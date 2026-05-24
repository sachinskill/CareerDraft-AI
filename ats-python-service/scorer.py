"""
Deterministic ATS Scoring Engine.

Scoring breakdown (100 points total):
  [40] Skill Match       — weighted keyword overlap (critical 3x, important 2x, optional 1x)
  [20] Experience Match  — candidate years vs JD required years
  [10] Education Match   — degree level detection
  [10] Keyword Density   — semantic similarity via sentence-transformers
  [10] Section Complete  — presence and depth of required resume sections
  [10] Readability       — weak verbs, first-person, bullet length

All dimensions are independently computed and reproducible.
LLM is NOT used here.
"""
import logging
import re
import time
from typing import Any

from embedder import compute_similarity

logger = logging.getLogger(__name__)

# Max chars fed into any scoring function — keeps all ops fast
_MAX_RESUME_CHARS = 5000
_MAX_JD_CHARS = 3000

# ── Skill taxonomy (canonical forms) ─────────────────────────────────────────

SKILL_TAXONOMY: set[str] = {
    # Languages
    "java", "python", "javascript", "typescript", "c++", "c#", "go", "golang",
    "rust", "kotlin", "swift", "php", "ruby", "scala", "r", "bash", "shell",
    "groovy", "dart", "elixir", "haskell", "lua", "perl", "vba",
    # Frontend
    "html", "css", "react", "angular", "vue", "svelte", "nextjs", "tailwind",
    "bootstrap", "webpack", "vite", "redux", "graphql", "jquery",
    # Backend
    "spring", "spring-boot", "spring-security", "hibernate", "jpa",
    "express", "fastapi", "flask", "django", "rails", "laravel", "nestjs",
    "quarkus", "micronaut",
    # Databases
    "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
    "oracle", "sqlite", "dynamodb", "neo4j", "mariadb", "sqlserver",
    "snowflake", "bigquery", "clickhouse",
    # Cloud
    "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "terraform",
    "ansible", "helm", "jenkins", "github-actions", "circleci",
    "ec2", "s3", "lambda", "ecs", "eks", "rds",
    # Data / ML
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
    "spark", "kafka", "airflow", "mlflow", "huggingface", "langchain",
    "machine-learning", "deep-learning", "nlp", "data-science",
    # Architecture
    "microservices", "rest-api", "grpc", "websockets", "event-driven",
    "cqrs", "ddd", "ci/cd", "devops", "agile", "scrum", "tdd", "bdd",
    # Tools
    "git", "maven", "gradle", "npm", "yarn", "jira", "swagger", "openapi",
    "postman", "sonarqube", "linux", "nginx", "prometheus", "grafana",
}

CANONICAL_MAP: dict[str, str] = {
    "spring boot": "spring-boot", "springboot": "spring-boot",
    "spring security": "spring-security",
    "rest api": "rest-api", "restful": "rest-api", "restful api": "rest-api",
    "microservice": "microservices", "micro services": "microservices",
    "node.js": "nodejs", "node js": "nodejs",
    "react.js": "react", "reactjs": "react",
    "vue.js": "vue", "vuejs": "vue",
    "next.js": "nextjs", "next js": "nextjs",
    "ci cd": "ci/cd", "cicd": "ci/cd",
    "github actions": "github-actions",
    "amazon web services": "aws",
    "google cloud": "gcp", "google cloud platform": "gcp",
    "microsoft azure": "azure",
    "kubernetes": "k8s",
    "machine learning": "machine-learning",
    "deep learning": "deep-learning",
    "natural language processing": "nlp",
    "postgres": "postgresql", "postgre sql": "postgresql",
    "mongo db": "mongodb",
    "elastic search": "elasticsearch",
    "react native": "react-native",
    "tailwind css": "tailwind", "tailwindcss": "tailwind",
    "sql server": "sqlserver", "ms sql": "sqlserver",
}

WEAK_VERBS: set[str] = {
    "worked", "helped", "assisted", "participated", "involved",
    "responsible", "did", "made", "used", "utilized", "handled",
    "supported", "contributed",
}

STRONG_VERBS: set[str] = {
    "built", "developed", "implemented", "designed", "architected",
    "engineered", "led", "managed", "launched", "delivered", "reduced",
    "increased", "improved", "optimized", "automated", "migrated",
    "refactored", "deployed", "scaled", "created", "spearheaded",
    "streamlined", "transformed", "accelerated", "achieved", "generated",
    "saved", "mentored", "pioneered",
}

