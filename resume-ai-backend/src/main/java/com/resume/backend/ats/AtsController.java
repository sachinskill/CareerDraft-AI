package com.resume.backend.ats;

import com.fasterxml.jackson.databind.JsonNode;
import com.resume.backend.ats.upload.FileParsingException;
import com.resume.backend.ats.upload.ResumeFileParserService;
import com.resume.backend.ats.upload.ResumeFileUploadResponse;
import com.resume.backend.ats.upload.UnsupportedFileTypeException;
import com.resume.backend.user.User;
import com.resume.backend.user.UsageLimitException;
import com.resume.backend.user.UsageLimitService;
import com.resume.backend.user.PremiumAccessService;
import com.resume.backend.model.ParserCache;
import com.resume.backend.repository.ParserCacheRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Unified ATS controller.
 *
 * POST /api/v1/ats/upload  — file upload → deterministic score (Python-first, Java fallback)
 * POST /api/v1/ats/analyze — structured JSON resume → deterministic score
 */
@RestController
@RequestMapping("/api/v1/ats")
public class AtsController {

    private static final Logger logger = LoggerFactory.getLogger(AtsController.class);

    private final ResumeFileParserService fileParserService;
    private final AtsAnalyzerService javaScorer;
    private final AtsAiFeedbackService aiFeedbackService;
    private final PythonScoringClient pythonClient;
    private final UsageLimitService usageLimitService;
    private final AtsResultMapper resultMapper;
    private final ParserCacheRepository parserCacheRepository;
    private final PremiumAccessService premiumAccessService;

    public AtsController(
            ResumeFileParserService fileParserService,
            AtsAnalyzerService javaScorer,
            AtsAiFeedbackService aiFeedbackService,
            PythonScoringClient pythonClient,
            UsageLimitService usageLimitService,
            AtsResultMapper resultMapper,
            ParserCacheRepository parserCacheRepository,
            PremiumAccessService premiumAccessService) {
        this.fileParserService = fileParserService;
        this.javaScorer = javaScorer;
        this.aiFeedbackService = aiFeedbackService;
        this.pythonClient = pythonClient;
        this.usageLimitService = usageLimitService;
        this.resultMapper = resultMapper;
        this.parserCacheRepository = parserCacheRepository;
        this.premiumAccessService = premiumAccessService;
    }

