package com.resume.backend.repository;

import com.resume.backend.model.UsageMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsageMetricsRepository extends JpaRepository<UsageMetrics, Long> {
    List<UsageMetrics> findByUserIdOrderByTimestampDesc(Long userId);
}
