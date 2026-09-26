package com.prm.wallet.service;

import com.prm.wallet.dto.request.WithdrawalRequest;
import com.prm.wallet.dto.response.WithdrawalResponse;

import java.util.List;

public interface WithdrawalService {
    List<WithdrawalResponse> findAll();
    WithdrawalResponse findById(Long id);
    WithdrawalResponse create(WithdrawalRequest request);
    WithdrawalResponse update(Long id, WithdrawalRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Withdrawal
}
