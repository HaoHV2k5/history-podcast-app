package com.prm.common.service;

import com.prm.common.dto.request.EmailTemplateRequest;
import com.prm.common.dto.response.EmailTemplateResponse;
import com.prm.common.entity.EmailTemplate;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.repository.EmailTemplateRepository;
import com.prm.common.service.impl.EmailTemplateServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailTemplateServiceImplTest {

    @Mock
    private EmailTemplateRepository repository;

    @InjectMocks
    private EmailTemplateServiceImpl service;

    private EmailTemplate sampleTemplate;

    @BeforeEach
    void setUp() {
        sampleTemplate = EmailTemplate.builder()
                .id(1L)
                .code("TEST_OTP")
                .name("Test OTP Template")
                .subject("Test Subject {{otpCode}}")
                .htmlContent("<div>OTP: {{otpCode}}</div>")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("findAll trả về danh sách template")
    void testFindAll() {
        when(repository.findAll()).thenReturn(List.of(sampleTemplate));

        List<EmailTemplateResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("TEST_OTP", result.get(0).getCode());
    }

    @Test
    @DisplayName("findByCode trả về template thành công")
    void testFindByCode() {
        when(repository.findByCode("TEST_OTP")).thenReturn(Optional.of(sampleTemplate));

        EmailTemplateResponse result = service.findByCode("TEST_OTP");

        assertNotNull(result);
        assertEquals("TEST_OTP", result.getCode());
    }

    @Test
    @DisplayName("findByCode ném RESOURCE_NOT_FOUND nếu không tìm thấy")
    void testFindByCode_NotFound() {
        when(repository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> service.findByCode("UNKNOWN"));
        assertEquals(ErrorCode.RESOURCE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("create template thành công khi code chưa tồn tại")
    void testCreate_Success() {
        EmailTemplateRequest request = EmailTemplateRequest.builder()
                .code("NEW_TEMPLATE")
                .name("New Template")
                .subject("Subject")
                .htmlContent("<div>Content</div>")
                .build();

        when(repository.existsByCode("NEW_TEMPLATE")).thenReturn(false);
        when(repository.save(any(EmailTemplate.class))).thenAnswer(i -> {
            EmailTemplate t = i.getArgument(0);
            t.setId(2L);
            return t;
        });

        EmailTemplateResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("NEW_TEMPLATE", result.getCode());
        verify(repository, times(1)).save(any(EmailTemplate.class));
    }

    @Test
    @DisplayName("create template ném AppException nếu code đã tồn tại")
    void testCreate_DuplicateCode() {
        EmailTemplateRequest request = EmailTemplateRequest.builder()
                .code("TEST_OTP")
                .name("Duplicate")
                .subject("Subject")
                .htmlContent("<div>Content</div>")
                .build();

        when(repository.existsByCode("TEST_OTP")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> service.create(request));
        assertEquals(ErrorCode.INVALID_REQUEST_DATA, ex.getErrorCode());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update template thành công")
    void testUpdate_Success() {
        EmailTemplateRequest request = EmailTemplateRequest.builder()
                .code("TEST_OTP")
                .name("Updated Name")
                .subject("Updated Subject")
                .htmlContent("<div>Updated Content</div>")
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(sampleTemplate));
        when(repository.save(any(EmailTemplate.class))).thenReturn(sampleTemplate);

        EmailTemplateResponse result = service.update(1L, request);

        assertNotNull(result);
        assertEquals("Updated Name", sampleTemplate.getName());
        verify(repository, times(1)).save(sampleTemplate);
    }
}
