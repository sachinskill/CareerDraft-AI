package com.resume.backend.admin;

import com.resume.backend.model.Resume;
import com.resume.backend.payment.Payment;
import com.resume.backend.repository.PaymentRepository;
import com.resume.backend.repository.ResumeRepository;
import com.resume.backend.user.PremiumAccessService;
import com.resume.backend.user.User;
import com.resume.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Admin Operations Controller — CareerDraft AI
 *
 * All endpoints are secured by ROLE_ADMIN at the SecurityConfig level.
 * This controller reuses existing repositories and services — no duplicate logic.
 *
 * Modules:
 *   Module 1 — Dashboard Overview  (GET /api/admin/overview)
 *   Module 2 — User Management     (GET /api/admin/users, POST /api/admin/users/{id}/grant-pro, etc.)
 *   Module 3 — Payment History     (GET /api/admin/payments)
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ResumeRepository resumeRepository;
    private final PremiumAccessService premiumAccessService;

    public AdminController(UserRepository userRepository,
                           PaymentRepository paymentRepository,
                           ResumeRepository resumeRepository,
                           PremiumAccessService premiumAccessService) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.resumeRepository = resumeRepository;
        this.premiumAccessService = premiumAccessService;
    }

    // ── Guard helper ──────────────────────────────────────────────────────────

    /**
     * Extra runtime guard — returns 403 if the caller is not ROLE_ADMIN.
     * SecurityConfig already blocks non-admins at the filter level,
     * but this provides defence-in-depth in case config is accidentally relaxed.
     */
    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Access denied. Admin only."));
    }

    // =========================================================================
    // MODULE 1 — DASHBOARD OVERVIEW
    // =========================================================================

    /**
     * GET /api/admin/overview
     *
     * Returns aggregate counts using existing JPA methods.
     * SQL translated by Spring Data:
     *   SELECT COUNT(*) FROM users WHERE soft_deleted = false
     *   SELECT COUNT(*) FROM users WHERE role = 'ROLE_PRO' AND soft_deleted = false
     *   SELECT COUNT(*) FROM users WHERE created_at >= today AND soft_deleted = false
     *   SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'SUCCESS'
     *
     * Free users are DERIVED as: total - pro.
     * We do NOT query free users directly because the dual is_pro/role fields
     * can become inconsistent (e.g. is_pro=false but role=ROLE_PRO), which would
     * cause the three stats to not add up. Deriving from total - pro ensures
     * the numbers are always consistent regardless of data inconsistency.
     */
    @GetMapping("/overview")
    public ResponseEntity<?> getOverview() {
        if (!isAdmin()) return forbidden();

        long totalUsers = userRepository.countBySoftDeletedFalse();
        long proUsers   = userRepository.countByIsProAndSoftDeletedFalse(true);
        // Derived — avoids inconsistency from the dual is_pro/role fields.
        // Total and Pro are the source of truth; Free is always consistent with them.
        long freeUsers  = totalUsers - proUsers;

        long todayRegistrations = userRepository.countRegisteredToday(
                LocalDate.now().atStartOfDay()
        );
        double totalRevenue = paymentRepository.sumSuccessfulPayments();

        Map<String, Object> overview = new HashMap<>();
        overview.put("totalUsers", totalUsers);
        overview.put("proUsers", proUsers);
        overview.put("freeUsers", freeUsers);
        overview.put("todayRegistrations", todayRegistrations);
        overview.put("totalRevenue", totalRevenue);

        logger.info("Admin overview requested by: {}", currentAdminEmail());
        return ResponseEntity.ok(overview);
    }

    // =========================================================================
    // MODULE 2 — USER MANAGEMENT
    // =========================================================================

    /**
     * GET /api/admin/users?search=&page=0&size=20
     *
     * Returns paginated users with resume count and ATS scan count.
     * Search matches on email (case-insensitive LIKE).
     */
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (!isAdmin()) return forbidden();
        if (size > 100) size = 100; // cap page size

        Page<User> userPage;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (search == null || search.trim().isEmpty()) {
            userPage = userRepository.findBySoftDeletedFalse(pageRequest);
        } else {
            userPage = userRepository.findBySoftDeletedFalseAndEmailContainingIgnoreCase(
                    search.trim(), pageRequest);
        }

        List<Map<String, Object>> rows = userPage.getContent().stream().map(u -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", u.getId());
            row.put("email", u.getEmail());
            row.put("role", u.getRole());
            row.put("isPro", premiumAccessService.isPro(u));
            row.put("enabled", u.getEnabled());
            row.put("scanCount", u.getScanCount());
            row.put("enhanceCount", u.getEnhanceCount());
            row.put("createdAt", u.getCreatedAt());
            // resume count — reuses existing repository method
            row.put("resumeCount", resumeRepository.countByUserIdAndSoftDeletedFalse(u.getId()));
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("users", rows);
        response.put("totalElements", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());
        response.put("currentPage", userPage.getNumber());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/users/{id}
     * Returns full detail for a single user.
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserDetail(@PathVariable Long id) {
        if (!isAdmin()) return forbidden();

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }
        User u = opt.get();

        Map<String, Object> detail = new HashMap<>();
        detail.put("id", u.getId());
        detail.put("email", u.getEmail());
        detail.put("role", u.getRole());
        detail.put("isPro", premiumAccessService.isPro(u));
        detail.put("enabled", u.getEnabled());
        detail.put("scanCount", u.getScanCount());
        detail.put("enhanceCount", u.getEnhanceCount());
        detail.put("exportCount", u.getExportCount());
        detail.put("createdAt", u.getCreatedAt());
        detail.put("updatedAt", u.getUpdatedAt());
        detail.put("resumeCount", resumeRepository.countByUserIdAndSoftDeletedFalse(u.getId()));

        return ResponseEntity.ok(detail);
    }

    /**
     * POST /api/admin/users/{id}/grant-pro
     * Sets isPro = true and role = ROLE_PRO.
     *
     * TODO (Future Refactor): The system currently uses two fields to represent premium status:
     *   - is_pro (boolean column)
     *   - role = 'ROLE_PRO' (varchar column)
     * Both must be updated together for correct behaviour (PremiumAccessService checks either).
     * After launch, refactor to a single source of truth: is_pro only.
     * role should only carry ROLE_FREE / ROLE_ADMIN — not premium state.
     * ROLE_PRO should be removed from the role column entirely.
     */
    @PostMapping("/users/{id}/grant-pro")
    public ResponseEntity<?> grantPro(@PathVariable Long id) {
        if (!isAdmin()) return forbidden();

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }
        User user = opt.get();
        user.setIsPro(true);
        // Preserve user's existing role (Admin, User, Free, etc.)
        userRepository.save(user);

        logger.info("Admin {} granted Pro to user {}", currentAdminEmail(), user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Pro access granted.", "email", user.getEmail()));
    }

    /**
     * POST /api/admin/users/{id}/revoke-pro
     * Sets isPro = false and role = ROLE_FREE.
     * See grant-pro for the TODO on the dual-field technical debt.
     */
    @PostMapping("/users/{id}/revoke-pro")
    public ResponseEntity<?> revokePro(@PathVariable Long id) {
        if (!isAdmin()) return forbidden();

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }
        User user = opt.get();
        user.setIsPro(false);
        // Only reset the role if it was specifically 'ROLE_PRO' to preserve ROLE_ADMIN / ROLE_FREE / etc.
        if ("ROLE_PRO".equals(user.getRole())) {
            user.setRole("ROLE_FREE");
        }
        userRepository.save(user);

        logger.info("Admin {} revoked Pro from user {}", currentAdminEmail(), user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Pro access revoked.", "email", user.getEmail()));
    }

    /**
     * POST /api/admin/users/{id}/disable
     * Sets enabled = false. User cannot log in.
     */
    @PostMapping("/users/{id}/disable")
    public ResponseEntity<?> disableUser(@PathVariable Long id) {
        if (!isAdmin()) return forbidden();

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }
        User user = opt.get();
        if ("ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Cannot disable an admin account."));
        }
        user.setEnabled(false);
        userRepository.save(user);

        logger.info("Admin {} disabled user {}", currentAdminEmail(), user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Account disabled.", "email", user.getEmail()));
    }

    /**
     * POST /api/admin/users/{id}/enable
     * Sets enabled = true. Re-activates a disabled account.
     */
    @PostMapping("/users/{id}/enable")
    public ResponseEntity<?> enableUser(@PathVariable Long id) {
        if (!isAdmin()) return forbidden();

        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }
        User user = opt.get();
        user.setEnabled(true);
        userRepository.save(user);

        logger.info("Admin {} enabled user {}", currentAdminEmail(), user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Account enabled.", "email", user.getEmail()));
    }

    // =========================================================================
    // MODULE 3 — PAYMENT HISTORY (Read-only)
    // =========================================================================

    /**
     * GET /api/admin/payments?search=&page=0&size=20
     *
     * Search by email, payment ID, or status (case-insensitive).
     * Read-only — no mutations.
     */
    @GetMapping("/payments")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getPayments(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (!isAdmin()) return forbidden();
        if (size > 100) size = 100;

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Payment> paymentPage;
        if (search == null || search.trim().isEmpty()) {
            paymentPage = paymentRepository.findAll(pageRequest);
        } else {
            paymentPage = paymentRepository.findBySearchTerm(search.trim().toLowerCase(), pageRequest);
        }

        List<Map<String, Object>> rows = paymentPage.getContent().stream().map(p -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", p.getId());
            row.put("orderId", p.getOrderId());
            row.put("paymentId", p.getPaymentId());
            row.put("amount", p.getAmount());
            row.put("status", p.getStatus());
            row.put("createdAt", p.getCreatedAt());
            // Fetch user email safely
            row.put("userEmail", p.getUser() != null ? p.getUser().getEmail() : "—");
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("payments", rows);
        response.put("totalElements", paymentPage.getTotalElements());
        response.put("totalPages", paymentPage.getTotalPages());
        response.put("currentPage", paymentPage.getNumber());

        return ResponseEntity.ok(response);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String currentAdminEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User u) {
            return u.getEmail();
        }
        return "unknown";
    }
}
