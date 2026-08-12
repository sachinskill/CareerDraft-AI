package com.resume.backend.ats;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Maps the Python microservice JSON response → AtsResultDTO.
 *
 * Responsibilities:
 *  1. Build explainable ScoringBreakdown with per-dimension reasons
 *  2. Compute potentialScore + ordered ImprovementAction list
 *  3. Ensure overallScore == sum(breakdown dimensions) — no contradictions
 *  4. Populate skill gap (matched / missing / partial)
 *  5. Generate impact message (handles 0/0 bullets gracefully)
 */
@Component
public class AtsResultMapper {

    // Dimension weights (must sum to 100)
    private static final int W_SKILLS      = 40;
    private static final int W_EXPERIENCE  = 20;
    private static final int W_EDUCATION   = 10;
    private static final int W_SECTIONS    = 10;
    private static final int W_IMPACT      = 10;
    private static final int W_READABILITY = 10;

    public AtsResultDTO fromPythonResponse(JsonNode node) {
        AtsResultDTO dto = new AtsResultDTO();

        // ── 1. Raw dimension scores from Python ───────────────────────────────
        JsonNode bd = node.path("breakdown");
        int skillScore    = bd.path("skillMatch").asInt(0);
        int expScore      = bd.path("experienceMatch").asInt(0);
        int eduScore      = bd.path("educationMatch").asInt(0);
        int sectionScore  = bd.path("sectionCompleteness").asInt(0);
        int impactRaw     = bd.path("readability").asInt(0); // Python uses readability slot
        int readRaw       = bd.path("readability").asInt(0);

        // Normalise each dimension to its weight (Python returns 0-max, we keep as-is)
        // overallScore = direct sum — Python already weights correctly
        int overallScore = node.path("overallScore").asInt(
                skillScore + expScore + eduScore + sectionScore + impactRaw + readRaw);
        overallScore = Math.min(98, Math.max(0, overallScore));

        dto.setAtsScore(overallScore);

        // ── 2. Skill gap ──────────────────────────────────────────────────────
        List<String> matched  = toStringList(node.path("matchedSkills"));
        JsonNode missingNode  = node.path("missingSkills");
        List<String> critical = toStringList(missingNode.path("critical"));
        List<String> important = toStringList(missingNode.path("important"));
        List<String> optional  = toStringList(missingNode.path("niceToHave"));

        dto.setMatchedKeywords(matched);
        dto.setStrongSkills(matched);
        dto.setMissingCriticalSkills(critical);
        dto.setMissingCoreSkills(important);

        List<String> flatMissing = new ArrayList<>(critical);
        flatMissing.addAll(important);
        flatMissing.addAll(optional);
        dto.setMissingKeywords(flatMissing.stream().limit(8).toList());

        List<AtsResultDTO.MissingSkill> categorized = new ArrayList<>();
        critical.forEach(s  -> categorized.add(new AtsResultDTO.MissingSkill(s, "CRITICAL")));
        important.forEach(s -> categorized.add(new AtsResultDTO.MissingSkill(s, "IMPORTANT")));
        optional.forEach(s  -> categorized.add(new AtsResultDTO.MissingSkill(s, "NICE_TO_HAVE")));
        dto.setCategorizedMissingSkills(categorized);

        // Partial skills — skills mentioned but not as primary (heuristic: in matched but
        // also appear in important missing → likely mentioned in passing)
        List<String> partial = new ArrayList<>();
        for (String s : important) {
            if (matched.stream().anyMatch(m -> m.toLowerCase().contains(s.toLowerCase().substring(0, Math.min(4, s.length()))))) {
                partial.add(s);
            }
        }
        dto.setPartialSkills(partial);

        // ── 3. Keyword match % and semantic similarity ────────────────────────
        double kwPct = node.path("keywordMatchPct").asDouble(0);
        double semantic = node.path("semanticSimilarity").asDouble(0);

        // CONSISTENCY FIX: if there are critical missing skills, keyword match
        // cannot be 100%. Cap it to reflect reality.
        if (!critical.isEmpty() && kwPct >= 95) {
            kwPct = Math.max(60, kwPct - (critical.size() * 8.0));
        }
        dto.setKeywordMatchPercentage(Math.round(kwPct * 10.0) / 10.0);
        dto.setSemanticSimilarity(Math.round(semantic * 100.0) / 100.0);

        // Re-align overall score with high semantic alignment / keyword match percentage
        double semanticPct = dto.getSemanticSimilarity() > 0 ? dto.getSemanticSimilarity() : dto.getKeywordMatchPercentage();
        if (semanticPct >= 75.0 && dto.getAtsScore() < 60) {
            int adjusted = (int) Math.round(semanticPct * 0.85);
            dto.setAtsScore(Math.max(dto.getAtsScore(), adjusted));
        }

        // ── 4. Explainable breakdown ──────────────────────────────────────────
        AtsResultDTO.ScoringBreakdown breakdown = new AtsResultDTO.ScoringBreakdown();

        breakdown.setSkills(new AtsResultDTO.DimensionScore(
                skillScore, W_SKILLS,
                buildSkillReason(matched, critical, important)));

        breakdown.setExperience(new AtsResultDTO.DimensionScore(
                expScore, W_EXPERIENCE,
                buildExpReason(node, expScore)));

        breakdown.setEducation(new AtsResultDTO.DimensionScore(
                eduScore, W_EDUCATION,
                buildEduReason(node, eduScore)));

        breakdown.setSections(new AtsResultDTO.DimensionScore(
                sectionScore, W_SECTIONS,
                buildSectionReason(toStringList(node.path("sectionsFound")))));

        int totalBullets = node.path("totalBullets").asInt(0);
        int quantBullets = node.path("quantifiedBullets").asInt(0);
        int impactScore  = computeImpactScore(totalBullets, quantBullets);
        breakdown.setImpact(new AtsResultDTO.DimensionScore(
                impactScore, W_IMPACT,
                buildImpactReason(totalBullets, quantBullets)));

        breakdown.setReadability(new AtsResultDTO.DimensionScore(
                readRaw, W_READABILITY,
                buildReadabilityReason(toStringList(node.path("readabilityFlags")))));

        dto.setBreakdown(breakdown);

        // ── 5. Recalculate overallScore from breakdown for consistency ─────────
        int recalculated = skillScore + expScore + eduScore + sectionScore + impactScore + readRaw;
        recalculated = Math.min(98, Math.max(0, recalculated));
        dto.setAtsScore(recalculated);

        // ── 6. Confidence ─────────────────────────────────────────────────────
        int totalJdSkills = matched.size() + flatMissing.size();
        double confidence = totalJdSkills > 0
                ? Math.min(0.99, 0.5 + (totalJdSkills / 30.0) * 0.49)
                : 0.6;
        dto.setConfidence(Math.round(confidence * 100.0) / 100.0);

        // ── 7. Improvement engine ─────────────────────────────────────────────
        List<AtsResultDTO.ImprovementAction> improvements = buildImprovements(
                critical, important, sectionScore, impactScore, readRaw,
                toStringList(node.path("sectionsFound")),
                toStringList(node.path("readabilityFlags")));

        int totalGain = improvements.stream().mapToInt(AtsResultDTO.ImprovementAction::getImpact).sum();
        int potentialScore = Math.min(97, recalculated + totalGain);
        int potentialImprovement = potentialScore - recalculated;

        dto.setImprovements(improvements);
        dto.setPotentialScore(potentialScore);
        dto.setPotentialImprovement(Math.max(0, potentialImprovement));

        // ── 8. Impact / bullets ───────────────────────────────────────────────
        dto.setTotalBullets(totalBullets);
        dto.setQuantifiedBullets(quantBullets);
        dto.setImpactScore(impactScore);
        dto.setImpactMessage(buildImpactMessage(totalBullets, quantBullets));

        // ── 9. Readability ────────────────────────────────────────────────────
        dto.setReadabilityScore(readRaw);
        dto.setWeaknessFlags(toStringList(node.path("readabilityFlags")));

        // ── 10. Experience ────────────────────────────────────────────────────
        dto.setExperienceAlignmentScore(expScore);

        // ── 11. Legacy sectionScores map (for backward compat) ────────────────
        Map<String, Integer> legacyScores = new LinkedHashMap<>();
        legacyScores.put("keywordMatch", skillScore);
        legacyScores.put("sectionQuality", sectionScore);
        legacyScores.put("impactScore", impactScore);
        legacyScores.put("experienceAlignment", expScore);
        legacyScores.put("readability", readRaw);
        legacyScores.put("summaryQuality", eduScore);
        dto.setSectionScores(legacyScores);

        // ── 12. Tailoring tips (specific, not generic) ────────────────────────
        dto.setTailoringTips(buildTailoringTips(critical, important, sectionScore,
                toStringList(node.path("sectionsFound"))));

        // ── 13. Verdict ───────────────────────────────────────────────────────
        setVerdict(dto, recalculated);

        // ── 14. Entry-level context ───────────────────────────────────────────
        dto.setEntryLevel(node.path("isEntryLevel").asBoolean(false));
        int coreMatched = (int) matched.stream()
                .filter(s -> critical.contains(s) || important.contains(s)).count();
        dto.setCoreSkillsMatched(coreMatched);
        dto.setTotalCoreSkills(Math.max(1, critical.size() + important.size()));

        dto.setWarnings(new ArrayList<>());

        return dto;
    }

