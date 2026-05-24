package com.resume.backend.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AIConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(AIConfiguration.class);

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.model:llama-3.1-8b-instant}")
    private String groqModel;

    @Bean
    @ConditionalOnProperty(name = "ai.mode", havingValue = "mock", matchIfMissing = true)
    AIService mockAIService() {
        logger.warn("AI mode: MOCK — Groq will NOT be called. Set ai.mode=groq in application.properties.");
        return new MockAIService();
    }

    @Bean
    @ConditionalOnProperty(name = "ai.mode", havingValue = "groq")
    AIService groqAIService() {
        String cleanKey = groqApiKey == null ? "" : groqApiKey.trim()
                .replaceAll("^\"|\"$", "")
                .replaceAll("^'|'$", "")
                .trim();

        if (cleanKey.isBlank()) {
            logger.error("groq.api.key is empty! Check application.properties.");
            throw new IllegalStateException("groq.api.key must not be empty when ai.mode=groq");
        }

        logger.info("✅ AI mode: GROQ — GroqAIService initialized");
        logger.info("   Key prefix: {}...", cleanKey.substring(0, Math.min(12, cleanKey.length())));
        return new GroqAIService(cleanKey, groqModel.trim());
    }
}
