package com.resume.backend.ats;

import com.resume.backend.ai.AIService;
import com.resume.backend.utils.JsonParserUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AtsComprehensiveServiceImpl implements AtsComprehensiveService {

    private static final Logger logger = LoggerFactory.getLogger(AtsComprehensiveServiceImpl.class);
    private final AIService aiService;

    public AtsComprehensiveServiceImpl(AIService aiService) {
        this.aiService = aiService;
    }

    @Override
    @Cacheable(value = "atsResults", key = "T(java.util.Objects).hash(#resumeText, #jobDescription)")
    public AtsResultDTO executeComprehensiveAnalysis(String resumeText, String jobDescription) throws Exception {
        logger.info("Starting unified comprehensive ATS Analysis (Single LLM Call) to avoid Rate Limits.");

        // 1. Load the comprehensive prompt
        Path path = new ClassPathResource("comprehensive_ats_prompt.txt").getFile().toPath();
        String promptTemplate = Files.readString(path);

        // 2. Inject parameters
        String prompt = promptTemplate
                .replace("{{resume_text}}", resumeText != null ? resumeText : "")
                .replace("{{job_description}}", jobDescription != null ? jobDescription : "");

        // 3. Make single LLM Call
        String jsonResponse = aiService.analyzeStructure(prompt);
        logger.info("Groq API returned response of length: {}", jsonResponse.length());

        // 4. Parse the returned JSON
        Map<String, Object> aiData = JsonParserUtil.parseAiResponse(jsonResponse);
        logger.info("Parsed AI response, data present: {}", aiData.containsKey("data"));
        
        if (aiData.containsKey("data")) {
            Object dataObj = aiData.get("data");
            if (dataObj instanceof Map<?, ?> rawMap) {
                aiData = new HashMap<>();
                for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
                    if (entry.getKey() instanceof String) {
                        aiData.put((String) entry.getKey(), entry.getValue());
                    }
                }
            }
            logger.info("Unpacked data, keys: {}", aiData.keySet());
        } else {
            logger.error("No 'data' key found in parsed response. Keys present: {}", aiData.keySet());
            throw new Exception("AI response parsing failed - no data found");
        }

        // 5. Map to AtsResultDTO
        AtsResultDTO result = new AtsResultDTO();

        // Core score
        if (aiData.containsKey("atsScore")) {
            result.setAtsScore(((Number) aiData.get("atsScore")).intValue());
        }

        // Default initialization for safety
        result.setMissingCriticalSkills(new ArrayList<>());
        result.setMissingCoreSkills(new ArrayList<>());

        // Matched / missing lists
        if (aiData.containsKey("matchedKeywords")) {
            result.setMatchedKeywords(parseStringList(aiData.get("matchedKeywords")));
            result.setStrongSkills(parseStringList(aiData.get("matchedKeywords"))); // Populate strong skills too
        } else {
            result.setMatchedKeywords(new ArrayList<>());
        }

        if (aiData.containsKey("missingKeywords")) {
            result.setMissingKeywords(parseStringList(aiData.get("missingKeywords")));
        } else {
            result.setMissingKeywords(new ArrayList<>());
        }

        // Score Breakdown
        if (aiData.containsKey("scoreBreakdown")) {
            Object raw = aiData.get("scoreBreakdown");
            Map<String, Integer> breakdown = new HashMap<>();
            if (raw instanceof Map) {
                ((Map<?, ?>) raw).forEach((k, v) -> {
                    int val = 0;
                    if (v instanceof Number) {
                        val = ((Number) v).intValue();
                    } else if (v instanceof String) {
                        try {
                            val = Integer.parseInt(v.toString());
                        } catch (Exception ignored) {
                        }
                    }
                    if (k instanceof String) {
                        breakdown.put((String) k, val);
                    }
                });
                result.setSectionScores(breakdown);
                if (breakdown.containsKey("keywordMatch")) {
                    result.setKeywordMatchPercentage((double) breakdown.get("keywordMatch"));
                }
            }
        } else {
            result.setSectionScores(new HashMap<>());
        }

        // Missing Skills by severity
        List<AtsResultDTO.MissingSkill> missingSkillsList = new ArrayList<>();
        if (aiData.containsKey("missingSkills")) {
            Object rawMsMap = aiData.get("missingSkills");
            if (rawMsMap instanceof Map) {
                Map<?, ?> msMap = (Map<?, ?>) rawMsMap;
                if (msMap.containsKey("critical") && msMap.get("critical") != null) {
                    List<String> criticals = parseStringList(msMap.get("critical"));
                    result.setMissingCriticalSkills(criticals);
                    for (String s : criticals)
                        missingSkillsList.add(new AtsResultDTO.MissingSkill(s, "CRITICAL"));
                }
                if (msMap.containsKey("core") && msMap.get("core") != null) {
                    List<String> cores = parseStringList(msMap.get("core"));
                    result.setMissingCoreSkills(cores);
                    for (String s : cores)
                        missingSkillsList.add(new AtsResultDTO.MissingSkill(s, "IMPORTANT"));
                }
                if (msMap.containsKey("niceToHave") && msMap.get("niceToHave") != null) {
                    for (String s : parseStringList(msMap.get("niceToHave")))
                        missingSkillsList.add(new AtsResultDTO.MissingSkill(s, "NICE_TO_HAVE"));
                }
            }
        }
        result.setCategorizedMissingSkills(missingSkillsList);

        // Set default values for fields not provided by comprehensive analysis
        result.setTotalBullets(0);
        result.setQuantifiedBullets(0);
        result.setReadabilityScore(8);
        result.setWeaknessFlags(new ArrayList<>());
        result.setWarnings(new ArrayList<>());
        result.setTailoringTips(new ArrayList<>());

        setVerdict(result);

        // AI Feedback DTO Setup
        AtsAiFeedbackDTO feedback = new AtsAiFeedbackDTO();
        if (aiData.containsKey("aiFeedback")) {
            Object rawFdb = aiData.get("aiFeedback");
            if (rawFdb instanceof Map) {
                Map<?, ?> fdbMap = (Map<?, ?>) rawFdb;
                // Safely extract strengths and weaknesses
                List<String> strengths = parseStringList(fdbMap.get("strengths"));
                List<String> weaknesses = parseStringList(fdbMap.get("weaknesses"));
                List<String> suggestions = parseStringList(fdbMap.get("improvementSuggestions"));

                feedback.setSkillsFeedback("Strengths: " + String.join(", ", strengths));
                feedback.setOverallSummary(String.join(". ", suggestions));

                // Map improvementSuggestions to legacy ATS requirements
                feedback.setImprovementSuggestions(String.join("\n", suggestions));
                feedback.setAtsSummaryExplanation("Weaknesses identified: " + String.join(", ", weaknesses));
            }
        }

        if (aiData.containsKey("improvedBulletExamples")) {
            feedback.setRewrittenBullets(parseStringList(aiData.get("improvedBulletExamples")));
        } else {
            feedback.setRewrittenBullets(new ArrayList<>());
        }

        result.setAiFeedback(feedback);

        logger.info("ATS analysis complete. Score: {}, Matched: {}, Missing: {}", 
            result.getAtsScore(), 
            result.getMatchedKeywords().size(), 
            result.getMissingKeywords().size());

        return result;
    }

    /** Assigns a human-readable verdict based on the ATS score. */
    private void setVerdict(AtsResultDTO result) {
        int score = result.getAtsScore();
        if (score >= 80) {
            result.setAtsVerdict("Excellent");
            result.setVerdictExplanation("Your resume is well-optimized for ATS systems");
        } else if (score >= 60) {
            result.setAtsVerdict("Good");
            result.setVerdictExplanation("Your resume has good ATS compatibility with room for improvement");
        } else if (score >= 40) {
            result.setAtsVerdict("Fair");
            result.setVerdictExplanation("Your resume needs significant improvements for ATS optimization");
        } else {
            result.setAtsVerdict("Needs Work");
            result.setVerdictExplanation("Your resume requires major revisions to pass ATS screening");
        }
    }

    /**
     * Safely converts a potential List of Strings or List of Maps into a clean List of Strings.
     * Handles LLM hallucinations where arrays of objects are returned instead of strings.
     */
    private List<String> parseStringList(Object obj) {
        List<String> result = new ArrayList<>();
        if (obj instanceof List) {
            for (Object item : (List<?>) obj) {
                if (item instanceof String) {
                    result.add((String) item);
                } else if (item instanceof Map) {
                    // If LLM hallucinated an array of objects, extract their values or stringify
                    Map<?, ?> map = (Map<?, ?>) item;
                    if (map.containsKey("keyword")) {
                        result.add(String.valueOf(map.get("keyword")));
                    } else if (map.containsKey("bullet")) {
                        result.add(String.valueOf(map.get("bullet")));
                    } else if (map.containsKey("improved")) {
                        result.add(String.valueOf(map.get("improved")));
                    } else {
                        result.add(map.values().iterator().next().toString());
                    }
                }
            }
        }
        return result;
    }
}
