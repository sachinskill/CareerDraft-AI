package com.resume.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.backend.model.Resume;
import com.resume.backend.model.ResumeVersion;
import com.resume.backend.repository.ResumeRepository;
import com.resume.backend.repository.ResumeVersionRepository;
import com.resume.backend.user.User;
import com.resume.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/resumes")
public class SaaSResumeController {

    private static final Logger logger = LoggerFactory.getLogger(SaaSResumeController.class);
    private static final int FREE_RESUME_LIMIT = 1;

    private final ResumeRepository resumeRepository;
    private final ResumeVersionRepository resumeVersionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public SaaSResumeController(ResumeRepository resumeRepository,
                               ResumeVersionRepository resumeVersionRepository,
                               UserRepository userRepository,
                               ObjectMapper objectMapper) {
        this.resumeRepository = resumeRepository;
        this.resumeVersionRepository = resumeVersionRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Get all resumes for current authenticated user.
     */
    @GetMapping
    public ResponseEntity<?> getMyResumes() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Authentication required."));
        }
        List<Resume> resumes = resumeRepository.findByUserIdAndSoftDeletedFalse(currentUser.getId());
        return ResponseEntity.ok(resumes);
    }

    /**
     * Get details of a single resume.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getResumeById(@PathVariable String id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Authentication required."));
        }
        Optional<Resume> optionalResume = resumeRepository.findByIdAndSoftDeletedFalse(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Resume not found."));
        }
        Resume resume = optionalResume.get();
        if (!resume.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Access denied."));
        }
        return ResponseEntity.ok(resume);
    }

    /**
     * Create a new resume. Enforces free tier limits (max 1 resume).
     */
    @PostMapping
    public ResponseEntity<?> createResume(@RequestBody Map<String, Object> payload) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Authentication required."));
        }

        // Limit Check for Free Users
        boolean isPro = currentUser.getIsPro() || "ROLE_PRO".equals(currentUser.getRole());
        long activeCount = resumeRepository.countByUserIdAndSoftDeletedFalse(currentUser.getId());
        if (!isPro && activeCount >= FREE_RESUME_LIMIT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(error("Free tier limit reached. Upgrade to Pro to create more resumes."));
        }

        try {
            Resume resume = new Resume();
            resume.setUser(currentUser);
            resume.setOriginalJson(payload.containsKey("originalJson") ? objectMapper.writeValueAsString(payload.get("originalJson")) : null);
            resume.setImprovedJson(payload.containsKey("improvedJson") ? objectMapper.writeValueAsString(payload.get("improvedJson")) : resume.getOriginalJson());
            resume.setCurrentStatus((String) payload.getOrDefault("currentStatus", "ORIGINAL"));
            resume.setSelectedTemplate((String) payload.get("selectedTemplate"));
            resume.setSelectedTheme((String) payload.get("selectedTheme"));
            resume.setSelectedFont((String) payload.get("selectedFont"));
            resume.setAtsScoreSnapshot((Integer) payload.get("atsScoreSnapshot"));
            resume.setSoftDeleted(false);

            resume = resumeRepository.save(resume);

            // Create initial version
            ResumeVersion version = new ResumeVersion();
            version.setResume(resume);
            version.setVersionNumber(1);
            version.setContentJson(resume.getOriginalJson() != null ? resume.getOriginalJson() : "{}");
            version.setTemplate(resume.getSelectedTemplate());
            version.setTheme(resume.getSelectedTheme());
            version.setFont(resume.getSelectedFont());
            version.setAtsScoreSnapshot(resume.getAtsScoreSnapshot());
            version.setDescription("Initial version");

            resumeVersionRepository.save(version);
            logger.info("Created resume {} and version 1 for user {}", resume.getId(), currentUser.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(resume);
        } catch (Exception e) {
            logger.error("Failed to create resume: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Failed to save resume."));
        }
    }

    /**
     * Update an existing resume and automatically push a new version to history.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateResume(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Authentication required."));
        }

        Optional<Resume> optionalResume = resumeRepository.findByIdAndSoftDeletedFalse(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Resume not found."));
        }

        Resume resume = optionalResume.get();
        if (!resume.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Access denied."));
        }

        try {
            if (payload.containsKey("originalJson")) {
                resume.setOriginalJson(objectMapper.writeValueAsString(payload.get("originalJson")));
            }
            if (payload.containsKey("improvedJson")) {
                resume.setImprovedJson(objectMapper.writeValueAsString(payload.get("improvedJson")));
            }
            if (payload.containsKey("currentStatus")) {
                resume.setCurrentStatus((String) payload.get("currentStatus"));
            }
            if (payload.containsKey("selectedTemplate")) {
                resume.setSelectedTemplate((String) payload.get("selectedTemplate"));
            }
            if (payload.containsKey("selectedTheme")) {
                resume.setSelectedTheme((String) payload.get("selectedTheme"));
            }
            if (payload.containsKey("selectedFont")) {
                resume.setSelectedFont((String) payload.get("selectedFont"));
            }
            if (payload.containsKey("atsScoreSnapshot")) {
                resume.setAtsScoreSnapshot((Integer) payload.get("atsScoreSnapshot"));
            }

            resume = resumeRepository.save(resume);

            // Compute next version number
            List<ResumeVersion> versions = resumeVersionRepository.findByResumeIdOrderByVersionNumberDesc(id);
            int nextVersionNum = versions.isEmpty() ? 1 : versions.get(0).getVersionNumber() + 1;

            // Create new version snapshot
            ResumeVersion version = new ResumeVersion();
            version.setResume(resume);
            version.setVersionNumber(nextVersionNum);
            // Snapshot current status JSON
            String activeContent = "ORIGINAL".equalsIgnoreCase(resume.getCurrentStatus()) ? resume.getOriginalJson() : resume.getImprovedJson();
            version.setContentJson(activeContent != null ? activeContent : "{}");
            version.setTemplate(resume.getSelectedTemplate());
            version.setTheme(resume.getSelectedTheme());
            version.setFont(resume.getSelectedFont());
            version.setAtsScoreSnapshot(resume.getAtsScoreSnapshot());
            version.setDescription((String) payload.getOrDefault("versionDescription", "Auto-saved update"));

            resumeVersionRepository.save(version);
            logger.info("Updated resume {} to version {} for user {}", id, nextVersionNum, currentUser.getEmail());

            return ResponseEntity.ok(resume);
        } catch (Exception e) {
            logger.error("Failed to update resume {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Failed to update resume."));
        }
    }

    /**
     * Soft delete a resume.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(@PathVariable String id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Authentication required."));
        }

        Optional<Resume> optionalResume = resumeRepository.findByIdAndSoftDeletedFalse(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Resume not found."));
        }

        Resume resume = optionalResume.get();
        if (!resume.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Access denied."));
        }

        resume.setSoftDeleted(true);
        resumeRepository.save(resume);
        logger.info("Soft deleted resume {} for user {}", id, currentUser.getEmail());

        return ResponseEntity.ok(Map.of("message", "Resume successfully deleted."));
    }

    /**
     * Get all version snapshots for a resume.
     */
    @GetMapping("/{id}/versions")
    public ResponseEntity<?> getResumeVersions(@PathVariable String id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Authentication required."));
        }

        Optional<Resume> optionalResume = resumeRepository.findByIdAndSoftDeletedFalse(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Resume not found."));
        }

        Resume resume = optionalResume.get();
        if (!resume.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Access denied."));
        }

        List<ResumeVersion> versions = resumeVersionRepository.findByResumeIdOrderByVersionNumberDesc(id);
        return ResponseEntity.ok(versions);
    }

    /**
     * Rollback a resume to a specific historical version snapshot.
     */
    @PostMapping("/{id}/rollback/{versionId}")
    public ResponseEntity<?> rollbackResume(@PathVariable String id, @PathVariable String versionId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Authentication required."));
        }

        Optional<Resume> optionalResume = resumeRepository.findByIdAndSoftDeletedFalse(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Resume not found."));
        }

        Resume resume = optionalResume.get();
        if (!resume.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Access denied."));
        }

        Optional<ResumeVersion> optionalVersion = resumeVersionRepository.findById(versionId);
        if (optionalVersion.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Version snapshot not found."));
        }

        ResumeVersion version = optionalVersion.get();
        if (!version.getResume().getId().equals(resume.getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("Version does not belong to this resume."));
        }

        try {
            // Restore snapshot
            resume.setOriginalJson(version.getContentJson());
            resume.setImprovedJson(version.getContentJson());
            resume.setCurrentStatus("ORIGINAL");
            resume.setSelectedTemplate(version.getTemplate());
            resume.setSelectedTheme(version.getTheme());
            resume.setSelectedFont(version.getFont());
            resume.setAtsScoreSnapshot(version.getAtsScoreSnapshot());

            resume = resumeRepository.save(resume);

            // Add rollback action itself as a new version history entry
            List<ResumeVersion> versions = resumeVersionRepository.findByResumeIdOrderByVersionNumberDesc(id);
            int nextVersionNum = versions.isEmpty() ? 1 : versions.get(0).getVersionNumber() + 1;

            ResumeVersion rollbackVersion = new ResumeVersion();
            rollbackVersion.setResume(resume);
            rollbackVersion.setVersionNumber(nextVersionNum);
            rollbackVersion.setContentJson(resume.getOriginalJson());
            rollbackVersion.setTemplate(resume.getSelectedTemplate());
            rollbackVersion.setTheme(resume.getSelectedTheme());
            rollbackVersion.setFont(resume.getSelectedFont());
            rollbackVersion.setAtsScoreSnapshot(resume.getAtsScoreSnapshot());
            rollbackVersion.setDescription("Rollback to version " + version.getVersionNumber());

            resumeVersionRepository.save(rollbackVersion);
            logger.info("Rolled back resume {} to version {} and saved snapshot as version {}", id, version.getVersionNumber(), nextVersionNum);

            return ResponseEntity.ok(resume);
        } catch (Exception e) {
            logger.error("Failed to rollback resume {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Failed to perform rollback."));
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || "anonymousUser".equals(auth.getPrincipal())) return null;
        return auth.getPrincipal() instanceof User u ? u : null;
    }

    private Map<String, String> error(String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        body.put("timestamp", Instant.now().toString());
        return body;
    }
}
