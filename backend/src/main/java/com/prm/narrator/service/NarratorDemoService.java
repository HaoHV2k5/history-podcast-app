package com.prm.narrator.service;

import com.prm.narrator.dto.request.NarratorDemoRequest;
import com.prm.narrator.dto.response.NarratorDemoResponse;

import java.util.List;

public interface NarratorDemoService {
    List<NarratorDemoResponse> findAll();
    NarratorDemoResponse findById(Long id);
    NarratorDemoResponse create(NarratorDemoRequest request);
    NarratorDemoResponse update(Long id, NarratorDemoRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain NarratorDemo
}
