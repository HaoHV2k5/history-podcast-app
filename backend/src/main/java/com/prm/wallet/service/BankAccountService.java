package com.prm.wallet.service;

import com.prm.wallet.dto.request.BankAccountRequest;
import com.prm.wallet.dto.response.BankAccountResponse;

import java.util.List;

public interface BankAccountService {
    List<BankAccountResponse> findAll();
    BankAccountResponse findById(Long id);
    BankAccountResponse create(BankAccountRequest request);
    BankAccountResponse update(Long id, BankAccountRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain BankAccount
}
