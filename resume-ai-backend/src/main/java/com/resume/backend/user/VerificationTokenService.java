package com.resume.backend.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class VerificationTokenService {

    private static final Logger logger = LoggerFactory.getLogger(VerificationTokenService.class);
    private final VerificationTokenRepository verificationTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${verification.email.expiry-minutes:10}")
    private int emailExpiryMinutes;

    @Value("${verification.reset.expiry-minutes:30}")
    private int resetExpiryMinutes;

    public VerificationTokenService(VerificationTokenRepository verificationTokenRepository) {
        this.verificationTokenRepository = verificationTokenRepository;
    }

    /**
     * Generates a 6-digit numeric OTP securely.
     */
    public String generateOtp() {
        int number = secureRandom.nextInt(1000000);
        return String.format("%06d", number);
    }

    /**
     * Generates a high-entropy secure random token.
     */
    public String generateResetToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * Hashes a raw token string using SHA-256.
     */
    public String hashToken(String rawToken) {
        if (rawToken == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            logger.error("Failed to compute SHA-256 hash", e);
            throw new RuntimeException("SHA-256 hashing algorithm not available", e);
        }
    }

    /**
     * Creates a new OTP for email verification, invalidating any previous unused ones.
     */
    @Transactional
    public String createEmailVerificationToken(User user) {
        invalidateExistingTokens(user, VerificationTokenPurpose.EMAIL_VERIFICATION);

        String rawOtp = generateOtp();
        String hashedOtp = hashToken(rawOtp);

        VerificationToken vt = new VerificationToken();
        vt.setUser(user);
        vt.setToken(hashedOtp);
        vt.setPurpose(VerificationTokenPurpose.EMAIL_VERIFICATION);
        vt.setExpiresAt(LocalDateTime.now().plusMinutes(emailExpiryMinutes));
        vt.setUsed(false);

        verificationTokenRepository.save(vt);
        logger.info("Created new email verification OTP for user: {}", user.getEmail());
        return rawOtp;
    }

    /**
     * Creates a new token for password resets, invalidating any previous unused ones.
     */
    @Transactional
    public String createPasswordResetToken(User user) {
        invalidateExistingTokens(user, VerificationTokenPurpose.PASSWORD_RESET);

        String rawToken = generateResetToken();
        String hashedToken = hashToken(rawToken);

        VerificationToken vt = new VerificationToken();
        vt.setUser(user);
        vt.setToken(hashedToken);
        vt.setPurpose(VerificationTokenPurpose.PASSWORD_RESET);
        vt.setExpiresAt(LocalDateTime.now().plusMinutes(resetExpiryMinutes));
        vt.setUsed(false);

        verificationTokenRepository.save(vt);
        logger.info("Created new password reset token for user: {}", user.getEmail());
        return rawToken;
    }

    /**
     * Verifies a raw token, marks it used on success, and handles expiration/usage checks.
     */
    @Transactional
    public boolean verifyToken(User user, String rawToken, VerificationTokenPurpose purpose) {
        if (rawToken == null || user == null) {
            return false;
        }

        String hashedIncoming = hashToken(rawToken);
        List<VerificationToken> tokens = verificationTokenRepository.findByUserAndPurposeAndUsed(user, purpose, false);

        for (VerificationToken vt : tokens) {
            if (vt.getToken().equals(hashedIncoming)) {
                if (vt.getExpiresAt().isBefore(LocalDateTime.now())) {
                    logger.warn("Token validation failed: expired. User: {}, Purpose: {}", user.getEmail(), purpose);
                    return false;
                }
                vt.setUsed(true);
                vt.setUsedAt(LocalDateTime.now());
                verificationTokenRepository.save(vt);
                logger.info("Successfully verified and consumed token for user: {}, Purpose: {}", user.getEmail(), purpose);
                return true;
            }
        }

        logger.warn("Token validation failed: no matching unused token. User: {}, Purpose: {}", user.getEmail(), purpose);
        return false;
    }

    /**
     * Helper to mark all existing unused tokens of a specific purpose as used (invalidating them).
     */
    @Transactional
    public void invalidateExistingTokens(User user, VerificationTokenPurpose purpose) {
        List<VerificationToken> existing = verificationTokenRepository.findByUserAndPurposeAndUsed(user, purpose, false);
        if (!existing.isEmpty()) {
            for (VerificationToken vt : existing) {
                vt.setUsed(true);
                vt.setUsedAt(LocalDateTime.now());
            }
            verificationTokenRepository.saveAll(existing);
            logger.info("Invalidated {} previous unused token(s) of purpose {} for user: {}", existing.size(), purpose, user.getEmail());
        }
    }
}
