package com.resume.backend.user;

public class UsageLimitException extends RuntimeException {
    public UsageLimitException(String message) {
        super(message);
    }
}
