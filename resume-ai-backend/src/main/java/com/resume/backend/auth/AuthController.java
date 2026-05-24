package com.resume.backend.auth;

import com.resume.backend.security.JwtService;
import com.resume.backend.user.User;
import com.resume.backend.user.UserRepository;
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

    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request, HttpServletResponse response) {
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
            user = userRepository.save(user);
            logger.info("New user registered: {}", user.getEmail());

            String token = jwtService.generateToken(user);
            setAuthCookie(response, token);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AuthResponse(token, user.getEmail(), user.getScanCount(), user.getIsPro(), user.getEnhanceCount(), user.getExportCount(), user.getRole()));

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

            logger.info("User logged in: {}", user.getEmail());
            String token = jwtService.generateToken(user);
            setAuthCookie(response, token);

            return ResponseEntity.ok(
                    new AuthResponse(token, user.getEmail(), user.getScanCount(), user.getIsPro(), user.getEnhanceCount(), user.getExportCount(), user.getRole()));

        } catch (Exception e) {
            logger.error("Login error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Login failed"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
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
                .map(u -> ResponseEntity.ok(new AuthResponse(null, u.getEmail(), u.getScanCount(), u.getIsPro(), u.getEnhanceCount(), u.getExportCount(), u.getRole())))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setAuthCookie(HttpServletResponse response, String token) {
        // SameSite=Lax: correct for localhost HTTP cross-origin Axios requests.
        // SameSite=None requires Secure=true — Chrome REJECTS None without Secure,
        // so the cookie is silently dropped even on localhost.
        // SameSite=Lax works for cross-origin requests when withCredentials=true is set in Axios.
        // In production (HTTPS): set COOKIE_SECURE=true in env → secureCookie=true.
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secureCookie)   // false on localhost, true in production
                .sameSite("Lax")        // Lax = works on localhost HTTP; use Strict on production
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .build();

        // addHeader (not setHeader) — setHeader would overwrite other Set-Cookie headers
        response.addHeader("Set-Cookie", cookie.toString());

        // Debug: confirm exact cookie string being sent
        System.out.println("Setting cookie: " + cookie.toString());
        logger.info("Auth cookie set: {}", cookie.toString().replaceAll("auth_token=[^;]+", "auth_token=***"));
    }

    String extractTokenFromCookieOrHeader(HttpServletRequest request) {
        // 1. Try httpOnly cookie
        if (request.getCookies() != null) {
            return Arrays.stream(request.getCookies())
                    .filter(c -> COOKIE_NAME.equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }
        // 2. Fall back to Authorization header (for API clients / mobile)
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
