package com.prm.narrator.service;

import com.prm.narrator.dto.request.NarratorProfileRequest;
import com.prm.narrator.dto.response.NarratorProfileResponse;

import java.util.List;

public interface NarratorProfileService {
    List<NarratorProfileResponse> findAll();
    NarratorProfileResponse findById(Long id);
    NarratorProfileResponse create(NarratorProfileRequest request);
    NarratorProfileResponse update(Long id, NarratorProfileRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain NarratorProfile
}
