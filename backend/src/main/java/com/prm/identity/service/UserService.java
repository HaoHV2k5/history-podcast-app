package com.prm.identity.service;

import com.prm.common.dto.PageResponse;
import com.prm.identity.dto.request.*;
import com.prm.identity.dto.response.UserResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {

    // === Legacy / Generic CRUD ===
    List<UserResponse> findAll();
    UserResponse findById(Long id);
    UserResponse create(UserRequest request);
    UserResponse update(Long id, UserRequest request);
    void delete(Long id);

    // === User Profile Self-Management ===
    UserResponse getMyProfile();
    UserResponse updateMyProfile(UpdateUserProfileRequest request);
    UserResponse uploadAvatar(MultipartFile file);
    void changePassword(ChangePasswordRequest request);

    // === Admin User Management ===
    PageResponse<UserResponse> searchUsers(String keyword, String role, String status, Pageable pageable);
    UserResponse adminCreateUser(AdminCreateUserRequest request);
    UserResponse adminUpdateUser(Long id, AdminUpdateUserRequest request);
    UserResponse adminUpdateStatus(Long id, AdminUpdateUserStatusRequest request);
    UserResponse adminUpdateRole(Long id, AdminUpdateUserRoleRequest request);
    void adminDeleteUser(Long id);
}
