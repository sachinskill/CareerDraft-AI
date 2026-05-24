package com.resume.backend.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

public class JsonParserUtil {

    private static final Logger logger = LoggerFactory.getLogger(JsonParserUtil.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static Map<String, Object> parseAiResponse(String response) {
        Map<String, Object> jsonResponse = new HashMap<>();

        // Extract content inside <think> tags if present
        int thinkStart = response.indexOf("<think>") + 7;
        int thinkEnd = response.indexOf("</think>");
        if (thinkStart > 6 && thinkEnd != -1) {
            String thinkContent = response.substring(thinkStart, thinkEnd).trim();
            jsonResponse.put("think", thinkContent);
        } else {
            jsonResponse.put("think", null);
        }

        // Try multiple approaches to find JSON content
        try {
            // First try to find JSON between ```json and ``` markers
            int jsonStart = response.indexOf("```json");
            int jsonEnd = -1;
            if (jsonStart != -1) {
                jsonStart += 7; // Move past "```json"
                jsonEnd = response.indexOf("```", jsonStart);
                if (jsonEnd != -1) {
                    return parseAndWrap(response.substring(jsonStart, jsonEnd).trim(), jsonResponse);
                }
            }

            // Second, look for a JSON object directly in the response
            jsonStart = response.indexOf("{");
            if (jsonStart != -1) {
                // Determine if this looks like a "think" block start or actual JSON
                int thinkTagCheck = response.indexOf("{\"think\":");
                if (jsonStart != thinkTagCheck) {
                    // Find matching closing brace by counting braces
                    int braceCount = 1;
                    jsonEnd = jsonStart + 1;
                    while (jsonEnd < response.length() && braceCount > 0) {
                        char c = response.charAt(jsonEnd);
                        if (c == '{')
                            braceCount++;
                        else if (c == '}')
                            braceCount--;
                        jsonEnd++;
                    }

                    if (braceCount == 0) {
                        return parseAndWrap(response.substring(jsonStart, jsonEnd).trim(), jsonResponse);
                    }
                }
            }

            // If we still don't have data, try to extract content after the thinking
            // section
            if (thinkEnd != -1 && thinkEnd < response.length() - 10) {
                String remainingContent = response.substring(thinkEnd + 8).trim();
                if (remainingContent.startsWith("{") && remainingContent.endsWith("}")) {
                    return parseAndWrap(remainingContent, jsonResponse);
                }
            }

            // If still no JSON found, the response might not contain valid JSON
            jsonResponse.put("data", null);
            logger.error("No valid JSON found in the response. Raw response length: {}", response.length());
        } catch (Exception e) {
            jsonResponse.put("data", null);
            logger.error("Error parsing JSON from response: {}", e.getMessage());
        }

        return jsonResponse;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> parseAndWrap(String jsonContent, Map<String, Object> wrapper) throws Exception {
        Map<String, Object> dataContent = objectMapper.readValue(jsonContent, Map.class);
        wrapper.put("data", dataContent);
        return wrapper;
    }
}
