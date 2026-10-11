package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.contract.dto.response.BookingEscrowConfigResponse;
import com.prm.contract.service.BookingEscrowConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/booking-escrow/policy")
@RequiredArgsConstructor
@Tag(name = "Booking & Escrow Public Policy", description = "Chính sách công khai về phí sàn, thời hạn hợp đồng, ký quỹ và giải ngân")
public class BookingEscrowPolicyController {

    private final BookingEscrowConfigService configService;

    @GetMapping
    @Operation(summary = "Xem chính sách & thông số sàn công khai", description = "Dành cho khách vãng lai, Creator và Freelancer tra cứu biểu phí sàn (5%), thời hạn phản hồi hợp đồng, duyệt bài và giải ngân")
    public ResponseEntity<ApiResponse<BookingEscrowConfigResponse>> getPublicPolicy() {
        BookingEscrowConfigResponse response = configService.getConfig();
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chính sách & biểu phí sàn thành công", response));
    }
}
