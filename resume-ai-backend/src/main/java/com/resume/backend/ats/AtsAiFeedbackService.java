package com.resume.backend.ats;

import java.util.Map;

public interface AtsAiFeedbackService {

    /**
     * Generate AI-powered feedback based on ATS analysis results
     * 
     * @param atsResult      The ATS analysis results
     * @param jobDescription The job description used for analysis
     * @param resumeData     The structured resume data
     * @return AtsAiFeedbackDTO containing AI-generated explanations and suggestions
     */
    AtsAiFeedbackDTO generateFeedback(AtsResultDTO atsResult, String jobDescription, Map<String, Object> resumeData);
}