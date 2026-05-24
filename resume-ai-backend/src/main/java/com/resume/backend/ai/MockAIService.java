package com.resume.backend.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.ArrayList;

/**
 * Mock AI Service for development and testing without consuming API tokens.
 * Returns static sample responses.
 * 
 * Note: This class is instantiated as a bean in AIConfiguration, not
 * via @Service
 */
public class MockAIService implements AIService {

  private static final Logger logger = LoggerFactory.getLogger(MockAIService.class);

  @Override
  public String generateResume(String prompt) {
    logger.info("MockAIService: Generating resume (mock mode)");
    return """
        {
          "personalInformation": {
            "fullName": "John Doe",
            "email": "john.doe@example.com",
            "phoneNumber": "+1 (555) 123-4567",
            "location": "San Francisco, CA",
            "linkedIn": "https://linkedin.com/in/johndoe",
            "gitHub": "https://github.com/johndoe",
            "portfolio": null
          },
          "summary": "Experienced software developer with 5 years in full-stack development, specializing in Java and React.",
          "skills": [
            {"title": "Java", "level": "Advanced"},
            {"title": "Spring Boot", "level": "Advanced"},
            {"title": "React", "level": "Intermediate"},
            {"title": "PostgreSQL", "level": "Intermediate"},
            {"title": "Docker", "level": "Intermediate"}
          ],
          "experience": [
            {
              "jobTitle": "Senior Software Engineer",
              "company": "Tech Corp",
              "location": "San Francisco, CA",
              "duration": "2021 - Present",
              "responsibility": "Led development of microservices architecture serving 1M+ users"
            },
            {
              "jobTitle": "Software Engineer",
              "company": "StartupXYZ",
              "location": "Remote",
              "duration": "2019 - 2021",
              "responsibility": "Developed RESTful APIs and React frontend components"
            }
          ],
          "education": [
            {
              "degree": "Bachelor of Science in Computer Science",
              "university": "University of California",
              "location": "Berkeley, CA",
              "graduationYear": "2019"
            }
          ],
          "certifications": [],
          "projects": [],
          "languages": [{"name": "English"}],
          "interests": [{"name": "Open Source"}]
        }
        """;
  }

  @Override
  public String enhanceResume(String prompt) {
    logger.info("MockAIService: Enhancing resume (mock mode)");
    // Return the same structure but with "enhanced" flag
    return generateResume(prompt);
  }

  @Override
  public String analyzeStructure(String prompt) {
    logger.info("MockAIService: Analyzing structure (mock mode)");
    return generateResume(prompt);
  }

  @Override
  public String generateFeedback(String prompt) {
    logger.info("MockAIService: Generating feedback (mock mode)");
    return """
        SCORE ANALYSIS:
        Your resume demonstrates strong technical alignment with the job requirements and showcases relevant experience.

        TOP 3 SKILL IMPROVEMENTS:
        1. Add Docker containerization experience in your projects section
        2. Highlight Kubernetes orchestration skills if you have experience
        3. Mention CI/CD pipeline implementation in your work experience

        SKILL PLACEMENT ADVICE:
        Consider adding these skills to your technical skills section and providing specific examples of their usage in your project descriptions.
        """;
  }

  @Override
  public String extractKeywords(String prompt) {
    logger.info("MockAIService: Extracting keywords (mock mode)");
    String lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.contains("marketing") || lowerPrompt.contains("seo")) {
      return "SEO, Content Strategy, Google Analytics, Social Media, Email Marketing, Data Analysis";
    }

    // Check if this is the Pass 2 semantic skill checking call
    if (lowerPrompt.contains("compare skills against a resume") && lowerPrompt.contains("resume text:")) {
      int idx = lowerPrompt.indexOf("resume text:");
      String resumeText = lowerPrompt.substring(idx + "resume text:".length()).trim();

      // Extract the required skills list from prompt
      String requiredSkillsSection = "";
      if (lowerPrompt.contains("required skills to check:")) {
        int reqIdx = lowerPrompt.indexOf("required skills to check:");
        int endReqIdx = lowerPrompt.indexOf("resume text:");
        if (reqIdx < endReqIdx) {
          requiredSkillsSection = lowerPrompt.substring(reqIdx + "required skills to check:".length(), endReqIdx).trim();
        }
      }

      if (!requiredSkillsSection.isEmpty()) {
        String[] skillsToCheck = requiredSkillsSection.split(",");
        List<String> matched = new ArrayList<>();
        for (String skill : skillsToCheck) {
          String trimmedSkill = skill.trim();
          if (!trimmedSkill.isEmpty() && resumeText.contains(trimmedSkill)) {
            matched.add(trimmedSkill);
          }
        }
        if (matched.isEmpty()) {
          return "NONE";
        }
        return String.join(", ", matched);
      }
      return "NONE";
    }

    return "Java, Python, C++, SQL, Git, Linux, Docker, AWS, Agile, Machine Learning, Problem Solving, Communication";
  }
}
