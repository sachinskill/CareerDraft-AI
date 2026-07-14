package com.resume.backend.payment;

import com.resume.backend.user.User;
import com.resume.backend.user.UserRepository;
import com.resume.backend.repository.PaymentRepository;
import com.resume.backend.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PaymentVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentVerificationService.class);

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final com.resume.backend.services.EmailService emailService;

    public PaymentVerificationService(UserRepository userRepository,
                                      PaymentRepository paymentRepository,
                                      SubscriptionRepository subscriptionRepository,
                                      com.resume.backend.services.EmailService emailService) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.emailService = emailService;
    }

    /**
     * Idempotently upgrades a user to PRO, recording the payment and active subscription.
     */
    @Transactional
    public void upgradeUserToPro(Long userId, String orderId, String paymentId, Double amount) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            logger.error("User with ID {} not found for upgrade.", userId);
            return;
        }
        User user = userOpt.get();

        // Idempotency check: see if this payment ID has already been recorded as SUCCESS
        if (paymentId != null) {
            Optional<Payment> existingPayment = paymentRepository.findByPaymentId(paymentId);
            if (existingPayment.isPresent() && "SUCCESS".equals(existingPayment.get().getStatus())) {
                logger.info("Payment ID {} already recorded as SUCCESS. Skipping upgrade.", paymentId);
                return;
            }
        }

        // Record or update payment record
        Payment payment = null;
        if (orderId != null) {
            payment = paymentRepository.findByOrderId(orderId).orElse(null);
        }
        if (payment == null) {
            payment = new Payment();
            payment.setOrderId(orderId);
        }
        payment.setUser(user);
        payment.setPaymentId(paymentId);
        payment.setAmount(amount);
        payment.setStatus("SUCCESS");
        paymentRepository.save(payment);

        // Update User role and Pro status
        user.setIsPro(true);
        user.setRole("ROLE_PRO");
        userRepository.save(user);

        // Send Welcome Pro email
        try {
            emailService.sendWelcomeProEmail(user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send Welcome Pro email to user {}", user.getEmail(), e);
        }

        // Create or update subscription
        Subscription subscription = new Subscription();
        subscription.setUser(user);
        subscription.setSubscriptionId(orderId != null ? orderId : (paymentId != null ? paymentId : "sub_unknown"));
        subscription.setProvider("razorpay");
        subscription.setStatus("ACTIVE");
        subscription.setPlanType("PRO");
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(null); // Lifetime purchase: no expiry date
        subscriptionRepository.save(subscription);

        logger.info("Successfully upgraded user {} (ID: {}) to PRO via webhook payment/order: {}", 
                user.getEmail(), user.getId(), orderId);
    }
}
