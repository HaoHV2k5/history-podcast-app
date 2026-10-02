package com.prm.channel.controller;

import com.prm.channel.dto.request.AdminModerationDecisionRequest;
import com.prm.channel.dto.response.AdminModerationItemResponse;
import com.prm.channel.service.AdminModerationService;
import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminModerationControllerTest {

    @Mock
    private AdminModerationService adminModerationService;

    @InjectMocks
    private AdminModerationController adminModerationController;

    @BeforeEach
    void setUp() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin@historypodcast.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/v1/admin/moderation/reviews: Lấy danh sách hàng đợi kiểm duyệt")
    void testSearchReviews() {
        AdminModerationItemResponse item = AdminModerationItemResponse.builder()
                .reviewId(1L)
                .contentId(10L)
                .title("Chiến thắng Bạch Đằng")
                .decision("PENDING")
                .aiShieldTier("GOOD")
                .aiShieldTierLabel("Tốt")
                .aiShieldScore(BigDecimal.valueOf(88.0))
                .build();

        PageResponse<AdminModerationItemResponse> pageResponse = PageResponse.<AdminModerationItemResponse>builder()
                .items(List.of(item))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .build();

        when(adminModerationService.searchReviews(eq("PENDING"), eq("GOOD"), eq("Bạch Đằng"), any(Pageable.class)))
                .thenReturn(pageResponse);

        ResponseEntity<ApiResponse<PageResponse<AdminModerationItemResponse>>> response =
                adminModerationController.searchReviews("PENDING", "GOOD", "Bạch Đằng", 0, 10, "id", "desc");

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getItems().size());
        assertEquals("Chiến thắng Bạch Đằng", response.getBody().getData().getItems().get(0).getTitle());
    }

    @Test
    @DisplayName("GET /api/v1/admin/moderation/reviews/{id}: Lấy chi tiết phiên duyệt")
    void testGetReviewDetail() {
        AdminModerationItemResponse item = AdminModerationItemResponse.builder()
                .reviewId(1L)
                .contentId(10L)
                .title("Chiến dịch Lam Sơn")
                .decision("PENDING")
                .aiShieldTier("EXCELLENT")
                .aiShieldTierLabel("Xuất sắc")
                .aiShieldScore(BigDecimal.valueOf(95.0))
                .build();

        when(adminModerationService.getReviewDetail(1L)).thenReturn(item);

        ResponseEntity<ApiResponse<AdminModerationItemResponse>> response =
                adminModerationController.getReviewDetail(1L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Xuất sắc", response.getBody().getData().getAiShieldTierLabel());
    }

    @Test
    @DisplayName("POST /api/v1/admin/moderation/reviews/{id}/decision: Phê duyệt video thành công")
    void testProcessDecision_Approved() {
        AdminModerationDecisionRequest request = AdminModerationDecisionRequest.builder()
                .decision("APPROVED")
                .reason("Nội dung xuất sắc, cho phép xuất bản")
                .build();

        AdminModerationItemResponse result = AdminModerationItemResponse.builder()
                .reviewId(1L)
                .contentId(10L)
                .decision("APPROVED")
                .moderatorEmail("admin@historypodcast.com")
                .build();

        when(adminModerationService.processDecision(eq(1L), eq("admin@historypodcast.com"), any(AdminModerationDecisionRequest.class)))
                .thenReturn(result);

        ResponseEntity<ApiResponse<AdminModerationItemResponse>> response =
                adminModerationController.processDecision(1L, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("phê duyệt"));
        assertEquals("APPROVED", response.getBody().getData().getDecision());
    }

    @Test
    @DisplayName("POST /api/v1/admin/moderation/reviews/{id}/decision: Từ chối video thành công")
    void testProcessDecision_Rejected() {
        AdminModerationDecisionRequest request = AdminModerationDecisionRequest.builder()
                .decision("REJECTED")
                .reason("Cần kiểm chứng lại dữ liệu mốc thời gian")
                .build();

        AdminModerationItemResponse result = AdminModerationItemResponse.builder()
                .reviewId(1L)
                .contentId(10L)
                .decision("REJECTED")
                .moderatorEmail("admin@historypodcast.com")
                .build();

        when(adminModerationService.processDecision(eq(1L), eq("admin@historypodcast.com"), any(AdminModerationDecisionRequest.class)))
                .thenReturn(result);

        ResponseEntity<ApiResponse<AdminModerationItemResponse>> response =
                adminModerationController.processDecision(1L, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("từ chối"));
        assertEquals("REJECTED", response.getBody().getData().getDecision());
    }
}
