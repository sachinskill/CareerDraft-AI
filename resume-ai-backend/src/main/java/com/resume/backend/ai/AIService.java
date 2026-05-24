package com.resume.backend.ai;

/**
 * AI Service abstraction layer for resume generation and analysis.
 * Allows switching between different AI providers (Mock, Groq, OpenAI, etc.)
 */
public interface AIService {

    /**
     * Generate a complete resume from user description
     * 
     * @param prompt The formatted prompt with user description
     * @return AI-generated response (JSON format expected)
     */
    String generateResume(String prompt);

    /**
     * Enhance an existing resume
     * 
     * @param prompt The formatted prompt with resume data
     * @return AI-enhanced response (JSON format expected)
     */
    String enhanceResume(String prompt);

    /**
     * Analyze and structure resume text from uploaded files
     * 
     * @param prompt The formatted prompt with extracted text
     * @return AI-structured response (JSON format expected)
     */
    String analyzeStructure(String prompt);

    /**
     * Generate ATS feedback and improvement suggestions
     * 
     * @param prompt The formatted prompt with ATS results
     * @return AI-generated feedback
     */
    String generateFeedback(String prompt);

    /**
     * Extract technical and soft skills from a job description or text
     * 
     * @param prompt The formatted prompt with text
     * @return AI-extracted skills as a comma-separated string
     */
    String extractKeywords(String prompt);
}
