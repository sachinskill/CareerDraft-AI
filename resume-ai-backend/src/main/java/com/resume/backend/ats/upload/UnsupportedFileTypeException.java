package com.resume.backend.ats.upload;

/**
 * Exception thrown when an unsupported file type is uploaded for resume parsing.
 */
public class UnsupportedFileTypeException extends Exception {
    
    public UnsupportedFileTypeException(String message) {
        super(message);
    }
    
    public UnsupportedFileTypeException(String message, Throwable cause) {
        super(message, cause);
    }
}