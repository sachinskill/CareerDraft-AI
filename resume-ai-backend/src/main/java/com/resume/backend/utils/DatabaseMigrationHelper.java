package com.resume.backend.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseMigrationHelper implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationHelper.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationHelper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Executing database constraint migration...");
        try {
            // 1. Drop and recreate resume_versions foreign key with ON DELETE CASCADE
            // Try dropping with the known constraint name given in user logs
            jdbcTemplate.execute("ALTER TABLE resume_versions DROP CONSTRAINT IF EXISTS fk2tc1ij6lmop8569p74kl2u2ut");
            
            // Query dynamically in case constraint name varies
            String findVersionsConstraint = "SELECT constraint_name FROM information_schema.key_column_usage " +
                    "WHERE table_name = 'resume_versions' AND column_name = 'resume_id'";
            List<String> versionsConstraints = jdbcTemplate.queryForList(findVersionsConstraint, String.class);
            for (String cn : versionsConstraints) {
                jdbcTemplate.execute("ALTER TABLE resume_versions DROP CONSTRAINT IF EXISTS " + cn);
            }

            jdbcTemplate.execute("ALTER TABLE resume_versions ADD CONSTRAINT fk2tc1ij6lmop8569p74kl2u2ut FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE");
            logger.info("Successfully added ON DELETE CASCADE to resume_versions(resume_id)");

            // 2. Do the same for ats_reports to prevent same deletion locks
            String findAtsConstraint = "SELECT constraint_name FROM information_schema.key_column_usage " +
                    "WHERE table_name = 'ats_reports' AND column_name = 'resume_id'";
            
            List<String> atsConstraints = jdbcTemplate.queryForList(findAtsConstraint, String.class);
            for (String cn : atsConstraints) {
                logger.info("Found foreign key constraint on ats_reports(resume_id): {}", cn);
                jdbcTemplate.execute("ALTER TABLE ats_reports DROP CONSTRAINT IF EXISTS " + cn);
                jdbcTemplate.execute("ALTER TABLE ats_reports ADD CONSTRAINT " + cn + 
                        " FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE");
                logger.info("Successfully added ON DELETE CASCADE to ats_reports(resume_id) for constraint: {}", cn);
            }

            // 3. Do the same for verification_tokens to prevent user deletion locks
            String findTokensConstraint = "SELECT constraint_name FROM information_schema.key_column_usage " +
                    "WHERE table_name = 'verification_tokens' AND column_name = 'user_id'";
            
            List<String> tokensConstraints = jdbcTemplate.queryForList(findTokensConstraint, String.class);
            for (String cn : tokensConstraints) {
                logger.info("Found foreign key constraint on verification_tokens(user_id): {}", cn);
                jdbcTemplate.execute("ALTER TABLE verification_tokens DROP CONSTRAINT IF EXISTS " + cn);
                jdbcTemplate.execute("ALTER TABLE verification_tokens ADD CONSTRAINT " + cn + 
                        " FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
                logger.info("Successfully added ON DELETE CASCADE to verification_tokens(user_id) for constraint: {}", cn);
            }

        } catch (Exception e) {
            logger.error("Failed to migrate database foreign key constraints", e);
        }
    }
}
