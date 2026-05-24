package com.resume.backend.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.backend.ai.AIService;
import com.resume.backend.ai.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import com.resume.backend.model.ATSReport;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class ResumeServiceImpl implements ResumeService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeServiceImpl.class);
    private final AIService aiService;

    public ResumeServiceImpl(AIService aiService) {
        this.aiService = aiService;
    }

    @Override
    public Map<String, Object> enhanceResumeResponse(Map<String, Object> resumeData, ATSReport latestReport)
            throws IOException {
        String promptString = this.loadPromptFromFile("enhancement_prompt.txt");

        // Convert resume data to JSON string
        ObjectMapper objectMapper = new ObjectMapper();
        String resumeJson = objectMapper.writeValueAsString(resumeData);

        // Extract relevant report data if available
        String jobDescription = latestReport != null && latestReport.getJobDescription() != null
                ? latestReport.getJobDescription()
                : "Generic Optimization (No Job Description provided)";
        String missingSkills = "None identified";

        if (latestReport != null && latestReport.getReportJson() != null) {
            try {
                // Parse the previously saved AtsResultDTO back into a Map to extract the
                // dynamically found missing skills
                Map<String, Object> reportData = objectMapper.readValue(latestReport.getReportJson(),
                        new TypeReference<Map<String, Object>>() {
                        });
                Object missing = reportData.get("missingKeywords");
                if (missing != null) {
                    missingSkills = missing.toString();
                }
            } catch (Exception e) {
                logger.error("Failed to parse reportJson for missing skills", e);
            }
        }

        String promptContent = this.putValuesToTemplate(promptString, Map.of(
                "resumeJson", resumeJson,
                "jobDescription", jobDescription,
                "missingSkills", missingSkills));

        Map<String, Object> enhancedResponse = new HashMap<>();

        try {
            String response = aiService.enhanceResume(promptContent);
            logger.info("AI Enhancement Response received (length: {} chars)", response.length());

            // Try to parse the response directly as JSON
            @SuppressWarnings("unchecked")
            Map<String, Object> enhancedData = objectMapper.readValue(response, Map.class);

            // Server-Side Self-Healing Data Integrity
            enforceDataIntegrity(resumeData, enhancedData);

            enhancedResponse.put("data", enhancedData);
            enhancedResponse.put("enhanced", true);
        } catch (AiServiceException e) {
            logger.error("AI service error during enhancement: {}", e.getMessage());
            // If enhancement fails, return original data
            enhancedResponse.put("data", resumeData);
            enhancedResponse.put("enhanced", false);
            enhancedResponse.put("error", "Enhancement failed, returning original data");
        } catch (Exception e) {
            logger.error("Error parsing enhanced JSON: {}", e.getMessage());
            // If enhancement fails, return original data
            enhancedResponse.put("data", resumeData);
            enhancedResponse.put("enhanced", false);
            enhancedResponse.put("error", "Enhancement failed, returning original data");
        }

        return enhancedResponse;
    }

    @Override
    public Map<String, Object> generateResumeResponse(String userResumeDescription) throws IOException {
        String promptString = this.loadPromptFromFile("resume_prompt.txt");

        // Add explicit instructions to format as JSON
        promptString = "Please provide your response as a valid JSON object. " + promptString;

        String promptContent = this.putValuesToTemplate(promptString, Map.of(
                "userDescription", userResumeDescription));

        try {
            String response = aiService.generateResume(promptContent);
            logger.info("AI Resume Generation Response received (length: {} chars)", response.length());

            Map<String, Object> stringObjectMap = parseMultipleResponses(response);

            // If data is null, throw exception instead of returning dummy data
            if (stringObjectMap.get("data") == null) {
                logger.error("AI returned null data for resume generation");
                throw new AiServiceException("Failed to generate resume data from AI response");
            }

            return stringObjectMap;
        } catch (AiServiceException e) {
            logger.error("AI service error during resume generation: {}", e.getMessage());
            throw new IOException("Failed to generate resume: " + e.getMessage(), e);
        }
    }

    @Override
    public String generateBulletImprovement(String prompt) throws IOException {
        try {
            String response = aiService.generateFeedback(prompt);
            if (response == null || response.isBlank()) return null;
            // Strip any accidental JSON wrapping the model might add
            String cleaned = response.trim()
                    .replaceAll("^\\{.*?\"improved\"\\s*:\\s*\"", "")
                    .replaceAll("\"\\s*\\}\\s*$", "")
                    .replaceAll("^[\"']|[\"']$", "");
            return cleaned.isBlank() ? null : cleaned;
        } catch (AiServiceException e) {
            logger.error("AI service error during bullet improvement: {}", e.getMessage());
            throw new IOException("Failed to improve bullet: " + e.getMessage(), e);
        }
    }

    String loadPromptFromFile(String filename) throws IOException {
        Path path = new ClassPathResource(filename).getFile().toPath();
        return Files.readString(path);
    }

    String putValuesToTemplate(String template, Map<String, String> values) {
        for (Map.Entry<String, String> entry : values.entrySet()) {
            template = template.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return template;
    }

    private Map<String, Object> parseMultipleResponses(String response) {
        return com.resume.backend.utils.JsonParserUtil.parseAiResponse(response);
    }

    @SuppressWarnings("unchecked")
    void enforceDataIntegrity(Map<String, Object> original, Map<String, Object> enhanced) {
        // Enforce top-level metadata strictly
        String[] strictKeys = { "personalInformation", "education", "projects", "certifications", "languages",
                "interests" };
        for (String key : strictKeys) {
            if (original.containsKey(key)) {
                enhanced.put(key, original.get(key));
            }
        }

        // Enforce experience metadata (Lock company, title, dates, but permit modified
        // responsibilities)
        if (original.containsKey("experience") && original.get("experience") instanceof java.util.List) {
            java.util.List<Map<String, Object>> origExp = (java.util.List<Map<String, Object>>) original
                    .get("experience");
            java.util.List<Map<String, Object>> enhExp = new java.util.ArrayList<>();

            java.util.List<Map<String, Object>> rawEnhExp = null;
            if (enhanced.containsKey("experience") && enhanced.get("experience") instanceof java.util.List) {
                rawEnhExp = (java.util.List<Map<String, Object>>) enhanced.get("experience");
            }

            for (int i = 0; i < origExp.size(); i++) {
                Map<String, Object> origEntry = origExp.get(i);
                Map<String, Object> mergedEntry = new HashMap<>(origEntry); // Copy all original factual fields

                // Selectively allow overriding description/responsibilities if Groq provided
                // them
                if (rawEnhExp != null && i < rawEnhExp.size()) {
                    Map<String, Object> enhEntry = rawEnhExp.get(i);
                    if (enhEntry.containsKey("responsibilities")) {
                        mergedEntry.put("responsibilities", enhEntry.get("responsibilities"));
                    }
                    if (enhEntry.containsKey("description")) {
                        mergedEntry.put("description", enhEntry.get("description"));
                    }
                }
                enhExp.add(mergedEntry);
            }
            enhanced.put("experience", enhExp);
        }
    }
}
