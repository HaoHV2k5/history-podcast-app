package com.prm.wallet.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.payment.dto.request.CreateDepositRequest;
import com.prm.payment.dto.response.PaymentUrlResponse;
import com.prm.wallet.dto.response.WalletResponse;
import com.prm.wallet.dto.response.WalletTransactionResponse;
import com.prm.wallet.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallet Management", description = "Quản lý ví số dư nội bộ, lịch sử giao dịch và nạp tiền")
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "1. Xem thông tin ví của tôi", description = "Lấy số dư khả dụng (availableBalance) và số dư đóng băng rút tiền (pendingBalance)")
    public ResponseEntity<ApiResponse<WalletResponse>> getMyWallet() {
        WalletResponse response = walletService.getMyWallet();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/transactions")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "2. Xem lịch sử biến động số dư ví (phân trang)", description = "Lấy danh sách các giao dịch nạp tiền, mua hội viên, nhận doanh thu, rút tiền có phân trang")
    public ResponseEntity<ApiResponse<PageResponse<WalletTransactionResponse>>> getMyTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<WalletTransactionResponse> response = walletService.getMyTransactions(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/me/deposits")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "3. Khởi tạo yêu cầu nạp tiền vào ví", description = "Tạo lệnh nạp tiền và trả về URL thanh toán VNPay Sandbox")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> createDeposit(
            @Valid @RequestBody CreateDepositRequest request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = servletRequest.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isBlank() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = servletRequest.getRemoteAddr();
        }
        PaymentUrlResponse response = walletService.createDeposit(request, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo yêu cầu nạp tiền thành công", response));
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "4. Tra cứu thông tin ví theo ID (Dành cho Admin)", description = "Quản trị viên xem thông tin ví của người dùng bất kỳ")
    public ResponseEntity<ApiResponse<WalletResponse>> getById(@PathVariable Long id) {
        WalletResponse response = walletService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
