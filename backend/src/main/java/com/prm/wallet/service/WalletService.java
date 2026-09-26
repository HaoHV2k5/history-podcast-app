package com.prm.wallet.service;

import com.prm.wallet.dto.request.WalletRequest;
import com.prm.wallet.dto.response.WalletResponse;

import java.util.List;

public interface WalletService {
    List<WalletResponse> findAll();
    WalletResponse findById(Long id);
    WalletResponse create(WalletRequest request);
    WalletResponse update(Long id, WalletRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Wallet
}
