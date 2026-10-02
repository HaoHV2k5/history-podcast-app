package com.prm.identity.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.identity.dto.request.ChangePasswordRequest;
import com.prm.identity.dto.request.UpdateUserProfileRequest;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @Test
    @DisplayName("GET /api/v1/users/me: Lấy profile của người dùng hiện tại")
    void testGetMyProfile() {
        UserResponse responseData = UserResponse.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("Nguyen Van A")
                .roleName("VIEWER")
                .build();

        when(userService.getMyProfile()).thenReturn(responseData);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.getMyProfile();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("user@example.com", response.getBody().getData().getEmail());
        verify(userService, times(1)).getMyProfile();
    }

    @Test
    @DisplayName("PUT /api/v1/users/me: Cập nhật thông tin profile của tôi")
    void testUpdateMyProfile() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .fullName("Nguyen Van B")
                .phone("0988888888")
                .bio("Lịch sử Việt Nam")
                .build();

        UserResponse responseData = UserResponse.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("Nguyen Van B")
                .phone("0988888888")
                .build();

        when(userService.updateMyProfile(any(UpdateUserProfileRequest.class))).thenReturn(responseData);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.updateMyProfile(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Nguyen Van B", response.getBody().getData().getFullName());
        verify(userService, times(1)).updateMyProfile(request);
    }

    @Test
    @DisplayName("POST /api/v1/users/me/avatar: Tải lên avatar thành công")
    void testUploadAvatar() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "my-avatar.png", "image/png", "fake-img".getBytes());

        UserResponse responseData = UserResponse.builder()
                .id(1L)
                .avatarUrl("https://cloudinary.com/users/avatars/my-avatar.png")
                .build();

        when(userService.uploadAvatar(file)).thenReturn(responseData);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.uploadAvatar(file);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("https://cloudinary.com/users/avatars/my-avatar.png", response.getBody().getData().getAvatarUrl());
        verify(userService, times(1)).uploadAvatar(file);
    }

    @Test
    @DisplayName("PUT/POST /api/v1/users/me/change-password: Đổi mật khẩu thành công")
    void testChangePassword() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass123")
                .newPassword("NewPass123")
                .confirmPassword("NewPass123")
                .build();

        doNothing().when(userService).changePassword(any(ChangePasswordRequest.class));

        ResponseEntity<ApiResponse<Void>> response = userController.changePassword(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(userService, times(1)).changePassword(request);
    }
}
