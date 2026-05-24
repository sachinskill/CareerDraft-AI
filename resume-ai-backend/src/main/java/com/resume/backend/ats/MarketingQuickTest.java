package com.resume.backend.ats;

import com.resume.backend.ai.MockAIService;
import java.util.*;

public class MarketingQuickTest {
    public static void main(String[] args) {
        AtsAnalyzerServiceImpl atsAnalyzer = new AtsAnalyzerServiceImpl(new MockAIService());

        String jd = "We are seeking a highly skilled Digital Marketing Manager. Required skills include SEO, Content Strategy, and Google Analytics. Must have experience with Social Media campaigns and Email Marketing.";

        Map<String, Object> resumeData = new HashMap<>();
        Map<String, Object> personalInfo = new HashMap<>();
        personalInfo.put("name", "Jane Marketer");
        resumeData.put("basics", personalInfo);

        List<Map<String, Object>> skills = Arrays.asList(
                Map.of("name", "SEO, Content Strategy, Google Analytics, Copywriting, Social Media"));
        resumeData.put("skills", skills);

        List<Map<String, Object>> experience = Arrays.asList(
                Map.of(
                        "description",
                        "Led successful SEO and Social Media campaigns increasing traffic by 40%."));
        resumeData.put("experience", experience);

        try {
            AtsResultDTO result = atsAnalyzer.analyzeResume(resumeData, jd);
            System.out.println("ATS Score: " + result.getAtsScore() + "/100");
            System.out.println("Keyword Match Percentage: " + result.getKeywordMatchPercentage() + "%");
            System.out.println("Matched Keywords: " + result.getMatchedKeywords());
            System.out.println("Missing Keywords: " + result.getMissingKeywords());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
