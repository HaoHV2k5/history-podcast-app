package com.prm.contract.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prm.common.dto.PageResponse;
import com.prm.contract.dto.request.BookingEscrowConfigRequest;
import com.prm.contract.dto.request.CreateCommissionRequest;
import com.prm.contract.dto.request.RejectCommissionRequest;
import com.prm.contract.dto.response.BookingEscrowConfigResponse;
import com.prm.contract.dto.response.CommissionResponse;
import com.prm.contract.service.BookingEscrowConfigService;
import com.prm.contract.service.CommissionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CommissionAndConfigControllerTest {

    @Mock
    private CommissionService commissionService;

    @Mock
    private BookingEscrowConfigService configService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        CommissionController commissionController = new CommissionController(commissionService);
        BookingEscrowConfigController configController = new BookingEscrowConfigController(configService);
        mockMvc = MockMvcBuilders.standaloneSetup(commissionController, configController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/v1/commissions & /api/v1/hire-requests: Định tuyến song song chuẩn xác khi tạo đơn đặt nội dung")
    void testCreateCommissionDualRouting() throws Exception {
        CreateCommissionRequest req = CreateCommissionRequest.builder()
                .channelId(5L)
                .contentType("SERIES")
                .title("Series Kháng chiến chống Nguyên Mông")
                .description("3 tập chuyên sâu")
                .build();

        CommissionResponse res = CommissionResponse.builder()
                .id(101L)
                .channelId(5L)
                .contentType("SERIES")
                .title(req.getTitle())
                .status("PENDING")
                .build();

        when(commissionService.create(any(CreateCommissionRequest.class))).thenReturn(res);

        // Route chuẩn mới: /api/v1/commissions
        mockMvc.perform(post("/api/v1/commissions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(101))
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // Route alias tương thích FE: /api/v1/hire-requests
        mockMvc.perform(post("/api/v1/hire-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(101));

        verify(commissionService, times(2)).create(any(CreateCommissionRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/commissions/{id}/accept & reject & cancel: Đầy đủ luồng phản hồi đơn đặt nội dung")
    void testAcceptRejectCancelCommissionRoutes() throws Exception {
        when(commissionService.acceptCommission(101L)).thenReturn(
                CommissionResponse.builder().id(101L).status("ACCEPTED").conversationId("hire_request_101").build()
        );
        when(commissionService.rejectCommission(eq(101L), any(RejectCommissionRequest.class))).thenReturn(
                CommissionResponse.builder().id(101L).status("REJECTED").rejectionReason("Kín lịch sản xuất").build()
        );
        when(commissionService.cancelCommission(101L)).thenReturn(
                CommissionResponse.builder().id(101L).status("CANCELLED").build()
        );

        mockMvc.perform(post("/api/v1/commissions/101/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.conversationId").value("hire_request_101"));

        mockMvc.perform(post("/api/v1/hire-requests/101/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RejectCommissionRequest("Kín lịch sản xuất"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value("Kín lịch sản xuất"));

        mockMvc.perform(post("/api/v1/commissions/101/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("GET /api/v1/commissions/my-received & /my-sent & /me: Lấy danh sách đơn phân trang")
    void testGetCommissionPaginatedLists() throws Exception {
        PageResponse<CommissionResponse> pageRes = PageResponse.<CommissionResponse>builder()
                .items(List.of(CommissionResponse.builder().id(1L).status("PENDING").build()))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .build();

        when(commissionService.getMyReceivedRequests(any(), any(Pageable.class))).thenReturn(pageRes);
        when(commissionService.getMySentRequests(any(), any(Pageable.class))).thenReturn(pageRes);
        when(commissionService.getMyCommissions(any(), any(Pageable.class))).thenReturn(pageRes);

        mockMvc.perform(get("/api/v1/commissions/my-received"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id").value(1));

        mockMvc.perform(get("/api/v1/hire-requests/my-sent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id").value(1));

        mockMvc.perform(get("/api/v1/commissions/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id").value(1));
    }

    @Test
    @DisplayName("BookingEscrowConfigController: Kiểm tra toàn bộ endpoint Public Policy và Admin Config")
    void testBookingEscrowConfigControllerRoutes() throws Exception {
        BookingEscrowConfigResponse policy = BookingEscrowConfigResponse.builder()
                .maxMilestones(20)
                .platformFeePercent(new BigDecimal("5.0"))
                .membershipFeePercent(new BigDecimal("10.0"))
                .withdrawalSlaDays(2)
                .withdrawalMinAmount(new BigDecimal("50000"))
                .depositMinAmount(new BigDecimal("10000"))
                .build();

        when(configService.getConfig()).thenReturn(policy);
        when(configService.updateConfig(any(BookingEscrowConfigRequest.class))).thenReturn(policy);
        when(configService.resetDefaultConfig()).thenReturn(policy);

        // Public endpoints
        mockMvc.perform(get("/api/v1/policies/booking-escrow"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.maxMilestones").value(20))
                .andExpect(jsonPath("$.data.withdrawalSlaDays").value(2));

        mockMvc.perform(get("/api/v1/booking-escrow/policy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.platformFeePercent").value(5.0));

        // Admin endpoints
        mockMvc.perform(get("/api/v1/admin/booking-escrow/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.membershipFeePercent").value(10.0));

        mockMvc.perform(get("/api/v1/admin/booking-escrow/policy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.withdrawalMinAmount").value(50000));

        BookingEscrowConfigRequest updateReq = BookingEscrowConfigRequest.builder()
                .contractAcceptHours(48)
                .fundHours(48)
                .fundPauseMaxDays(7)
                .reviewDays(3)
                .releaseHoldDays(3)
                .revisionDays(2)
                .maxMilestones(20)
                .maxRevisionsDefault(2)
                .platformFeePercent(new BigDecimal("5.0"))
                .membershipFeePercent(new BigDecimal("10.0"))
                .withdrawalSlaDays(2)
                .withdrawalMinAmount(new BigDecimal("50000"))
                .depositMinAmount(new BigDecimal("10000"))
                .jobIntervalMinutes(60)
                .termsTemplate("Điều khoản chuẩn {PLATFORM_FEE_PERCENT}%")
                .build();

        mockMvc.perform(put("/api/v1/admin/booking-escrow/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/v1/admin/booking-escrow/config/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(configService, times(1)).resetDefaultConfig();
    }
}
