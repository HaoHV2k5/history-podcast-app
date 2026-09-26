package com.prm.common.service;

import com.prm.common.dto.request.SystemConfigRequest;
import com.prm.common.dto.response.SystemConfigResponse;

import java.util.List;

public interface SystemConfigService {
    List<SystemConfigResponse> findAll();
    SystemConfigResponse findById(Long id);
    SystemConfigResponse create(SystemConfigRequest request);
    SystemConfigResponse update(Long id, SystemConfigRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain SystemConfig
}
