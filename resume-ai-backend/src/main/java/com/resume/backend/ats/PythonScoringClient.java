package com.resume.backend.ats;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

/**
 * HTTP client for the Python ATS microservice.
 *
 * Timeouts:
 *   - /match-score  : 60s  (embedding + scoring, warm model ~2-4s)
 *   - /parse-resume : 30s  (PDF/DOCX parsing)
 *   - /health       :  3s  (fast check)
 *   - /warmup       : 30s  (first-time model JIT)
 *
 * On startup: calls /warmup asynchronously so the first real request is fast.
 */
@Service
public class PythonScoringClient {

    private static final Logger logger = LoggerFactory.getLogger(PythonScoringClient.class);

    // Increased from 30s → 60s to handle warm model scoring comfortably
    private static final Duration SCORE_TIMEOUT  = Duration.ofSeconds(60);
    private static final Duration PARSE_TIMEOUT  = Duration.ofSeconds(30);
    private static final Duration HEALTH_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration WARMUP_TIMEOUT = Duration.ofSeconds(30);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public PythonScoringClient(
            @Value("${ats.python.service.url:http://localhost:8000}") @NonNull String serviceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(serviceUrl)
                .build();
        this.objectMapper = new ObjectMapper();
        logger.info("PythonScoringClient configured with URL: {}", serviceUrl);
    }

    /**
     * Called after Spring context is ready.
     * Pings /health and if reachable, calls /warmup asynchronously
     * so the model is hot before the first real request arrives.
     */
    @PostConstruct
    public void triggerWarmup() {
        // Run in a daemon thread — don't block Spring startup
        Thread.ofVirtual().name("python-warmup").start(() -> {
            try {
                Thread.sleep(2000); // give Python service a moment to finish its own startup
                if (!isAvailable()) {
                    logger.info("Python service not reachable at startup — skipping warmup (Java fallback active)");
                    return;
                }
                logger.info("Python service reachable — triggering model warmup…");
                String response = webClient.get()
                        .uri("/warmup")
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(WARMUP_TIMEOUT)
                        .block();
                logger.info("Python model warmup complete: {}", response);
            } catch (Exception e) {
                logger.warn("Python warmup failed (non-critical): {}", e.getMessage());
            }
        });
    }

    /**
     * Call /match-score — returns full deterministic ATS score.
     * Returns null if the service is unavailable (caller falls back to Java scorer).
     */
    @SuppressWarnings("null")
    public JsonNode matchScore(String resumeText, String jobDescription) {
        try {
            Map<String, String> body = Map.of(
                    "resume_text", resumeText,
                    "job_description", jobDescription);

            String response = webClient.post()
                    .uri("/match-score")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(SCORE_TIMEOUT)
                    .block();

            return objectMapper.readTree(response);

        } catch (WebClientResponseException e) {
            logger.error("Python scoring service error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            logger.warn("Python scoring service unavailable: {} — falling back to Java scorer", e.getMessage());
            return null;
        }
    }

    /**
     * Call /parse-resume — extract text from uploaded file bytes.
     * Returns null if unavailable.
     */
    @SuppressWarnings("null")
    public String parseFile(byte[] fileBytes, String filename) {
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            });

            String response = webClient.post()
                    .uri("/parse-resume")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(PARSE_TIMEOUT)
                    .block();

            JsonNode node = objectMapper.readTree(response);
            return node.path("text").asText();

        } catch (Exception e) {
            logger.warn("Python parse service unavailable: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Health check — returns true if the Python service is reachable.
     */
    public boolean isAvailable() {
        try {
            webClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(HEALTH_TIMEOUT)
                    .block();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
