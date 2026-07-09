package com.resume.backend;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
@EnableCaching
@EnableAsync
public class ResumeAiBackendApplication {

    private static final Logger logger = LoggerFactory.getLogger(ResumeAiBackendApplication.class);

    // The exact keys defined in our .env file.
    // Only these will be injected — OS env vars with the same name are overridden.
    private static final Set<String> ENV_FILE_KEYS = Set.of(
            "SERVER_PORT", "DB_URL", "DB_USERNAME", "DB_PASSWORD",
            "AI_MODE", "GROQ_API_KEY", "GROQ_MODEL",
            "JWT_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET",
            "ATS_PYTHON_URL", "COOKIE_SECURE", "COOKIE_DOMAIN", "CORS_ALLOWED_ORIGINS",
            "RESEND_API_KEY", "RESEND_FROM_EMAIL", "FRONTEND_URL"
    );

    static {
        loadDotEnvIntoSystemProperties();
    }

    public static void main(String[] args) {
        SpringApplication.run(ResumeAiBackendApplication.class, args);
    }

    private static void loadDotEnvIntoSystemProperties() {
        String workingDir = System.getProperty("user.dir");
        logger.info("Working directory: {}", workingDir);

        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .ignoreIfMalformed()
                    .load();

            java.util.List<String> loadedKeys = new java.util.ArrayList<>();
            // Retrieve only the values declared in the local .env file (if it exists).
            // dotenv.entries() returns entries loaded specifically from the .env file.
            // If the file is missing (e.g. in production), entries() will be empty.
            for (io.github.cdimascio.dotenv.DotenvEntry entry : dotenv.entries(io.github.cdimascio.dotenv.Dotenv.Filter.DECLARED_IN_ENV_FILE)) {
                String key = entry.getKey();
                if (ENV_FILE_KEYS.contains(key)) {
                    String value = entry.getValue();
                    if (value != null) {
                        String cleanValue = value.trim()
                                .replaceAll("^\"|\"$", "")
                                .replaceAll("^'|'$", "")
                                .trim();

                        System.setProperty(key, cleanValue);
                        loadedKeys.add(key);
                    }
                }
            }

            java.util.Collections.sort(loadedKeys);
            logger.info(".env loaded: {} variables {}", loadedKeys.size(), loadedKeys);

            // Verify the critical ones
            String aiMode = System.getProperty("AI_MODE");
            String groqKey = System.getProperty("GROQ_API_KEY");
            String dbUser  = System.getProperty("DB_USERNAME");
            logger.info("AI mode: {}", aiMode != null ? aiMode : "NOT SET");
            logger.info("DB_USERNAME: {}", dbUser != null ? dbUser : "NOT SET");
            logger.info("Groq API key: {}",
                    groqKey != null && !groqKey.isBlank()
                            ? "PRESENT"
                            : "NOT SET — AI will not work!");

        } catch (DotenvException e) {
            logger.warn("Could not load .env: {} — using OS environment variables", e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error loading .env: {}", e.getMessage(), e);
        }
    }
}
