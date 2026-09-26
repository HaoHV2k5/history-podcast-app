package com.prm.identity.service;

import com.prm.identity.dto.request.LoginRequest;
import com.prm.identity.dto.request.RegisterRequest;
import com.prm.identity.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
}
