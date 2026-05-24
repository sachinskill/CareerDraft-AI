package com.resume.backend.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RazorpayService {
    
    private static final Logger logger = LoggerFactory.getLogger(RazorpayService.class);
    private static final int AMOUNT_IN_PAISE = 4900; // ₹49.00
    private static final String CURRENCY = "INR";
    
    private final RazorpayClient razorpayClient;
    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    
    public RazorpayService(
            @Value("${razorpay.key.id}") String keyId,
            @Value("${razorpay.key.secret}") String keySecret,
            @Value("${razorpay.webhook.secret}") String webhookSecret) throws RazorpayException {
        
        // Validate configuration
        if (keyId == null || keyId.isBlank()) {
            throw new IllegalStateException("RAZORPAY_KEY_ID not configured");
        }
        if (keySecret == null || keySecret.isBlank()) {
            throw new IllegalStateException("RAZORPAY_KEY_SECRET not configured");
        }
        
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.razorpayClient = new RazorpayClient(keyId, keySecret);
        
        logger.info("RazorpayService initialized with key: {}", keyId.substring(0, 12) + "...");
    }

    /**
     * Verify Razorpay Webhook signature
     */
    public boolean verifyWebhookSignature(String payload, String signature) {
        try {
            return Utils.verifyWebhookSignature(payload, signature, webhookSecret);
        } catch (RazorpayException e) {
            logger.error("Failed to verify webhook signature", e);
            return false;
        }
    }
    
    /**
     * Create Razorpay order for Pro upgrade
     * @param userId User ID for receipt generation
     * @return Map containing orderId, keyId, and amount
     */
    public Map<String, Object> createOrder(Long userId) {
        try {
            // Create order request
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", AMOUNT_IN_PAISE);
            orderRequest.put("currency", CURRENCY);
            orderRequest.put("receipt", "user_" + userId + "_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1); // Auto capture
            
            // Add metadata notes for Webhook tracking
            JSONObject notes = new JSONObject();
            notes.put("userId", String.valueOf(userId));
            orderRequest.put("notes", notes);
            
            // Create order via Razorpay API
            Order order = razorpayClient.orders.create(orderRequest);
            
            logger.info("Razorpay order created: {} for user: {}", order.get("id"), userId);
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("keyId", keyId);
            response.put("amount", AMOUNT_IN_PAISE);
            response.put("currency", CURRENCY);
            
            return response;
            
        } catch (RazorpayException e) {
            logger.error("Failed to create Razorpay order for user: {}", userId, e);
            throw new PaymentException("Failed to create payment order: " + e.getMessage());
        }
    }
    
    /**
     * Verify Razorpay payment signature using HMAC SHA256
     * @param razorpayOrderId Order ID from Razorpay
     * @param razorpayPaymentId Payment ID from Razorpay
     * @param razorpaySignature Signature from Razorpay
     * @return true if signature is valid, false otherwise
     */
    public boolean verifyPaymentSignature(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature) {
        
        try {
            // Use Razorpay SDK's utility method for signature verification
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);
            
            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);
            
            if (isValid) {
                logger.info("Payment signature verified successfully for order: {}", razorpayOrderId);
            } else {
                logger.warn("Payment signature verification failed for order: {}", razorpayOrderId);
            }
            
            return isValid;
            
        } catch (RazorpayException e) {
            logger.error("Error verifying payment signature for order: {}", razorpayOrderId, e);
            return false;
        }
    }
    
}
