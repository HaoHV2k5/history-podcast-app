package com.prm.contract.service;

import com.prm.contract.dto.request.EscrowTransactionRequest;
import com.prm.contract.dto.response.EscrowTransactionResponse;

import java.util.List;

public interface EscrowTransactionService {
    List<EscrowTransactionResponse> findAll();
    EscrowTransactionResponse findById(Long id);
    EscrowTransactionResponse create(EscrowTransactionRequest request);
    EscrowTransactionResponse update(Long id, EscrowTransactionRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain EscrowTransaction
}
