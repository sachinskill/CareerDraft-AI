package com.resume.backend.user;

import org.springframework.stereotype.Service;

@Service
public class PremiumAccessService {

    private static final int FREE_RESUME_LIMIT = 2; // Up to 2 resumes allowed
    private static final int FREE_SCAN_LIMIT = 2;

    /**
     * Checks if the user has Pro status.
     * Checks both isPro flag and ROLE_PRO authority for redundancy.
     */
    public boolean isPro(User user) {
        return user != null && (Boolean.TRUE.equals(user.getIsPro()) || "ROLE_PRO".equals(user.getRole()));
    }

    /**
     * Checks if user can create another resume draft.
     */
    public boolean canCreateResume(User user, int currentActiveCount) {
        return isPro(user) || currentActiveCount < FREE_RESUME_LIMIT;
    }

    /**
     * Checks if user can execute an ATS scan.
     */
    public boolean canAnalyzeATS(User user) {
        return isPro(user) || user.getScanCount() < FREE_SCAN_LIMIT;
    }

    /**
     * Checks if user can use AI enhancements. (Pro only)
     */
    public boolean canUseAiEnhance(User user) {
        return isPro(user);
    }

    /**
     * Checks if user can export/download a PDF. (Unlimited for everyone)
     */
    public boolean canDownloadPdf(User user) {
        return true;
    }

    /**
     * Checks if user has permission to use resume draft version rollbacks. (Pro only)
     */
    public boolean canUseVersionRollback(User user) {
        return isPro(user);
    }

    /**
     * Checks if user can access the specified template layout.
     * Premium templates (executive, sidebar-modern, elegant) require PRO access.
     */
    public boolean canAccessTemplate(User user, String templateId) {
        if (isPro(user)) {
            return true;
        }
        if (templateId == null) {
            return true;
        }
        String id = templateId.toLowerCase();
        return !("executive".equals(id) || "sidebar-modern".equals(id) || "elegant".equals(id) || "premium_executive".equals(id));
    }
}
