package com.prm.identity.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.identity.dto.request.*;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin User Management", description = "[Admin Only] Quản trị người dùng hệ thống: tìm kiếm, phân trang, lọc theo vai trò và trạng thái, đổi mật khẩu, phân quyền")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "1. Danh sách người dùng (Tìm kiếm & Phân trang)", description = "Lấy danh sách người dùng hệ thống có phân trang, hỗ trợ tìm kiếm theo từ khóa (email, số điện thoại, họ tên), lọc theo vai trò và trạng thái tài khoản.")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> searchUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        PageResponse<UserResponse> response = userService.searchUsers(search, role, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "2. Chi tiết người dùng theo ID", description = "Lấy toàn bộ thông tin chi tiết của một tài khoản người dùng theo ID.")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse response = userService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "3. Quản trị viên tạo người dùng mới", description = "Tạo mới một tài khoản người dùng với email, mật khẩu ban đầu, vai trò (VIEWER, CREATOR, NARRATOR, ADMIN) và trạng thái.")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        UserResponse response = userService.adminCreateUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tài khoản người dùng thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "4. Cập nhật thông tin người dùng", description = "Admin cập nhật thông tin cá nhân, vai trò hoặc trạng thái của một tài khoản người dùng theo ID.")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        UserResponse response = userService.adminUpdateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin người dùng thành công", response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "5. Cập nhật trạng thái tài khoản", description = "Admin kích hoạt, tạm khóa hoặc vô hiệu hóa tài khoản người dùng (ACTIVE, INACTIVE, LOCKED). Không cho phép admin tự khóa chính mình.")
    public ResponseEntity<ApiResponse<UserResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserStatusRequest request
    ) {
        UserResponse response = userService.adminUpdateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái người dùng thành công", response));
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "6. Phân quyền / Đổi vai trò người dùng", description = "Admin thay đổi vai trò (ADMIN, CREATOR, NARRATOR, VIEWER) cho người dùng. Không cho phép admin tự hạ quyền của chính mình.")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRoleRequest request
    ) {
        UserResponse response = userService.adminUpdateRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vai trò người dùng thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "7. Xóa tài khoản người dùng", description = "Admin xóa tài khoản người dùng khỏi hệ thống. Không cho phép admin tự xóa chính mình.")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.adminDeleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản người dùng thành công", null));
    }
}
