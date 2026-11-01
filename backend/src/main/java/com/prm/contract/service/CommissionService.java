package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.contract.dto.request.CreateCommissionRequest;
import com.prm.contract.dto.request.RejectCommissionRequest;
import com.prm.contract.dto.response.CommissionResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommissionService {

    CommissionResponse create(CreateCommissionRequest request);

    CommissionResponse findById(Long id);

    PageResponse<CommissionResponse> getMySentRequests(String status, Pageable pageable);

    PageResponse<CommissionResponse> getMyReceivedRequests(String status, Pageable pageable);

    PageResponse<CommissionResponse> getMyCommissions(String status, Pageable pageable);

    CommissionResponse acceptCommission(Long id);

    CommissionResponse rejectCommission(Long id, RejectCommissionRequest request);

    CommissionResponse cancelCommission(Long id);

    List<CommissionResponse> findAll();

    CommissionResponse update(Long id, CreateCommissionRequest request);

    void delete(Long id);
}
