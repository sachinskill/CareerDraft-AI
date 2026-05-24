package com.resume.backend.ats;

public interface AtsComprehensiveService {

    /**
     * Replaces 3 disparate API calls by sending the resume text and JD directly
     * into
     * a single consolidated Groq prompt, preventing 429 Token Limits.
     */
    AtsResultDTO executeComprehensiveAnalysis(String resumeText, String jobDescription) throws Exception;

}
