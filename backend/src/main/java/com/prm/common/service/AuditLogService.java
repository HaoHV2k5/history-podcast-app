package com.prm.common.service;

import com.prm.common.dto.request.AuditLogRequest;
import com.prm.common.dto.response.AuditLogResponse;

import java.util.List;

public interface AuditLogService {
    List<AuditLogResponse> findAll();
    AuditLogResponse findById(Long id);
    AuditLogResponse create(AuditLogRequest request);
    AuditLogResponse update(Long id, AuditLogRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain AuditLog
}