    // ── Reason builders ───────────────────────────────────────────────────────

    private String buildSkillReason(List<String> matched, List<String> critical, List<String> important) {
        if (matched.isEmpty() && critical.isEmpty()) return "No technical skills detected in resume or job description";
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
        return sb.toString();
    }

    private String buildExpReason(JsonNode node, int score) {
        JsonNode expYears = node.path("experienceYears");
        int candidate = expYears.path("candidate").asInt(-1);
        Object required = expYears.path("required").isTextual()
                ? expYears.path("required").asText()
                : expYears.path("required").asInt(-1);
        if (candidate < 0) return "Could not determine experience years from resume";
        if ("not specified".equals(required.toString())) return candidate + " years detected; job has no stated requirement";
        int req = Integer.parseInt(required.toString().replaceAll("[^0-9]", "0"));
        if (candidate >= req) return candidate + " years meets the " + req + "+ year requirement";
        return candidate + " years detected; job requires " + req + "+ years — gap of " + (req - candidate) + " years";
    }

    private String buildEduReason(JsonNode node, int score) {
        JsonNode edu = node.path("educationLevel");
        int candidate = edu.path("candidate").asInt(0);
        int required  = edu.path("required").asInt(0);
        String[] levels = {"None", "Diploma", "Bachelor's", "Master's", "PhD"};
        String cand = candidate < levels.length ? levels[candidate] : "Unknown";
        String req  = required  < levels.length ? levels[required]  : "Unknown";
        if (required == 0) return "No degree requirement stated in job description";
        if (candidate >= required) return cand + " degree meets the " + req + " requirement";
        return cand + " detected; job prefers " + req;
    }

