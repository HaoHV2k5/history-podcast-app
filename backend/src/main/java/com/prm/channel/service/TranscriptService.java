package com.prm.channel.service;

import com.prm.channel.dto.request.TranscriptRequest;
import com.prm.channel.dto.response.TranscriptResponse;

import java.util.List;

public interface TranscriptService {
    List<TranscriptResponse> findAll();
    TranscriptResponse findById(Long id);
    TranscriptResponse create(TranscriptRequest request);
    TranscriptResponse update(Long id, TranscriptRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Transcript
}
