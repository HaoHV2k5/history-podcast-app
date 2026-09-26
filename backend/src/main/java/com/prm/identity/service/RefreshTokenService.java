package com.prm.identity.service;

import com.prm.identity.dto.request.RefreshTokenRequest;
import com.prm.identity.dto.response.RefreshTokenResponse;

import java.util.List;

public interface RefreshTokenService {
    List<RefreshTokenResponse> findAll();
    RefreshTokenResponse findById(Long id);
    RefreshTokenResponse create(RefreshTokenRequest request);
    RefreshTokenResponse update(Long id, RefreshTokenRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain RefreshToken
}
