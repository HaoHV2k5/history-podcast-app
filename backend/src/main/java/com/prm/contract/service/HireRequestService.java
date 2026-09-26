package com.prm.contract.service;

import com.prm.contract.dto.request.HireRequestRequest;
import com.prm.contract.dto.response.HireRequestResponse;

import java.util.List;

public interface HireRequestService {
    List<HireRequestResponse> findAll();
    HireRequestResponse findById(Long id);
    HireRequestResponse create(HireRequestRequest request);
    HireRequestResponse update(Long id, HireRequestRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain HireRequest
}
