package com.resume.backend.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsageLimitService {
    
    private static final Logger logger = LoggerFactory.getLogger(UsageLimitService.class);
    private static final int FREE_SCAN_LIMIT = 2;
    
    private final UserRepository userRepository;
    
    public UsageLimitService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Check and increment usage for user
     * Returns remaining scans for soft-limit messaging
     * @throws UsageLimitException if free limit reached
     */
    @Transactional
    public int checkAndIncrementUsage(User user) {
        // Check if user has reached free limit
        if (!user.getIsPro() && !"ROLE_PRO".equals(user.getRole()) && user.getScanCount() >= FREE_SCAN_LIMIT) {
            logger.warn("User {} reached free limit: {}/{}", user.getEmail(), user.getScanCount(), FREE_SCAN_LIMIT);
            throw new UsageLimitException("Free limit reached. Upgrade to Pro for unlimited scans.");
        }
        
        // Increment scan count
        user.setScanCount(user.getScanCount() + 1);
        userRepository.save(user);
        
        int remaining = FREE_SCAN_LIMIT - user.getScanCount();
        logger.info("User {} scan count incremented to: {}, remaining: {}", 
            user.getEmail(), user.getScanCount(), remaining);
        
        return remaining;
    }

    /**
     * Check and increment enhancement usage
     */
    @Transactional
    public void checkAndIncrementEnhance(User user) {
        boolean isPro = user.getIsPro() || "ROLE_PRO".equals(user.getRole());
        if (!isPro && user.getEnhanceCount() >= 2) {
            logger.warn("User {} reached free enhancement limit: {}", user.getEmail(), user.getEnhanceCount());
            throw new UsageLimitException("Free limit reached. Upgrade to Pro for unlimited AI enhancements.");
        }
        user.setEnhanceCount(user.getEnhanceCount() + 1);
        userRepository.save(user);
        logger.info("User {} enhance count incremented to: {}", user.getEmail(), user.getEnhanceCount());
    }

    /**
     * Check and increment export usage
     */
    @Transactional
    public void checkAndIncrementExport(User user) {
        boolean isPro = user.getIsPro() || "ROLE_PRO".equals(user.getRole());
        if (!isPro && user.getExportCount() >= 2) {
            logger.warn("User {} reached free export limit: {}", user.getEmail(), user.getExportCount());
            throw new UsageLimitException("Free limit reached. Upgrade to Pro for unlimited downloads.");
        }
        user.setExportCount(user.getExportCount() + 1);
        userRepository.save(user);
        logger.info("User {} export count incremented to: {}", user.getEmail(), user.getExportCount());
    }
    
    /**
     * Get remaining scans for user (for soft-limit display)
     */
    public int getRemainingScans(User user) {
        if (user.getIsPro() || "ROLE_PRO".equals(user.getRole())) {
            return -1; // Unlimited
        }
        return Math.max(0, FREE_SCAN_LIMIT - user.getScanCount());
    }
}