DEGREE_LEVELS: dict[str, int] = {
    "phd": 4, "doctorate": 4, "ph.d": 4,
    "master": 3, "msc": 3, "m.s": 3, "mba": 3, "m.tech": 3,
    "bachelor": 2, "b.e": 2, "b.tech": 2, "b.s": 2, "bsc": 2, "b.sc": 2,
    "associate": 1, "diploma": 1,
}

SECTION_HEADERS: list[str] = [
    "summary", "objective", "experience", "work experience", "employment",
    "education", "skills", "technical skills", "projects", "certifications",
    "achievements", "awards",
]


# ── Normalisation helpers ─────────────────────────────────────────────────────

def _canonicalize(text: str) -> str:
    text = text.lower().strip()
    return CANONICAL_MAP.get(text, text)


def _extract_skills(text: str) -> set[str]:
    """Extract canonical skill tokens from free text."""
    text_lower = text.lower()
    found: set[str] = set()

    # Multi-word canonical phrases first
    for phrase, canonical in CANONICAL_MAP.items():
        if phrase in text_lower:
            found.add(canonical)

    # Single-word taxonomy match
    tokens = re.findall(r"[\w\.\+\#\-]+", text_lower)
    for token in tokens:
        canon = _canonicalize(token)
        if canon in SKILL_TAXONOMY:
            found.add(canon)

    return found


