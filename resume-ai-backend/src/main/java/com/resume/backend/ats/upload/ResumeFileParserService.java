package com.resume.backend.ats.upload;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for parsing resume files and extracting text content.
 * Supports PDF and DOCX file formats.
 */
public interface ResumeFileParserService {
    
    /**
     * Extract plain text from a resume file.
     * 
     * @param file The uploaded resume file (PDF or DOCX)
     * @return Cleaned plain text content from the resume
     * @throws UnsupportedFileTypeException if file type is not supported
     * @throws FileParsingException if file cannot be parsed
     */
    String extractTextFromFile(MultipartFile file) throws UnsupportedFileTypeException, FileParsingException;
    
    /**
     * Check if the file type is supported for text extraction.
     * 
     * @param filename The name of the file
     * @return true if file type is supported (PDF or DOCX)
     */
    boolean isSupportedFileType(String filename);
    
    /**
     * Clean and normalize extracted text for ATS processing.
     * 
     * @param rawText The raw extracted text
     * @return Cleaned and normalized text
     */
    String cleanExtractedText(String rawText);
}