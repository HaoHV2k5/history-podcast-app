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
@RequiredArgsConstructor
@Tag(name = "Booking & Escrow Policy Configuration", description = "Tra cứu công khai và Quản trị thông số chính sách toàn hệ thống (Đặt hàng nội dung 5%, Ký quỹ Milestone tối đa 20 mốc, Gói hội viên kênh 10%, Cam kết SLA rút tiền 2 ngày)")
public class BookingEscrowConfigController {

    private final BookingEscrowConfigService configService;

    @GetMapping({"/api/v1/booking-escrow/policy", "/api/v1/policies/booking-escrow"})
    @Operation(summary = "1. [Public] Xem chính sách & thông số nền tảng công khai",
               description = "Tra cứu biểu phí đặt hàng nội dung (5%), tối đa 20 Milestone, tự động duyệt sau 3 ngày, phí Gói hội viên kênh (10% sàn / 90% Creator) và cam kết xử lý rút tiền tối đa 2 ngày")
    public ResponseEntity<ApiResponse<BookingEscrowConfigResponse>> getPublicPolicy() {
        BookingEscrowConfigResponse response = configService.getConfig();
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chính sách & biểu phí nền tảng thành công", response));
    }

    @GetMapping({"/api/v1/admin/booking-escrow/config", "/api/v1/admin/booking-escrow/policy"})
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "2. [Admin] Lấy thông số cấu hình chính sách nền tảng hiện hành",
               description = "Xem hạn phản hồi hợp đồng, hạn ký quỹ, hạn duyệt, phí đặt hàng (5%), phí hội viên (10%), SLA rút tiền (2 ngày) và văn bản điều khoản đã nội suy")
    public ResponseEntity<ApiResponse<BookingEscrowConfigResponse>> getConfig() {
        BookingEscrowConfigResponse response = configService.getConfig();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping({"/api/v1/admin/booking-escrow/config", "/api/v1/admin/booking-escrow/policy"})
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "3. [Admin] Cập nhật thông số cấu hình chính sách nền tảng",
               description = "Cho phép Admin thay đổi các thông số sàn (phí đặt hàng %, số milestone tối đa, phí hội viên %, SLA rút tiền,...), áp dụng ngay lập tức và lưu đồng bộ vào booking_escrow_configs + system_configs")
    public ResponseEntity<ApiResponse<BookingEscrowConfigResponse>> updateConfig(
            @Valid @RequestBody BookingEscrowConfigRequest request
    ) {
        BookingEscrowConfigResponse response = configService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông số cấu hình thành công", response));
    }

    @PostMapping({"/api/v1/admin/booking-escrow/config/reset", "/api/v1/admin/booking-escrow/policy/reset"})
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "4. [Admin] Khôi phục thông số cấu hình về mặc định chuẩn",
               description = "Đưa tất cả thông số sàn về giá trị mặc định chuẩn (5% phí đặt hàng, tối đa 20 mốc, 10% phí hội viên, 2 ngày SLA rút tiền)")
    public ResponseEntity<ApiResponse<BookingEscrowConfigResponse>> resetDefaultConfig() {
        BookingEscrowConfigResponse response = configService.resetDefaultConfig();
        return ResponseEntity.ok(ApiResponse.success("Đã khôi phục các thông số về mặc định ban đầu", response));
    }
}
