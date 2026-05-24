package com.resume.backend.ats;

import java.util.Map;

public interface AtsAnalyzerService {
    
    /**
     * Analyzes a resume against a job description and returns ATS scoring results
     * 
     * @param resumeData The resume data as a Map (JSON structure)
     * @param jobDescription The job description as plain text
     * @return AtsResultDTO containing score and analysis details
     */
    AtsResultDTO analyzeResume(Map<String, Object> resumeData, String jobDescription);
}