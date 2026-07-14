package com.resume.backend.repository;

import com.resume.backend.payment.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    // ── Existing methods (unchanged) ──────────────────────────────────────────
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Payment> findByOrderId(String orderId);
    Optional<Payment> findByPaymentId(String paymentId);

    // ── Admin: revenue aggregate ──────────────────────────────────────────────

    /**
     * Sum of all successful payments.
     * SQL: SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.status = 'SUCCESS'
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p WHERE p.status = 'SUCCESS'")
    double sumSuccessfulPayments();

    // ── Admin: paginated search ───────────────────────────────────────────────

    /**
     * Search payments by user email (partial), payment ID, or status.
     * SQL: SELECT p FROM payments p JOIN users u ON p.user_id = u.id
     *      WHERE LOWER(u.email) LIKE %term% OR LOWER(p.paymentId) LIKE %term%
     *            OR LOWER(p.status) LIKE %term%
     */
    @Query("""
            SELECT p FROM Payment p
            WHERE LOWER(p.user.email) LIKE LOWER(CONCAT('%', :term, '%'))
               OR (p.paymentId IS NOT NULL AND LOWER(p.paymentId) LIKE LOWER(CONCAT('%', :term, '%')))
               OR LOWER(p.status) LIKE LOWER(CONCAT('%', :term, '%'))
            """)
    Page<Payment> findBySearchTerm(@Param("term") String term, Pageable pageable);
}
