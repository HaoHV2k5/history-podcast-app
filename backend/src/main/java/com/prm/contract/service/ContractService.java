package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.dto.request.CreateContractRequest;
import com.prm.contract.dto.request.UpdateContractRequest;
import com.prm.contract.dto.response.ContractResponse;
import org.springframework.data.domain.Pageable;

public interface ContractService {

    ContractResponse createAndSendContract(CreateContractRequest request);

    ContractResponse updatePendingContract(Long contractId, UpdateContractRequest request);

    ContractResponse getContractById(Long id);

    PageResponse<ContractResponse> getMyContracts(ContractStatus status, Pageable pageable);

    ContractResponse acceptContract(Long contractId);

    ContractResponse rejectContract(Long contractId);

    ContractResponse cancelContract(Long contractId);

    PageResponse<com.prm.contract.dto.response.MilestoneResponse> getMyMilestones(
            com.prm.contract.constant.MilestoneStatus status,
            Long contractId,
            Pageable pageable
    );

    com.prm.contract.dto.response.MyMilestoneFinancialResponse getMyMilestoneFinancials();
}