    private String buildSectionReason(List<String> found) {
        List<String> required = List.of("summary", "experience", "education", "skills");
        List<String> missing = required.stream().filter(s -> !found.contains(s)).toList();
        if (missing.isEmpty()) return "All key sections present: " + String.join(", ", found.stream().limit(5).toList());
        return "Missing sections: " + String.join(", ", missing) + ". Found: " + String.join(", ", found.stream().limit(4).toList());
    }

    private String buildImpactReason(int total, int quantified) {
        if (total == 0) return "No bullet points detected — add achievement-focused bullets";
        int pct = (int) Math.round((double) quantified / total * 100);
        if (pct >= 75) return pct + "% of bullets contain measurable results — excellent";
        if (pct >= 40) return pct + "% of bullets quantified — aim for 75%+";
        return "Only " + pct + "% of " + total + " bullets contain numbers/metrics — add measurable outcomes";
    }

    private String buildReadabilityReason(List<String> flags) {
        if (flags.isEmpty()) return "Clean writing — no major readability issues detected";
        return String.join("; ", flags.stream().limit(2).toList());
    }

    // ── Impact score computation (fixes 0/0 bug) ──────────────────────────────

    private int computeImpactScore(int total, int quantified) {
        if (total == 0) return 3; // neutral — can't penalise if no bullets detected
        double ratio = (double) quantified / total;
        return Math.min(10, (int) Math.round(ratio * 10));
    }

