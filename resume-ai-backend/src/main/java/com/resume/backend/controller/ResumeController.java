package com.resume.backend.controller;

import com.resume.backend.ResumeRequest;
import com.resume.backend.services.ResumeService;
import com.resume.backend.user.User;
import com.resume.backend.user.UsageLimitException;
import com.resume.backend.user.UsageLimitService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.resume.backend.ats.upload.ResumeTextStructureService;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Handles AI resume generation and enhancement.
 *
 * POST /api/v1/resume/generate — generate a resume from a text description
 * POST /api/v1/resume/enhance  — enhance an existing resume with AI
 *
 * ATS analysis is handled by AtsController (/api/v1/ats/*).
 * SaaS DB-backed flows are handled by the SaaS routes below.
 */
@RestController
@RequestMapping("/api/v1/resume")
public class ResumeController {

    private static final Logger logger = LoggerFactory.getLogger(ResumeController.class);

    private final ResumeService resumeService;
    private final UsageLimitService usageLimitService;
    private final ResumeTextStructureService textStructureService;

    public ResumeController(ResumeService resumeService, UsageLimitService usageLimitService, ResumeTextStructureService textStructureService) {
        this.resumeService = resumeService;
        this.usageLimitService = usageLimitService;
        this.textStructureService = textStructureService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateResume(@RequestBody ResumeRequest resumeRequest) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser != null) {
                usageLimitService.checkAndIncrementUsage(currentUser);
            }

            if (resumeRequest == null || resumeRequest.userDescription() == null
                    || resumeRequest.userDescription().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("User description is required"));
            }

            Map<String, Object> result = resumeService.generateResumeResponse(resumeRequest.userDescription());
            if (result == null || result.get("data") == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(error("Failed to generate resume. Please try again."));
            }

            return ResponseEntity.ok(result);

        } catch (UsageLimitException e) {
            logger.warn("Usage limit reached: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (IOException e) {
            logger.error("AI service error during resume generation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("AI service error. Please try again later."));
        } catch (Exception e) {
            logger.error("Unexpected error during resume generation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("An unexpected error occurred. Please try again."));
        }
    }

    @PostMapping("/enhance")
    public ResponseEntity<?> enhanceResume(@RequestBody Map<String, Object> resumeData) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser != null) {
                usageLimitService.checkAndIncrementEnhance(currentUser);
            }

            if (resumeData == null || resumeData.isEmpty()) {
                return ResponseEntity.badRequest().body(error("Resume data is required"));
            }

            Map<String, Object> enhanced = resumeService.enhanceResumeResponse(resumeData, null);
            if (enhanced == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(error("Failed to enhance resume. Please try again."));
            }

            return ResponseEntity.ok(enhanced);

        } catch (UsageLimitException e) {
            logger.warn("Usage limit reached: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (IOException e) {
            logger.error("AI service error during resume enhancement: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("AI service error. Please try again later."));
        } catch (Exception e) {
            logger.error("Unexpected error during resume enhancement: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("An unexpected error occurred. Please try again."));
        }
    }

    /**
     * Improve a single bullet point with AI.
     * Returns plain text — the improved bullet string directly.
     */
    @PostMapping("/enhance-bullet")
    public ResponseEntity<?> enhanceBullet(@RequestBody Map<String, String> request) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser != null) {
                usageLimitService.checkAndIncrementEnhance(currentUser);
            }

            String text = request.get("text");
            String context = request.getOrDefault("context", "professional resume");

            if (text == null || text.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("text is required"));
            }

            String prompt = "Rewrite this resume bullet point to be more impactful, quantified, and ATS-friendly. "
                    + "Use strong action verbs. Return ONLY the improved bullet text as a plain string — no JSON, no markdown, no explanation.\n\n"
                    + "Original: \"" + text + "\"\n"
                    + "Context: " + context;

            String improved = resumeService.generateBulletImprovement(prompt);
            return ResponseEntity.ok(Map.of("improved", improved != null ? improved.trim() : text));

        } catch (UsageLimitException e) {
            logger.warn("Usage limit reached: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error improving bullet: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("Failed to improve bullet. Please try again."));
        }
    }

    /**
     * Track and increment export limit usage.
     */
    @PostMapping("/track-export")
    public ResponseEntity<?> trackExport() {
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Authentication required to export."));
            }
            usageLimitService.checkAndIncrementExport(currentUser);
            return ResponseEntity.ok(Map.of("success", true, "exportCount", currentUser.getExportCount()));
        } catch (UsageLimitException e) {
            logger.warn("Export limit reached: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error tracking export: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Failed to track export."));
        }
    }

    /**
     * Parse raw text to structured JSON using the AI parsing pipeline.
     */
    @PostMapping("/parse-text")
    public ResponseEntity<?> parseText(@RequestBody Map<String, String> request) {
        try {
            String text = request.get("text");
            if (text == null || text.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(error("text is required"));
            }
            Map<String, Object> structured = textStructureService.parseTextToResumeStructure(text);
            return ResponseEntity.ok(structured);
        } catch (Exception e) {
            logger.error("Error parsing text: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("Failed to parse text. Please try again."));
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || "anonymousUser".equals(auth.getPrincipal())) return null;
        return auth.getPrincipal() instanceof User u ? u : null;
    }

    private Map<String, String> error(String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        body.put("timestamp", java.time.Instant.now().toString());
        return body;
    }
}
