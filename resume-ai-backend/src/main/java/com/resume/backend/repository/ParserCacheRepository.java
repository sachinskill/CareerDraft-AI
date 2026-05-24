package com.resume.backend.repository;

import com.resume.backend.model.ParserCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ParserCacheRepository extends JpaRepository<ParserCache, String> {
}
