package com.resume.backend.ats;

import java.util.Map;

public class AtsAnalysisRequest {
    private Map<String, Object> resumeData;
    private String jobDescription;
    private boolean includeAiFeedback = true; // Default to true, can be disabled

    public AtsAnalysisRequest() {}

    public AtsAnalysisRequest(Map<String, Object> resumeData, String jobDescription) {
        this.resumeData = resumeData;
        this.jobDescription = jobDescription;
    }

    public AtsAnalysisRequest(Map<String, Object> resumeData, String jobDescription, boolean includeAiFeedback) {
        this.resumeData = resumeData;
        this.jobDescription = jobDescription;
        this.includeAiFeedback = includeAiFeedback;
    }

    public Map<String, Object> getResumeData() {
        return resumeData;
    }

    public void setResumeData(Map<String, Object> resumeData) {
        this.resumeData = resumeData;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public boolean isIncludeAiFeedback() {
        return includeAiFeedback;
    }

    public void setIncludeAiFeedback(boolean includeAiFeedback) {
        this.includeAiFeedback = includeAiFeedback;
    }

    @Override
    public String toString() {
        return "AtsAnalysisRequest{" +
                "resumeData=" + resumeData +
                ", jobDescription='" + jobDescription + '\'' +
                ", includeAiFeedback=" + includeAiFeedback +
                '}';
    }
}