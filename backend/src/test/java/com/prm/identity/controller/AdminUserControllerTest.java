package com.prm.identity.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.identity.dto.request.*;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminUserController adminUserController;

    @Test
    @DisplayName("GET /api/v1/admin/users: Tìm kiếm và lấy danh sách người dùng phân trang")
    void testSearchUsers() {
        UserResponse user = UserResponse.builder().id(1L).email("user1@example.com").build();
        PageResponse<UserResponse> pageResponse = PageResponse.<UserResponse>builder()
                .items(List.of(user))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .build();

        when(userService.searchUsers(eq("test"), eq("VIEWER"), eq("ACTIVE"), any(Pageable.class)))
                .thenReturn(pageResponse);

        ResponseEntity<ApiResponse<PageResponse<UserResponse>>> response =
                adminUserController.searchUsers("test", "VIEWER", "ACTIVE", 0, 10, "createdAt", "desc");

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getItems().size());
    }

    @Test
    @DisplayName("GET /api/v1/admin/users/{id}: Lấy chi tiết người dùng")
    void testGetUserById() {
        UserResponse user = UserResponse.builder().id(1L).email("user1@example.com").build();
        when(userService.findById(1L)).thenReturn(user);

        ResponseEntity<ApiResponse<UserResponse>> response = adminUserController.getUserById(1L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("user1@example.com", response.getBody().getData().getEmail());
    }

    @Test
    @DisplayName("POST /api/v1/admin/users: Tạo mới người dùng")
    void testCreateUser() {
        AdminCreateUserRequest request = AdminCreateUserRequest.builder()
                .email("new@example.com")
                .password("Password123")
                .build();

        UserResponse created = UserResponse.builder().id(2L).email("new@example.com").build();
        when(userService.adminCreateUser(request)).thenReturn(created);

        ResponseEntity<ApiResponse<UserResponse>> response = adminUserController.createUser(request);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("new@example.com", response.getBody().getData().getEmail());
    }

    @Test
    @DisplayName("PUT /api/v1/admin/users/{id}: Cập nhật thông tin người dùng")
    void testUpdateUser() {
        AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .fullName("New Name")
                .build();

        UserResponse updated = UserResponse.builder().id(2L).fullName("New Name").build();
        when(userService.adminUpdateUser(2L, request)).thenReturn(updated);

        ResponseEntity<ApiResponse<UserResponse>> response = adminUserController.updateUser(2L, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("New Name", response.getBody().getData().getFullName());
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{id}/status: Cập nhật trạng thái người dùng")
    void testUpdateStatus() {
        AdminUpdateUserStatusRequest request = AdminUpdateUserStatusRequest.builder()
                .status("LOCKED")
                .build();

        UserResponse updated = UserResponse.builder().id(2L).status("LOCKED").build();
        when(userService.adminUpdateStatus(2L, request)).thenReturn(updated);

        ResponseEntity<ApiResponse<UserResponse>> response = adminUserController.updateStatus(2L, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("LOCKED", response.getBody().getData().getStatus());
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{id}/role: Cập nhật vai trò người dùng")
    void testUpdateRole() {
        AdminUpdateUserRoleRequest request = AdminUpdateUserRoleRequest.builder()
                .roleName("CREATOR")
                .build();

        UserResponse updated = UserResponse.builder().id(2L).roleName("CREATOR").build();
        when(userService.adminUpdateRole(2L, request)).thenReturn(updated);

        ResponseEntity<ApiResponse<UserResponse>> response = adminUserController.updateRole(2L, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("CREATOR", response.getBody().getData().getRoleName());
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/users/{id}: Xóa người dùng")
    void testDeleteUser() {
        doNothing().when(userService).adminDeleteUser(2L);

        ResponseEntity<ApiResponse<Void>> response = adminUserController.deleteUser(2L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(userService, times(1)).adminDeleteUser(2L);
    }
}
