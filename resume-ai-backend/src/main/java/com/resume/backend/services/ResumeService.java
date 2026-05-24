package com.resume.backend.services;

import java.io.IOException;
import java.util.Map;

import com.resume.backend.model.ATSReport;

public interface ResumeService {

   Map<String, Object> generateResumeResponse(String userResumeDescription) throws IOException;

   Map<String, Object> enhanceResumeResponse(Map<String, Object> resumeData, ATSReport latestReport) throws IOException;

   /** Improve a single bullet point. Returns the improved text as a plain string. */
   String generateBulletImprovement(String prompt) throws IOException;
}
