package com.prm.channel.service;

import com.prm.channel.dto.request.AiFilterLogRequest;
import com.prm.channel.dto.response.AiFilterLogResponse;

import java.util.List;

public interface AiFilterLogService {
    List<AiFilterLogResponse> findAll();
    AiFilterLogResponse findById(Long id);
    AiFilterLogResponse create(AiFilterLogRequest request);
    AiFilterLogResponse update(Long id, AiFilterLogRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain AiFilterLog
}
