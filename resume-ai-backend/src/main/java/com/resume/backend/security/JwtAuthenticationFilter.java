package com.resume.backend.security;

import com.resume.backend.user.User;
import com.resume.backend.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String COOKIE_NAME = "auth_token";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            String token = extractToken(request);

            if (token != null && jwtService.validateToken(token)) {
                String email = jwtService.extractUsername(token);
                User user = userRepository.findByEmail(email).orElse(null);

                if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    List<GrantedAuthority> authorities = new ArrayList<>();
                    String userRole = user.getRole();
                    if (userRole == null) {
                        userRole = "ROLE_FREE";
                    }
                    authorities.add(new SimpleGrantedAuthority(userRole));
                    // Add ROLE_PRO if isPro is true for backwards compatibility / robust rules
                    if (Boolean.TRUE.equals(user.getIsPro()) && !userRole.equals("ROLE_PRO")) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_PRO"));
                    }

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(user, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    logger.debug("Authenticated user: {}", email);
                }
            }
        } catch (Exception e) {
            logger.error("Authentication filter error: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT from httpOnly cookie first, then fall back to Authorization header.
     */
    private String extractToken(HttpServletRequest request) {
        // 1. httpOnly cookie (preferred — XSS-safe)
        if (request.getCookies() != null) {
            return Arrays.stream(request.getCookies())
                    .filter(c -> COOKIE_NAME.equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(tryHeader(request));
        }
        // 2. Authorization header fallback (API clients, mobile)
        return tryHeader(request);
    }

    private String tryHeader(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;
    }
}
