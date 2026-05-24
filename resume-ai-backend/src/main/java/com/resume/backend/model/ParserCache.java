package com.resume.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "parser_caches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParserCache {

    @Id
    @Column(nullable = false, unique = true)
    private String fileHash; // SHA-256 hash of the uploaded file bytes

    @Column(columnDefinition = "TEXT", nullable = false)
    private String extractedText;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
