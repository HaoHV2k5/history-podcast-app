package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.DisputeStatus;
import com.prm.contract.dto.request.CounterEvidenceRequest;
import com.prm.contract.dto.request.DisputeRequest;
import com.prm.contract.dto.request.OpenDisputeRequest;
import com.prm.contract.dto.request.ResolveDisputeRequest;
import com.prm.contract.dto.response.DisputeResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DisputeService {

    DisputeResponse openDispute(OpenDisputeRequest request);

    DisputeResponse submitCounterEvidence(Long disputeId, CounterEvidenceRequest request);

    DisputeResponse resolveDispute(Long disputeId, ResolveDisputeRequest request);

    DisputeResponse getDisputeById(Long id);

    List<DisputeResponse> getDisputesByContract(Long contractId);

    PageResponse<DisputeResponse> getAllDisputes(DisputeStatus status, Pageable pageable);

    // Legacy CRUD methods for backward compatibility
    List<DisputeResponse> findAll();
    DisputeResponse findById(Long id);
    DisputeResponse create(DisputeRequest request);
    DisputeResponse update(Long id, DisputeRequest request);
    void delete(Long id);
}
