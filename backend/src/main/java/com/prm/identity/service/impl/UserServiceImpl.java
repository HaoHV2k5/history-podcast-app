package com.prm.identity.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.exception.ResourceNotFoundException;
import com.prm.common.service.FileStorageService;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.dto.request.*;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.mapper.UserMapper;
import com.prm.identity.repository.RefreshTokenRepository;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.service.UserService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository repository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper mapper;
    private final EntityManager entityManager;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    // =========================================================================
    // Legacy / Generic CRUD
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Override
    public UserResponse create(UserRequest request) {
        User entity = mapper.toEntity(request);
        if (request.getRoleId() != null) {
            entity.setRole(entityManager.getReference(Role.class, request.getRoleId()));
        }
        User saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public UserResponse update(Long id, UserRequest request) {
        User entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getRoleId() != null) {
            entity.setRole(entityManager.getReference(Role.class, request.getRoleId()));
        }
        User updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        repository.deleteById(id);
    }

    // =========================================================================
    // User Profile Self-Management
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMyProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản: " + email));
        return mapper.toResponse(user);
    }

    @Override
    public UserResponse updateMyProfile(UpdateUserProfileRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản: " + email));

        if (StringUtils.hasText(request.getPhone())) {
            String newPhone = request.getPhone().trim();
            if (!newPhone.equals(user.getPhone()) && repository.existsByPhone(newPhone)) {
                throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, "Số điện thoại đã được đăng ký bởi tài khoản khác: " + newPhone);
            }
            user.setPhone(newPhone);
        }

        mapper.updateEntityFromProfileRequest(request, user);
        user.setUpdatedAt(Instant.now());
        User updated = repository.save(user);
        log.info("User {} updated profile successfully", email);
        return mapper.toResponse(updated);
    }

    @Override
    public UserResponse uploadAvatar(MultipartFile file) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản: " + email));

        String avatarUrl = fileStorageService.uploadImage(file, "users/avatars");
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(Instant.now());
        User updated = repository.save(user);
        log.info("User {} uploaded new avatar: {}", email, avatarUrl);
        return mapper.toResponse(updated);
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_NOT_MATCH);
        }

        String email = SecurityUtils.getCurrentUserEmail();
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        repository.save(user);

        // Thu hồi toàn bộ Refresh Tokens cũ nhằm bảo vệ tài khoản
        refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
        log.info("User {} changed password successfully and revoked all refresh tokens", email);
    }

    // =========================================================================
    // Admin User Management
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> searchUsers(String keyword, String role, String status, Pageable pageable) {
        String sanitizedKeyword = StringUtils.hasText(keyword) ? keyword.trim() : null;
        String sanitizedRole = StringUtils.hasText(role) ? role.trim() : null;
        String sanitizedStatus = StringUtils.hasText(status) ? status.trim() : null;

        Page<User> page = repository.searchUsers(sanitizedKeyword, sanitizedRole, sanitizedStatus, pageable);
        List<UserResponse> mappedItems = page.getContent().stream()
                .map(mapper::toResponse)
                .toList();
        return PageResponse.of(page, mappedItems);
    }

    @Override
    public UserResponse adminCreateUser(AdminCreateUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (repository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã tồn tại trên hệ thống: " + email);
        }

        if (StringUtils.hasText(request.getPhone())) {
            String phone = request.getPhone().trim();
            if (repository.existsByPhone(phone)) {
                throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, "Số điện thoại đã được đăng ký: " + phone);
            }
        }

        Role role = resolveRole(request.getRoleId(), request.getRoleName());
        String status = StringUtils.hasText(request.getStatus()) ? request.getStatus().trim().toUpperCase() : "ACTIVE";

        User user = mapper.toEntityFromAdminCreate(request);
        user.setEmail(email);
        if (StringUtils.hasText(request.getPhone())) {
            user.setPhone(request.getPhone().trim());
        }
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setStatus(status);
        user.setCreatedAt(Instant.now());

        User saved = repository.save(user);
        log.info("Admin created new user ID {}: email={}, role={}", saved.getId(), saved.getEmail(), role.getName());
        return mapper.toResponse(saved);
    }

    @Override
    public UserResponse adminUpdateUser(Long id, AdminUpdateUserRequest request) {
        User user = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy user với id: " + id));

        String currentAdminEmail = SecurityUtils.getCurrentUserEmail();

        if (StringUtils.hasText(request.getPhone())) {
            String newPhone = request.getPhone().trim();
            if (!newPhone.equals(user.getPhone()) && repository.existsByPhone(newPhone)) {
                throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, "Số điện thoại đã tồn tại: " + newPhone);
            }
            user.setPhone(newPhone);
        }

        if (StringUtils.hasText(request.getStatus())) {
            String newStatus = request.getStatus().trim().toUpperCase();
            if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && !"ACTIVE".equalsIgnoreCase(newStatus)) {
                throw new AppException(ErrorCode.CANNOT_DEACTIVATE_OWN_ACCOUNT);
            }
            user.setStatus(newStatus);
            if (!"ACTIVE".equalsIgnoreCase(newStatus)) {
                refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
            }
        }

        if (request.getRoleId() != null || StringUtils.hasText(request.getRoleName())) {
            Role targetRole = resolveRole(request.getRoleId(), request.getRoleName());
            if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && !RoleEnum.ADMIN.name().equalsIgnoreCase(targetRole.getName())) {
                throw new AppException(ErrorCode.CANNOT_MODIFY_OWN_ROLE);
            }
            user.setRole(targetRole);
        }

        mapper.updateEntityFromAdminUpdate(request, user);
        user.setUpdatedAt(Instant.now());
        User updated = repository.save(user);
        log.info("Admin updated user ID {}: {}", id, user.getEmail());
        return mapper.toResponse(updated);
    }

    @Override
    public UserResponse adminUpdateStatus(Long id, AdminUpdateUserStatusRequest request) {
        User user = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy user với id: " + id));

        String currentAdminEmail = SecurityUtils.getCurrentUserEmail();
        String newStatus = request.getStatus().trim().toUpperCase();

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && !"ACTIVE".equalsIgnoreCase(newStatus)) {
            throw new AppException(ErrorCode.CANNOT_DEACTIVATE_OWN_ACCOUNT);
        }

        user.setStatus(newStatus);
        user.setUpdatedAt(Instant.now());

        if (!"ACTIVE".equalsIgnoreCase(newStatus)) {
            refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
        }

        User updated = repository.save(user);
        log.info("Admin updated status for user ID {} to {}", id, newStatus);
        return mapper.toResponse(updated);
    }

    @Override
    public UserResponse adminUpdateRole(Long id, AdminUpdateUserRoleRequest request) {
        User user = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy user với id: " + id));

        String currentAdminEmail = SecurityUtils.getCurrentUserEmail();
        Role targetRole = resolveRole(request.getRoleId(), request.getRoleName());

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && !RoleEnum.ADMIN.name().equalsIgnoreCase(targetRole.getName())) {
            throw new AppException(ErrorCode.CANNOT_MODIFY_OWN_ROLE);
        }

        user.setRole(targetRole);
        user.setUpdatedAt(Instant.now());
        User updated = repository.save(user);
        log.info("Admin changed role for user ID {} to {}", id, targetRole.getName());
        return mapper.toResponse(updated);
    }

    @Override
    public void adminDeleteUser(Long id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy user với id: " + id));

        String currentAdminEmail = SecurityUtils.getCurrentUserEmail();
        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new AppException(ErrorCode.CANNOT_DELETE_OWN_ACCOUNT);
        }

        refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
        repository.delete(user);
        log.info("Admin deleted user ID {}: {}", id, user.getEmail());
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private Role resolveRole(Long roleId, String roleName) {
        if (roleId != null) {
            return roleRepository.findById(roleId)
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Không tìm thấy Role với id: " + roleId));
        }
        if (StringUtils.hasText(roleName)) {
            return roleRepository.findByName(roleName.trim().toUpperCase())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Không tìm thấy Role: " + roleName));
        }
        return roleRepository.findByName(RoleEnum.VIEWER.name())
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleEnum.VIEWER.name())
                        .description("Default Viewer Role")
                        .build()));
    }
}
