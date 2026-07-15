package com.resume.backend.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ── Existing methods (unchanged) ──────────────────────────────────────────
    Optional<User> findByEmail(String email);

    // ── Admin: aggregate counts ───────────────────────────────────────────────

    /** Total non-deleted users. */
    long countBySoftDeletedFalse();

    /** Total users with a specific role (e.g. ROLE_PRO). */
    long countByRoleAndSoftDeletedFalse(String role);

    /** Total users with a specific isPro status. */
    long countByIsProAndSoftDeletedFalse(Boolean isPro);

    /** Users registered since a given timestamp (today midnight). */
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since AND u.softDeleted = false")
    long countRegisteredToday(@Param("since") LocalDateTime since);

    // ── Admin: paginated user list ────────────────────────────────────────────

    /** All non-deleted users, paginated. */
    Page<User> findBySoftDeletedFalse(Pageable pageable);

    /** Non-deleted users whose email contains the search term (case-insensitive). */
    Page<User> findBySoftDeletedFalseAndEmailContainingIgnoreCase(String email, Pageable pageable);
}