    private String buildImpactMessage(int total, int quantified) {
        if (total == 0) return "No measurable achievements found — add bullet points with numbers, %, or scale";
        int pct = (int) Math.round((double) quantified / total * 100);
        return quantified + " of " + total + " bullets (" + pct + "%) contain measurable results";
    }

    // ── Improvement engine ────────────────────────────────────────────────────

    private List<AtsResultDTO.ImprovementAction> buildImprovements(
            List<String> critical, List<String> important,
            int sectionScore, int impactScore, int readScore,
            List<String> sectionsFound, List<String> readabilityFlags) {

        List<AtsResultDTO.ImprovementAction> actions = new ArrayList<>();

        // Critical skills — highest impact
        for (String skill : critical.stream().limit(3).toList()) {
            actions.add(new AtsResultDTO.ImprovementAction(
                    "Add \"" + skill + "\" to your Skills section (required by job description)", 6, "SKILL"));
        }

        // Important skills
        for (String skill : important.stream().limit(3).toList()) {
            actions.add(new AtsResultDTO.ImprovementAction(
                    "Add \"" + skill + "\" if you have experience with it", 3, "SKILL"));
        }

        // Missing sections
        List<String> requiredSections = List.of("summary", "experience", "education", "skills", "projects");
        for (String section : requiredSections) {
            if (!sectionsFound.contains(section)) {
                int impact = section.equals("summary") ? 4 : section.equals("projects") ? 3 : 5;
                actions.add(new AtsResultDTO.ImprovementAction(
                        "Add a " + capitalize(section) + " section", impact, "SECTION"));
            }
        }

        // Impact / bullets
        if (impactScore < 6) {
            actions.add(new AtsResultDTO.ImprovementAction(
                    "Add quantified achievements (numbers, %, scale) to your bullet points", 5, "IMPACT"));
        }

        // Readability
        if (!readabilityFlags.isEmpty()) {
            actions.add(new AtsResultDTO.ImprovementAction(
                    "Fix writing issues: " + readabilityFlags.get(0), 3, "READABILITY"));
        }

        // Sort by impact descending
        actions.sort(Comparator.comparingInt(AtsResultDTO.ImprovementAction::getImpact).reversed());
        return actions.stream().limit(6).toList();
    }

    // ── Tailoring tips (specific, not generic) ────────────────────────────────

    private List<String> buildTailoringTips(List<String> critical, List<String> important,
            int sectionScore, List<String> sectionsFound) {
        List<String> tips = new ArrayList<>();

        if (!critical.isEmpty()) {
            tips.add("Add these required skills immediately: " + String.join(", ", critical.stream().limit(4).toList())
                    + " — they appear in the 'Required' section of the job description");
        }
        if (!important.isEmpty()) {
            tips.add("Mention " + String.join(", ", important.stream().limit(3).toList())
                    + " in your experience bullets if you've used them");
        }
        if (!sectionsFound.contains("summary")) {
            tips.add("Add a 2-3 sentence professional summary mentioning the role title and your top 2 matching skills");
        }
        if (!sectionsFound.contains("projects")) {
            tips.add("Add a Projects section — it significantly boosts entry-level and mid-level ATS scores");
        }
        if (tips.isEmpty()) {
            tips.add("Quantify more bullet points: replace 'worked on X' with 'built X serving N users, reducing Y by Z%'");
        }

        return tips.stream().limit(3).toList();
    }

    // ── Verdict ───────────────────────────────────────────────────────────────

    private void setVerdict(AtsResultDTO dto, int score) {
        if (score >= 80) {
            dto.setAtsVerdict("Excellent");
            dto.setVerdictExplanation("Strong match — your resume is well-optimized for this role");
        } else if (score >= 65) {
            dto.setAtsVerdict("Good");
            dto.setVerdictExplanation("Good match with targeted improvements possible");
        } else if (score >= 45) {
            dto.setAtsVerdict("Fair");
            dto.setVerdictExplanation("Significant gaps — address missing skills and add measurable achievements");
        } else {
            dto.setAtsVerdict("Needs Work");
            dto.setVerdictExplanation("Major revisions required — most ATS systems will filter this resume out");
        }
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    private List<String> toStringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(n -> { if (!n.asText().isBlank()) list.add(n.asText()); });
        }
        return list;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
