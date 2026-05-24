package com.resume.backend.ats;

import java.util.List;

public class AtsAiFeedbackDTO {

    // ── Original fields (kept for compatibility)
    // ──────────────────────────────────
    private String atsSummaryExplanation;
    private String improvementSuggestions;
    private String keywordAdvice;

    // ── New structured fields ────────────────────────────────────────────────────
    private String overallSummary; // 2-3 sentence holistic assessment
    private String experienceFeedback; // Specific feedback on experience bullets
    private String skillsFeedback; // What's strong / weak in skills section
    private List<String> rewrittenBullets; // 1-2 AI-rewritten bullet examples (before→after)

    public AtsAiFeedbackDTO() {
    }

    public AtsAiFeedbackDTO(String atsSummaryExplanation, String improvementSuggestions, String keywordAdvice) {
        this.atsSummaryExplanation = atsSummaryExplanation;
        this.improvementSuggestions = improvementSuggestions;
        this.keywordAdvice = keywordAdvice;
    }

    // ── Getters & Setters
    // ─────────────────────────────────────────────────────────
    public String getAtsSummaryExplanation() {
        return atsSummaryExplanation;
    }

    public void setAtsSummaryExplanation(String v) {
        this.atsSummaryExplanation = v;
    }

    public String getImprovementSuggestions() {
        return improvementSuggestions;
    }

    public void setImprovementSuggestions(String v) {
        this.improvementSuggestions = v;
    }

    public String getKeywordAdvice() {
        return keywordAdvice;
    }

    public void setKeywordAdvice(String v) {
        this.keywordAdvice = v;
    }

    public String getOverallSummary() {
        return overallSummary;
    }

    public void setOverallSummary(String v) {
        this.overallSummary = v;
    }

    public String getExperienceFeedback() {
        return experienceFeedback;
    }

    public void setExperienceFeedback(String v) {
        this.experienceFeedback = v;
    }

    public String getSkillsFeedback() {
        return skillsFeedback;
    }

    public void setSkillsFeedback(String v) {
        this.skillsFeedback = v;
    }

    public List<String> getRewrittenBullets() {
        return rewrittenBullets;
    }

    public void setRewrittenBullets(List<String> v) {
        this.rewrittenBullets = v;
    }

    @Override
    public String toString() {
        return "AtsAiFeedbackDTO{" +
                "overallSummary='" + overallSummary + '\'' +
                ", improvementSuggestions='" + improvementSuggestions + '\'' +
                ", rewrittenBullets=" + rewrittenBullets + '}';
    }
}