package com.prm.contract.service;

import com.prm.contract.dto.request.DeliverableRequest;
import com.prm.contract.dto.response.DeliverableResponse;

import java.util.List;

public interface DeliverableService {
    List<DeliverableResponse> findAll();
    DeliverableResponse findById(Long id);
    DeliverableResponse create(DeliverableRequest request);
    DeliverableResponse update(Long id, DeliverableRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Deliverable
}
