package com.prm.contract.service;

import com.prm.contract.dto.request.ContractRequest;
import com.prm.contract.dto.response.ContractResponse;

import java.util.List;

public interface ContractService {
    List<ContractResponse> findAll();
    ContractResponse findById(Long id);
    ContractResponse create(ContractRequest request);
    ContractResponse update(Long id, ContractRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Contract
}
