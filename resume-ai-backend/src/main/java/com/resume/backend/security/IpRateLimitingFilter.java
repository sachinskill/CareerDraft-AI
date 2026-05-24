package com.resume.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class IpRateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket resolveBucket(String ip) {
        return cache.computeIfAbsent(ip, this::newBucket);
    }

    private Bucket newBucket(String ip) {
        // 20 requests per hour for anonymous users (dev-friendly)
        // In production, tighten this back to 5/24h
        Bandwidth limit = Bandwidth.builder().capacity(20).refillGreedy(20, Duration.ofHours(1)).build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Only apply rate limiting to specific resource-intensive SaaS AI endpoints
        boolean isProtectedEndpoint = path.startsWith("/api/v1/resume/upload") ||
                path.matches("/api/v1/resume/[^/]+/analyze") ||
                path.matches("/api/v1/resume/[^/]+/improve") ||
                path.startsWith("/api/v1/resume/generate") ||
                path.startsWith("/api/v1/resume/enhance") ||
                path.startsWith("/api/v1/ats");

        if (isProtectedEndpoint) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            // Only rate-limit anonymous users. Authenticated users are bound by database
            // scanCount logic.
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                String ip = getClientIP(request);
                Bucket bucket = resolveBucket(ip);

                if (bucket.tryConsume(1)) {
                    filterChain.doFilter(request, response);
                } else {
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType("application/json");
                    response.getWriter().write(
                            "{\"error\": \"Rate limit exceeded. Anonymous users are limited to 5 AI requests per day. Please log in or upgrade to continue.\"}");
                }
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
