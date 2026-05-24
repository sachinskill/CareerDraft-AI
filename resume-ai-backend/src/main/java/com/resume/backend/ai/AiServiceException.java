package com.resume.backend.ai;

/**
 * Custom exception for AI service failures
 */
public class AiServiceException extends RuntimeException {
    
    public AiServiceException(String message) {
        super(message);
    }
    
    public AiServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
