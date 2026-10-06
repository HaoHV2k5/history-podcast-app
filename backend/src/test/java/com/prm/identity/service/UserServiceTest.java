package com.prm.identity.service;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.FileStorageService;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.dto.request.*;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.mapper.UserMapper;
import com.prm.identity.repository.RefreshTokenRepository;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.service.impl.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;
    private Role sampleRole;
    private UserResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleRole = Role.builder()
                .id(1L)
                .name(RoleEnum.VIEWER.name())
                .description("Default Viewer Role")
                .build();

        sampleUser = User.builder()
                .id(10L)
                .email("user@example.com")
                .phone("0901234567")
                .fullName("Nguyen Van A")
                .passwordHash("$2a$10$hashedPassword")
                .status("ACTIVE")
                .role(sampleRole)
                .createdAt(Instant.now())
                .build();

        sampleResponse = UserResponse.builder()
                .id(10L)
                .email("user@example.com")
                .phone("0901234567")
                .fullName("Nguyen Van A")
                .roleId(1L)
                .roleName("VIEWER")
                .status("ACTIVE")
                .build();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user@example.com", null, List.of(new SimpleGrantedAuthority("ROLE_VIEWER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // =========================================================================
    // User Profile Self-Management Tests
    // =========================================================================

    @Test
    @DisplayName("getMyProfile: Lấy thông tin tài khoản hiện tại thành công")
    void testGetMyProfile_Success() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleResponse);

        UserResponse result = userService.getMyProfile();

        assertNotNull(result);
        assertEquals("user@example.com", result.getEmail());
        assertEquals("Nguyen Van A", result.getFullName());
        verify(userRepository, times(1)).findByEmail("user@example.com");
    }

    @Test
    @DisplayName("getMyProfile: Ném ngoại lệ khi không tìm thấy user")
    void testGetMyProfile_UserNotFound() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> userService.getMyProfile());
        assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    @DisplayName("updateMyProfile: Cập nhật thông tin thành công khi số điện thoại hợp lệ")
    void testUpdateMyProfile_Success() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .fullName("Nguyen Van B")
                .phone("0988888888")
                .bio("Lịch sử Việt Nam")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByPhone("0988888888")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(userMapper.toResponse(any(User.class))).thenReturn(sampleResponse);

        UserResponse result = userService.updateMyProfile(request);

        assertNotNull(result);
        verify(userMapper, times(1)).updateEntityFromProfileRequest(eq(request), eq(sampleUser));
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("updateMyProfile: Báo lỗi khi số điện thoại mới đã tồn tại trên tài khoản khác")
    void testUpdateMyProfile_DuplicatePhone_ThrowsException() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .phone("0999999999")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByPhone("0999999999")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> userService.updateMyProfile(request));
        assertEquals(ErrorCode.PHONE_ALREADY_EXISTS, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("uploadAvatar: Upload avatar thành công và cập nhật URL vào User")
    void testUploadAvatar_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", "dummy-content".getBytes());

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(fileStorageService.uploadImage(file, "users/avatars")).thenReturn("https://cloudinary.com/avatar.png");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(userMapper.toResponse(any(User.class))).thenReturn(sampleResponse);

        UserResponse result = userService.uploadAvatar(file);

        assertNotNull(result);
        assertEquals("https://cloudinary.com/avatar.png", sampleUser.getAvatarUrl());
        verify(fileStorageService, times(1)).uploadImage(file, "users/avatars");
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("changePassword: Đổi mật khẩu thành công và thu hồi tất cả refresh token cũ")
    void testChangePassword_Success() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass@123")
                .newPassword("NewPass@123")
                .confirmPassword("NewPass@123")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("OldPass@123", sampleUser.getPasswordHash())).thenReturn(true);
        when(passwordEncoder.encode("NewPass@123")).thenReturn("$2a$10$newHashedPassword");

        userService.changePassword(request);

        assertEquals("$2a$10$newHashedPassword", sampleUser.getPasswordHash());
        verify(userRepository, times(1)).save(sampleUser);
        verify(refreshTokenRepository, times(1)).revokeAllByUserId(eq(10L), any(Instant.class));
    }

    @Test
    @DisplayName("changePassword: Lỗi khi mật khẩu mới và xác nhận mật khẩu không trùng khớp")
    void testChangePassword_PasswordMismatch() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass@123")
                .newPassword("NewPass@123")
                .confirmPassword("DifferentPass@123")
                .build();

        AppException exception = assertThrows(AppException.class, () -> userService.changePassword(request));
        assertEquals(ErrorCode.PASSWORD_CONFIRM_NOT_MATCH, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("changePassword: Lỗi khi mật khẩu hiện tại không chính xác")
    void testChangePassword_OldPasswordIncorrect() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("WrongOldPass")
                .newPassword("NewPass@123")
                .confirmPassword("NewPass@123")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongOldPass", sampleUser.getPasswordHash())).thenReturn(false);

        AppException exception = assertThrows(AppException.class, () -> userService.changePassword(request));
        assertEquals(ErrorCode.OLD_PASSWORD_INCORRECT, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    // =========================================================================
    // Admin User Management Tests
    // =========================================================================

    @Test
    @DisplayName("searchUsers: Tìm kiếm và phân trang người dùng thành công")
    void testSearchUsers_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(List.of(sampleUser), pageable, 1);

        when(userRepository.searchUsers("test", "VIEWER", "ACTIVE", pageable)).thenReturn(page);
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleResponse);

        PageResponse<UserResponse> response = userService.searchUsers("test", "VIEWER", "ACTIVE", pageable);

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getItems().size());
        assertEquals("user@example.com", response.getItems().get(0).getEmail());
    }

    @Test
    @DisplayName("searchUsers: Tìm kiếm với tham số null hoặc rỗng")
    void testSearchUsers_WithNullAndEmptyParams() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(List.of(sampleUser), pageable, 1);

        when(userRepository.searchUsers(null, null, null, pageable)).thenReturn(page);
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleResponse);

        PageResponse<UserResponse> response = userService.searchUsers("   ", null, "", pageable);

        assertNotNull(response);
        verify(userRepository).searchUsers(null, null, null, pageable);
    }

    @Test
    @DisplayName("searchUsers: Tự động chuyển role và status sang chữ in hoa")
    void testSearchUsers_WithLowerCaseRoleAndStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(List.of(sampleUser), pageable, 1);

        when(userRepository.searchUsers("john", "CREATOR", "ACTIVE", pageable)).thenReturn(page);
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleResponse);

        PageResponse<UserResponse> response = userService.searchUsers(" john ", " creator ", " active ", pageable);

        assertNotNull(response);
        verify(userRepository).searchUsers("john", "CREATOR", "ACTIVE", pageable);
    }

    @Test
    @DisplayName("adminCreateUser: Admin tạo người dùng mới thành công")
    void testAdminCreateUser_Success() {
        AdminCreateUserRequest request = AdminCreateUserRequest.builder()
                .email("newuser@example.com")
                .password("User@123")
                .roleName("CREATOR")
                .status("ACTIVE")
                .fullName("Creator Demo")
                .build();

        Role creatorRole = Role.builder().id(2L).name("CREATOR").build();

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(roleRepository.findByName("CREATOR")).thenReturn(Optional.of(creatorRole));
        when(passwordEncoder.encode("User@123")).thenReturn("$2a$10$encodedUserPass");

        User createdUser = User.builder().id(11L).email("newuser@example.com").build();
        when(userMapper.toEntityFromAdminCreate(request)).thenReturn(createdUser);
        when(userRepository.save(any(User.class))).thenReturn(createdUser);
        when(userMapper.toResponse(createdUser)).thenReturn(UserResponse.builder().id(11L).email("newuser@example.com").build());

        UserResponse result = userService.adminCreateUser(request);

        assertNotNull(result);
        assertEquals("newuser@example.com", result.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("adminCreateUser: Lỗi khi email đã tồn tại")
    void testAdminCreateUser_EmailAlreadyExists() {
        AdminCreateUserRequest request = AdminCreateUserRequest.builder()
                .email("user@example.com")
                .password("Password123")
                .build();

        when(userRepository.existsByEmail("user@example.com")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> userService.adminCreateUser(request));
        assertEquals(ErrorCode.EMAIL_ALREADY_EXISTS, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("adminUpdateStatus: Cập nhật trạng thái thành công và thu hồi refresh token khi khóa")
    void testAdminUpdateStatus_LockAccount_Success() {
        // Đăng nhập quyền ADMIN với email khác
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@historypodcast.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        AdminUpdateUserStatusRequest request = AdminUpdateUserStatusRequest.builder()
                .status("LOCKED")
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleResponse);

        UserResponse result = userService.adminUpdateStatus(10L, request);

        assertNotNull(result);
        assertEquals("LOCKED", sampleUser.getStatus());
        verify(refreshTokenRepository, times(1)).revokeAllByUserId(eq(10L), any(Instant.class));
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("adminUpdateStatus: Admin không thể tự khóa tài khoản của chính mình")
    void testAdminUpdateStatus_SelfLock_ThrowsException() {
        // Admin đang thao tác trên chính tài khoản của mình
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@historypodcast.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        User adminUser = User.builder().id(1L).email("admin@historypodcast.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        AdminUpdateUserStatusRequest request = AdminUpdateUserStatusRequest.builder()
                .status("LOCKED")
                .build();

        AppException exception = assertThrows(AppException.class, () -> userService.adminUpdateStatus(1L, request));
        assertEquals(ErrorCode.CANNOT_DEACTIVATE_OWN_ACCOUNT, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("adminUpdateRole: Phân quyền vai trò mới thành công")
    void testAdminUpdateRole_Success() {
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@historypodcast.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        Role narratorRole = Role.builder().id(3L).name("NARRATOR").build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(roleRepository.findByName("NARRATOR")).thenReturn(Optional.of(narratorRole));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleResponse);

        AdminUpdateUserRoleRequest request = AdminUpdateUserRoleRequest.builder()
                .roleName("NARRATOR")
                .build();

        UserResponse result = userService.adminUpdateRole(10L, request);

        assertNotNull(result);
        assertEquals(narratorRole, sampleUser.getRole());
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("adminUpdateRole: Admin không thể tự hạ quyền của chính mình")
    void testAdminUpdateRole_SelfDemote_ThrowsException() {
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@historypodcast.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        User adminUser = User.builder().id(1L).email("admin@historypodcast.com").build();
        Role viewerRole = Role.builder().id(4L).name("VIEWER").build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(roleRepository.findByName("VIEWER")).thenReturn(Optional.of(viewerRole));

        AdminUpdateUserRoleRequest request = AdminUpdateUserRoleRequest.builder()
                .roleName("VIEWER")
                .build();

        AppException exception = assertThrows(AppException.class, () -> userService.adminUpdateRole(1L, request));
        assertEquals(ErrorCode.CANNOT_MODIFY_OWN_ROLE, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("adminDeleteUser: Admin xóa tài khoản thành công")
    void testAdminDeleteUser_Success() {
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@historypodcast.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));

        userService.adminDeleteUser(10L);

        verify(refreshTokenRepository, times(1)).revokeAllByUserId(eq(10L), any(Instant.class));
        verify(userRepository, times(1)).delete(sampleUser);
    }

    @Test
    @DisplayName("adminDeleteUser: Admin không thể tự xóa tài khoản của chính mình")
    void testAdminDeleteUser_SelfDelete_ThrowsException() {
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@historypodcast.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        User adminUser = User.builder().id(1L).email("admin@historypodcast.com").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        AppException exception = assertThrows(AppException.class, () -> userService.adminDeleteUser(1L));
        assertEquals(ErrorCode.CANNOT_DELETE_OWN_ACCOUNT, exception.getErrorCode());
        verify(userRepository, never()).delete(any(User.class));
    }
}