def _extract_years_from_jd(jd: str) -> int:
    """Parse minimum years required from job description. Returns -1 if not found."""
    patterns = [
        r"(\d+)\+?\s*(?:to\s*\d+)?\s*years?\s+(?:of\s+)?(?:experience|exp)",
        r"minimum\s+(\d+)\s*years?",
        r"at\s+least\s+(\d+)\s*years?",
    ]
    for pat in patterns:
        m = re.search(pat, jd, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return -1


def _estimate_candidate_years(resume_text: str) -> int:
    """Rough estimate of candidate experience years from date ranges."""
    year_pattern = re.findall(r"\b(20\d{2}|19\d{2})\b", resume_text)
    if len(year_pattern) < 2:
        return 0
    years = sorted(set(int(y) for y in year_pattern))
    return max(0, years[-1] - years[0])


def _detect_degree_level(resume_text: str) -> int:
    """Returns numeric degree level (0=none, 1=diploma, 2=bachelor, 3=master, 4=phd)."""
    text_lower = resume_text.lower()
    best = 0
    for keyword, level in DEGREE_LEVELS.items():
        if keyword in text_lower:
            best = max(best, level)
    return best


def _detect_required_degree(jd: str) -> int:
    """Returns minimum required degree level from JD."""
    jd_lower = jd.lower()
    for keyword, level in sorted(DEGREE_LEVELS.items(), key=lambda x: -x[1]):
        if keyword in jd_lower:
            return level
    return 0  # No requirement stated


def _categorize_jd_skills(jd: str, all_skills: set[str]) -> dict[str, set[str]]:
    """Split JD skills into critical / important / optional buckets."""
    jd_lower = jd.lower()
    critical: set[str] = set()
    important: set[str] = set()
    optional: set[str] = set()

    # Heuristic: skills near "required", "must", "essential" → critical
    required_section = re.search(
        r"(required|must.have|essential|mandatory)[:\s]+(.*?)(?=preferred|nice|bonus|$)",
        jd_lower, re.DOTALL
    )
    preferred_section = re.search(
        r"(preferred|nice.to.have|bonus|plus)[:\s]+(.*?)$",
        jd_lower, re.DOTALL
    )

    req_text = required_section.group(2) if required_section else jd_lower
    pref_text = preferred_section.group(2) if preferred_section else ""

    for skill in all_skills:
        if skill in _extract_skills(req_text):
            critical.add(skill)
        elif skill in _extract_skills(pref_text):
            optional.add(skill)
        else:
            important.add(skill)

    return {"critical": critical, "important": important, "optional": optional}


def _extract_bullets(resume_text: str) -> list[str]:
    """Extract bullet-like lines from resume text."""
    lines = resume_text.split("\n")
    bullets = []
    for line in lines:
        stripped = line.strip()
        # Lines starting with bullet chars or action verbs
        if stripped and (
            stripped[0] in "•●▪-*" or
            any(stripped.lower().startswith(v) for v in STRONG_VERBS | WEAK_VERBS)
        ):
            bullets.append(stripped.lstrip("•●▪-* "))
    return bullets


def _detect_sections(resume_text: str) -> set[str]:
    """Detect which standard sections are present."""
    text_lower = resume_text.lower()
    found = set()
    for header in SECTION_HEADERS:
        if header in text_lower:
            found.add(header)
    return found


# ── Scoring dimensions ────────────────────────────────────────────────────────

def _score_skills(resume_skills: set[str], jd_skills: set[str],
                  buckets: dict[str, set[str]]) -> dict[str, Any]:
    """Dimension 1: Skill Match (max 40 pts). Weighted by severity."""
    if not jd_skills:
        return {"score": 30, "matched": [], "missing_critical": [],
                "missing_important": [], "missing_optional": [], "match_pct": 100.0}

    total_weight = 0.0
    matched_weight = 0.0
    matched: list[str] = []
    missing_critical: list[str] = []
    missing_important: list[str] = []
    missing_optional: list[str] = []

    for skill in jd_skills:
        w = 3.0 if skill in buckets["critical"] else 2.0 if skill in buckets["important"] else 1.0
        total_weight += w
        if skill in resume_skills:
            matched_weight += w
            matched.append(skill)
        else:
            if skill in buckets["critical"]:
                missing_critical.append(skill)
            elif skill in buckets["important"]:
                missing_important.append(skill)
            else:
                missing_optional.append(skill)

    ratio = matched_weight / total_weight if total_weight > 0 else 0.0
    score = round(ratio * 40)
    match_pct = round((len(matched) / len(jd_skills)) * 100, 1)

    return {
        "score": min(40, score),
        "matched": matched,
        "missing_critical": missing_critical,
        "missing_important": missing_important,
        "missing_optional": missing_optional,
        "match_pct": match_pct,
    }


def _score_experience(resume_text: str, jd: str) -> dict[str, Any]:
    """Dimension 2: Experience Match (max 20 pts)."""
    required = _extract_years_from_jd(jd)
    candidate = _estimate_candidate_years(resume_text)

    if required < 0:
        return {"score": 15, "candidate_years": candidate, "required_years": "not specified"}

    if candidate >= required:
        score = 20
    else:
        gap = required - candidate
        score = max(4, 20 - gap * 4)

    return {"score": score, "candidate_years": candidate, "required_years": required}


def _score_education(resume_text: str, jd: str) -> dict[str, Any]:
    """Dimension 3: Education Match (max 10 pts)."""
    candidate_level = _detect_degree_level(resume_text)
    required_level = _detect_required_degree(jd)

    if required_level == 0:
        score = 8  # No requirement stated → mostly neutral
    elif candidate_level >= required_level:
        score = 10
    else:
        gap = required_level - candidate_level
        score = max(2, 10 - gap * 3)

    return {"score": score, "candidate_level": candidate_level, "required_level": required_level}


def _score_semantic(resume_text: str, jd: str) -> dict[str, Any]:
    """Dimension 4: Keyword Density / Semantic Similarity (max 10 pts)."""
    similarity = compute_similarity(resume_text, jd)
    score = round(similarity * 10)
    return {"score": min(10, score), "similarity": round(similarity, 4)}


def _score_sections(resume_text: str) -> dict[str, Any]:
    """Dimension 5: Section Completeness (max 10 pts)."""
    found = _detect_sections(resume_text)
    required = {"summary", "experience", "education", "skills"}
    bonus = {"projects", "certifications", "achievements"}

    base = len(found & required)  # 0-4
    extra = min(2, len(found & bonus))  # 0-2
    score = min(10, base * 2 + extra)

    return {"score": score, "sections_found": list(found)}


def _score_readability(resume_text: str) -> dict[str, Any]:
    """Dimension 6: Readability (max 10 pts)."""
    bullets = _extract_bullets(resume_text)
    if not bullets:
        return {"score": 7, "flags": ["No bullet points detected"]}

    score = 10
    flags: list[str] = []
    total = len(bullets)

    first_person = sum(
        1 for b in bullets
        if b.lower().startswith(("i ", "my ", "i've ")) or " i " in b.lower()
    )
    weak_count = sum(
        1 for b in bullets
        if any(b.lower().startswith(v) for v in WEAK_VERBS)
    )
    long_count = sum(1 for b in bullets if len(b.split()) > 30)
    strong_count = sum(
        1 for b in bullets
        if any(b.lower().startswith(v) for v in STRONG_VERBS)
    )

    if first_person / total > 0.1:
        score -= 2
        flags.append("Uses first-person pronouns in bullets")
    if weak_count / total > 0.2:
        score -= 2
        flags.append(f"{weak_count} bullets start with weak verbs (worked, helped, assisted…)")
    if long_count / total > 0.3:
        score -= 2
        flags.append(f"{long_count} bullets exceed 30 words — consider splitting")
    if strong_count / total >= 0.5:
        score = min(10, score + 2)

    # Quantification bonus
    metric_pattern = re.compile(
        r"(\d+[%xX]?)|(\$\s*\d+)|(\d+\s*(million|billion|k|m))", re.IGNORECASE
    )
    quantified = sum(1 for b in bullets if metric_pattern.search(b))
    quant_ratio = quantified / total
    if quant_ratio < 0.2:
        flags.append(f"Only {quantified}/{total} bullets contain measurable results")

    return {
        "score": max(0, score),
        "flags": flags,
        "total_bullets": total,
        "quantified_bullets": quantified,
        "quant_ratio": round(quant_ratio, 2),
    }


# ── Main entry point ──────────────────────────────────────────────────────────

def compute_ats_score(resume_text: str, job_description: str) -> dict[str, Any]:
    """
    Compute full deterministic ATS score.
    Returns structured JSON matching the frontend AtsResultDTO shape.
    All text is capped before processing to guarantee fast response times.
    """
    t_total = time.perf_counter()

    # ── Cap text length for performance ───────────────────────────────────────
    resume_text = resume_text[:_MAX_RESUME_CHARS]
    job_description = job_description[:_MAX_JD_CHARS]

    # ── Skill extraction (shared, done once) ──────────────────────────────────
    t0 = time.perf_counter()
    resume_skills = _extract_skills(resume_text)
    jd_skills = _extract_skills(job_description)
    buckets = _categorize_jd_skills(job_description, jd_skills)
    logger.debug("Skill extraction: %.3fs", time.perf_counter() - t0)

    # ── Scoring dimensions ────────────────────────────────────────────────────
    t0 = time.perf_counter()
    skill_result = _score_skills(resume_skills, jd_skills, buckets)
    logger.debug("Skill scoring: %.3fs", time.perf_counter() - t0)

    t0 = time.perf_counter()
    exp_result = _score_experience(resume_text, job_description)
    edu_result = _score_education(resume_text, job_description)
    section_result = _score_sections(resume_text)
    readability_result = _score_readability(resume_text)
    logger.debug("Rule-based dimensions: %.3fs", time.perf_counter() - t0)

    t0 = time.perf_counter()
    semantic_result = _score_semantic(resume_text, job_description)
    logger.debug("Semantic embedding: %.3fs", time.perf_counter() - t0)

    breakdown = {
        "skillMatch": skill_result["score"],
        "experienceMatch": exp_result["score"],
        "educationMatch": edu_result["score"],
        "semanticSimilarity": semantic_result["score"],
        "sectionCompleteness": section_result["score"],
        "readability": readability_result["score"],
    }

    raw_score = sum(breakdown.values())

    is_entry_level = _extract_years_from_jd(job_description) <= 0 or exp_result["candidate_years"] <= 1
    if is_entry_level and raw_score > 75:
        raw_score = 75

    final_score = min(98, raw_score)

    if final_score >= 80:
        verdict, explanation = "Excellent", "Your resume is well-optimized for this role"
    elif final_score >= 65:
        verdict, explanation = "Good", "Strong match with room for targeted improvements"
    elif final_score >= 45:
        verdict, explanation = "Fair", "Significant gaps — address missing skills and impact"
    else:
        verdict, explanation = "Needs Work", "Major revisions required to pass ATS screening"

    elapsed = time.perf_counter() - t_total
    logger.info(
        "ATS scoring complete: score=%d, skills=%d matched, time=%.3fs",
        final_score, len(skill_result["matched"]), elapsed
    )

    return {
        "overallScore": final_score,
        "breakdown": breakdown,
        "matchedSkills": skill_result["matched"],
        "missingSkills": {
            "critical": skill_result["missing_critical"],
            "important": skill_result["missing_important"],
            "niceToHave": skill_result["missing_optional"],
        },
        "keywordMatchPct": skill_result["match_pct"],
        "semanticSimilarity": semantic_result["similarity"],
        "experienceYears": {
            "candidate": exp_result["candidate_years"],
            "required": exp_result["required_years"],
        },
        "educationLevel": {
            "candidate": edu_result["candidate_level"],
            "required": edu_result["required_level"],
        },
        "sectionsFound": section_result["sections_found"],
        "readabilityFlags": readability_result["flags"],
        "totalBullets": readability_result.get("total_bullets", 0),
        "quantifiedBullets": readability_result.get("quantified_bullets", 0),
        "verdict": verdict,
        "verdictExplanation": explanation,
        "isEntryLevel": is_entry_level,
        "processingTimeMs": round(elapsed * 1000),
    }
