package com.prm.identity.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.dto.request.LoginRequest;
import com.prm.identity.dto.request.RegisterRequest;
import com.prm.identity.dto.response.AuthResponse;
import com.prm.identity.entity.RefreshToken;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.repository.RefreshTokenRepository;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.security.JwtProvider;
import com.prm.identity.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_NOT_MATCH);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng: " + request.getEmail());
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, "Số điện thoại đã được sử dụng: " + request.getPhone());
        }

        // Mặc định gán Role VIEWER từ RoleEnum
        Role role = roleRepository.findByName(RoleEnum.VIEWER.name())
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleEnum.VIEWER.name())
                        .description("Default Viewer Role")
                        .build()));

        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .role(role)
                .build();

        User savedUser = userRepository.save(user);

        return createAuthResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new AppException(ErrorCode.ACCOUNT_INACTIVE_OR_LOCKED);
        }

        return createAuthResponse(user);
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new AppException(ErrorCode.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }

        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OR_EXPIRED_REFRESH_TOKEN));

        if (Boolean.TRUE.equals(storedToken.getRevoked())) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.INVALID_OR_EXPIRED_REFRESH_TOKEN, "Refresh token đã hết hạn");
        }

        User user = storedToken.getUser();
        String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
        String newAccessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(), roleName);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(roleName)
                .build();
    }

    private AuthResponse createAuthResponse(User user) {
        String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(), roleName);
        String refreshToken = jwtProvider.generateRefreshToken(user.getId(), user.getEmail());

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusMillis(jwtProvider.getRefreshTokenExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(roleName)
                .build();
    }
}
