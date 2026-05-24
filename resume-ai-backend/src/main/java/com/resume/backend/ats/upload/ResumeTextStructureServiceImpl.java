package com.resume.backend.ats.upload;

import com.resume.backend.ai.AIService;
import com.resume.backend.ai.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;

import java.util.*;
import java.io.IOException;

/**
 * Implementation of ResumeTextStructureService for parsing resume text into
 * structured data.
 * Uses rule-based parsing with regex patterns and section headers.
 */
@Service
public class ResumeTextStructureServiceImpl implements ResumeTextStructureService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeTextStructureServiceImpl.class);
    private final AIService aiService;

    public ResumeTextStructureServiceImpl(AIService aiService) {
        this.aiService = aiService;
    }

    @Override
    public Map<String, Object> parseTextToResumeStructure(String extractedText) {
        if (extractedText == null || extractedText.trim().isEmpty()) {
            return createEmptyResumeStructure();
        }

        try {
            // Limit text size to prevent timeout
            String textToProcess = extractedText;
            if (extractedText.length() > 5000) {
                logger.info("Resume text too long ({} chars), truncating to 5000 chars", extractedText.length());
                textToProcess = extractedText.substring(0, 5000);
            }

            String promptString = loadPromptFromFile("structure_prompt.txt");
            String promptContent = promptString.replace("{{resumeText}}", textToProcess);

            logger.info("Sending resume text to AI for parsing (length: {} chars)", textToProcess.length());
            long startTime = System.currentTimeMillis();

            String response = aiService.analyzeStructure(promptContent);

            long duration = System.currentTimeMillis() - startTime;
            logger.info("AI parsing completed in {}ms", duration);

            Map<String, Object> parsedResponse = com.resume.backend.utils.JsonParserUtil.parseAiResponse(response);

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) parsedResponse.get("data");

            if (data != null && !data.isEmpty()) {
                return data;
            } else {
                logger.warn("AI Parsing returned empty data, using fallback basic parsing");
                return createBasicResumeFromText(extractedText);
            }

        } catch (AiServiceException e) {
            logger.error("AI service error during parsing: {}", e.getMessage());
            logger.info("Falling back to basic text parsing");
            return createBasicResumeFromText(extractedText);
        } catch (Exception e) {
            logger.error("AI Parsing Exception: {}", e.getMessage());
            logger.info("Falling back to basic text parsing");
            return createBasicResumeFromText(extractedText);
        }
    }

    /**
     * Fallback: Create basic resume structure from text using simple parsing
     */
    private Map<String, Object> createBasicResumeFromText(String text) {
        Map<String, Object> resumeData = new HashMap<>();

        // Extract email
        String email = extractEmail(text);

        // Extract phone
        String phone = extractPhone(text);

        // Create personal information
        Map<String, Object> personalInfo = new HashMap<>();
        personalInfo.put("fullName", extractName(text));
        personalInfo.put("email", email);
        personalInfo.put("phoneNumber", phone);
        personalInfo.put("location", "");
        personalInfo.put("linkedIn", null);
        personalInfo.put("gitHub", null);
        personalInfo.put("portfolio", null);

        resumeData.put("personalInformation", personalInfo);

        // Extract skills (look for common skill keywords)
        List<Map<String, Object>> skills = extractBasicSkills(text);
        resumeData.put("skills", skills);

        // Create basic summary
        String summary = "Professional with experience in software development";
        if (text.length() > 100) {
            summary = text.substring(0, Math.min(200, text.length())).replaceAll("\\s+", " ").trim();
        }
        resumeData.put("summary", summary);

        resumeData.put("experience", new ArrayList<>());
        resumeData.put("education", new ArrayList<>());
        resumeData.put("projects", new ArrayList<>());
        resumeData.put("certifications", new ArrayList<>());
        resumeData.put("languages", new ArrayList<>());
        resumeData.put("interests", new ArrayList<>());

        return resumeData;
    }

    private String extractName(String text) {
        // First line is usually the name
        String[] lines = text.split("\\n");
        if (lines.length > 0) {
            String firstLine = lines[0].trim();
            if (firstLine.length() > 0 && firstLine.length() < 50) {
                return firstLine;
            }
        }
        return "Candidate Name";
    }

    private String extractEmail(String text) {
        java.util.regex.Pattern emailPattern = java.util.regex.Pattern.compile(
                "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        java.util.regex.Matcher matcher = emailPattern.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return "";
    }

    private String extractPhone(String text) {
        java.util.regex.Pattern phonePattern = java.util.regex.Pattern.compile(
                "\\+?\\d[\\d\\s\\-\\(\\)]{8,}\\d");
        java.util.regex.Matcher matcher = phonePattern.matcher(text);
        if (matcher.find()) {
            return matcher.group().trim();
        }
        return "";
    }

    private List<Map<String, Object>> extractBasicSkills(String text) {
        List<Map<String, Object>> skills = new ArrayList<>();
        String textLower = text.toLowerCase();

        // Common technical skills
        String[] commonSkills = {
                "java", "python", "javascript", "react", "spring", "spring boot",
                "node.js", "angular", "vue", "docker", "kubernetes", "aws",
                "mysql", "postgresql", "mongodb", "git", "jenkins", "ci/cd"
        };

        for (String skill : commonSkills) {
            if (textLower.contains(skill)) {
                Map<String, Object> skillMap = new HashMap<>();
                skillMap.put("title", capitalizeFirst(skill));
                skillMap.put("level", "Intermediate");
                skills.add(skillMap);

                if (skills.size() >= 10)
                    break; // Limit to 10 skills
            }
        }

        return skills;
    }

    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty())
            return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private String loadPromptFromFile(String filename) throws IOException {
        ClassPathResource resource = new ClassPathResource(filename);
        java.nio.file.Path path = resource.getFile().toPath();
        return java.nio.file.Files.readString(path);
    }

    // Helper methods for interface compatibility (can be deprecated or removed
    // later)
    @Override
    public String extractSummary(String text) {
        return "";
    }

    @Override
    public List<String> extractSkills(String text) {
        return new ArrayList<>();
    }

    @Override
    public List<String> extractExperience(String text) {
        return new ArrayList<>();
    }

    @Override
    public List<String> extractEducation(String text) {
        return new ArrayList<>();
    }

    @Override
    public List<String> extractProjects(String text) {
        return new ArrayList<>();
    }

    /**
     * Create empty resume structure.
     */
    private Map<String, Object> createEmptyResumeStructure() {
        Map<String, Object> resumeData = new HashMap<>();
        resumeData.put("summary", "");
        resumeData.put("skills", new ArrayList<>());
        resumeData.put("experience", new ArrayList<>());
        resumeData.put("education", new ArrayList<>());
        resumeData.put("projects", new ArrayList<>());
        return resumeData;
    }
}