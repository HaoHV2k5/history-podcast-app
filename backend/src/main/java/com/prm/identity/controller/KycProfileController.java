package com.prm.identity.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.identity.dto.request.SendEmailOtpRequest;
import com.prm.identity.dto.request.SubmitKycRequest;
import com.prm.identity.dto.request.UpdateKycStatusRequest;
import com.prm.identity.dto.request.VerifyEmailOtpRequest;
import com.prm.identity.dto.request.VerifyPhoneRequest;
import com.prm.identity.dto.response.KycProfileResponse;
import com.prm.identity.service.KycProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/kyc-profiles")
@RequiredArgsConstructor
@Tag(name = "KYC Creator Verification", description = "Quy trình xác thực danh tính và phê duyệt hồ sơ Nhà sáng tạo (Creator)")
@SecurityRequirement(name = "Bearer Authentication")
public class KycProfileController {

    private final KycProfileService service;

    @PostMapping("/otps/email")
    @Operation(summary = "1. Gửi mã OTP xác thực email", description = "Gửi mã OTP 6 số qua Brevo REST API (HTTPS port 443). Có cooldown 60 giây chống spam.")
    public ResponseEntity<ApiResponse<Void>> sendEmailOtp(@Valid @RequestBody SendEmailOtpRequest request) {
        service.sendEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi đến email của bạn", null));
    }

    @PostMapping("/otps/email/verify")
    @Operation(summary = "2. Xác thực mã OTP email", description = "Kiểm tra mã OTP 6 số nhận được trong email.")
    public ResponseEntity<ApiResponse<Void>> verifyEmailOtp(@Valid @RequestBody VerifyEmailOtpRequest request) {
        service.verifyEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực email thành công", null));
    }

    @PostMapping("/verifications/phone")
    @Operation(summary = "3. Xác thực số điện thoại", description = "Xác thực số điện thoại thông qua token Firebase Phone Auth.")
    public ResponseEntity<ApiResponse<Void>> verifyPhone(@Valid @RequestBody VerifyPhoneRequest request) {
        service.verifyPhone(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực số điện thoại thành công", null));
    }

    @PostMapping
    @Operation(summary = "4. Nộp hồ sơ đăng ký Creator", description = "Nộp thông tin định danh và tài khoản ngân hàng sau khi đã xác thực OTP thành công.")
    public ResponseEntity<ApiResponse<KycProfileResponse>> submitKyc(@Valid @RequestBody SubmitKycRequest request) {
        KycProfileResponse response = service.submitKyc(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nộp hồ sơ Creator thành công. Vui lòng chờ phê duyệt.", response));
    }

    @GetMapping("/me")
    @Operation(summary = "5. Xem hồ sơ KYC của tôi", description = "Lấy thông tin và trạng thái hồ sơ KYC của tài khoản đang đăng nhập.")
    public ResponseEntity<ApiResponse<KycProfileResponse>> getMyKycProfile() {
        KycProfileResponse response = service.getMyKycProfile();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "6. [Admin] Danh sách hồ sơ KYC", description = "Lấy danh sách hồ sơ KYC có phân trang và lọc theo trạng thái (PENDING, APPROVED, REJECTED).")
    public ResponseEntity<ApiResponse<PageResponse<KycProfileResponse>>> getKycProfiles(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<KycProfileResponse> response = service.getKycProfiles(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "7. [Admin] Phê duyệt hoặc từ chối hồ sơ KYC", description = "Duyệt hồ sơ (tự động nâng role lên CREATOR) hoặc từ chối kèm lý do.")
    public ResponseEntity<ApiResponse<KycProfileResponse>> updateKycStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateKycStatusRequest request
    ) {
        KycProfileResponse response = service.updateKycStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái hồ sơ thành công", response));
    }
}
