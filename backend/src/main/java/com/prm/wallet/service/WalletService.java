package com.prm.wallet.service;

import com.prm.common.dto.PageResponse;
import com.prm.payment.dto.request.CreateDepositRequest;
import com.prm.payment.dto.response.PaymentUrlResponse;
import com.prm.wallet.dto.response.WalletResponse;
import com.prm.wallet.dto.response.WalletTransactionResponse;
import org.springframework.data.domain.Pageable;

public interface WalletService {

    /**
     * Lấy thông tin ví của người dùng đang đăng nhập (Tự động khởi tạo nếu chưa có).
     */
    WalletResponse getMyWallet();

    /**
     * Lấy lịch sử biến động số dư ví của người dùng hiện tại (phân trang).
     */
    PageResponse<WalletTransactionResponse> getMyTransactions(Pageable pageable);

    /**
     * Tạo yêu cầu nạp tiền ví qua VNPay Sandbox.
     */
    PaymentUrlResponse createDeposit(CreateDepositRequest request, String ipAddress);

    /**
     * Xem thông tin ví theo ID (Dành cho Quản trị viên).
     */
    WalletResponse findById(Long id);
}
