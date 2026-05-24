package com.resume.backend.ats;

import com.resume.backend.ai.AIService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Production-grade ATS Analysis Engine.
 *
 * Scoring breakdown (100 points total):
 * [35] Keyword Match — weighted TF proximity match vs job description
 * [20] Section Quality — depth/completeness of each resume section
 * [15] Impact Score — % of bullets with quantifiable metrics
 * [15] Experience Alignment — seniority match with JD years required
 * [10] Readability — penalises first-person, weak verbs, overlong bullets
 * [5] Summary Quality — tailored vs generic opening statement
 */
@Service
@SuppressWarnings("unused") // TECHNICAL_SKILLS, CANONICAL, STOP_WORDS are reserved for future rule-based matching
public class AtsAnalyzerServiceImpl implements AtsAnalyzerService {

    private final AIService aiService;

    public AtsAnalyzerServiceImpl(AIService aiService) {
        this.aiService = aiService;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 300+ TECHNICAL SKILL TAXONOMY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    private static final Set<String> TECHNICAL_SKILLS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            // ── Programming Languages ─────────────────────────────────────────────
            "java", "python", "javascript", "typescript", "c++", "c#", "go", "golang",
            "rust", "kotlin", "swift", "php", "ruby", "scala", "r", "matlab", "perl",
            "shell", "bash", "powershell", "groovy", "lua", "dart", "elixir", "haskell",
            "clojure", "f#", "cobol", "fortran", "assembly", "vba",

            // ── Web / Frontend ────────────────────────────────────────────────────
            "html", "css", "react", "angular", "vue", "svelte", "nextjs", "nuxtjs",
            "gatsby", "remix", "astro", "tailwind", "bootstrap", "sass", "less",
            "webpack", "vite", "rollup", "parcel", "babel", "jquery", "redux",
            "zustand", "recoil", "mobx", "rxjs", "graphql", "apollo", "relay",
            "storybook", "jest", "cypress", "playwright", "selenium",

            // ── Backend Frameworks ────────────────────────────────────────────────
            "spring", "spring-boot", "spring-mvc", "spring-security", "spring-cloud",
            "hibernate", "jpa", "express", "fastapi", "flask", "django", "rails",
            "laravel", "symfony", "asp.net", "blazor", "nestjs", "hapi", "koa",
            "fastify", "gin", "fiber", "echo", "actix", "axum", "phoenix",
            "sinatra", "grails", "quarkus", "micronaut", "helidon",

            // ── Databases / Storage ───────────────────────────────────────────────
            "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
            "oracle", "sqlite", "dynamodb", "neo4j", "influxdb", "mariadb",
            "sqlserver", "couchdb", "hbase", "firestore", "bigtable", "spanner",
            "cockroachdb", "timescaledb", "clickhouse", "snowflake", "redshift",
            "bigquery", "databricks", "minio", "memcached", "etcd", "zookeeper",

            // ── Cloud & Infrastructure ────────────────────────────────────────────
            "aws", "azure", "gcp", "heroku", "digitalocean", "linode", "cloudflare",
            "vercel", "netlify", "render", "fly.io",

            // ── AWS Services ──────────────────────────────────────────────────────
            "ec2", "s3", "lambda", "ecs", "eks", "rds", "sqs", "sns", "api-gateway",
            "cloudfront", "cloudwatch", "iam", "vpc", "route53", "elasticache",
            "kinesis", "glue", "athena", "emr", "sagemaker",

            // ── DevOps & CI/CD ────────────────────────────────────────────────────
            "docker", "kubernetes", "k8s", "helm", "jenkins", "terraform", "ansible",
            "chef", "puppet", "gitlab", "github-actions", "circleci", "travis-ci",
            "argocd", "fluxcd", "spinnaker", "concourse", "teamcity", "bamboo",
            "vagrant", "packer", "vault", "consul", "prometheus", "grafana",
            "datadog", "newrelic", "splunk", "elk", "logstash", "kibana",
            "jaeger", "zipkin", "istio", "linkerd", "envoy", "nginx", "apache",
            "haproxy", "traefik",

            // ── Data Science / ML / AI ────────────────────────────────────────────
            "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
            "scipy", "matplotlib", "seaborn", "plotly", "jupyter", "spark",
            "hadoop", "kafka", "airflow", "dbt", "mlflow", "kubeflow", "ray",
            "huggingface", "langchain", "openai", "llm", "nlp", "computer-vision",
            "deep-learning", "machine-learning", "data-science",

            // ── Mobile ────────────────────────────────────────────────────────────
            "android", "ios", "react-native", "flutter", "xamarin", "ionic",
            "objective-c", "kotlin-multiplatform",

            // ── Security ──────────────────────────────────────────────────────────
            "oauth", "jwt", "ssl", "tls", "owasp", "penetration-testing",
            "vulnerability-assessment", "siem", "soc", "waf",
            "cryptography", "zero-trust", "devsecops",

            // ── Testing & QA ──────────────────────────────────────────────────────
            "junit", "testng", "mockito", "pytest", "mocha", "jasmine",
            "jmeter", "gatling", "locust", "k6", "cucumber", "bdd",
            "tdd", "appium",

            // ── Architecture & Methodologies ──────────────────────────────────────
            "microservices", "rest-api", "grpc", "soap", "websockets",
            "event-driven", "cqrs", "event-sourcing", "ddd", "hexagonal",
            "clean-architecture", "solid", "design-patterns", "ci/cd", "devops",
            "agile", "scrum", "kanban", "sdlc", "sre", "leadership", "architecture",
            "code-review", "debugging", "automation", "testing",

            // ── Tools & Version Control ───────────────────────────────────────────
            "git", "maven", "gradle", "npm", "yarn", "pnpm", "pip", "cargo",
            "jira", "confluence", "slack", "figma", "swagger", "openapi",
            "postman", "insomnia", "sonarqube", "artifactory", "nexus",

            // ── Operating Systems / Platforms ─────────────────────────────────────
            "linux", "ubuntu", "centos", "debian", "redhat", "alpine",
            "windows-server", "macos", "unix")));

    // ── Canonicalization map (variant → canonical) ───────────────────────────────
    private static final Map<String, String> CANONICAL = new HashMap<>() {
        {
            put("spring boot", "spring-boot");
            put("springboot", "spring-boot");
            put("spring security", "spring-security");
            put("spring cloud", "spring-cloud");
            put("rest api", "rest-api");
            put("restful", "rest-api");
            put("restful api", "rest-api");
            put("restapi", "rest-api");
            put("microservice", "microservices");
            put("micro services", "microservices");
            put("micro-services", "microservices");
            put("node js", "nodejs");
            put("node.js", "nodejs");
            put("nodjs", "nodejs");
            put("vue js", "vue");
            put("vuejs", "vue");
            put("vue.js", "vue");
            put("react js", "react");
            put("reactjs", "react");
            put("react.js", "react");
            put("angular js", "angular");
            put("angularjs", "angular");
            put("next js", "nextjs");
            put("next.js", "nextjs");
            put("nuxt js", "nuxtjs");
            put("nuxt.js", "nuxtjs");
            put("ci cd", "ci/cd");
            put("cicd", "ci/cd");
            put("github actions", "github-actions");
            put("gitlab ci", "gitlab");
            put("gitlab ci/cd", "gitlab");
            put("code review", "code-review");
            put("amazon web services", "aws");
            put("google cloud", "gcp");
            put("google cloud platform", "gcp");
            put("microsoft azure", "azure");
            put("kubernetes", "k8s");
            put("computer vision", "computer-vision");
            put("machine learning", "machine-learning");
            put("deep learning", "deep-learning");
            put("natural language processing", "nlp");
            put("large language model", "llm");
            put("object oriented", "oop");
            put("object-oriented", "oop");
            put("data structure", "data-structures");
            put("data structures", "data-structures");
            put("sql server", "sqlserver");
            put("ms sql", "sqlserver");
            put("mongo db", "mongodb");
            put("postgre sql", "postgresql");
            put("postgres", "postgresql");
            put("elastic search", "elasticsearch");
            put("react native", "react-native");
            put("event driven", "event-driven");
            put("event-driven architecture", "event-driven");
            put("domain driven design", "ddd");
            put("test driven development", "tdd");
            put("behaviour driven development", "bdd");
            put("behavior driven development", "bdd");
            put("design pattern", "design-patterns");
            put("rest", "rest-api");
            put("api", "rest-api");
            put("devops", "devops");
            put("dev ops", "devops");
            put("tailwind css", "tailwind");
            put("tailwindcss", "tailwind");
            put("fastapi", "fastapi");
            put("fast api", "fastapi");
        }
    };

    // ── Terms to always exclude
    // ───────────────────────────────────────────────────
    private static final Set<String> STOP_WORDS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from",
            "up", "about", "into", "through", "during", "before", "after", "above", "below",
            "between", "among", "is", "are", "was", "were", "be", "been", "being", "have",
            "has", "had", "do", "does", "did", "will", "would", "could", "should", "may",
            "might", "must", "can", "this", "that", "these", "those", "a", "an", "it", "its",
            "we", "i", "you", "he", "she", "they", "our", "their", "my", "your", "his", "her",
            // Recruitment noise
            "looking", "candidate", "ideal", "plus", "knowledge", "required", "responsibilities",
            "seeking", "hiring", "position", "role", "job", "work", "team", "teams", "company",
            "organization", "department", "office", "environment", "opportunity", "career",
            "professional", "individual", "person", "someone", "applicant",
            // Generic soft skill blobs (leadership signals are handled separately)
            "communication", "collaboration", "teamwork", "problem-solving", "analytical",
            "creative", "innovative", "motivated", "dynamic", "passionate", "dedicated",
            "reliable", "flexible", "adaptable", "detail-oriented", "results-driven",
            "self-starter", "goal-oriented", "proactive", "enthusiastic",
            // Generic business
            "customer", "business", "growth", "revenue", "profit", "sales", "marketing",
            "strategy", "management", "operations", "finance", "accounting",
            // Generic tech blobs (skill extraction handles specifics)
            "software", "system", "systems", "application", "applications", "technology",
            "technologies", "tool", "tools", "platform", "platforms", "framework", "frameworks",
            "library", "libraries", "service", "services", "code", "coding", "programming",
            "development", "developer", "engineer", "engineering", "solution", "solutions",
            "product", "products", "feature", "features", "module", "modules", "component",
            "components", "architecture", "infrastructure", "environment", "stack",
            "implementation", "integration", "deployment", "configuration", "automation",
            "monitoring", "performance", "optimization", "security",
            "scalability", "reliability", "availability", "maintainability")));

    // ── Weak verbs that hurt readability ─────────────────────────────────────────
    private static final Set<String> WEAK_VERBS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "worked", "helped", "assisted", "participated", "involved", "responsible",
            "did", "made", "used", "utilized", "handled", "supported", "contributed",
            "was involved", "took part", "was responsible")));

    // ── Strong action verbs (ATS-favored) ────────────────────────────────────────
    private static final Set<String> STRONG_VERBS = Set.of(
            "built", "developed", "implemented", "designed", "architected", "engineered",
            "led", "managed", "launched", "delivered", "reduced", "increased", "improved",
            "optimized", "automated", "migrated", "refactored", "deployed", "scaled",
            "created", "established", "spearheaded", "streamlined", "transformed",
            "accelerated", "achieved", "generated", "saved", "mentored", "pioneered");

    // *** MAIN ENTRY POINT ***
    @Override
    public AtsResultDTO analyzeResume(Map<String, Object> resumeData, String jobDescription) {

        // ── 1. Extract & normalise JD keywords ────────────────────────────────
        Set<String> jdSkills = extractJdSkills(jobDescription);
        boolean isEntryLevel = detectEntryLevel(jobDescription);

        // ── 2. Severity-aware JD skill categorisation ──────────────────────────
        Map<String, Set<String>> severityBuckets = categoriseByJdSeverity(jobDescription, jdSkills);
        Set<String> criticalJdSkills = severityBuckets.get("critical");
        Set<String> importantJdSkills = severityBuckets.get("important");
        Set<String> niceToHaveJdSkills = severityBuckets.get("optional");

        // ── 3. Extract resume skills from all sections ─────────────────────────
        Set<String> resumeSkills = extractMatchedSkills(resumeData, jdSkills);

        // ── 4. Compute matched & missing ──────────────────────────────────────
        List<String> matchedKeywords = new ArrayList<>();
        for (String s : jdSkills) {
            if (resumeSkills.contains(s))
                matchedKeywords.add(s);
        }

        // ── 5. Six scoring dimensions ──────────────────────────────────────────
        int expAlignment = computeExperienceAlignmentScore(resumeData, jobDescription, isEntryLevel); // 0-15
        int keywordScore = computeKeywordScore(jdSkills, resumeSkills, criticalJdSkills, importantJdSkills,
                matchedKeywords, expAlignment); // 0-35
        int sectionQuality = computeSectionQualityScore(resumeData); // 0-20
        int[] impactResult = computeImpactScore(resumeData); // 0-15 + raw counts
        int[] readabilityRes = computeReadabilityScore(resumeData); // 0-10 + flags
        int summaryQuality = computeSummaryQualityScore(resumeData, criticalJdSkills); // 0-5

        int impactScore = impactResult[0];
        int quantifiedBullets = impactResult[1];
        int totalBullets = impactResult[2];

        int rawScore = keywordScore + sectionQuality + impactScore + expAlignment + readabilityRes[0] + summaryQuality;
        int finalScore = applyRealismCap(rawScore, isEntryLevel, resumeData);

        // ── 6. Keyword match percentage ────────────────────────────────────────
        double rawPct = jdSkills.isEmpty() ? 100.0 : (double) matchedKeywords.size() / jdSkills.size() * 100.0;

        // Semantic/Experience smoothing: High experience alignment implies strong
        // implicit skill match
        if (expAlignment >= 10 && rawPct < 50.0 && !jdSkills.isEmpty()) {
            double boost = (expAlignment / 15.0) * 20.0; // Up to 20% boost
            rawPct = Math.min(100.0, rawPct + boost);
        }
        double matchPct = Math.min(100.0, Math.round(rawPct * 10.0) / 10.0);

        // ── 7. Missing skills with severity ───────────────────────────────────
        List<AtsResultDTO.MissingSkill> categorizedMissing = buildCategorizedMissing(
                criticalJdSkills, importantJdSkills, niceToHaveJdSkills, matchedKeywords);

        // Legacy flat missing list (top 6 by severity priority)
        List<String> missingKeywords = categorizedMissing.stream()
                .sorted(Comparator.comparingInt(
                        ms -> "CRITICAL".equals(ms.getSeverity()) ? 0 : "IMPORTANT".equals(ms.getSeverity()) ? 1 : 2))
                .limit(6)
                .map(AtsResultDTO.MissingSkill::getName)
                .collect(Collectors.toList());

        // ── 8. Strong matched skills (top 8, critical-first) ─────────────────
        List<String> strongSkills = matchedKeywords.stream()
                .sorted(Comparator
                        .comparingInt(s -> criticalJdSkills.contains(s) ? 0 : importantJdSkills.contains(s) ? 1 : 2))
                .limit(8)
                .map(this::formatSkillName)
                .collect(Collectors.toList());

        // Legacy critical/core buckets for AI feedback service
        List<String> legacyCritical = categorizedMissing.stream()
                .filter(ms -> "CRITICAL".equals(ms.getSeverity()))
                .limit(3).map(ms -> formatSkillName(ms.getName())).collect(Collectors.toList());
        List<String> legacyCore = categorizedMissing.stream()
                .filter(ms -> "IMPORTANT".equals(ms.getSeverity()))
                .limit(3).map(ms -> formatSkillName(ms.getName())).collect(Collectors.toList());

        // ── 9. Warnings & flags ───────────────────────────────────────────────
        List<String> warnings = buildWarnings(resumeData, isEntryLevel);
        List<String> weaknessFlags = buildWeaknessFlags(readabilityRes, resumeData);

        // ── 10. Rule-based tailoring tips ────────────────────────────────────
        List<String> tailoringTips = buildTailoringTips(
                categorizedMissing, impactScore, readabilityRes[0], resumeData, jobDescription, finalScore);

        // ── 11. Section scores map ────────────────────────────────────────────
        Map<String, Integer> sectionScores = new LinkedHashMap<>();
        sectionScores.put("keywordMatch", keywordScore);
        sectionScores.put("sectionQuality", sectionQuality);
        sectionScores.put("impactScore", impactScore);
        sectionScores.put("experienceAlignment", expAlignment);
        sectionScores.put("readability", readabilityRes[0]);
        sectionScores.put("summaryQuality", summaryQuality);

        // ── 12. Build result ──────────────────────────────────────────────────
        AtsResultDTO result = new AtsResultDTO(finalScore, matchPct,
                matchedKeywords.stream().map(this::formatSkillName).limit(10).collect(Collectors.toList()),
                missingKeywords.stream().map(this::formatSkillName).collect(Collectors.toList()),
                warnings);

        result.setStrongSkills(strongSkills);
        result.setMissingCriticalSkills(legacyCritical);
        result.setMissingCoreSkills(legacyCore);
        result.setCategorizedMissingSkills(categorizedMissing.stream()
                .map(ms -> new AtsResultDTO.MissingSkill(formatSkillName(ms.getName()), ms.getSeverity()))
                .limit(10).collect(Collectors.toList()));
        result.setSectionScores(sectionScores);
        result.setImpactScore(impactScore);
        result.setQuantifiedBullets(quantifiedBullets);
        result.setTotalBullets(totalBullets);
        result.setReadabilityScore(readabilityRes[0]);
        result.setWeaknessFlags(weaknessFlags);
        result.setExperienceAlignmentScore(expAlignment);
        result.setTailoringTips(tailoringTips);
        result.setEntryLevel(isEntryLevel);

        // Core match fraction for frontend display
        Set<String> allCore = new HashSet<>(criticalJdSkills);
        allCore.addAll(importantJdSkills);
        int coreMatches = (int) matchedKeywords.stream().filter(allCore::contains).count();
        result.setCoreSkillsMatched(coreMatches);
        result.setTotalCoreSkills(Math.max(allCore.size(), 1));

        setVerdict(result, finalScore, isEntryLevel, criticalJdSkills, matchedKeywords);

        // ── 13. Enrich with explainable breakdown + improvement engine ─────────
        enrichWithExplainableData(result, resumeData, categorizedMissing, finalScore,
                impactScore, totalBullets, quantifiedBullets, readabilityRes[0],
                matchedKeywords, criticalJdSkills, importantJdSkills);

        return result;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCORING DIMENSIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * DIMENSION 1 — Keyword Match (max 35 pts)
     * Critical skills = 3× weight, Important = 2×, Optional = 1×
     */
    private int computeKeywordScore(Set<String> jdSkills, Set<String> resumeSkills,
            Set<String> critical, Set<String> important,
            List<String> matchedKeywords, int expAlignment) {
        if (jdSkills.isEmpty())
            return 25; // No JD → neutral score

        double totalWeight = 0;
        double matchedWeight = 0;

        for (String skill : jdSkills) {
            double w = critical.contains(skill) ? 3.0 : important.contains(skill) ? 2.0 : 1.0;
            totalWeight += w;
            if (resumeSkills.contains(skill))
                matchedWeight += w;
        }

        double ratio = totalWeight == 0 ? 0 : matchedWeight / totalWeight;
        int baseScore = (int) Math.round(ratio * 35);

        // Semantic/Experience smoothing
        if (expAlignment >= 10 && ratio < 0.5) {
            baseScore += (int) ((expAlignment / 15.0) * 10); // up to +10 points
        }
        return Math.min(35, baseScore);
    }

    /**
     * DIMENSION 2 — Section Quality (max 20 pts)
     * Goes beyond boolean presence: evaluates content depth.
     */
    private int computeSectionQualityScore(Map<String, Object> resumeData) {
        int score = 0;

        // Summary (0-4): exists + substantial length
        String summary = (String) resumeData.get("summary");
        if (summary != null && !summary.isBlank()) {
            score += 2;
            if (summary.split("\\s+").length >= 30)
                score += 2; // substantive
        }

        // Skills (0-4): number of skills listed
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> skills = (List<Map<String, Object>>) resumeData.get("skills");
        if (skills != null) {
            if (skills.size() >= 3)
                score += 2;
            if (skills.size() >= 7)
                score += 2;
        }

        // Experience (0-5): depth of descriptions
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> experience = (List<Map<String, Object>>) resumeData.get("experience");
        if (experience != null && !experience.isEmpty()) {
            score += 2;
            long withDesc = experience.stream()
                    .filter(e -> nonBlank((String) e.get("description")))
                    .count();
            if (withDesc > 0)
                score += 2;
            if (withDesc >= 2)
                score += 1;
        }

        // Education (0-2)
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> education = (List<Map<String, Object>>) resumeData.get("education");
        if (education != null && !education.isEmpty())
            score += 2;

        // Projects (0-5): depth matters for entry-level
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> projects = (List<Map<String, Object>>) resumeData.get("projects");
        if (projects != null && !projects.isEmpty()) {
            score += 2;
            long withDesc = projects.stream()
                    .filter(p -> nonBlank((String) p.get("description")))
                    .count();
            if (withDesc > 0)
                score += 2;
            if (projects.size() >= 2)
                score += 1;
        }

        return Math.min(20, score);
    }

    /**
     * DIMENSION 3 — Impact Score (max 15 pts)
     * Counts bullet points that include numbers, %, $, or quantitative keywords.
     * Returns [score, quantifiedBullets, totalBullets].
     */
    private int[] computeImpactScore(Map<String, Object> resumeData) {
        List<String> allBullets = extractAllBullets(resumeData);
        int total = allBullets.size();
        if (total == 0)
            return new int[] { 0, 0, 0 };

        // Pattern: number, %, $, or strong quantitative phrases
        Pattern metrics = Pattern.compile(
                "(\\d+[%xX]?)|(\\$\\s*\\d+)|(\\d+\\s*(million|billion|thousand|k|m|b))|" +
                        "(reduced|increased|improved|saved|generated|cut|boosted|grew|scaled|optimized|deployed|migrated)"
                        +
                        "\\s+\\w*(\\s+by\\s+\\d+)?",
                Pattern.CASE_INSENSITIVE);

        int quantified = 0;
        for (String bullet : allBullets) {
            Matcher m = metrics.matcher(bullet);
            if (m.find())
                quantified++;
        }

        double ratio = (double) quantified / total;
        int score = (int) Math.round(ratio * 15);
        return new int[] { Math.min(15, score), quantified, total };
    }

    /**
     * DIMENSION 4 — Experience Alignment (max 15 pts)
     * Compares candidate's inferred years of experience with JD requirements.
     */
    private int computeExperienceAlignmentScore(Map<String, Object> resumeData,
            String jobDescription, boolean isEntryLevel) {
        // Infer required years from JD
        int jdMinYears = extractMinYearsFromJd(jobDescription);
        if (jdMinYears < 0)
            return 12; // JD doesn't specify → mostly neutral

        // Infer candidate years from number of experience entries + dates
        int candidateYears = estimateCandidateYears(resumeData);

        if (isEntryLevel) {
            // For entry-level, internships and projects also count
            boolean hasProjects = hasSection(resumeData, "projects");
            if (hasProjects)
                candidateYears = Math.max(candidateYears, 1);
        }

        if (candidateYears >= jdMinYears)
            return 15; // perfect match
        int gap = jdMinYears - candidateYears;
        if (gap == 1)
            return 12;
        if (gap == 2)
            return 9;
        if (gap == 3)
            return 6;
        return Math.max(3, 15 - gap * 3);
    }

    /**
     * DIMENSION 5 — Readability Score (max 10 pts).
     * Returns [score, firstPersonCount, weakVerbCount, longBulletCount].
     */
    private int[] computeReadabilityScore(Map<String, Object> resumeData) {
        List<String> allBullets = extractAllBullets(resumeData);
        int score = 10;
        int firstPersonCount = 0, weakVerbCount = 0, longBulletCount = 0;

        for (String bullet : allBullets) {
            String lower = bullet.toLowerCase();

            // First-person pronouns
            if (lower.startsWith("i ") || lower.contains(" i ") || lower.startsWith("my ") || lower.contains("(i)")) {
                firstPersonCount++;
            }
            // Weak verbs
            for (String weak : WEAK_VERBS) {
                if (lower.startsWith(weak) || lower.contains(" " + weak + " ")) {
                    weakVerbCount++;
                    break;
                }
            }
            // Overlong bullets (> 30 words)
            if (bullet.split("\\s+").length > 30)
                longBulletCount++;
        }

        // Deductions
        if (firstPersonCount >= 2)
            score -= 2;
        else if (firstPersonCount >= 1)
            score -= 1;

        if (!allBullets.isEmpty() && (double) weakVerbCount / allBullets.size() > 0.2)
            score -= 2;
        if (!allBullets.isEmpty() && (double) longBulletCount / allBullets.size() > 0.3)
            score -= 2;

        // Bonus: uses majority strong verbs
        long strongCount = allBullets.stream().filter(b -> {
            String l = b.toLowerCase();
            return STRONG_VERBS.stream().anyMatch(v -> l.startsWith(v));
        }).count();
        if (!allBullets.isEmpty() && (double) strongCount / allBullets.size() >= 0.5)
            score = Math.min(10, score + 2);

        return new int[] { Math.max(0, score), firstPersonCount, weakVerbCount, longBulletCount };
    }

    /**
     * DIMENSION 6 — Summary Quality (max 5 pts)
     */
    private int computeSummaryQualityScore(Map<String, Object> resumeData, Set<String> criticalSkills) {
        String summary = (String) resumeData.get("summary");
        if (summary == null || summary.isBlank())
            return 0;

        int score = 0;
        String lower = summary.toLowerCase();

        // Has enough words (at least 20)
        if (summary.split("\\s+").length >= 20)
            score += 2;

        // Contains at least one critical skill
        boolean hasCritical = criticalSkills.stream().anyMatch(lower::contains);
        if (hasCritical)
            score += 2;

        // Does NOT rely purely on generic buzzwords
        long buzzCount = List.of("passionate", "results-driven", "team player", "self-starter",
                "dynamic", "innovative", "motivated", "go-getter", "rockstar")
                .stream().filter(lower::contains).count();
        if (buzzCount <= 1)
            score += 1; // non-generic

        return Math.min(5, score);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // EXPLAINABLE BREAKDOWN + IMPROVEMENT ENGINE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    private void enrichWithExplainableData(
            AtsResultDTO result,
            Map<String, Object> resumeData,
            List<AtsResultDTO.MissingSkill> categorizedMissing,
            int finalScore, int impactScore, int totalBullets, int quantifiedBullets,
            int readabilityScore, List<String> matched,
            Set<String> criticalJdSkills, Set<String> importantJdSkills) {

        // ── Explainable breakdown ─────────────────────────────────────────────
        AtsResultDTO.ScoringBreakdown breakdown = new AtsResultDTO.ScoringBreakdown();
        Map<String, Integer> scores = result.getSectionScores();

        List<String> criticalMissing = categorizedMissing.stream()
                .filter(ms -> "CRITICAL".equals(ms.getSeverity()))
                .map(AtsResultDTO.MissingSkill::getName).toList();
        List<String> importantMissing = categorizedMissing.stream()
                .filter(ms -> "IMPORTANT".equals(ms.getSeverity()))
                .map(AtsResultDTO.MissingSkill::getName).toList();

        // Skills dimension
        String skillReason = buildSkillReason(matched, criticalMissing, importantMissing);
        breakdown.setSkills(new AtsResultDTO.DimensionScore(
                scores.getOrDefault("keywordMatch", 0), 35, skillReason));

        // Experience dimension
        breakdown.setExperience(new AtsResultDTO.DimensionScore(
                scores.getOrDefault("experienceAlignment", 0), 15,
                result.getExperienceAlignmentScore() >= 12
                        ? "Experience years meet or exceed job requirements"
                        : "Experience gap detected — consider highlighting relevant projects"));

        // Section quality
        breakdown.setSections(new AtsResultDTO.DimensionScore(
                scores.getOrDefault("sectionQuality", 0), 20,
                buildSectionReasonFromData(resumeData)));

        // Impact
        String impactReason = totalBullets == 0
                ? "No bullet points detected — add achievement-focused bullets"
                : buildImpactReasonFromCounts(totalBullets, quantifiedBullets);
        breakdown.setImpact(new AtsResultDTO.DimensionScore(impactScore, 15, impactReason));

        // Readability
        breakdown.setReadability(new AtsResultDTO.DimensionScore(
                readabilityScore, 10,
                result.getWeaknessFlags() != null && !result.getWeaknessFlags().isEmpty()
                        ? result.getWeaknessFlags().get(0)
                        : "Clean writing — no major readability issues"));

        // Education (summary quality slot)
        breakdown.setEducation(new AtsResultDTO.DimensionScore(
                scores.getOrDefault("summaryQuality", 0), 5,
                hasSection(resumeData, "summary") ? "Professional summary present" : "No summary section detected"));

        result.setBreakdown(breakdown);

        // ── Impact message (fixes 0/0 bug) ────────────────────────────────────
        result.setImpactMessage(totalBullets == 0
                ? "No measurable achievements found — add bullet points with numbers, %, or scale"
                : quantifiedBullets + " of " + totalBullets + " bullets ("
                        + (int) Math.round((double) quantifiedBullets / totalBullets * 100) + "%) contain measurable results");

        // ── Confidence ────────────────────────────────────────────────────────
        int totalJdSkills = matched.size() + categorizedMissing.size();
        double confidence = totalJdSkills > 0 ? Math.min(0.99, 0.5 + (totalJdSkills / 30.0) * 0.49) : 0.6;
        result.setConfidence(Math.round(confidence * 100.0) / 100.0);

        // ── Keyword match consistency fix ─────────────────────────────────────
        // If there are critical missing skills, keyword match % cannot be 100%
        if (!criticalMissing.isEmpty() && result.getKeywordMatchPercentage() >= 95) {
            double adjusted = Math.max(60, result.getKeywordMatchPercentage() - (criticalMissing.size() * 8.0));
            result.setKeywordMatchPercentage(Math.round(adjusted * 10.0) / 10.0);
        }

        // ── Improvement engine ────────────────────────────────────────────────
        List<AtsResultDTO.ImprovementAction> improvements = new ArrayList<>();

        for (String skill : criticalMissing.stream().limit(3).toList()) {
            improvements.add(new AtsResultDTO.ImprovementAction(
                    "Add \"" + formatSkillName(skill) + "\" to your Skills section (required by job description)", 6, "SKILL"));
        }
        for (String skill : importantMissing.stream().limit(2).toList()) {
            improvements.add(new AtsResultDTO.ImprovementAction(
                    "Add \"" + formatSkillName(skill) + "\" if you have experience with it", 3, "SKILL"));
        }
        if (totalBullets == 0 || (totalBullets > 0 && (double) quantifiedBullets / totalBullets < 0.4)) {
            improvements.add(new AtsResultDTO.ImprovementAction(
                    "Add quantified achievements (numbers, %, scale) to your bullet points", 5, "IMPACT"));
        }
        if (!hasSection(resumeData, "summary")) {
            improvements.add(new AtsResultDTO.ImprovementAction("Add a tailored professional summary", 4, "SECTION"));
        }
        if (!hasSection(resumeData, "projects")) {
            improvements.add(new AtsResultDTO.ImprovementAction("Add a Projects section with tech stack details", 3, "SECTION"));
        }
        if (readabilityScore < 7) {
            improvements.add(new AtsResultDTO.ImprovementAction(
                    "Replace weak verbs (worked, helped) with action verbs (built, designed, led)", 3, "READABILITY"));
        }

        improvements.sort(Comparator.comparingInt(AtsResultDTO.ImprovementAction::getImpact).reversed());
        result.setImprovements(improvements.stream().limit(6).toList());

        int totalGain = improvements.stream().mapToInt(AtsResultDTO.ImprovementAction::getImpact).sum();
        int potentialScore = Math.min(97, finalScore + totalGain);
        result.setPotentialScore(potentialScore);
        result.setPotentialImprovement(Math.max(0, potentialScore - finalScore));
    }

    private String buildSkillReason(List<String> matched, List<String> critical, List<String> important) {
        StringBuilder sb = new StringBuilder();
        if (!matched.isEmpty()) {
            sb.append("Matched: ").append(String.join(", ", matched.stream().limit(4).toList()));
            if (matched.size() > 4) sb.append(" +").append(matched.size() - 4).append(" more");
        }
        if (!critical.isEmpty()) {
            if (sb.length() > 0) sb.append(". ");
            sb.append("Missing critical: ").append(String.join(", ", critical.stream().limit(4).toList()));
        } else if (!important.isEmpty()) {
            if (sb.length() > 0) sb.append(". ");
            sb.append("Missing important: ").append(String.join(", ", important.stream().limit(3).toList()));
        }
        return sb.length() > 0 ? sb.toString() : "No technical skills detected";
    }

    private String buildSectionReasonFromData(Map<String, Object> data) {
        List<String> present = new ArrayList<>();
        List<String> absent = new ArrayList<>();
        for (String s : List.of("summary", "skills", "experience", "education", "projects")) {
            if (hasSection(data, s)) present.add(s); else absent.add(s);
        }
        String msg = "Present: " + String.join(", ", present);
        if (!absent.isEmpty()) msg += ". Missing: " + String.join(", ", absent);
        return msg;
    }

    private String buildImpactReasonFromCounts(int total, int quantified) {
        int pct = (int) Math.round((double) quantified / total * 100);
        if (pct >= 75) return pct + "% of bullets contain measurable results — excellent";
        if (pct >= 40) return pct + "% of bullets quantified — aim for 75%+";
        return "Only " + pct + "% of " + total + " bullets contain numbers/metrics";
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VERDICT, WARNINGS & TIPS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    private void setVerdict(AtsResultDTO result, int score, boolean isEntryLevel,
            Set<String> criticalSkills, List<String> matched) {
        long criticalMet = criticalSkills.stream().filter(matched::contains).count();
        boolean coresMet = criticalSkills.isEmpty() || (double) criticalMet / criticalSkills.size() >= 0.5;

        String verdict, explanation;
        if (score >= 85) {
            verdict = "Excellent Match";
            explanation = isEntryLevel ? "Outstanding alignment with this role's requirements"
                    : "Your profile strongly matches what employers are looking for";
        } else if (score >= 72) {
            verdict = "Strong Match";
            explanation = isEntryLevel ? "You are highly competitive for this entry-level role"
                    : "Strong technical alignment with the job requirements";
        } else if (score >= 58) {
            verdict = "Good Fit";
            explanation = isEntryLevel ? "Solid foundation — a few additions will make you competitive"
                    : "Good fit with opportunities to strengthen your profile";
        } else if (score >= 45) {
            verdict = "Needs Improvement";
            explanation = coresMet ? "You have core skills but need to address a few gaps"
                    : "Several key technical skills are missing for this role";
        } else {
            verdict = "Low Match";
            explanation = isEntryLevel ? "Consider building skills through projects before applying"
                    : "Significant skill gaps identified — upskilling recommended";
        }

        result.setAtsVerdict(verdict);
        result.setVerdictExplanation(explanation);
    }

    private List<String> buildWarnings(Map<String, Object> resumeData, boolean isEntryLevel) {
        List<String> w = new ArrayList<>();
        if (!hasSection(resumeData, "summary"))
            w.add("Missing professional summary — add a tailored 2-3 sentence opening");
        if (!hasSection(resumeData, "skills"))
            w.add("No skills section detected — list your technical skills explicitly");
        if (!hasSection(resumeData, "experience") && !hasSection(resumeData, "projects"))
            w.add("Add work experience or personal projects to demonstrate practical skill");
        if (!hasSection(resumeData, "education"))
            w.add("Add education details to complete your profile");
        if (isEntryLevel && !hasSection(resumeData, "projects"))
            w.add("Projects are highly valuable for entry-level roles — add 2-3 technical projects");
        return w;
    }

    private List<String> buildWeaknessFlags(int[] readabilityRes, Map<String, Object> resumeData) {
        List<String> flags = new ArrayList<>();
        if (readabilityRes.length > 1 && readabilityRes[1] >= 2)
            flags.add("Uses first-person pronouns (I, my) — use action verbs instead");
        if (readabilityRes.length > 2 && readabilityRes[2] >= 2)
            flags.add("Weak action verbs detected (worked on, helped, assisted) — replace with impact verbs");
        if (readabilityRes.length > 3 && readabilityRes[3] >= 2)
            flags.add("Overlong bullet points — keep each bullet under 25 words");

        String summary = (String) resumeData.get("summary");
        if (summary != null) {
            String lower = summary.toLowerCase();
            long buzzCount = List.of("passionate", "results-driven", "team player", "self-starter", "dynamic")
                    .stream().filter(lower::contains).count();
            if (buzzCount >= 2)
                flags.add("Summary relies on generic buzzwords — make it role-specific");
        }
        return flags;
    }

    /**
     * Generates 3 rule-based tailoring tips specific to this resume + JD analysis.
     */
    private List<String> buildTailoringTips(List<AtsResultDTO.MissingSkill> missing,
            int impactScore, int readabilityScore,
            Map<String, Object> resumeData,
            String jobDescription, int finalScore) {
        List<String> tips = new ArrayList<>();

        // Tip 1: Based on most critical missing skill
        Optional<AtsResultDTO.MissingSkill> topMissing = missing.stream()
                .filter(ms -> "CRITICAL".equals(ms.getSeverity())).findFirst();
        if (topMissing.isPresent()) {
            String skill = topMissing.get().getName();
            tips.add("Add \"" + formatSkillName(skill)
                    + "\" to your Skills section — it is listed as a required skill in the job description");
        } else {
            Optional<AtsResultDTO.MissingSkill> importantMissing = missing.stream()
                    .filter(ms -> "IMPORTANT".equals(ms.getSeverity())).findFirst();
            importantMissing.ifPresent(ms -> tips.add("Highlight \"" + formatSkillName(ms.getName())
                    + "\" in your experience bullets — employers prioritise this skill"));
        }

        // Tip 2: Quantification if low
        if (impactScore < 8) {
            tips.add(
                    "Quantify your achievements — e.g., 'Reduced API response time by 40%' or 'Deployed 3 microservices serving 10,000 users'");
        } else if (impactScore < 12) {
            tips.add(
                    "Good use of metrics! Add 1-2 more quantified results in your experience section to maximise impact");
        }

        // Tip 3: Readability / summary / or keyword density
        if (readabilityScore < 7) {
            tips.add(
                    "Rewrite bullets starting with strong action verbs: Built, Designed, Implemented, Reduced, Led — avoid 'I', 'my', 'helped'");
        } else if (!hasSection(resumeData, "summary")) {
            tips.add(
                    "Add a tailored 2-3 sentence professional summary mentioning the role and your top 2-3 relevant skills");
        } else if (finalScore < 65) {
            String roleHint = extractRoleHint(jobDescription);
            tips.add("Tailor your summary to mention " + (roleHint.isEmpty() ? "the target role" : "'" + roleHint + "'")
                    + " and 2-3 of the most critical required skills");
        }

        // Ensure exactly 3 tips
        if (tips.size() < 3) {
            tips.add(
                    "Mirror keywords from the job description exactly — ATS systems match exact terms like 'CI/CD', 'microservices', 'REST APIs'");
        }
        if (tips.size() < 3) {
            tips.add("Add a Projects section to showcase hands-on experience with the required technology stack");
        }

        return tips.stream().limit(3).collect(Collectors.toList());
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // KEYWORD EXTRACTION & SKILL HELPERS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /** Extract named skills from any block of text. */
    private Set<String> extractJdSkills(String text) {
        if (text == null || text.isBlank())
            return new HashSet<>();

        try {
            String prompt = "Extract ONLY specific hard skills, technical terms, tools, software, and tangible role-specific requirements from the text. "
                    + "EXCLUDE generic buzzwords, soft skills, managerial phrases (like 'User Needs', 'Reliability', 'Operations', 'Technology Updates'), and basic competencies. "
                    + "CRITICAL: Output ONLY a comma-separated list of the 10-15 most critical technical keywords. DO NOT include ANY introductory text, transitional phrases, or conversational filler (e.g., do not say 'Here is a list'). Just the keywords. Text: "
                    + text;
            String aiResult = aiService.extractKeywords(prompt);

            if (aiResult == null || aiResult.isBlank())
                return new HashSet<>();

            return Arrays.stream(aiResult.split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .map(s -> s.replaceAll("^(here's a list|here is a list|prioritizing nouns).*?:\\s*", "")) // Strip
                                                                                                              // common
                                                                                                              // LLM
                                                                                                              // filler
                                                                                                              // prefixes
                    .filter(s -> s.length() > 1 && s.length() < 40 && s.split("\\s+").length <= 4) // No long sentences
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            return new HashSet<>();
        }
    }

    /**
     * Extract all skills from all sections of the resume using 2-Pass SaaS
     * algorithm.
     */
    private Set<String> extractMatchedSkills(Map<String, Object> resumeData, Set<String> jdSkills) {
        StringBuilder sb = new StringBuilder();
        extractValuesToStringBuilder(resumeData, sb);
        String resumeText = sb.toString().toLowerCase();

        Set<String> matched = new HashSet<>();
        Set<String> potentiallyMissing = new HashSet<>();

        // ── PASS 1: Strict Normalized Regex Matching (handles spacing & punctuation)
        // ──
        for (String jdSkill : jdSkills) {
            String term = jdSkill.toLowerCase().replaceAll("[^a-z0-9+#]+", " ").trim();
            if (term.isEmpty())
                continue;

            // Build regex: e.g. "react js" ->
            // "(?<=^|[^a-z0-9+#])react[\s\p{Punct}]*js(?=[^a-z0-9+#]|$)"
            // This strictly matches nodejs, node.js, node-js, node js without false
            // positives.
            String regex = "(?<=^|[^a-z0-9+#])" + term.replace(" ", "[\\s\\p{Punct}]*") + "(?=[^a-z0-9+#]|$)";

            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(regex).matcher(resumeText);
            if (matcher.find()) {
                matched.add(jdSkill);
            } else {
                potentiallyMissing.add(jdSkill);
            }
        }

        // ── PASS 2: AI-Powered Semantic Equivalence for missing skills (SaaS scale) ──
        if (!potentiallyMissing.isEmpty()) {
            try {
                // We truncate the resume text to ~6000 chars to ensure comfortable processing
                // speed
                String contextText = resumeText.length() > 6000 ? resumeText.substring(0, 6000) : resumeText;
                String prompt = "You are an ATS skill matching engine. Your task is to compare skills against a resume.\n"
                        + "IMPORTANT MATCHING RULES:\n"
                        + "1. Perform semantic equivalence matching (e.g., 'rest api' and 'restful api' are equivalent, 'aws' and 'amazon web services').\n"
                        + "2. Do NOT mark a skill as missing if its equivalent exists.\n"
                        + "Required Skills to Check: " + String.join(", ", potentiallyMissing) + "\n"
                        + "Resume Text: " + contextText + "\n"
                        + "CRITICAL: Output ONLY a comma-separated list of the Required Skills that are ACTUALLY PRESENT in the Resume Text based on semantic equivalence. Do not add any introductory or conversational text (e.g., do not say 'Here is a list'). If none, output NONE.";

                String aiResult = aiService.extractKeywords(prompt);
                if (aiResult != null && !aiResult.isBlank() && !aiResult.equalsIgnoreCase("NONE")) {
                    List<String> recovered = Arrays.stream(aiResult.split(","))
                            .map(String::trim)
                            .map(s -> s.replaceAll(
                                    "^(here's a list|here is a list|prioritizing nouns|the required skills).*?:\\s*",
                                    ""))
                            .filter(s -> s.length() > 1 && s.split("\\s+").length <= 4)
                            .collect(Collectors.toList());

                    for (String rec : recovered) {
                        for (String missing : potentiallyMissing) {
                            if (missing.equalsIgnoreCase(rec) || rec.toLowerCase().contains(missing.toLowerCase())) {
                                matched.add(missing);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Non-blocking fallback; if LLM semantic check fails, rely on Pass 1 Regex.
            }
        }

        return matched;
    }

    private void extractValuesToStringBuilder(Object obj, StringBuilder sb) {
        if (obj instanceof String) {
            sb.append(obj).append(" ");
        } else if (obj instanceof Map) {
            for (Object val : ((Map<?, ?>) obj).values()) {
                extractValuesToStringBuilder(val, sb);
            }
        } else if (obj instanceof List) {
            for (Object item : (List<?>) obj) {
                extractValuesToStringBuilder(item, sb);
            }
        }
    }

    /**
     * Categorise JD skills by severity (CRITICAL / IMPORTANT / NICE_TO_HAVE)
     * based on surrounding JD context sentences.
     */
    private Map<String, Set<String>> categoriseByJdSeverity(String jd, Set<String> allSkills) {
        Set<String> critical = new HashSet<>();
        Set<String> important = new HashSet<>();
        Set<String> optional = new HashSet<>();

        String lower = jd.toLowerCase();
        // Split into sentences for context window
        String[] sentences = jd.split("[.!?\\n]");

        for (String skill : allSkills) {
            String severity = "IMPORTANT"; // default
            for (String sentence : sentences) {
                String sl = sentence.toLowerCase();
                if (!sl.contains(skill))
                    continue;

                if (sl.contains("required") || sl.contains("must have") || sl.contains("essential") ||
                        sl.contains("mandatory") || sl.contains("minimum requirement") ||
                        sl.contains("you must") || sl.contains("must be")) {
                    severity = "CRITICAL";
                    break;
                } else if (sl.contains("preferred") || sl.contains("nice to have") ||
                        sl.contains("bonus") || sl.contains("plus") || sl.contains("desirable") ||
                        sl.contains("good to have") || sl.contains("advantageous")) {
                    severity = "NICE_TO_HAVE";
                    break;
                }
            }
            switch (severity) {
                case "CRITICAL":
                    critical.add(skill);
                    break;
                case "NICE_TO_HAVE":
                    optional.add(skill);
                    break;
                default:
                    important.add(skill);
            }
        }

        // If nothing was marked critical, treat top-mentioned skills as critical
        if (critical.isEmpty()) {
            allSkills.stream()
                    .sorted((a, b) -> Long.compare(countOccurrences(lower, b), countOccurrences(lower, a)))
                    .limit(3)
                    .forEach(s -> {
                        important.remove(s);
                        critical.add(s);
                    });
        }

        Map<String, Set<String>> buckets = new HashMap<>();
        buckets.put("critical", critical);
        buckets.put("important", important);
        buckets.put("optional", optional);
        return buckets;
    }

    private List<AtsResultDTO.MissingSkill> buildCategorizedMissing(
            Set<String> critical, Set<String> important, Set<String> optional,
            List<String> matched) {

        List<AtsResultDTO.MissingSkill> result = new ArrayList<>();
        for (String s : critical)
            if (!matched.contains(s))
                result.add(new AtsResultDTO.MissingSkill(s, "CRITICAL"));
        for (String s : important)
            if (!matched.contains(s))
                result.add(new AtsResultDTO.MissingSkill(s, "IMPORTANT"));
        for (String s : optional)
            if (!matched.contains(s))
                result.add(new AtsResultDTO.MissingSkill(s, "NICE_TO_HAVE"));
        return result;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // EXPERIENCE YEAR ESTIMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    private int extractMinYearsFromJd(String jd) {
        // Patterns: "5+ years", "3-5 years", "minimum 2 years", "at least 4 years"
        Pattern p = Pattern.compile(
                "(?:minimum\\s+|at\\s+least\\s+|over\\s+)?(\\d+)(?:\\+|\\s*[-–]\\s*\\d+)?\\s*(?:years? of|years?\\s+(?:of\\s+)?(?:experience|work))",
                Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(jd);
        int min = -1;
        while (m.find()) {
            int y = Integer.parseInt(m.group(1));
            if (min < 0 || y < min)
                min = y;
        }
        return min;
    }

    private int estimateCandidateYears(Map<String, Object> resumeData) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> exp = (List<Map<String, Object>>) resumeData.get("experience");
        if (exp == null || exp.isEmpty())
            return 0;

        int currentYear = 2026;
        int earliest = currentYear;
        for (Map<String, Object> e : exp) {
            String start = str(e.get("startDate"));
            Matcher m = Pattern.compile("\\b(20\\d{2}|19\\d{2})\\b").matcher(start);
            if (m.find()) {
                int y = Integer.parseInt(m.group(1));
                if (y < earliest)
                    earliest = y;
            }
        }
        return Math.max(0, currentYear - earliest);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ENTRY-LEVEL DETECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    private boolean detectEntryLevel(String jd) {
        if (jd == null)
            return false;
        String lower = jd.toLowerCase();
        return lower.contains("entry level") || lower.contains("entry-level") ||
                lower.contains("junior") || lower.contains("graduate") ||
                lower.contains("fresher") || lower.contains("intern") ||
                lower.contains("0-2 years") || lower.contains("0-3 years") ||
                lower.contains("0 to 2") || lower.contains("0 to 3") ||
                lower.contains("no experience required") || lower.contains("recent graduate");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // REALISM CAP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    private int applyRealismCap(int raw, boolean isEntryLevel, Map<String, Object> resumeData) {
        int capped = Math.max(20, Math.min(95, raw));
        if (isEntryLevel)
            return Math.min(capped, 93);
        return capped;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // UTILITY METHODS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /** Extract all bullet / description strings across experience + projects. */
    private List<String> extractAllBullets(Map<String, Object> resumeData) {
        List<String> bullets = new ArrayList<>();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> exp = (List<Map<String, Object>>) resumeData.get("experience");
        if (exp != null) {
            for (Map<String, Object> e : exp) {
                splitAndAdd(str(e.get("description")), bullets);
                splitAndAdd(str(e.get("responsibility")), bullets);
            }
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> proj = (List<Map<String, Object>>) resumeData.get("projects");
        if (proj != null) {
            for (Map<String, Object> p : proj) {
                splitAndAdd(str(p.get("description")), bullets);
            }
        }

        return bullets;
    }

    private void splitAndAdd(String text, List<String> out) {
        if (text == null || text.isBlank())
            return;
        String[] parts = text.split("[.\\n•\\-]");
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.length() > 5)
                out.add(trimmed);
        }
    }

    /** Format canonical skill name for display ("spring-boot" → "Spring Boot"). */
    private String formatSkillName(String skill) {
        if (skill == null)
            return "";
        String[] parts = skill.replace("-", " ").replace(".", " ").split("\\s+");
        return Arrays.stream(parts)
                .map(p -> p.isEmpty() ? p : Character.toUpperCase(p.charAt(0)) + p.substring(1))
                .collect(Collectors.joining(" "));
    }

    private boolean hasSection(Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val instanceof String)
            return !((String) val).isBlank();
        if (val instanceof List)
            return !((List<?>) val).isEmpty();
        return val != null;
    }

    private boolean nonBlank(String s) {
        return s != null && !s.isBlank();
    }

    private String str(Object o) {
        return o == null ? "" : o.toString();
    }

    private long countOccurrences(String text, String term) {
        int count = 0, idx = 0;
        while ((idx = text.indexOf(term, idx)) != -1) {
            count++;
            idx += term.length();
        }
        return count;
    }

    private String extractRoleHint(String jd) {
        Pattern p = Pattern.compile(
                "(?:looking for|hiring|seeking|need)\\s+(?:a|an)?\\s*([A-Za-z ]+?(?:developer|engineer|analyst|architect|manager|designer|scientist|lead|specialist))",
                Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(jd);
        if (m.find())
            return m.group(1).trim();
        return "";
    }
}