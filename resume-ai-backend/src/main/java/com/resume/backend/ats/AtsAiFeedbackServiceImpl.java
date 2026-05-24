package com.resume.backend.ats;

import com.resume.backend.ai.AIService;
import com.resume.backend.ai.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AtsAiFeedbackServiceImpl implements AtsAiFeedbackService {

    private static final Logger logger = LoggerFactory.getLogger(AtsAiFeedbackServiceImpl.class);
    private final AIService aiService;

    public AtsAiFeedbackServiceImpl(AIService aiService) {
        this.aiService = aiService;
    }

    @Override
    public AtsAiFeedbackDTO generateFeedback(AtsResultDTO atsResult, String jobDescription,
            Map<String, Object> resumeData) {
        try {
            String promptTemplate = loadPromptFromFile("ats_feedback_prompt.txt");

            boolean isEntryLevel = atsResult.isEntryLevel();

            // Collect sample experience bullets for the AI to reference
            String experienceBullets = buildBulletSamples(resumeData);
            String resumeSummary = extractSummary(resumeData);

            Map<String, String> vars = new HashMap<>();
            vars.put("atsScore", String.valueOf(atsResult.getAtsScore()));
            vars.put("atsVerdict", nvl(atsResult.getAtsVerdict(), "N/A"));
            vars.put("isEntryLevel", isEntryLevel ? "Yes" : "No");
            vars.put("keywordMatchPercentage", String.valueOf(atsResult.getKeywordMatchPercentage()));
            vars.put("impactScore", String.valueOf(atsResult.getImpactScore()));
            vars.put("readabilityScore", String.valueOf(atsResult.getReadabilityScore()));
            vars.put("strongSkills", listToStr(atsResult.getStrongSkills()));
            vars.put("missingCriticalSkills", listToStr(atsResult.getMissingCriticalSkills()));
            vars.put("missingCoreSkills", listToStr(atsResult.getMissingCoreSkills()));
            vars.put("weaknessFlags", listToStr(atsResult.getWeaknessFlags()));
            vars.put("tailoringTips", listToStr(atsResult.getTailoringTips()));
            vars.put("jobDescription", nvl(jobDescription, "No job description provided"));
            vars.put("resumeSummary", nvl(resumeSummary, "No summary available"));
            vars.put("experienceBullets", experienceBullets);

            String prompt = fillTemplate(promptTemplate, vars);
            String response = aiService.generateFeedback(prompt);
            logger.info("AI Feedback generated successfully (score={})", atsResult.getAtsScore());

            return parseEnhancedResponse(response, atsResult, jobDescription);

        } catch (AiServiceException e) {
            logger.error("AI service error: {}", e.getMessage());
            return buildFallback(atsResult, jobDescription);
        } catch (Exception e) {
            logger.error("Unexpected error generating AI feedback: {}", e.getMessage());
            return buildFallback(atsResult, jobDescription);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RESPONSE PARSING
    // ──────────────────────────────────────────────────────────────────────────

    private AtsAiFeedbackDTO parseEnhancedResponse(String response, AtsResultDTO atsResult, String jd) {
        AtsAiFeedbackDTO dto = new AtsAiFeedbackDTO();

        try {
            dto.setOverallSummary(extract(response, "OVERALL SUMMARY:"));
            dto.setExperienceFeedback(extract(response, "EXPERIENCE FEEDBACK:"));
            dto.setSkillsFeedback(extract(response, "SKILLS FEEDBACK:"));

            // Parse rewritten bullets section into a list
            String bulletsSection = extract(response, "REWRITTEN BULLETS:");
            dto.setRewrittenBullets(parseBulletList(bulletsSection));

            // Legacy field mappings for backward compatibility
            String improvements = extract(response, "TOP 3 IMPROVEMENTS:");
            dto.setImprovementSuggestions(
                    improvements.isEmpty() ? extract(response, "TOP 3 SKILL IMPROVEMENTS:") : improvements);

            String advice = extract(response, "PLACEMENT ADVICE:");
            dto.setKeywordAdvice(advice.isEmpty() ? extract(response, "SKILL PLACEMENT ADVICE:") : advice);

            // atsSummaryExplanation = overallSummary (legacy compat)
            dto.setAtsSummaryExplanation(dto.getOverallSummary().isEmpty()
                    ? extract(response, "SCORE ANALYSIS:")
                    : dto.getOverallSummary());

        } catch (Exception e) {
            logger.warn("Partial parsing failure — using raw response: {}", e.getMessage());
            dto.setAtsSummaryExplanation(response.length() > 300 ? response.substring(0, 300) + "..." : response);
            dto.setImprovementSuggestions("Please review the job requirements and add relevant technical skills.");
            dto.setKeywordAdvice("Add missing skills to the Skills and Projects sections.");
        }

        // Validate — if fields are empty, fall back gracefully
        if (isBlank(dto.getOverallSummary())) {
            return buildFallback(atsResult, jd);
        }
        return dto;
    }

    /**
     * Extract the content after a header up to the next all-caps header or end of
     * string.
     */
    private String extract(String text, String header) {
        int start = text.indexOf(header);
        if (start < 0)
            return "";
        start += header.length();
        // Find next section header (all-caps word + colon)
        int end = text.length();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                "\n[A-Z][A-Z ]+:", java.util.regex.Pattern.MULTILINE).matcher(text);
        while (m.find()) {
            if (m.start() > start) {
                end = m.start();
                break;
            }
        }
        return text.substring(start, end).strip()
                .replaceAll("^\\s*[\\-\\*]+\\s*", "").strip();
    }

    private List<String> parseBulletList(String section) {
        if (section == null || section.isBlank())
            return new ArrayList<>();
        return Arrays.stream(section.split("\\n"))
                .map(String::strip)
                .filter(l -> l.matches("^[1-9][\\.\\)].*") || l.startsWith("•") || l.startsWith("-"))
                .map(l -> l.replaceFirst("^[1-9][\\.\\)]\\s*", "").replaceFirst("^[•\\-]\\s*", ""))
                .filter(l -> !l.isBlank())
                .limit(3)
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PROFESSIONAL FALLBACK (no AI available)
    // ──────────────────────────────────────────────────────────────────────────

    private AtsAiFeedbackDTO buildFallback(AtsResultDTO r, String jd) {
        AtsAiFeedbackDTO dto = new AtsAiFeedbackDTO();
        int score = r.getAtsScore();

        // ── Overall summary ───────────────────────────────────────────────────
        String overall;
        if (score >= 80) {
            overall = "Your resume shows strong alignment with the job requirements, scoring " + score + "/100. " +
                    "You have excellent coverage of the key technical skills. A few targeted additions will make your profile outstanding.";
        } else if (score >= 65) {
            overall = "Your resume scores " + score + "/100 and demonstrates solid technical foundations. " +
                    "Closing the identified skill gaps and adding quantifiable achievements will significantly strengthen your application.";
        } else {
            overall = "Your resume scores " + score
                    + "/100. There are opportunities to better align your skills and experiences with the job requirements. "
                    +
                    "Focus on adding the critical missing skills and quantifying your technical achievements.";
        }
        dto.setOverallSummary(overall);
        dto.setAtsSummaryExplanation(overall);

        // ── Experience feedback ───────────────────────────────────────────────
        String expFeedback;
        if (r.getImpactScore() >= 10) {
            expFeedback = "Your experience bullets demonstrate good use of quantifiable metrics. " +
                    "Continue highlighting numbers, percentages, and concrete outcomes in every bullet.";
        } else if (r.getImpactScore() >= 5) {
            expFeedback = "Some experience bullets include metrics, but there is room to improve. " +
                    "Aim to quantify at least 60% of your bullets with numbers, percentages, or scale indicators.";
        } else {
            expFeedback = "Most experience bullets lack quantifiable impact. " +
                    "Transform vague descriptions like 'worked on APIs' into 'Built and deployed 5 REST APIs reducing latency by 30%.'";
        }
        dto.setExperienceFeedback(expFeedback);

        // ── Skills feedback ───────────────────────────────────────────────────
        StringBuilder sfb = new StringBuilder();
        if (r.getStrongSkills() != null && !r.getStrongSkills().isEmpty()) {
            sfb.append("Strong skills matched: ").append(String.join(", ", r.getStrongSkills())).append(". ");
        }
        if (r.getMissingCriticalSkills() != null && !r.getMissingCriticalSkills().isEmpty()) {
            sfb.append("Critical skills to add: ").append(String.join(", ", r.getMissingCriticalSkills()))
                    .append(" — these are explicitly required in the job description.");
        }
        dto.setSkillsFeedback(sfb.length() > 0 ? sfb.toString()
                : "Review the job description and align your skills section accordingly.");

        // ── Rewritten bullets ─────────────────────────────────────────────────
        dto.setRewrittenBullets(List.of(
                "Original: 'Worked on backend APIs' → Improved: 'Designed and deployed 8 RESTful APIs using Spring Boot, serving 50,000+ daily requests with 99.9% uptime'",
                "Original: 'Helped with database optimization' → Improved: 'Optimized 15 slow PostgreSQL queries, reducing p95 response time from 2.3s to 340ms'"));

        // ── Improvements ─────────────────────────────────────────────────────
        StringBuilder imp = new StringBuilder();
        if (r.getMissingCriticalSkills() != null && !r.getMissingCriticalSkills().isEmpty()) {
            imp.append("1. Add missing critical skills to your Skills section: ")
                    .append(String.join(", ", r.getMissingCriticalSkills())).append(".\n");
        } else {
            imp.append("1. Showcase your strongest skills with specific project examples.\n");
        }
        imp.append("2. Quantify achievements: add numbers, percentages, or scale to every experience bullet.\n");
        imp.append("3. Tailor your professional summary to specifically mention the target role and required skills.");
        dto.setImprovementSuggestions(imp.toString());

        // ── Placement advice ──────────────────────────────────────────────────
        dto.setKeywordAdvice("Add critical skills to your Skills section header for ATS parsing. " +
                "Weave important technologies naturally into your experience bullet descriptions. " +
                "For entry-level roles, demonstrate skills through project descriptions with technology stacks.");

        return dto;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    private String extractSummary(Map<String, Object> resumeData) {
        if (resumeData == null)
            return "No summary available";
        Object summary = resumeData.get("summary");
        if (summary instanceof String && !((String) summary).isBlank()) {
            String txt = (String) summary;
            return txt.length() > 300 ? txt.substring(0, 300) + "..." : txt;
        }
        return "No summary available";
    }

    private String buildBulletSamples(Map<String, Object> resumeData) {
        if (resumeData == null)
            return "[ No experience bullets found ]";

        List<String> bullets = new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> exp = (List<Map<String, Object>>) resumeData.get("experience");
        if (exp != null) {
            for (Map<String, Object> e : exp) {
                String d = e.get("description") != null ? String.valueOf(e.get("description")) : "";
                String r = e.get("responsibility") != null ? String.valueOf(e.get("responsibility")) : "";
                splitAndAdd(d, bullets);
                splitAndAdd(r, bullets);
            }
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> projs = (List<Map<String, Object>>) resumeData.get("projects");
        if (projs != null) {
            for (Map<String, Object> p : projs) {
                String desc = p.get("description") != null ? String.valueOf(p.get("description")) : "";
                splitAndAdd(desc, bullets);
            }
        }

        if (bullets.isEmpty()) {
            return "[ No experience or project bullets found securely in resume text ]";
        }

        // Return up to 5 sample bullets for AI to rewrite
        return bullets.stream()
                .limit(5)
                .map(b -> "- " + b)
                .collect(Collectors.joining("\n"));
    }

    private void splitAndAdd(String text, List<String> out) {
        if (text == null || text.isBlank())
            return;
        String[] parts = text.split("[.\\n•\\-]");
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.length() > 10)
                out.add(trimmed);
        }
    }

    private String listToStr(List<String> list) {
        if (list == null || list.isEmpty())
            return "None identified";
        return String.join(", ", list);
    }

    private String nvl(String s, String def) {
        return (s == null || s.isBlank()) ? def : s;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String fillTemplate(String template, Map<String, String> vars) {
        String result = template;
        for (Map.Entry<String, String> e : vars.entrySet()) {
            result = result.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return result;
    }

    private String loadPromptFromFile(String filename) throws IOException {
        ClassPathResource resource = new ClassPathResource(filename);
        java.nio.file.Path path = resource.getFile().toPath();
        return java.nio.file.Files.readString(path);
    }

    /** Detect if entry-level from JD (used in fallback only). */
    private boolean detectEntryLevelRole(String jd) {
        if (jd == null)
            return false;
        String lower = jd.toLowerCase();
        return lower.contains("entry level") || lower.contains("junior") ||
                lower.contains("graduate") || lower.contains("fresher") ||
                lower.contains("intern") || lower.contains("0-3 years");
    }
}