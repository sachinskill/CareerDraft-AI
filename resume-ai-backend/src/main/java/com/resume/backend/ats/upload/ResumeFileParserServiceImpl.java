package com.resume.backend.ats.upload;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Implementation of ResumeFileParserService for extracting text from PDF and
 * DOCX files.
 */
@Service
public class ResumeFileParserServiceImpl implements ResumeFileParserService {

    private static final String[] SUPPORTED_EXTENSIONS = { ".pdf", ".docx", ".txt" };
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Patterns for text cleaning
    private static final Pattern EXCESSIVE_WHITESPACE = Pattern.compile("\\s{3,}");
    private static final Pattern MULTIPLE_NEWLINES = Pattern.compile("\\n{3,}");
    private static final Pattern HEADER_FOOTER_PATTERN = Pattern.compile("(?i)(page \\d+|\\d+/\\d+|header|footer)");

    @Override
    public String extractTextFromFile(MultipartFile file) throws UnsupportedFileTypeException, FileParsingException {
        // Validate file
        validateFile(file);

        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new FileParsingException("File name is missing");
        }

        try {
            String rawText;
            if (filename.toLowerCase().endsWith(".pdf")) {
                rawText = extractTextFromPdf(file.getInputStream());
            } else if (filename.toLowerCase().endsWith(".docx")) {
                rawText = extractTextFromDocx(file.getInputStream());
            } else if (filename.toLowerCase().endsWith(".txt")) {
                rawText = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
            } else {
                throw new UnsupportedFileTypeException("Unsupported file type: " + getFileExtension(filename));
            }

            return cleanExtractedText(rawText);

        } catch (IOException e) {
            throw new FileParsingException("Failed to read file: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isSupportedFileType(String filename) {
        if (filename == null) {
            return false;
        }

        String lowerFilename = filename.toLowerCase();
        for (String extension : SUPPORTED_EXTENSIONS) {
            if (lowerFilename.endsWith(extension)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public String cleanExtractedText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return "";
        }

        String cleaned = rawText;

        // Remove header/footer patterns
        cleaned = HEADER_FOOTER_PATTERN.matcher(cleaned).replaceAll("");

        // Normalize line breaks
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n");

        // Remove excessive whitespace
        cleaned = EXCESSIVE_WHITESPACE.matcher(cleaned).replaceAll(" ");

        // Remove multiple consecutive newlines
        cleaned = MULTIPLE_NEWLINES.matcher(cleaned).replaceAll("\n\n");

        // Trim and normalize
        cleaned = cleaned.trim();

        return cleaned;
    }

    /**
     * Extract text from PDF file using Apache PDFBox.
     */
    private String extractTextFromPdf(InputStream inputStream) throws IOException, FileParsingException {
        try {
            PDDocument document = PDDocument.load(inputStream);
            try {
                if (document.isEncrypted()) {
                    throw new FileParsingException("PDF file is encrypted and cannot be processed");
                }

                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);

                return stripper.getText(document);
            } finally {
                document.close();
            }
        } catch (IOException e) {
            throw new FileParsingException("Failed to extract text from PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Extract text from DOCX file using Apache POI.
     */
    private String extractTextFromDocx(InputStream inputStream) throws IOException, FileParsingException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder textBuilder = new StringBuilder();

            List<XWPFParagraph> paragraphs = document.getParagraphs();
            for (XWPFParagraph paragraph : paragraphs) {
                String paragraphText = paragraph.getText();
                if (paragraphText != null && !paragraphText.trim().isEmpty()) {
                    textBuilder.append(paragraphText).append("\n");
                }
            }

            return textBuilder.toString();

        } catch (IOException e) {
            throw new FileParsingException("Failed to extract text from DOCX: " + e.getMessage(), e);
        }
    }

    /**
     * Validate uploaded file for size and basic properties.
     */
    private void validateFile(MultipartFile file) throws FileParsingException, UnsupportedFileTypeException {
        if (file == null || file.isEmpty()) {
            throw new FileParsingException("File is empty or missing");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileParsingException("File size exceeds maximum limit of 10MB");
        }

        String filename = file.getOriginalFilename();
        if (!isSupportedFileType(filename)) {
            throw new UnsupportedFileTypeException("Unsupported file type. Only PDF and DOCX files are supported.");
        }
    }

    /**
     * Get file extension from filename.
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
    }
}
