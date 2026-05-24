package com.resume.backend.ats;

import com.resume.backend.ai.MockAIService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AtsAnalyzerServiceImplTest {

        private AtsAnalyzerServiceImpl atsAnalyzerService;

        @BeforeEach
        void setUp() {
                atsAnalyzerService = new AtsAnalyzerServiceImpl(new MockAIService());
        }

        // ── Test 1: Full resume + keyword-rich JD ─────────────────────────────────
        @Test
        void testAnalyzeResume_WithCompleteResume() {
                Map<String, Object> resumeData = createSampleResumeData();
                String jd = "We are looking for a Java developer with Spring Boot experience and React skills. " +
                                "The candidate must have experience with microservices and REST APIs. " +
                                "Required: Docker and PostgreSQL knowledge.";

                AtsResultDTO result = atsAnalyzerService.analyzeResume(resumeData, jd);

                assertNotNull(result);
                assertTrue(result.getAtsScore() > 0, "Score should be > 0 for a matching resume");
                assertTrue(result.getAtsScore() <= 100, "Score should not exceed 100");
                assertNotNull(result.getMatchedKeywords());
                assertNotNull(result.getMissingKeywords());
                assertNotNull(result.getWarnings());
                assertTrue(result.getKeywordMatchPercentage() >= 0);
                assertTrue(result.getKeywordMatchPercentage() <= 100);

                // 6-dimensional fields
                assertNotNull(result.getSectionScores(), "sectionScores must not be null");
                assertFalse(result.getSectionScores().isEmpty(), "sectionScores must contain dimension scores");
                assertTrue(result.getSectionScores().containsKey("keywordMatch"), "Must have keywordMatch dimension");
                assertTrue(result.getSectionScores().containsKey("impactScore"), "Must have impactScore dimension");
                assertTrue(result.getSectionScores().containsKey("readability"), "Must have readability dimension");
                assertNotNull(result.getAtsVerdict(), "Verdict must be set");
                assertNotNull(result.getVerdictExplanation(), "Verdict explanation must be set");
                assertNotNull(result.getCategorizedMissingSkills(), "Categorized missing skills must not be null");
        }

        // ── Test 2: Empty JD ──────────────────────────────────────────────────────
        @Test
        void testAnalyzeResume_WithEmptyJobDescription() {
                Map<String, Object> resumeData = createSampleResumeData();
                String jd = "";

                AtsResultDTO result = atsAnalyzerService.analyzeResume(resumeData, jd);

                assertNotNull(result);
                // Empty JD → no required skills → 100% (all zero requirements satisfied)
                assertEquals(100.0, result.getKeywordMatchPercentage(),
                                "Empty JD → 100% match (no requirements = all requirements satisfied)");
                assertTrue(result.getMatchedKeywords().isEmpty(), "No JD keywords → no skill keywords matched");
                assertTrue(result.getMissingKeywords().isEmpty(), "No JD keywords → nothing can be missing");
                assertTrue(result.getAtsScore() >= 0, "Score must be >= 0");
                assertTrue(result.getAtsScore() <= 100, "Score must be <= 100");
        }

        // ── Test 3: Incomplete resume ─────────────────────────────────────────────
        @Test
        void testAnalyzeResume_WithIncompleteResume() {
                Map<String, Object> resumeData = new HashMap<>();
                resumeData.put("personalInformation", Map.of("fullName", "John Doe"));

                String jd = "Java developer required with Spring Boot experience. " +
                                "Candidate must have PostgreSQL, Docker, and Kubernetes skills.";

                AtsResultDTO result = atsAnalyzerService.analyzeResume(resumeData, jd);

                assertNotNull(result);
                assertTrue(result.getAtsScore() < 60,
                                "Incomplete resume against keyword-heavy JD should score < 60, got: "
                                                + result.getAtsScore());
                assertFalse(result.getWarnings().isEmpty(), "Should have warnings for missing sections");
        }

        // ── Test 4: Quantified bullets score higher ───────────────────────────────
        @Test
        void testImpactScoring_QuantifiedBulletScoresHigher() {
                Map<String, Object> withMetrics = createSampleResumeDataWithQuantifiedBullets();
                Map<String, Object> withoutMetrics = createSampleResumeData();

                String jd = "Java developer with Spring Boot and REST API experience.";

                AtsResultDTO metricsResult = atsAnalyzerService.analyzeResume(withMetrics, jd);
                AtsResultDTO noMetricsResult = atsAnalyzerService.analyzeResume(withoutMetrics, jd);

                assertTrue(metricsResult.getImpactScore() >= noMetricsResult.getImpactScore(),
                                "Quantified bullets should produce >= impact score");
                assertTrue(metricsResult.getQuantifiedBullets() > 0,
                                "Quantified resume should have > 0 quantified bullets");
        }

        // ── Test 5: CRITICAL severity detection ──────────────────────────────────
        @Test
        void testMissingSkillSeverity_CriticalDetected() {
                Map<String, Object> bareResume = new HashMap<>();
                bareResume.put("personalInformation", Map.of("fullName", "Jane Doe"));
                bareResume.put("summary", "I am a software developer.");

                String jd = "We require Docker for containerisation. Docker is required and mandatory.\n" +
                                "Python experience is also required.\n" +
                                "Nice to have: Terraform knowledge.";

                AtsResultDTO result = atsAnalyzerService.analyzeResume(bareResume, jd);

                assertNotNull(result.getCategorizedMissingSkills());
                long criticalCount = result.getCategorizedMissingSkills().stream()
                                .filter(ms -> "CRITICAL".equals(ms.getSeverity())).count();
                assertTrue(criticalCount > 0, "Should detect at least one CRITICAL missing skill");
        }

        // ── Test 6: All 6 dimension scores populated ──────────────────────────────
        @Test
        void testSectionScores_AllDimensionsPopulated() {
                Map<String, Object> resumeData = createSampleResumeData();
                String jd = "Java Spring Boot developer with React, Docker and REST APIs.";

                AtsResultDTO result = atsAnalyzerService.analyzeResume(resumeData, jd);

                Map<String, Integer> scores = result.getSectionScores();
                assertNotNull(scores);
                List.of("keywordMatch", "sectionQuality", "impactScore", "experienceAlignment", "readability",
                                "summaryQuality")
                                .forEach(key -> assertTrue(scores.containsKey(key), "Missing dimension: " + key));
                scores.values().forEach(v -> assertTrue(v >= 0, "Score dimension should be >= 0"));
        }

        // ── Helpers ───────────────────────────────────────────────────────────────

        private Map<String, Object> createSampleResumeData() {
                Map<String, Object> data = new HashMap<>();
                data.put("personalInformation", Map.of("fullName", "John Doe", "email", "john@example.com"));
                data.put("summary",
                                "Experienced Java developer with 5 years of experience building enterprise " +
                                                "applications using Spring Boot and microservices. Proficient in React and REST APIs.");
                data.put("skills", Arrays.asList(
                                Map.of("title", "Java"),
                                Map.of("title", "Spring Boot"),
                                Map.of("title", "React"),
                                Map.of("title", "REST APIs"),
                                Map.of("title", "Microservices"),
                                Map.of("title", "PostgreSQL")));
                data.put("experience", Arrays.asList(
                                Map.of("jobTitle", "Senior Java Developer", "company", "Tech Corp",
                                                "startDate", "2020", "endDate", "Present",
                                                "description",
                                                "Managed microservices using Spring Boot. Implemented REST APIs for business modules."),
                                Map.of("jobTitle", "Java Developer", "company", "Software Inc",
                                                "startDate", "2018", "endDate", "2020",
                                                "description",
                                                "Built web applications using Java and React. Database optimisation and API development.")));
                data.put("education", Arrays.asList(
                                Map.of("degree", "Bachelor of Computer Science", "institution",
                                                "University of Technology",
                                                "startDate", "2014", "endDate", "2018")));
                data.put("projects", Arrays.asList(
                                Map.of("title", "E-commerce Platform",
                                                "description",
                                                "Built a full-stack e-commerce platform using Spring Boot and React.")));
                return data;
        }

        private Map<String, Object> createSampleResumeDataWithQuantifiedBullets() {
                Map<String, Object> data = createSampleResumeData();
                data.put("experience", Arrays.asList(
                                Map.of("jobTitle", "Senior Java Developer", "company", "Tech Corp",
                                                "startDate", "2019", "endDate", "Present",
                                                "description",
                                                "Reduced API latency by 40% by optimising Spring Boot microservices. " +
                                                                "Deployed 8 REST APIs serving 50,000 daily requests with 99.9% uptime. "
                                                                +
                                                                "Increased test coverage from 45% to 85%, reducing production bugs by 60%."),
                                Map.of("jobTitle", "Java Developer", "company", "Software Inc",
                                                "startDate", "2017", "endDate", "2019",
                                                "description",
                                                "Migrated 3 monolithic services to microservices, saving $30k/month. " +
                                                                "Built React dashboard used by 1,200 internal users.")));
                return data;
        }
}