package com.resume.backend.ats;

import java.util.List;
import java.util.Map;

/**
 * Unified ATS result contract.
 *
 * Scoring is deterministic and explainable:
 *   overallScore = weighted sum of 6 dimensions (max 100)
 *   potentialScore = overallScore + sum of actionable improvements
 *   confidence = ratio of JD skills that could be evaluated
 *
 * The frontend must NEVER compute scores itself — all numbers come from here.
 */
public class AtsResultDTO {

    // ── Core score ────────────────────────────────────────────────────────────
    private int atsScore;                  // 0-100 final weighted score
    private double confidence;             // 0.0-1.0 how reliable the score is
    private String atsVerdict;             // "Excellent" | "Good" | "Fair" | "Needs Work"
    private String verdictExplanation;     // 1-sentence human-readable reason

    // ── Potential / improvement engine ───────────────────────────────────────
    private int potentialScore;            // score achievable after improvements
    private int potentialImprovement;      // potentialScore - atsScore
    private List<ImprovementAction> improvements; // ordered by impact desc

    // ── Explainable breakdown ─────────────────────────────────────────────────
    private ScoringBreakdown breakdown;    // per-dimension score + reason

    // ── Skill gap analysis ────────────────────────────────────────────────────
    private List<String> matchedKeywords;
    private List<String> missingKeywords;          // flat list for legacy compat
    private List<String> partialSkills;            // skills partially mentioned
    private List<MissingSkill> categorizedMissingSkills;  // severity-tiered
    private List<String> missingCriticalSkills;    // legacy compat
    private List<String> missingCoreSkills;        // legacy compat
    private List<String> strongSkills;

    // ── Keyword match ─────────────────────────────────────────────────────────
    private double keywordMatchPercentage; // % of JD skills found in resume
    private double semanticSimilarity;    // cosine similarity 0.0-1.0

    // ── Impact / bullets ─────────────────────────────────────────────────────
    private int impactScore;              // 0-15
    private int quantifiedBullets;
    private int totalBullets;
    private String impactMessage;         // human-readable impact summary

    // ── Readability ───────────────────────────────────────────────────────────
    private int readabilityScore;         // 0-10
    private List<String> weaknessFlags;

    // ── Experience ────────────────────────────────────────────────────────────
    private int experienceAlignmentScore; // 0-15 or 0-20 depending on engine

    // ── Section scores (raw map for backward compat) ──────────────────────────
    private Map<String, Integer> sectionScores;

    // ── Tailoring tips ────────────────────────────────────────────────────────
    private List<String> tailoringTips;

    // ── Warnings ─────────────────────────────────────────────────────────────
    private List<String> warnings;

    // ── AI feedback ───────────────────────────────────────────────────────────
    private AtsAiFeedbackDTO aiFeedback;

    // ── Entry-level context ───────────────────────────────────────────────────
    private boolean isEntryLevel;
    private int coreSkillsMatched;
    private int totalCoreSkills;
    private boolean isLocked = false;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Inner classes
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /** One actionable improvement with its score impact. */
    public static class ImprovementAction {
        private String action;   // e.g. "Add Docker to your Skills section"
        private int impact;      // e.g. +8
        private String category; // "SKILL" | "SECTION" | "IMPACT" | "READABILITY"

        public ImprovementAction() {}
        public ImprovementAction(String action, int impact, String category) {
            this.action = action;
            this.impact = impact;
            this.category = category;
        }

        public String getAction() { return action; }
        public void setAction(String v) { this.action = v; }
        public int getImpact() { return impact; }
        public void setImpact(int v) { this.impact = v; }
        public String getCategory() { return category; }
        public void setCategory(String v) { this.category = v; }
    }

    /** Per-dimension score with a human-readable reason. */
    public static class DimensionScore {
        private int score;
        private int maxScore;
        private String reason; // e.g. "Good match but missing Docker, AWS"

        public DimensionScore() {}
        public DimensionScore(int score, int maxScore, String reason) {
            this.score = score;
            this.maxScore = maxScore;
            this.reason = reason;
        }

        public int getScore() { return score; }
        public void setScore(int v) { this.score = v; }
        public int getMaxScore() { return maxScore; }
        public void setMaxScore(int v) { this.maxScore = v; }
        public String getReason() { return reason; }
        public void setReason(String v) { this.reason = v; }
    }

    /** Full explainable breakdown. */
    public static class ScoringBreakdown {
        private DimensionScore skills;
        private DimensionScore experience;
        private DimensionScore education;
        private DimensionScore sections;
        private DimensionScore impact;
        private DimensionScore readability;

        public ScoringBreakdown() {}

        public DimensionScore getSkills() { return skills; }
        public void setSkills(DimensionScore v) { this.skills = v; }
        public DimensionScore getExperience() { return experience; }
        public void setExperience(DimensionScore v) { this.experience = v; }
        public DimensionScore getEducation() { return education; }
        public void setEducation(DimensionScore v) { this.education = v; }
        public DimensionScore getSections() { return sections; }
        public void setSections(DimensionScore v) { this.sections = v; }
        public DimensionScore getImpact() { return impact; }
        public void setImpact(DimensionScore v) { this.impact = v; }
        public DimensionScore getReadability() { return readability; }
        public void setReadability(DimensionScore v) { this.readability = v; }
    }

    /** Severity-tagged missing skill. */
    public static class MissingSkill {
        private String name;
        private String severity; // "CRITICAL" | "IMPORTANT" | "NICE_TO_HAVE"

