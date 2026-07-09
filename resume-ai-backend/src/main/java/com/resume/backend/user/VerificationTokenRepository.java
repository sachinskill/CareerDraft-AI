package com.resume.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    List<VerificationToken> findByUserAndPurposeAndUsed(User user, VerificationTokenPurpose purpose, Boolean used);
}
