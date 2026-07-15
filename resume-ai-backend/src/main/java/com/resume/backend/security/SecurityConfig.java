package com.resume.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final IpRateLimitingFilter ipRateLimitingFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOriginsRaw;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
            IpRateLimitingFilter ipRateLimitingFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.ipRateLimitingFilter = ipRateLimitingFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CSRF disabled — stateless JWT; re-enable if switching to session cookies
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public auth endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        // Public Razorpay Webhook endpoints
                        .requestMatchers("/api/payment/webhook", "/api/payments/webhook").permitAll()
                        // Public ATS upload/analyze for guest scans
                        .requestMatchers("/api/v1/ats/upload", "/api/v1/ats/analyze", "/api/ats/upload",
                                "/api/ats/analyze")
                        .permitAll()
                        // Legacy/AI generation endpoints
                        .requestMatchers("/api/v1/resume/generate", "/api/v1/resume/enhance",
                                "/api/v1/resume/enhance-bullet")
                        .permitAll()
                        // Admin Operations Dashboard — ROLE_ADMIN only
                        // Backend enforces this; frontend route protection is supplementary only
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        // Secured SaaS endpoints
                        .requestMatchers("/api/resumes/**", "/api/subscriptions/**", "/api/dashboard/**")
                        .authenticated()
                        .requestMatchers("/api/payment/**", "/api/payments/**").authenticated()
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(ipRateLimitingFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        // Direct production whitelist without env dependency
        List<String> origins = List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "https://career-draft-ai.vercel.app");

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // Required for httpOnly cookie
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
