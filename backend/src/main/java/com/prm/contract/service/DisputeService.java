package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.DisputeStatus;
import com.prm.contract.dto.request.CounterEvidenceRequest;
import com.prm.contract.dto.request.OpenDisputeRequest;
import com.prm.contract.dto.request.ResolveDisputeRequest;
import com.prm.contract.dto.response.DisputeResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface DisputeService {

    Map<String, Object> uploadEvidenceFile(MultipartFile file);

    DisputeResponse openDispute(OpenDisputeRequest request);

    DisputeResponse submitCounterEvidence(Long disputeId, CounterEvidenceRequest request);

    DisputeResponse resolveDispute(Long disputeId, ResolveDisputeRequest request);

    DisputeResponse getDisputeById(Long id);

    List<DisputeResponse> getDisputesByContract(Long contractId);

    PageResponse<DisputeResponse> getAllDisputes(DisputeStatus status, Pageable pageable);
}
