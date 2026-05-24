package com.resume.backend.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private Integer scanCount = 0;
    
    @Column(nullable = false)
    private Integer enhanceCount = 0;
    
    @Column(nullable = false)
    private Integer exportCount = 0;
    
    private LocalDateTime lastUsageDate;
    
    @Column(nullable = false)
    private String role = "ROLE_FREE"; // ROLE_FREE, ROLE_PRO, ROLE_ADMIN
    
    @Column(nullable = false)
    private Boolean softDeleted = false;
    
    @Column(nullable = false)
    private Boolean isPro = false;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
