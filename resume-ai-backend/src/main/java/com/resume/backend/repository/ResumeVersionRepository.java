package com.resume.backend.repository;

import com.resume.backend.model.ResumeVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeVersionRepository extends JpaRepository<ResumeVersion, String> {
    List<ResumeVersion> findByResumeIdOrderByVersionNumberDesc(String resumeId);
    List<ResumeVersion> findByResumeIdOrderByVersionNumberAsc(String resumeId);
}
