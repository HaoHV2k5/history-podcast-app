package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.dto.request.ContractRequest;
import com.prm.contract.dto.request.CreateContractRequest;
import com.prm.contract.dto.response.ContractResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ContractService {

    ContractResponse createAndSendContract(CreateContractRequest request);

    ContractResponse getContractById(Long id);

    PageResponse<ContractResponse> getMyContracts(ContractStatus status, Pageable pageable);

    ContractResponse acceptContract(Long contractId);

    ContractResponse rejectContract(Long contractId);

    ContractResponse cancelContract(Long contractId);

    // Legacy CRUD methods for backward compatibility
    List<ContractResponse> findAll();
    ContractResponse findById(Long id);
    ContractResponse create(ContractRequest request);
    ContractResponse update(Long id, ContractRequest request);
    void delete(Long id);
}
