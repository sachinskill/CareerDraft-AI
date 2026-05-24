package com.resume.backend.model;

import com.resume.backend.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "usage_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsageMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true) // Nullable for anonymous guests
    private User user;

    @Column(nullable = false)
    private String actionType; // SCAN, ENHANCE, EXPORT, SAVE

    private String requestIp;
    private String requestPath;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
