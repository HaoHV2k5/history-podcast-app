package com.prm.contract.service;

import com.prm.contract.dto.request.DisputeRequest;
import com.prm.contract.dto.response.DisputeResponse;

import java.util.List;

public interface DisputeService {
    List<DisputeResponse> findAll();
    DisputeResponse findById(Long id);
    DisputeResponse create(DisputeRequest request);
    DisputeResponse update(Long id, DisputeRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Dispute
}
