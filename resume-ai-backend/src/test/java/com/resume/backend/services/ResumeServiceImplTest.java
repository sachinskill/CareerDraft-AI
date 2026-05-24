package com.resume.backend.services;

import com.resume.backend.ai.AIService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ResumeServiceImplTest {

    private ResumeServiceImpl resumeService;
    private AIService mockAiService;

    @BeforeEach
    public void setup() {
        mockAiService = Mockito.mock(AIService.class);
        resumeService = new ResumeServiceImpl(mockAiService);
    }

    @Test
    public void testEnforceDataIntegrity_PreventsHallucinations() {
        // 1. Setup Original (Factually correct) Data
        Map<String, Object> original = new HashMap<>();

        // Personal Info
        Map<String, Object> origPersonal = new HashMap<>();
        origPersonal.put("fullName", "John Doe");
        origPersonal.put("email", "john@example.com");
        original.put("personalInformation", origPersonal);

        // Experience
        List<Map<String, Object>> origExpList = new ArrayList<>();
        Map<String, Object> origExp = new HashMap<>();
        origExp.put("companyName", "Tech Corp");
        origExp.put("jobTitle", "Software Engineer");
        origExp.put("startDate", "2020-01");
        origExp.put("endDate", "2023-01");
        origExp.put("responsibilities", "Did some coding.");
        origExpList.add(origExp);
        original.put("experience", origExpList);

        // 2. Setup Enhanced (Hallucinated) Data from AI
        Map<String, Object> enhanced = new HashMap<>();

        // AI Hallucinated Personal Info
        Map<String, Object> enhPersonal = new HashMap<>();
        enhPersonal.put("fullName", "Johnny D."); // Hallucination!
        enhPersonal.put("email", "johnny@fake.com"); // Hallucination!
        enhanced.put("personalInformation", enhPersonal);

        // AI Hallucinated Experience
        List<Map<String, Object>> enhExpList = new ArrayList<>();
        Map<String, Object> enhExp = new HashMap<>();
        enhExp.put("companyName", "Google"); // Hallucination!
        enhExp.put("jobTitle", "Senior Principal Engineer"); // Hallucination!
        enhExp.put("startDate", "2015-01"); // Hallucination!
        enhExp.put("responsibilities", "Architected scalable microservices using Java and Spring Boot."); // Expected
                                                                                                          // Improvement
        enhExpList.add(enhExp);
        enhanced.put("experience", enhExpList);

        // 3. Run Self-Healing Utility
        resumeService.enforceDataIntegrity(original, enhanced);

        // 4. Verify Integrity (Hallucinations should be wiped, enhancements should be
        // kept)

        // Check Personal Info restored
        @SuppressWarnings("unchecked")
        Map<String, Object> resultPersonal = (Map<String, Object>) enhanced.get("personalInformation");
        assertEquals("John Doe", resultPersonal.get("fullName"), "Original name must be restored");
        assertEquals("john@example.com", resultPersonal.get("email"), "Original email must be restored");

        // Check Experience restored (Except responsibilities)
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> resultExpList = (List<Map<String, Object>>) enhanced.get("experience");
        Map<String, Object> resultExp = resultExpList.get(0);

        assertEquals("Tech Corp", resultExp.get("companyName"), "Original company must be restored");
        assertEquals("Software Engineer", resultExp.get("jobTitle"), "Original title must be restored");
        assertEquals("2020-01", resultExp.get("startDate"), "Original start date must be restored");

        // The ONLY thing that should be kept from the AI is the responsibility
        // improvement!
        assertEquals("Architected scalable microservices using Java and Spring Boot.",
                resultExp.get("responsibilities"), "Enhanced responsibilities must be kept");
    }
}