        public MissingSkill() {}
        public MissingSkill(String name, String severity) {
            this.name = name;
            this.severity = severity;
        }

        public String getName() { return name; }
        public void setName(String v) { this.name = v; }
        public String getSeverity() { return severity; }
        public void setSeverity(String v) { this.severity = v; }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Constructors
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    public AtsResultDTO() {}

    /** Legacy constructor — kept for backward compat with AtsAnalyzerServiceImpl. */
    public AtsResultDTO(int atsScore, double keywordMatchPercentage,
            List<String> matchedKeywords, List<String> missingKeywords,
            List<String> warnings) {
        this.atsScore = atsScore;
        this.keywordMatchPercentage = keywordMatchPercentage;
        this.matchedKeywords = matchedKeywords;
        this.missingKeywords = missingKeywords;
        this.warnings = warnings;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Getters & Setters
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    public int getAtsScore() { return atsScore; }
    public void setAtsScore(int v) { this.atsScore = v; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double v) { this.confidence = v; }

    public String getAtsVerdict() { return atsVerdict; }
    public void setAtsVerdict(String v) { this.atsVerdict = v; }

    public String getVerdictExplanation() { return verdictExplanation; }
    public void setVerdictExplanation(String v) { this.verdictExplanation = v; }

    public int getPotentialScore() { return potentialScore; }
    public void setPotentialScore(int v) { this.potentialScore = v; }

    public int getPotentialImprovement() { return potentialImprovement; }
    public void setPotentialImprovement(int v) { this.potentialImprovement = v; }

    public List<ImprovementAction> getImprovements() { return improvements; }
    public void setImprovements(List<ImprovementAction> v) { this.improvements = v; }

    public ScoringBreakdown getBreakdown() { return breakdown; }
    public void setBreakdown(ScoringBreakdown v) { this.breakdown = v; }

    public List<String> getMatchedKeywords() { return matchedKeywords; }
    public void setMatchedKeywords(List<String> v) { this.matchedKeywords = v; }

    public List<String> getMissingKeywords() { return missingKeywords; }
    public void setMissingKeywords(List<String> v) { this.missingKeywords = v; }

    public List<String> getPartialSkills() { return partialSkills; }
    public void setPartialSkills(List<String> v) { this.partialSkills = v; }

    public List<MissingSkill> getCategorizedMissingSkills() { return categorizedMissingSkills; }
    public void setCategorizedMissingSkills(List<MissingSkill> v) { this.categorizedMissingSkills = v; }

    public List<String> getMissingCriticalSkills() { return missingCriticalSkills; }
    public void setMissingCriticalSkills(List<String> v) { this.missingCriticalSkills = v; }

    public List<String> getMissingCoreSkills() { return missingCoreSkills; }
    public void setMissingCoreSkills(List<String> v) { this.missingCoreSkills = v; }

    public List<String> getStrongSkills() { return strongSkills; }
    public void setStrongSkills(List<String> v) { this.strongSkills = v; }

    public double getKeywordMatchPercentage() { return keywordMatchPercentage; }
    public void setKeywordMatchPercentage(double v) { this.keywordMatchPercentage = v; }

    public double getSemanticSimilarity() { return semanticSimilarity; }
    public void setSemanticSimilarity(double v) { this.semanticSimilarity = v; }

    public int getImpactScore() { return impactScore; }
    public void setImpactScore(int v) { this.impactScore = v; }

    public int getQuantifiedBullets() { return quantifiedBullets; }
    public void setQuantifiedBullets(int v) { this.quantifiedBullets = v; }

    public int getTotalBullets() { return totalBullets; }
    public void setTotalBullets(int v) { this.totalBullets = v; }

    public String getImpactMessage() { return impactMessage; }
    public void setImpactMessage(String v) { this.impactMessage = v; }

    public int getReadabilityScore() { return readabilityScore; }
    public void setReadabilityScore(int v) { this.readabilityScore = v; }

    public List<String> getWeaknessFlags() { return weaknessFlags; }
    public void setWeaknessFlags(List<String> v) { this.weaknessFlags = v; }

    public int getExperienceAlignmentScore() { return experienceAlignmentScore; }
    public void setExperienceAlignmentScore(int v) { this.experienceAlignmentScore = v; }

    public Map<String, Integer> getSectionScores() { return sectionScores; }
    public void setSectionScores(Map<String, Integer> v) { this.sectionScores = v; }

    public List<String> getTailoringTips() { return tailoringTips; }
    public void setTailoringTips(List<String> v) { this.tailoringTips = v; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> v) { this.warnings = v; }

    public AtsAiFeedbackDTO getAiFeedback() { return aiFeedback; }
    public void setAiFeedback(AtsAiFeedbackDTO v) { this.aiFeedback = v; }

    public boolean isEntryLevel() { return isEntryLevel; }
    public void setEntryLevel(boolean v) { this.isEntryLevel = v; }

    public int getCoreSkillsMatched() { return coreSkillsMatched; }
    public void setCoreSkillsMatched(int v) { this.coreSkillsMatched = v; }

    public int getTotalCoreSkills() { return totalCoreSkills; }
    public void setTotalCoreSkills(int v) { this.totalCoreSkills = v; }

    public boolean getIsLocked() { return isLocked; }
    public void setIsLocked(boolean v) { this.isLocked = v; }

    @Override
    public String toString() {
        return "AtsResultDTO{score=" + atsScore + ", potential=" + potentialScore
                + ", verdict='" + atsVerdict + "', confidence=" + confidence + ", isLocked=" + isLocked + "}";
    }
}
