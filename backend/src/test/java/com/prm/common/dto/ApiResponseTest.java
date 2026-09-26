package com.prm.common.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    void testNullFieldsAreOmittedInSerialization() throws Exception {
        // Success case with null errorCode
        ApiResponse<String> successResponse = ApiResponse.success("Hello");
        String jsonSuccess = objectMapper.writeValueAsString(successResponse);

        assertTrue(jsonSuccess.contains("\"success\":true"));
        assertTrue(jsonSuccess.contains("\"message\":\"Success\""));
        assertTrue(jsonSuccess.contains("\"data\":\"Hello\""));
        assertFalse(jsonSuccess.contains("errorCode")); // errorCode should be omitted because it is null

        // Error case with null data
        ApiResponse<Void> errorResponse = ApiResponse.error("AUTH_2001", "Invalid credentials");
        String jsonError = objectMapper.writeValueAsString(errorResponse);

        assertTrue(jsonError.contains("\"success\":false"));
        assertTrue(jsonError.contains("\"errorCode\":\"AUTH_2001\""));
        assertTrue(jsonError.contains("\"message\":\"Invalid credentials\""));
        assertFalse(jsonError.contains("\"data\"")); // data should be omitted because it is null
    }
}
