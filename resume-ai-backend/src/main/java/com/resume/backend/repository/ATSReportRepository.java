package com.resume.backend.repository;

import com.resume.backend.model.ATSReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ATSReportRepository extends JpaRepository<ATSReport, String> {
    List<ATSReport> findByResumeIdAndSoftDeletedFalseOrderByCreatedAtDesc(String resumeId);
    List<ATSReport> findByUserIdAndSoftDeletedFalseOrderByCreatedAtDesc(Long userId);
    java.util.Optional<ATSReport> findByIdAndSoftDeletedFalse(String id);
}
