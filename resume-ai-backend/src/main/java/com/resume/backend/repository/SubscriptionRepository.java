package com.resume.backend.repository;

import com.resume.backend.payment.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, String> {
    List<Subscription> findByUserId(Long userId);
    Optional<Subscription> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
    Optional<Subscription> findBySubscriptionId(String subscriptionId);
}
