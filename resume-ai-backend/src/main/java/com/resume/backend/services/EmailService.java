package com.resume.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final WebClient webClient;

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    @Value("classpath:email/verify-email.html")
    private Resource verifyEmailResource;

    @Value("classpath:email/forgot-password.html")
    private Resource forgotPasswordResource;

    @Value("classpath:email/welcome-pro.html")
    private Resource welcomeProResource;

    public EmailService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://api.resend.com").build();
    }

    /**
     * Reads resource contents as UTF-8 String helper.
     */
    private String loadTemplate(Resource resource) {
        try {
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            logger.error("Failed to read email template from resource path: {}", resource.getFilename(), e);
            throw new RuntimeException("Failed to read email template", e);
        }
    }

    /**
     * Dispatch email POST payload to Resend.
     */
    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("your_api_key")) {
                logger.warn("Resend API key is not configured. Skipping email dispatch to: {}", to);
                return;
            }

            Map<String, Object> requestPayload = Map.of(
                "from", fromEmail,
                "to", List.of(to),
                "subject", subject,
                "html", htmlContent
            );

            webClient.post()
                .uri("/emails")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestPayload)
                .retrieve()
                .toBodilessEntity()
                .block(); // Synchronous call

            logger.info("Successfully dispatched email to: {} with subject: {}", to, subject);
        } catch (Exception e) {
            // Never expose Resend errors to clients. Log failures.
            logger.error("Failed to send email to {} via Resend REST API: {}", to, e.getMessage(), e);
        }
    }

    /**
     * Sends the verification email containing the OTP.
     */
    public void sendVerificationEmail(String toEmail, String otp) {
        logger.info("Email verification OTP for {}: {}", toEmail, otp);
        String template = loadTemplate(verifyEmailResource);
        String htmlContent = template.replace("{{OTP}}", otp);
        sendEmail(toEmail, "Verify Your Email - CareerDraft AI", htmlContent);
    }

    /**
     * Sends the password reset email containing the reset link URL.
     */
    public void sendPasswordResetEmail(String toEmail, String resetUrl) {
        String template = loadTemplate(forgotPasswordResource);
        String htmlContent = template.replace("{{RESET_URL}}", resetUrl);
        sendEmail(toEmail, "Reset Your Password - CareerDraft AI", htmlContent);
    }

    /**
     * Sends the Pro welcome email to upgraded users.
     */
    public void sendWelcomeProEmail(String toEmail) {
        String template = loadTemplate(welcomeProResource);
        sendEmail(toEmail, "Welcome to CareerDraft Pro! 🎉", template);
    }
}
