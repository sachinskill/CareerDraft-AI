package com.resume.backend.payment;

/**
 * Custom exception for payment-related errors
 */
public class PaymentException extends RuntimeException {
    
    public PaymentException(String message) {
        super(message);
    }
    
    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }
}
