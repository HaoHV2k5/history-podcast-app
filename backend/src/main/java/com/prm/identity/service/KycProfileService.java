package com.prm.identity.service;

import com.prm.identity.dto.request.KycProfileRequest;
import com.prm.identity.dto.response.KycProfileResponse;

import java.util.List;

public interface KycProfileService {
    List<KycProfileResponse> findAll();
    KycProfileResponse findById(Long id);
    KycProfileResponse create(KycProfileRequest request);
    KycProfileResponse update(Long id, KycProfileRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain KycProfile
}
