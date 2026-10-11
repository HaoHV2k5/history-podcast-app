package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.dto.response.*;
import com.prm.contract.service.AdminRevenueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/revenue/milestones")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin - Milestone Revenue Management", description = "[Admin Only] Quản trị & Đối soát Doanh thu Phí sàn Milestone")
public class AdminRevenueController {

    private final AdminRevenueService adminRevenueService;

    @GetMapping("/summary")
    @Operation(summary = "1. Lấy tổng quan KPI doanh thu milestone", description = "Trả về tổng doanh thu thực thu (5%), tiền đang giữ hộ trong Escrow, GMV và số lượng milestone theo trạng thái")
    public ResponseEntity<ApiResponse<MilestoneRevenueSummaryResponse>> getSummary(
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate
    ) {
        MilestoneRevenueSummaryResponse response = adminRevenueService.getRevenueSummary(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy tổng quan KPI doanh thu milestone thành công", response));
    }

    @GetMapping("/chart")
    @Operation(summary = "2. Lấy dữ liệu biểu đồ xu hướng doanh thu", description = "Nhóm doanh thu theo chu kỳ (DAY, WEEK, MONTH) và phân bổ theo VOICE / CONTENT")
    public ResponseEntity<ApiResponse<List<MilestoneRevenueChartPointResponse>>> getChart(
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(defaultValue = "DAY") String groupBy
    ) {
        List<MilestoneRevenueChartPointResponse> response = adminRevenueService.getRevenueChart(startDate, endDate, groupBy);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu biểu đồ doanh thu thành công", response));
    }

    @GetMapping("/ledger")
    @Operation(summary = "3. Sổ cái đối soát chi tiết milestone", description = "Danh sách chi tiết các khoản phí milestone có phân trang, hỗ trợ tìm kiếm từ khóa và lọc đa chiều")
    public ResponseEntity<ApiResponse<PageResponse<AdminMilestoneRevenueResponse>>> getLedger(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) EscrowStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "releasedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String validSortBy = "createdAt".equalsIgnoreCase(sortBy) || "releasedAt".equalsIgnoreCase(sortBy) || "fundedAt".equalsIgnoreCase(sortBy)
                ? sortBy : "releasedAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, validSortBy));

        PageResponse<AdminMilestoneRevenueResponse> response = adminRevenueService.getRevenueLedger(
                contractId, status, serviceType, startDate, endDate, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy sổ cái chi tiết doanh thu milestone thành công", response));
    }

    @GetMapping("/top-contributors")
    @Operation(summary = "4. Bảng xếp hạng đối tác đóng góp doanh thu lớn nhất", description = "Lấy top Creator chi tiêu nhiều nhất hoặc Freelancer mang lại doanh thu cao nhất")
    public ResponseEntity<ApiResponse<List<TopRevenueContributorResponse>>> getTopContributors(
            @RequestParam(defaultValue = "CREATOR") String role,
            @RequestParam(defaultValue = "5") int limit
    ) {
        List<TopRevenueContributorResponse> response = adminRevenueService.getTopContributors(role, limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách top đối tác đóng góp doanh thu thành công", response));
    }

    @GetMapping("/export")
    @Operation(summary = "5. Xuất file CSV đối soát tài chính", description = "Tải file CSV danh sách milestone theo bộ lọc, định dạng chuẩn UTF-8 BOM hiển thị tiếng Việt trên Excel")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) EscrowStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(required = false) String search
    ) {
        byte[] csvBytes = adminRevenueService.exportRevenueCsv(contractId, status, serviceType, startDate, endDate, search);
        String filename = "milestone-revenue-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }
}
