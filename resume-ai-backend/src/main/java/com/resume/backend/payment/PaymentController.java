package com.resume.backend.payment;

import com.resume.backend.user.User;
import com.resume.backend.user.UserRepository;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    private final RazorpayService razorpayService;
    private final UserRepository userRepository;
    private final PaymentVerificationService paymentVerificationService;
    
    public PaymentController(RazorpayService razorpayService, 
                             UserRepository userRepository,
                             PaymentVerificationService paymentVerificationService) {
        this.razorpayService = razorpayService;
        this.userRepository = userRepository;
        this.paymentVerificationService = paymentVerificationService;
    }
    
    /**
     * Create Razorpay order for Pro upgrade
     * POST /api/payment/create-order
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder() {
        try {
            // Get current authenticated user
            User currentUser = getCurrentUser();
            
            // Check if user is already Pro
            if (currentUser.getIsPro()) {
                logger.warn("User {} is already Pro, cannot create order", currentUser.getEmail());
                Map<String, String> error = new HashMap<>();
                error.put("error", "You are already a Pro user");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Create Razorpay order
            Map<String, Object> orderData = razorpayService.createOrder(currentUser.getId());
            
            logger.info("Payment order created for user: {}", currentUser.getEmail());
            
            return ResponseEntity.ok(orderData);
            
        } catch (PaymentException e) {
            logger.error("Payment order creation failed", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            logger.error("Unexpected error creating payment order", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create payment order");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Verify payment and upgrade user to Pro (Synchronous UI callback flow)
     * POST /api/payment/verify
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        try {
            // Get current authenticated user
            User currentUser = getCurrentUser();
            
            // Validate request
            if (request.getRazorpayOrderId() == null || request.getRazorpayOrderId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Order ID is required"));
            }
            if (request.getRazorpayPaymentId() == null || request.getRazorpayPaymentId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Payment ID is required"));
            }
            if (request.getRazorpaySignature() == null || request.getRazorpaySignature().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Signature is required"));
            }
            
            // Verify payment signature
            boolean isValid = razorpayService.verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
            );
            
            if (!isValid) {
                logger.warn("Invalid payment signature for user: {}", currentUser.getEmail());
                Map<String, String> error = new HashMap<>();
                error.put("error", "Payment verification failed. Invalid signature.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Perform upgrade synchronously
            paymentVerificationService.upgradeUserToPro(
                currentUser.getId(), 
                request.getRazorpayOrderId(), 
                request.getRazorpayPaymentId(), 
                49.0
            );
            
            logger.info("User {} upgraded to Pro successfully. Payment ID: {}", 
                currentUser.getEmail(), request.getRazorpayPaymentId());
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment verified successfully. You are now a Pro user!");
            response.put("isPro", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Payment verification failed", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Payment verification failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Webhook endpoint called by Razorpay when payment event fires.
     * POST /api/payment/webhook
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String body,
            @RequestHeader("X-Razorpay-Signature") String signatureHeader) {
        
        logger.info("Received Razorpay webhook callback");

        // 1. Verify cryptographic webhook signature
        boolean isValid = razorpayService.verifyWebhookSignature(body, signatureHeader);
        if (!isValid) {
            logger.warn("Invalid Razorpay webhook signature");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        try {
            JSONObject json = new JSONObject(body);
            String event = json.optString("event");
            logger.info("Razorpay webhook event verified: {}", event);

            if ("order.paid".equals(event) || "payment.captured".equals(event)) {
                JSONObject eventPayload = json.optJSONObject("payload");
                if (eventPayload != null) {
                    JSONObject orderObj = eventPayload.optJSONObject("order");
                    JSONObject paymentObj = eventPayload.optJSONObject("payment");

                    String orderId = null;
                    String paymentId = null;
                    String userIdStr = null;
                    double amount = 49.0;

                    if (orderObj != null) {
                        JSONObject orderEntity = orderObj.optJSONObject("entity");
                        if (orderEntity != null) {
                            orderId = orderEntity.optString("id");
                            JSONObject notes = orderEntity.optJSONObject("notes");
                            if (notes != null) {
                                userIdStr = notes.optString("userId");
                            }
                        }
                    }

                    if (paymentObj != null) {
                        JSONObject paymentEntity = paymentObj.optJSONObject("entity");
                        if (paymentEntity != null) {
                            paymentId = paymentEntity.optString("id");
                            if (orderId == null) {
                                orderId = paymentEntity.optString("order_id");
                            }
                            amount = paymentEntity.optDouble("amount", 4900.0) / 100.0;
                            if (userIdStr == null) {
                                JSONObject notes = paymentEntity.optJSONObject("notes");
                                if (notes != null) {
                                    userIdStr = notes.optString("userId");
                                }
                            }
                        }
                    }

                    if (userIdStr != null && !userIdStr.isBlank()) {
                        final Long userId = Long.valueOf(userIdStr);
                        final String finalOrderId = orderId;
                        final String finalPaymentId = paymentId;
                        final double finalAmount = amount;

                        // 2. Perform user upgrade asynchronously as required by spec
                        CompletableFuture.runAsync(() -> {
                            try {
                                paymentVerificationService.upgradeUserToPro(userId, finalOrderId, finalPaymentId, finalAmount);
                            } catch (Exception e) {
                                logger.error("Asynchronous user upgrade failed for userId {}", userId, e);
                            }
                        });

                        logger.info("Scheduled asynchronous user upgrade task for userId: {}", userId);
                    } else {
                        logger.warn("Razorpay event {} payload does not contain notes.userId metadata", event);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error processing Razorpay webhook body: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing body");
        }

        // Return 200 OK immediately to Razorpay to prevent retries
        return ResponseEntity.ok("Webhook processed");
    }
    
    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User) {
            return userRepository.findById(((User) principal).getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
