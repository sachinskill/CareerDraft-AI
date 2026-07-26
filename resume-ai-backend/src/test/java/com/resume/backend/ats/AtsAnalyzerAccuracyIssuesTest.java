package com.resume.backend.ats;

import com.resume.backend.ai.MockAIService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class AtsAnalyzerAccuracyIssuesTest {

    private AtsAnalyzerServiceImpl atsAnalyzerService;

    @BeforeEach
    void setUp() {
        atsAnalyzerService = new AtsAnalyzerServiceImpl(new MockAIService() {
            @Override
            public String extractKeywords(String prompt) {
                // Mock keyword extraction for the JD containing our synonym requirements
                if (prompt.contains("Extract ONLY specific hard skills")) {
                    return "gpu, s3, workflow automation tools";
                }
                return super.extractKeywords(prompt);
            }
        });
    }

    @Test
    void testSectionParsingAndBulletDetection() {
        // Flat text with sections and bullets
        String flatText = "John Doe\n\n" +
                "EXPERIENCE\n" +
                "• Deployed microservices serving 10,000+ users.\n" +
                "• Instructed 100,000+ students globally.\n\n" +
                "EDUCATION\n" +
                "• BS in Computer Science\n\n" +
                "PROJECTS\n" +
                "• Built Dataduct workflow tools.";

        Map<String, Object> resumeData = Map.of("summary", flatText);
        String jd = "Software developer with experience.";

        AtsResultDTO result = atsAnalyzerService.analyzeResume(resumeData, jd);

        // Assert Issue 1 & 3: Sections parsed, bullets detected, and metrics extracted
        assertTrue(result.getTotalBullets() > 0, "Bullets must be detected in flat text");
        assertTrue(result.getQuantifiedBullets() > 0, "Quantified bullets (like '100,000+') must be extracted");
        
        // Assert that sections are not flagged as missing in warnings
        boolean missingExp = result.getWarnings().stream().anyMatch(w -> w.toLowerCase().contains("experience"));
        boolean missingEdu = result.getWarnings().stream().anyMatch(w -> w.toLowerCase().contains("education"));
        boolean missingProj = result.getWarnings().stream().anyMatch(w -> w.toLowerCase().contains("projects"));
        
        assertFalse(missingExp, "Experience section should not be flagged as missing");
        assertFalse(missingEdu, "Education section should not be flagged as missing");
        assertFalse(missingProj, "Projects section should not be flagged as missing");
    }

    @Test
    void testOverlyRigidKeywordMatchingWithSynonyms() {
        // Resume lists synonyms: TPUs, AWS, Dataduct
        String flatText = "John Doe\n\n" +
                "EXPERIENCE\n" +
                "• Developed deep learning models on TPUs.\n" +
                "• Hosted storage buckets on AWS.\n" +
                "• Built pipeline using Dataduct.";

        Map<String, Object> resumeData = Map.of("summary", flatText);
        // JD requires: gpu, s3, workflow automation tools
        String jd = "We are seeking a developer with GPU, S3, and Workflow Automation Tools experience.";

        AtsResultDTO result = atsAnalyzerService.analyzeResume(resumeData, jd);

        // Assert Issue 2: Synonyms should map to core requirements
        assertTrue(result.getMatchedKeywords().stream().anyMatch(k -> k.equalsIgnoreCase("gpu")), "TPU in resume should match GPU requirement");
        assertTrue(result.getMatchedKeywords().stream().anyMatch(k -> k.equalsIgnoreCase("s3")), "AWS in resume should match S3 requirement");
        assertTrue(result.getMatchedKeywords().stream().anyMatch(k -> k.equalsIgnoreCase("workflow automation tools")), "Dataduct in resume should match Workflow Automation Tools requirement");
    }

    @Test
    void testScoringConsistency() {
        String flatText = "John Doe\n\n" +
                "EXPERIENCE\n" +
                "• Developed deep learning models on TPUs.\n" +
                "• Hosted storage buckets on AWS.\n" +
                "• Built pipeline using Dataduct.";

        Map<String, Object> resumeData = Map.of("summary", flatText);
        String jd = "We are seeking a developer with GPU, S3, and Workflow Automation Tools experience.";

        AtsResultDTO result = atsAnalyzerService.analyzeResume(resumeData, jd);

        // Assert Issue 4: High match percentage (e.g. 100% or 89% from synonyms) should not have a low overall score (like 53)
        double matchPct = result.getKeywordMatchPercentage();
        int overallScore = result.getAtsScore();

        if (matchPct >= 75.0) {
            assertTrue(overallScore >= 60, "Overall score (" + overallScore + ") must be aligned with high match percentage (" + matchPct + ")");
        }
    }
}
