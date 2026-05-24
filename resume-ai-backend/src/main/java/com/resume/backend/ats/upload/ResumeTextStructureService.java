package com.resume.backend.ats.upload;

import java.util.Map;

/**
 * Service interface for parsing extracted resume text into structured resume data.
 * Converts plain text into minimal resume structure for improved ATS analysis.
 */
public interface ResumeTextStructureService {
    
    /**
     * Parse extracted resume text into a structured resume data object.
     * 
     * @param extractedText The plain text extracted from resume file
     * @return Structured resume data map compatible with ATS analyzer
     */
    Map<String, Object> parseTextToResumeStructure(String extractedText);
    
    /**
     * Extract summary section from resume text.
     * 
     * @param text The resume text
     * @return Summary text (first meaningful paragraph)
     */
    String extractSummary(String text);
    
    /**
     * Extract skills from resume text.
     * 
     * @param text The resume text
     * @return List of skills as strings
     */
    java.util.List<String> extractSkills(String text);
    
    /**
     * Extract experience sections from resume text.
     * 
     * @param text The resume text
     * @return List of experience text blocks
     */
    java.util.List<String> extractExperience(String text);
    
    /**
     * Extract education sections from resume text.
     * 
     * @param text The resume text
     * @return List of education text blocks
     */
    java.util.List<String> extractEducation(String text);
    
    /**
     * Extract projects sections from resume text.
     * 
     * @param text The resume text
     * @return List of project text blocks
     */
    java.util.List<String> extractProjects(String text);
}