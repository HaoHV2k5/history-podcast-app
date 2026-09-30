package com.prm.wallet.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.wallet.dto.request.RejectWithdrawalRequest;
import com.prm.wallet.dto.request.WithdrawalRequest;
import com.prm.wallet.dto.response.WithdrawalResponse;
import com.prm.wallet.service.WithdrawalService;
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
@RequestMapping("/api/v1/withdrawals")
@RequiredArgsConstructor
@Tag(name = "Withdrawal Management", description = "Quản lý yêu cầu rút tiền của Creator và quy trình duyệt của Admin")
public class WithdrawalController {

    private final WithdrawalService withdrawalService;

    @PostMapping
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "1. Creator tạo yêu cầu rút tiền", description = "Yêu cầu rút tiền về tài khoản ngân hàng chính chủ. Đóng băng available_balance sang pending_balance.")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> requestWithdrawal(@Valid @RequestBody WithdrawalRequest request) {
        WithdrawalResponse response = withdrawalService.requestWithdrawal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo yêu cầu rút tiền thành công", response));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "2. Creator xem lịch sử rút tiền của mình", description = "Danh sách các yêu cầu rút tiền có phân trang")
    public ResponseEntity<ApiResponse<PageResponse<WithdrawalResponse>>> getMyWithdrawals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "requestedAt"));
        PageResponse<WithdrawalResponse> response = withdrawalService.getMyWithdrawals(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/admin")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "3. Admin xem toàn bộ danh sách rút tiền", description = "Tra cứu danh sách yêu cầu rút tiền toàn hệ thống có phân trang")
    public ResponseEntity<ApiResponse<PageResponse<WithdrawalResponse>>> getAllWithdrawals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "requestedAt"));
        PageResponse<WithdrawalResponse> response = withdrawalService.getAllWithdrawals(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/admin/{id}/process")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "4. Admin tiếp nhận xử lý rút tiền", description = "Chuyển trạng thái yêu cầu từ PENDING sang PROCESSING")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> processWithdrawal(@PathVariable Long id) {
        WithdrawalResponse response = withdrawalService.processWithdrawal(id);
        return ResponseEntity.ok(ApiResponse.success("Tiếp nhận yêu cầu rút tiền thành công", response));
    }

    @PatchMapping("/admin/{id}/complete")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "5. Admin xác nhận chuyển khoản thành công", description = "Chuyển trạng thái sang COMPLETED và trừ pending_balance của ví")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> completeWithdrawal(@PathVariable Long id) {
        WithdrawalResponse response = withdrawalService.completeWithdrawal(id);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận hoàn tất rút tiền thành công", response));
    }

    @PatchMapping("/admin/{id}/fail")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "6. Admin báo lỗi chuyển khoản", description = "Chuyển trạng thái sang FAILED và hoàn tiền về available_balance")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> failWithdrawal(
            @PathVariable Long id,
            @RequestBody(required = false) RejectWithdrawalRequest request
    ) {
        String reason = request != null ? request.getReason() : null;
        WithdrawalResponse response = withdrawalService.failWithdrawal(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận lỗi chuyển khoản và hoàn tiền vào ví", response));
    }

    @PatchMapping("/admin/{id}/reject")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "7. Admin từ chối yêu cầu rút tiền", description = "Chuyển trạng thái sang REJECTED và hoàn tiền về available_balance")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> rejectWithdrawal(
            @PathVariable Long id,
            @RequestBody(required = false) RejectWithdrawalRequest request
    ) {
        String reason = request != null ? request.getReason() : null;
        WithdrawalResponse response = withdrawalService.rejectWithdrawal(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối yêu cầu rút tiền thành công", response));
    }
}
