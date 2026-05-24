package com.resume.backend.repository;

import com.resume.backend.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, String> {
    List<Resume> findByUserIdAndSoftDeletedFalse(Long userId);
    java.util.Optional<Resume> findByIdAndSoftDeletedFalse(String id);
    long countByUserIdAndSoftDeletedFalse(Long userId);
}
