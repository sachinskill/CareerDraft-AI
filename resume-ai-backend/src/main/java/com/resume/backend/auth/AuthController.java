package com.resume.backend.auth;

import com.resume.backend.security.JwtService;
import com.resume.backend.user.User;
import com.resume.backend.user.UserRepository;
import com.resume.backend.user.VerificationTokenPurpose;
import com.resume.backend.user.VerificationTokenService;
import com.resume.backend.services.EmailService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private static final String COOKIE_NAME = "auth_token";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final VerificationTokenService verificationTokenService;
    private final EmailService emailService;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, 
                          JwtService jwtService, VerificationTokenService verificationTokenService,
                          EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.verificationTokenService = verificationTokenService;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("Email is required"));
            }
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body(error("Password must be at least 6 characters"));
            }
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error("Email already registered"));
            }

            User user = new User();
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setScanCount(0);
            user.setIsPro(false);
            user.setEnabled(false); // New registrations default to disabled until verification
            user = userRepository.save(user);
            logger.info("New user registered (disabled): {}", user.getEmail());

            // Generate OTP & dispatch verification email
            String rawOtp = verificationTokenService.createEmailVerificationToken(user);
            emailService.sendVerificationEmail(user.getEmail(), rawOtp);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Registration successful. Please verify your email."));

        } catch (Exception e) {
            logger.error("Registration error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Registration failed"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        try {
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("Email is required"));
            }
            if (request.getPassword() == null || request.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body(error("Password is required"));
            }

            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Invalid email or password"));
            }

            // Check if email has been verified
            if (!Boolean.TRUE.equals(user.getEnabled())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("EMAIL_NOT_VERIFIED"));
            }

            logger.info("User logged in: {}", user.getEmail());
            String token = jwtService.generateToken(user);
            setAuthCookie(response, token);

            return ResponseEntity.ok(
                    new AuthResponse(user.getEmail(), user.getScanCount(), user.getIsPro(), user.getEnhanceCount(), user.getExportCount(), user.getRole()));

        } catch (Exception e) {
            logger.error("Login error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Login failed"));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody VerifyEmailRequest request, HttpServletResponse response) {
        try {
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("Email is required"));
            }
            if (request.getOtp() == null || request.getOtp().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("OTP is required"));
            }

            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("User not found"));
            }

            if (Boolean.TRUE.equals(user.getEnabled())) {
                return ResponseEntity.badRequest().body(error("Email is already verified"));
            }

            boolean isValid = verificationTokenService.verifyToken(user, request.getOtp().trim(), VerificationTokenPurpose.EMAIL_VERIFICATION);
            if (!isValid) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("Invalid or expired OTP"));
            }

            user.setEnabled(true);
            userRepository.save(user);
            logger.info("Email verified successfully for user: {}", user.getEmail());

            String token = jwtService.generateToken(user);
            setAuthCookie(response, token);

            return ResponseEntity.ok(
                    new AuthResponse(user.getEmail(), user.getScanCount(), user.getIsPro(), user.getEnhanceCount(), user.getExportCount(), user.getRole()));

        } catch (Exception e) {
            logger.error("Email verification error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Email verification failed"));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody ResendOtpRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("Email is required"));
            }

            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user == null) {
                // Return success anyway for security reasons
                return ResponseEntity.ok(Map.of("message", "If the account is not verified, a new verification code has been sent."));
            }

            if (Boolean.TRUE.equals(user.getEnabled())) {
                return ResponseEntity.badRequest().body(error("Email is already verified"));
            }

            String rawOtp = verificationTokenService.createEmailVerificationToken(user);
            emailService.sendVerificationEmail(user.getEmail(), rawOtp);

            return ResponseEntity.ok(Map.of("message", "If the account is not verified, a new verification code has been sent."));

        } catch (Exception e) {
            logger.error("Resend OTP error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Failed to resend verification code"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("Email is required"));
            }

            // Always return identical success messages for security validation protection
            ResponseEntity<?> successResponse = ResponseEntity.ok(Map.of("message", "If that email address exists, we have sent a password reset link."));

            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user == null) {
                return successResponse;
            }

            String rawToken = verificationTokenService.createPasswordResetToken(user);
            String resetUrl = String.format("%s/reset-password?token=%s&email=%s", frontendUrl, rawToken, user.getEmail());
            emailService.sendPasswordResetEmail(user.getEmail(), resetUrl);

            return successResponse;

        } catch (Exception e) {
            logger.error("Forgot password error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Failed to process request"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("Email is required"));
            }
            if (request.getToken() == null || request.getToken().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("Reset token is required"));
            }
            if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest().body(error("Password must be at least 6 characters"));
            }

            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("Invalid request details"));
            }

            boolean isValid = verificationTokenService.verifyToken(user, request.getToken().trim(), VerificationTokenPurpose.PASSWORD_RESET);
            if (!isValid) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("Invalid or expired reset token"));
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            // Invalidate remaining password reset tokens for user security hygiene
            verificationTokenService.invalidateExistingTokens(user, VerificationTokenPurpose.PASSWORD_RESET);

            logger.info("Password successfully updated for user: {}", user.getEmail());
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));

        } catch (Exception e) {
            logger.error("Reset password error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Failed to reset password"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String token = extractTokenFromCookieOrHeader(request);
        if (token == null || !jwtService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Not authenticated"));
        }
        String email = jwtService.extractUsername(token);
        return userRepository.findByEmail(email)
                .map(u -> ResponseEntity.ok(new AuthResponse(u.getEmail(), u.getScanCount(), u.getIsPro(), u.getEnhanceCount(), u.getExportCount(), u.getRole())))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setAuthCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
        logger.info("Auth cookie set: {}", cookie.toString().replaceAll("auth_token=[^;]+", "auth_token=***"));
    }

    String extractTokenFromCookieOrHeader(HttpServletRequest request) {
        if (request.getCookies() != null) {
            return Arrays.stream(request.getCookies())
                    .filter(c -> COOKIE_NAME.equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private Map<String, String> error(String message) {
        Map<String, String> e = new HashMap<>();
        e.put("error", message);
        return e;
    }
}
