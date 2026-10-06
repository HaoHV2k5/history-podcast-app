package com.prm.channel.controller;

import com.prm.channel.dto.request.AdminModerationDecisionRequest;
import com.prm.channel.dto.request.AiShieldPolicyConfigRequest;
import com.prm.channel.dto.request.BatchUpdatePolicyConfigRequest;
import com.prm.channel.dto.response.AdminModerationItemResponse;
import com.prm.channel.dto.response.AiShieldPolicyConfigResponse;
import com.prm.channel.service.AdminModerationService;
import com.prm.channel.service.AiShieldPolicyService;
import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.common.enums.AiShieldTier;
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

    @Mock
    private AiShieldPolicyService aiShieldPolicyService;

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
                .aiShieldTier(AiShieldTier.GOOD)
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
    @DisplayName("GET /api/v1/admin/moderation/reviews: Chuẩn hóa sortBy=createdAt về id")
    void testSearchReviews_SortByCreatedAtFallbackToId() {
        PageResponse<AdminModerationItemResponse> pageResponse = PageResponse.<AdminModerationItemResponse>builder()
                .items(List.of())
                .page(0)
                .size(10)
                .totalElements(0)
                .totalPages(0)
                .build();

        when(adminModerationService.searchReviews(isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(pageResponse);

        ResponseEntity<ApiResponse<PageResponse<AdminModerationItemResponse>>> response =
                adminModerationController.searchReviews(null, null, null, 0, 10, "createdAt", "desc");

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(adminModerationService).searchReviews(isNull(), isNull(), isNull(), argThat(pageable ->
                pageable.getSort().getOrderFor("id") != null));
    }

    @Test
    @DisplayName("GET /api/v1/admin/moderation/reviews/{id}: Lấy chi tiết phiên duyệt")
    void testGetReviewDetail() {
        AdminModerationItemResponse item = AdminModerationItemResponse.builder()
                .reviewId(1L)
                .contentId(10L)
                .title("Chiến dịch Lam Sơn")
                .decision("PENDING")
                .aiShieldTier(AiShieldTier.EXCELLENT)
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

    @Test
    @DisplayName("GET /api/v1/admin/moderation/policy-configs: Lấy danh sách cấu hình AI Shield")
    void testGetPolicyConfigs() {
        AiShieldPolicyConfigResponse config = AiShieldPolicyConfigResponse.builder()
                .id(1L)
                .tier(AiShieldTier.RED_ALERT)
                .label("Báo động đỏ")
                .minScore(BigDecimal.ZERO)
                .maxScore(BigDecimal.valueOf(50.0))
                .build();

        when(aiShieldPolicyService.getAllConfigs()).thenReturn(List.of(config));

        ResponseEntity<ApiResponse<List<AiShieldPolicyConfigResponse>>> response =
                adminModerationController.getPolicyConfigs();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getData().size());
        assertEquals(AiShieldTier.RED_ALERT, response.getBody().getData().get(0).getTier());
    }

    @Test
    @DisplayName("GET /api/v1/admin/moderation/policy-configs/{tier}: Lấy cấu hình của 1 tier")
    void testGetConfigByTier() {
        AiShieldPolicyConfigResponse config = AiShieldPolicyConfigResponse.builder()
                .tier(AiShieldTier.GOOD)
                .label("Tốt")
                .minScore(BigDecimal.valueOf(80.0))
                .maxScore(BigDecimal.valueOf(90.0))
                .build();

        when(aiShieldPolicyService.getConfigByTier(AiShieldTier.GOOD)).thenReturn(config);

        ResponseEntity<ApiResponse<AiShieldPolicyConfigResponse>> response =
                adminModerationController.getConfigByTier(AiShieldTier.GOOD);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Tốt", response.getBody().getData().getLabel());
    }

    @Test
    @DisplayName("PUT /api/v1/admin/moderation/policy-configs/{tier}: Admin cập nhật cấu hình % và nhãn")
    void testUpdatePolicyConfig() {
        AiShieldPolicyConfigRequest request = AiShieldPolicyConfigRequest.builder()
                .label("Cảnh báo nghiêm trọng")
                .minScore(BigDecimal.ZERO)
                .maxScore(BigDecimal.valueOf(45.0))
                .build();

        AiShieldPolicyConfigResponse updated = AiShieldPolicyConfigResponse.builder()
                .tier(AiShieldTier.RED_ALERT)
                .label("Cảnh báo nghiêm trọng")
                .minScore(BigDecimal.ZERO)
                .maxScore(BigDecimal.valueOf(45.0))
                .build();

        when(aiShieldPolicyService.updateConfig(eq(AiShieldTier.RED_ALERT), any(AiShieldPolicyConfigRequest.class)))
                .thenReturn(updated);

        ResponseEntity<ApiResponse<AiShieldPolicyConfigResponse>> response =
                adminModerationController.updatePolicyConfig(AiShieldTier.RED_ALERT, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Cảnh báo nghiêm trọng", response.getBody().getData().getLabel());
    }

    @Test
    @DisplayName("POST /api/v1/admin/moderation/policy-configs/reset-defaults: Khôi phục cấu hình mặc định")
    void testResetDefaultConfigs() {
        when(aiShieldPolicyService.resetDefaultConfigs()).thenReturn(List.of());

        ResponseEntity<ApiResponse<List<AiShieldPolicyConfigResponse>>> response =
                adminModerationController.resetDefaultConfigs();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(aiShieldPolicyService, times(1)).resetDefaultConfigs();
    }
}
