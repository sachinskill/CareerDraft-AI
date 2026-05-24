package com.resume.backend.ats.upload;

import com.resume.backend.ats.AtsResultDTO;

/**
 * Response DTO for resume file upload and ATS analysis.
 */
public class ResumeFileUploadResponse {

    private String extractedText;
    private AtsResultDTO atsAnalysis;
    private String filename;
    private long fileSize;
    private String fileType;
    private Integer remainingScans;
    private boolean isLocked = false;

    // ── Observability fields ──────────────────────────────────────────────────
    private String engineUsed;        // "python" | "java"
    private boolean fallbackUsed;     // true when Python was unavailable
    private long processingTimeMs;    // total scoring time
    private String warning;           // non-null when fallback occurred

    public ResumeFileUploadResponse() {}

    public ResumeFileUploadResponse(String extractedText, AtsResultDTO atsAnalysis,
                                    String filename, long fileSize, String fileType) {
        this.extractedText = extractedText;
        this.atsAnalysis = atsAnalysis;
        this.filename = filename;
        this.fileSize = fileSize;
        this.fileType = fileType;
    }

    public ResumeFileUploadResponse(String extractedText, AtsResultDTO atsAnalysis,
                                    String filename, long fileSize, String fileType,
                                    Integer remainingScans) {
        this(extractedText, atsAnalysis, filename, fileSize, fileType);
        this.remainingScans = remainingScans;
    }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String v) { this.extractedText = v; }

    public AtsResultDTO getAtsAnalysis() { return atsAnalysis; }
    public void setAtsAnalysis(AtsResultDTO v) { this.atsAnalysis = v; }

    public String getFilename() { return filename; }
    public void setFilename(String v) { this.filename = v; }

    public long getFileSize() { return fileSize; }
    public void setFileSize(long v) { this.fileSize = v; }

    public String getFileType() { return fileType; }
    public void setFileType(String v) { this.fileType = v; }

    public Integer getRemainingScans() { return remainingScans; }
    public void setRemainingScans(Integer v) { this.remainingScans = v; }

    public boolean getIsLocked() { return isLocked; }
    public void setIsLocked(boolean v) { this.isLocked = v; }

    public String getEngineUsed() { return engineUsed; }
    public void setEngineUsed(String v) { this.engineUsed = v; }

    public boolean isFallbackUsed() { return fallbackUsed; }
    public void setFallbackUsed(boolean v) { this.fallbackUsed = v; }

    public long getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(long v) { this.processingTimeMs = v; }

    public String getWarning() { return warning; }
    public void setWarning(String v) { this.warning = v; }
}