    /**
     * Upload a PDF/DOCX resume file and score it against a job description.
     * Python-first scoring with explicit fallback tracking and observability.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadAndScore(
            @RequestParam MultipartFile resumeFile,
            @RequestParam String jobDescription,
            @RequestParam(defaultValue = "true") boolean includeAiFeedback) {

        long startTime = System.currentTimeMillis();

        try {
            User currentUser = getCurrentUser();
            boolean isLocked = (currentUser == null);
            Integer remainingScans = null;

            if (!isLocked) {
                remainingScans = usageLimitService.checkAndIncrementUsage(currentUser);
            }

            if (resumeFile.isEmpty()) return badRequest("Resume file is required");
            if (jobDescription == null || jobDescription.isBlank()) return badRequest("Job description is required");

            // 1. Calculate SHA-256 and check ParserCache
            String extractedText = null;
            String fileHash = null;
            try {
                byte[] fileBytes = resumeFile.getBytes();
                fileHash = calculateSha256(fileBytes);
                Optional<ParserCache> cached = parserCacheRepository.findById(fileHash);
                if (cached.isPresent()) {
                    extractedText = cached.get().getExtractedText();
                    logger.info("Found cached parsed text for file hash: {}", fileHash);
                }
            } catch (Exception e) {
                logger.warn("Error checking parser cache: {}", e.getMessage());
            }

            // Extract text if not cached — Python parser first, Java fallback
            if (extractedText == null || extractedText.isBlank()) {
                try {
                    extractedText = pythonClient.parseFile(resumeFile.getBytes(), resumeFile.getOriginalFilename());
                    if (extractedText != null && !extractedText.isBlank()) {
                        logger.info("Python parser extracted {} chars from {}", extractedText.length(), resumeFile.getOriginalFilename());
                    }
                } catch (Exception e) {
                    logger.warn("Python parser unavailable ({}), using Java parser", e.getMessage());
                }
                if (extractedText == null || extractedText.isBlank()) {
                    extractedText = fileParserService.extractTextFromFile(resumeFile);
                    logger.info("Java parser extracted {} chars", extractedText.length());
                }
                if (extractedText.isBlank()) return badRequest("No readable text found in the uploaded file");

                // Save to ParserCache
                if (fileHash != null) {
                    try {
                        ParserCache cacheEntry = new ParserCache();
                        cacheEntry.setFileHash(fileHash);
                        cacheEntry.setExtractedText(extractedText);
                        parserCacheRepository.save(cacheEntry);
                        logger.info("Saved extracted text to parser cache with hash: {}", fileHash);
                    } catch (Exception e) {
                        logger.warn("Failed to save to parser cache: {}", e.getMessage());
                    }
                }
            }

            // 2. Score — Python deterministic scorer first, Java fallback
            ScoringResult scoringResult = scoreWithTracking(extractedText, jobDescription);
            AtsResultDTO result = scoringResult.dto;

            // 3. Optional AI feedback (only for authenticated non-locked scans)
            if (includeAiFeedback && !isLocked) {
                try {
                    AtsAiFeedbackDTO feedback = aiFeedbackService.generateFeedback(
                            result, jobDescription, Map.of("summary", extractedText));
                    result.setAiFeedback(feedback);
                } catch (Exception e) {
                    logger.warn("AI feedback generation failed (non-critical): {}", e.getMessage());
                }
            }

            boolean isPro = premiumAccessService.isPro(currentUser);
            long processingTimeMs = System.currentTimeMillis() - startTime;

            // Lock and strip details for guest scans
            if (isLocked) {
                result.setIsLocked(true);
                result.setAiFeedback(null);
                result.setBreakdown(null);
                result.setImprovements(null);
                result.setMatchedKeywords(null);
                result.setMissingKeywords(null);
                result.setPartialSkills(null);
                result.setCategorizedMissingSkills(null);
                result.setMissingCriticalSkills(null);
                result.setMissingCoreSkills(null);
                result.setStrongSkills(null);
                result.setTailoringTips(null);
            }

            ResumeFileUploadResponse response = new ResumeFileUploadResponse(
                    isLocked ? "" : extractedText, result,
                    resumeFile.getOriginalFilename(),
                    resumeFile.getSize(),
                    getExtension(resumeFile.getOriginalFilename()),
                    isLocked ? 0 : (isPro ? null : remainingScans));

            response.setIsLocked(isLocked);
            response.setEngineUsed(scoringResult.engine);
            response.setFallbackUsed(scoringResult.fallbackUsed);
            response.setProcessingTimeMs(processingTimeMs);
            if (scoringResult.fallbackUsed) {
                response.setWarning("Python scoring service unavailable — results computed by Java rule-based engine. Start the Python service at localhost:8000 for deterministic scoring.");
            }

            logger.info("ATS analysis complete: guest={}, engine={}, fallback={}, score={}, time={}ms",
                    isLocked, scoringResult.engine, scoringResult.fallbackUsed, result.getAtsScore(), processingTimeMs);

            return ResponseEntity.ok(response);

        } catch (UsageLimitException e) {
            logger.warn("Usage limit reached: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (UnsupportedFileTypeException e) {
            return badRequest("Unsupported file type: " + e.getMessage());
        } catch (FileParsingException e) {
            return badRequest("File parsing error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error during ATS upload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("An unexpected error occurred while processing the file"));
        }
    }

    /**
     * Score a structured JSON resume against a job description.
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeStructured(@RequestBody AtsAnalysisRequest request) {
        long startTime = System.currentTimeMillis();
        try {
            User currentUser = getCurrentUser();
            boolean isLocked = (currentUser == null);

            if (!isLocked) {
                usageLimitService.checkAndIncrementUsage(currentUser);
            }

            if (request.getResumeData() == null || request.getJobDescription() == null
                    || request.getJobDescription().isBlank()) {
                return badRequest("Resume data and job description are required");
            }

            String resumeText = flattenResumeToText(request.getResumeData());
            ScoringResult scoringResult = scoreWithTracking(resumeText, request.getJobDescription());
            AtsResultDTO result = scoringResult.dto;

            // Generate AI feedback only if not guest
            if (request.isIncludeAiFeedback() && !isLocked) {
                try {
                    AtsAiFeedbackDTO feedback = aiFeedbackService.generateFeedback(
                            result, request.getJobDescription(), request.getResumeData());
                    result.setAiFeedback(feedback);
                } catch (Exception e) {
                    logger.warn("AI feedback generation failed (non-critical): {}", e.getMessage());
                }
            }

            // Embed observability into the result warnings list
            if (scoringResult.fallbackUsed && result.getWarnings() != null) {
                result.getWarnings().add("Scored by Java engine (Python service unavailable)");
            }

            // Lock and strip details for guest scans
            if (isLocked) {
                result.setIsLocked(true);
                result.setAiFeedback(null);
                result.setBreakdown(null);
                result.setImprovements(null);
                result.setMatchedKeywords(null);
                result.setMissingKeywords(null);
                result.setPartialSkills(null);
                result.setCategorizedMissingSkills(null);
                result.setMissingCriticalSkills(null);
                result.setMissingCoreSkills(null);
                result.setStrongSkills(null);
                result.setTailoringTips(null);
            }

            logger.info("ATS analysis complete: guest={}, engine={}, fallback={}, score={}, time={}ms",
                    isLocked, scoringResult.engine, scoringResult.fallbackUsed, result.getAtsScore(),
                    System.currentTimeMillis() - startTime);

            return ResponseEntity.ok(result);

        } catch (UsageLimitException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error in ATS analysis: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("An error occurred during analysis. Please try again."));
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String calculateSha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate SHA-256 hash", e);
        }
    }

    /** Holds scoring result with engine metadata. */
    private record ScoringResult(AtsResultDTO dto, String engine, boolean fallbackUsed) {}

