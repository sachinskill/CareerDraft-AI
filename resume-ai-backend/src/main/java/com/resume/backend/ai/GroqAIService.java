package com.resume.backend.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Production-grade Groq AI Service implementation using Spring WebClient.
 * Implements AIService interface for resume generation and analysis.
 * 
 * Features:
 * - Uses llama-3.1-8b-instant model for fast inference
 * - 30-second timeout for all API calls
 * - Temperature 0.2 for consistent responses
 * - Comprehensive error handling with custom exceptions
 * - SLF4J logging for production monitoring
 */
public class GroqAIService implements AIService {

    private static final Logger logger = LoggerFactory.getLogger(GroqAIService.class);
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final double TEMPERATURE = 0.2;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String model;

    /**
     * Constructor for GroqAIService.
     * 
     * @param apiKey Groq API key from environment variable GROQ_API_KEY
     * @param model  Model name (default: llama-3.1-8b-instant)
     * @throws IllegalStateException if API key is null or empty
     */
    public GroqAIService(String apiKey, String model) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.error("GROQ_API_KEY is not configured");
            throw new IllegalStateException("GROQ_API_KEY environment variable is required when ai.mode=groq");
        }

        // Final sanitization — strip any quotes or whitespace that survived earlier steps
        String cleanKey = apiKey.trim()
                .replaceAll("^\"|\"$", "")
                .replaceAll("^'|'$", "")
                .trim();

        this.model = model.trim();
        this.objectMapper = new ObjectMapper();
        this.webClient = WebClient.builder()
                .baseUrl(GROQ_API_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + cleanKey)
                .build();

        // Diagnostic: confirm the exact auth header being set (first 15 chars of key only)
        logger.info("GroqAIService initialized with model: {}", this.model);
        logger.info("Authorization header: [Bearer {}...]",
                cleanKey.length() >= 15 ? cleanKey.substring(0, 15) : cleanKey);
    }

    @Override
    public String generateResume(String prompt) {
        logger.info("Generating resume via Groq API");
        return callGroqAPI(prompt, "resume generation");
    }

    @Override
    public String enhanceResume(String prompt) {
        logger.info("Enhancing resume via Groq API");
        return callGroqAPI(prompt, "resume enhancement");
    }

    @Override
    public String analyzeStructure(String prompt) {
        logger.info("Analyzing structure via Groq API");
        return callGroqAPI(prompt, "structure analysis");
    }

    @Override
    public String generateFeedback(String prompt) {
        logger.info("Generating feedback via Groq API");
        return callGroqAPIPlainText(prompt, "feedback generation",
                "You are a professional resume writing assistant. Return ONLY the requested text — no JSON, no markdown, no explanation, no preamble.");
    }

    @Override
    public String extractKeywords(String prompt) {
        logger.info("Extracting keywords via Groq API");
        return callGroqAPIPlainText(prompt, "keyword extraction",
                "You are a keyword extraction assistant. Return ONLY a comma-separated list of keywords. No JSON, no markdown, no explanation.");
    }

    /**
     * Plain-text Groq call — no response_format constraint.
     * Used for feedback generation and keyword extraction.
     */
    @SuppressWarnings("null")
    private String callGroqAPIPlainText(String prompt, String operation, String systemPrompt) {
        try {
            long startTime = System.currentTimeMillis();

            @SuppressWarnings("null")
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "temperature", TEMPERATURE,
                    // No response_format constraint — plain text is fine here
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", prompt)));

            String responseBody = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .onErrorResume(WebClientResponseException.class, ex -> {
                        logger.error("Groq API error - Status: {}, Body: {}",
                                ex.getStatusCode(), ex.getResponseBodyAsString());
                        return Mono.error(new AiServiceException(
                                "Groq API returned error: " + ex.getStatusCode(), ex));
                    })
                    .block();

            long duration = System.currentTimeMillis() - startTime;
            logger.info("Groq API call completed in {}ms for: {}", duration, operation);

            return extractContent(responseBody);

        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during Groq API call for {}: {}", operation, e.getMessage());
            throw new AiServiceException("Failed to call Groq API: " + e.getMessage(), e);
        }
    }

    /**
     * Makes a synchronous call to Groq API with timeout and error handling.
     * 
     * @param prompt    User prompt to send to the AI
     * @param operation Operation name for logging
     * @return AI-generated content
     * @throws AiServiceException if API call fails or response is invalid
     */
    @SuppressWarnings("null")
    private String callGroqAPI(String prompt, String operation) {
        try {
            long startTime = System.currentTimeMillis();

            // Build request body
            @SuppressWarnings("null")
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "temperature", TEMPERATURE,
                    "response_format", Map.of("type", "json_object"),
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are a resume assistant. ALWAYS output your response in pure JSON format without any markdown tagging."),
                            Map.of("role", "user", "content", prompt)));

            logger.debug("Calling Groq API for: {}", operation);

            // Make API call with timeout
            String responseBody = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .onErrorResume(WebClientResponseException.class, ex -> {
                        logger.error("Groq API error - Status: {}, Body: {}",
                                ex.getStatusCode(), ex.getResponseBodyAsString());
                        return Mono.error(new AiServiceException(
                                "Groq API returned error: " + ex.getStatusCode(), ex));
                    })
                    .block();

            long duration = System.currentTimeMillis() - startTime;
            logger.info("Groq API call completed in {}ms for: {}", duration, operation);

            // Parse and extract content
            return extractContent(responseBody);

        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during Groq API call for {}: {}", operation, e.getMessage());
            throw new AiServiceException("Failed to call Groq API: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts content from Groq API response.
     * 
     * @param responseBody Raw JSON response from Groq API
     * @return Extracted content string
     * @throws AiServiceException if response format is invalid
     */
    private String extractContent(String responseBody) {
        try {
            if (responseBody == null || responseBody.trim().isEmpty()) {
                logger.error("Groq API returned empty response");
                throw new AiServiceException("Groq API returned empty response");
            }

            JsonNode jsonResponse = objectMapper.readTree(responseBody);
            JsonNode choices = jsonResponse.get("choices");

            if (choices == null || choices.isEmpty()) {
                logger.error("Groq API response missing 'choices' field");
                throw new AiServiceException("Invalid Groq API response format: missing choices");
            }

            JsonNode message = choices.get(0).get("message");
            if (message == null) {
                logger.error("Groq API response missing 'message' field");
                throw new AiServiceException("Invalid Groq API response format: missing message");
            }

            JsonNode contentNode = message.get("content");
            if (contentNode == null) {
                logger.error("Groq API response missing 'content' field");
                throw new AiServiceException("Invalid Groq API response format: missing content");
            }

            String content = contentNode.asText();
            logger.debug("Successfully extracted content from Groq API response (length: {} chars)", content.length());

            return content;

        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to parse Groq API response: {}", e.getMessage());
            throw new AiServiceException("Failed to parse Groq API response: " + e.getMessage(), e);
        }
    }
}
