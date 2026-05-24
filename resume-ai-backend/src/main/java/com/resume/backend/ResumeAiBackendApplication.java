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
            "ATS_PYTHON_URL", "COOKIE_SECURE", "COOKIE_DOMAIN", "CORS_ALLOWED_ORIGINS"
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

            int loaded = 0;
            // Only inject keys that are explicitly defined in ENV_FILE_KEYS.
            // This prevents OS environment variables (like DB_USERNAME=postgres.xxx)
            // from being re-injected and overwriting the correct .env values.
            for (String key : ENV_FILE_KEYS) {
                String value = dotenv.get(key, null);
                if (value != null) {
                    // Sanitize: strip surrounding quotes and whitespace
                    String cleanValue = value.trim()
                            .replaceAll("^\"|\"$", "")
                            .replaceAll("^'|'$", "")
                            .trim();

                    System.setProperty(key, cleanValue);
                    loaded++;

                    // Log with masking for sensitive values
                    boolean sensitive = key.contains("KEY") || key.contains("SECRET") || key.contains("PASSWORD");
                    String display = sensitive
                            ? cleanValue.substring(0, Math.min(10, cleanValue.length())) + "..."
                            : cleanValue;
                    logger.info("  .env → System.setProperty({}) = {}", key, display);
                }
            }

            logger.info(".env loaded: {} variables injected", loaded);

            // Verify the critical ones
            String aiMode = System.getProperty("AI_MODE");
            String groqKey = System.getProperty("GROQ_API_KEY");
            String dbUser  = System.getProperty("DB_USERNAME");
            logger.info("AI mode: {}", aiMode != null ? aiMode : "NOT SET");
            logger.info("DB_USERNAME: {}", dbUser);
            logger.info("Groq API key: {}",
                    groqKey != null && !groqKey.isBlank()
                            ? "YES [" + groqKey.substring(0, Math.min(15, groqKey.length())) + "...]"
                            : "NO — AI will not work!");

        } catch (DotenvException e) {
            logger.warn("Could not load .env: {} — using OS environment variables", e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error loading .env: {}", e.getMessage(), e);
        }
    }
}