    /**
     * Try Python deterministic scorer; fall back to Java with explicit tracking.
     */
    private ScoringResult scoreWithTracking(String resumeText, String jobDescription) {
        long t = System.currentTimeMillis();
        JsonNode pythonResult = pythonClient.matchScore(resumeText, jobDescription);
        if (pythonResult != null) {
            logger.info("Python scorer returned result in {}ms", System.currentTimeMillis() - t);
            return new ScoringResult(resultMapper.fromPythonResponse(pythonResult), "python", false);
        }
        logger.warn("Python scorer unavailable — using Java rule-based scorer (start Python service at :8000 for deterministic scoring)");
        AtsResultDTO dto = javaScorer.analyzeResume(Map.of("summary", resumeText), jobDescription);
        return new ScoringResult(dto, "java", true);
    }

    /**
     * Flatten structured resume JSON to plain text for the Python scorer.
     */
    private String flattenResumeToText(Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();

        appendField(sb, data, "summary");

        Object skills = data.get("skills");
        if (skills instanceof java.util.List<?> list) {
            sb.append("\nSkills: ");
            list.forEach(s -> {
                if (s instanceof Map<?, ?> m) {
                    Object title = m.get("title");
                    sb.append(title != null ? title : "").append(", ");
                } else {
                    sb.append(s).append(", ");
                }
            });
        }

        appendSection(sb, data, "experience", "title", "company", "description");
        appendSection(sb, data, "education", "degree", "institution", "description");
        appendSection(sb, data, "projects", "title", "description");
        appendSection(sb, data, "certifications", "title", "issuer");

        return sb.toString();
    }

    private void appendField(StringBuilder sb, Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val != null) sb.append("\n").append(val);
    }

    private void appendSection(StringBuilder sb, Map<String, Object> data, String section, String... fields) {
        Object raw = data.get(section);
        if (raw instanceof java.util.List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    for (String f : fields) {
                        Object v = m.get(f);
                        if (v != null) sb.append("\n").append(v);
                    }
                }
            }
        }
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || "anonymousUser".equals(auth.getPrincipal())) return null;
        return auth.getPrincipal() instanceof User u ? u : null;
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest().body(error(message));
    }

    private Map<String, String> error(String message) {
        Map<String, String> e = new HashMap<>();
        e.put("error", message);
        e.put("timestamp", Instant.now().toString());
        return e;
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int i = filename.lastIndexOf('.');
        return i > 0 ? filename.substring(i) : "";
    }
}

