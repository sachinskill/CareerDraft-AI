package com.resume.backend.ats.upload;

/**
 * Exception thrown when a file cannot be parsed or read during resume text extraction.
 */
public class FileParsingException extends Exception {
    
    public FileParsingException(String message) {
        super(message);
    }
    
    public FileParsingException(String message, Throwable cause) {
        super(message, cause);
    }
}