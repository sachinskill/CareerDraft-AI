package com.resume.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ats_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ATSReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
    private com.resume.backend.user.User user;

    @Column(columnDefinition = "TEXT")
    private String jobDescription;

    private int atsScore;
    private int keywordMatch;

    @Column(columnDefinition = "TEXT")
    private String reportJson; // Full breakdown

    @Column(nullable = false)
    private Boolean softDeleted = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
