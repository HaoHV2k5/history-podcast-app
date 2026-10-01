package com.prm.common.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.request.EmailTemplatePreviewRequest;
import com.prm.common.dto.request.EmailTemplateRequest;
import com.prm.common.dto.request.EmailTemplateTestSendRequest;
import com.prm.common.dto.response.EmailTemplatePreviewResponse;
import com.prm.common.dto.response.EmailTemplateResponse;
import com.prm.common.service.EmailTemplateService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailTemplateControllerTest {

    @Mock
    private EmailTemplateService service;

    @InjectMocks
    private EmailTemplateController controller;

    @Test
    @DisplayName("GET /api/v1/email-templates trả về danh sách template")
    void testGetAll() {
        EmailTemplateResponse res = EmailTemplateResponse.builder()
                .id(1L)
                .code("OTP_CODE")
                .name("OTP Name")
                .build();

        when(service.findAll()).thenReturn(List.of(res));

        ResponseEntity<ApiResponse<List<EmailTemplateResponse>>> response = controller.getAll();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getData().size());
    }

    @Test
    @DisplayName("GET /api/v1/email-templates/{id} trả về chi tiết template")
    void testGetById() {
        EmailTemplateResponse res = EmailTemplateResponse.builder()
                .id(1L)
                .code("OTP_CODE")
                .build();

        when(service.findById(1L)).thenReturn(res);

        ResponseEntity<ApiResponse<EmailTemplateResponse>> response = controller.getById(1L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("OTP_CODE", response.getBody().getData().getCode());
    }

    @Test
    @DisplayName("POST /api/v1/email-templates tạo mới template thành công")
    void testCreate() {
        EmailTemplateRequest request = EmailTemplateRequest.builder()
                .code("NEW_CODE")
                .name("New Name")
                .subject("Subject")
                .htmlContent("<div>Content</div>")
                .build();

        EmailTemplateResponse res = EmailTemplateResponse.builder()
                .id(2L)
                .code("NEW_CODE")
                .build();

        when(service.create(any(EmailTemplateRequest.class))).thenReturn(res);

        ResponseEntity<ApiResponse<EmailTemplateResponse>> response = controller.create(request);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("NEW_CODE", response.getBody().getData().getCode());
    }

    @Test
    @DisplayName("PUT /api/v1/email-templates/{id} cập nhật template thành công")
    void testUpdate() {
        EmailTemplateRequest request = EmailTemplateRequest.builder()
                .code("NEW_CODE")
                .name("Updated Name")
                .subject("Updated Subject")
                .htmlContent("<div>Updated Content</div>")
                .build();

        EmailTemplateResponse res = EmailTemplateResponse.builder()
                .id(1L)
                .code("NEW_CODE")
                .name("Updated Name")
                .build();

        when(service.update(eq(1L), any(EmailTemplateRequest.class))).thenReturn(res);

        ResponseEntity<ApiResponse<EmailTemplateResponse>> response = controller.update(1L, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Updated Name", response.getBody().getData().getName());
    }

    @Test
    @DisplayName("DELETE /api/v1/email-templates/{id} xóa template thành công")
    void testDelete() {
        doNothing().when(service).delete(1L);

        ResponseEntity<ApiResponse<Void>> response = controller.delete(1L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(service, times(1)).delete(1L);
    }

    @Test
    @DisplayName("POST /api/v1/email-templates/{id}/preview xem trước render")
    void testPreview() {
        EmailTemplatePreviewRequest req = EmailTemplatePreviewRequest.builder()
                .variables(Map.of("name", "John"))
                .build();

        EmailTemplatePreviewResponse res = EmailTemplatePreviewResponse.builder()
                .subject("Hello John")
                .htmlContent("<div>Hello John</div>")
                .build();

        when(service.preview(eq(1L), any())).thenReturn(res);

        ResponseEntity<ApiResponse<EmailTemplatePreviewResponse>> response = controller.preview(1L, req);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Hello John", response.getBody().getData().getSubject());
    }

    @Test
    @DisplayName("POST /api/v1/email-templates/{id}/test-send gửi email test")
    void testSendTestEmail() {
        EmailTemplateTestSendRequest req = EmailTemplateTestSendRequest.builder()
                .toEmail("admin@example.com")
                .variables(Map.of("code", "123"))
                .build();

        doNothing().when(service).sendTestEmail(eq(1L), any());

        ResponseEntity<ApiResponse<Void>> response = controller.sendTestEmail(1L, req);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(service, times(1)).sendTestEmail(1L, req);
    }
}
