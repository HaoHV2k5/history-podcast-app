package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.contract.dto.request.BookingEscrowConfigRequest;
import com.prm.contract.dto.response.BookingEscrowConfigResponse;
import com.prm.contract.service.BookingEscrowConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/booking-escrow/config")
@RequiredArgsConstructor
@Tag(name = "Admin - Booking & Escrow Configuration", description = "Quản trị viên cấu hình các thông số mặc định của sàn Creator - Freelancer (Hạn phản hồi, phí sàn, thời gian duyệt, giải ngân, sửa bài)")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminBookingEscrowController {

    private final BookingEscrowConfigService configService;

    @GetMapping
    @Operation(summary = "Lấy thông số cấu hình mặc định hiện hành", description = "Xem hạn phản hồi hợp đồng, hạn ký quỹ, hạn duyệt, thời gian giữ tiền, tỉ lệ phí nền tảng,...")
    public ResponseEntity<ApiResponse<BookingEscrowConfigResponse>> getConfig() {
        BookingEscrowConfigResponse response = configService.getConfig();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping
    @Operation(summary = "Admin cập nhật thông số cấu hình mặc định", description = "Cho phép Admin thay đổi các thông số sàn (phí sàn %, hạn ký quỹ, hạn duyệt, hạn khiếu nại,...), áp dụng ngay lập tức và lưu vào Database")
    public ResponseEntity<ApiResponse<BookingEscrowConfigResponse>> updateConfig(
            @Valid @RequestBody BookingEscrowConfigRequest request
    ) {
        BookingEscrowConfigResponse response = configService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông số cấu hình thành công", response));
    }

    @PostMapping("/reset")
    @Operation(summary = "Khôi phục thông số cấu hình về mặc định ban đầu", description = "Đưa tất cả thông số sàn về giá trị mặc định của hệ thống")
    public ResponseEntity<ApiResponse<BookingEscrowConfigResponse>> resetDefaultConfig() {
        BookingEscrowConfigResponse response = configService.resetDefaultConfig();
        return ResponseEntity.ok(ApiResponse.success("Đã khôi phục các thông số về mặc định ban đầu", response));
    }
}
