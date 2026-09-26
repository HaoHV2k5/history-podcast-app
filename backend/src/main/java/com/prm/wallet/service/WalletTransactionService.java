package com.prm.wallet.service;

import com.prm.wallet.dto.request.WalletTransactionRequest;
import com.prm.wallet.dto.response.WalletTransactionResponse;

import java.util.List;

public interface WalletTransactionService {
    List<WalletTransactionResponse> findAll();
    WalletTransactionResponse findById(Long id);
    WalletTransactionResponse create(WalletTransactionRequest request);
    WalletTransactionResponse update(Long id, WalletTransactionRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain WalletTransaction
}
