package com.prm.wallet.service;

import com.prm.common.dto.PageResponse;
import com.prm.wallet.dto.request.WithdrawalRequest;
import com.prm.wallet.dto.response.WithdrawalResponse;
import org.springframework.data.domain.Pageable;

public interface WithdrawalService {

    /**
     * Creator tạo yêu cầu rút tiền về tài khoản ngân hàng chính chủ.
     */
    WithdrawalResponse requestWithdrawal(WithdrawalRequest request);

    /**
     * Creator xem lịch sử yêu cầu rút tiền của mình (phân trang).
     */
    PageResponse<WithdrawalResponse> getMyWithdrawals(Pageable pageable);

    /**
     * Admin xem danh sách tất cả yêu cầu rút tiền (phân trang).
     */
    PageResponse<WithdrawalResponse> getAllWithdrawals(Pageable pageable);

    /**
     * Admin tiếp nhận yêu cầu rút tiền (chuyển sang PROCESSING).
     */
    WithdrawalResponse processWithdrawal(Long id);

    /**
     * Admin xác nhận chuyển khoản ngân hàng thành công (chuyển sang COMPLETED, trừ pending_balance).
     */
    WithdrawalResponse completeWithdrawal(Long id);

    /**
     * Admin báo lỗi chuyển khoản ngân hàng thất bại (chuyển sang FAILED, hoàn tiền về available_balance).
     */
    WithdrawalResponse failWithdrawal(Long id, String reason);

    /**
     * Admin từ chối yêu cầu rút tiền (chuyển sang REJECTED, hoàn tiền về available_balance).
     */
    WithdrawalResponse rejectWithdrawal(Long id, String reason);
}
