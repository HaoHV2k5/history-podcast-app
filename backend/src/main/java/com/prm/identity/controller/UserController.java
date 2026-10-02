package com.prm.identity.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.identity.dto.request.ChangePasswordRequest;
import com.prm.identity.dto.request.UpdateUserProfileRequest;
import com.prm.identity.dto.request.UserRequest;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Profile & Account", description = "Quản lý hồ sơ người dùng cá nhân (Profile) và các thao tác tài khoản")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService service;

    // =========================================================================
    // User Profile Self-Management Endpoints
    // =========================================================================

    @GetMapping(value = {"/me", "/profile"})
    @Operation(summary = "1. Xem hồ sơ cá nhân", description = "Lấy thông tin chi tiết hồ sơ tài khoản của người dùng đang đăng nhập dựa trên JWT token")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile() {
        UserResponse response = service.getMyProfile();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping(value = {"/me", "/profile"})
    @Operation(summary = "2. Cập nhật hồ sơ cá nhân", description = "Cập nhật họ tên, số điện thoại, ảnh đại diện, tiểu sử của tài khoản đang đăng nhập")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(@Valid @RequestBody UpdateUserProfileRequest request) {
        UserResponse response = service.updateMyProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin hồ sơ thành công", response));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "3. Tải lên ảnh đại diện cá nhân", description = "Tải file ảnh đại diện (JPG, PNG, WEBP <= 10MB) lên Cloudinary và tự động cập nhật URL vào profile")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
            @Parameter(description = "File ảnh đại diện người dùng", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
            @RequestParam("file") MultipartFile file
    ) {
        UserResponse response = service.uploadAvatar(file);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh đại diện thành công", response));
    }

    @RequestMapping(value = {"/me/change-password", "/me/password"}, method = {RequestMethod.PUT, RequestMethod.POST})
    @Operation(summary = "4. Đổi mật khẩu cá nhân", description = "Đổi mật khẩu người dùng đang đăng nhập, kiểm tra mật khẩu hiện tại và tự động thu hồi mọi refresh token cũ")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo", null));
    }

    // =========================================================================
    // Admin / Direct CRUD Endpoints
    // =========================================================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Lấy danh sách tất cả User", description = "Trả về danh sách bản ghi User")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAll() {
        List<UserResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Lấy chi tiết User theo ID", description = "Trả về chi tiết một bản ghi User")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable Long id) {
        UserResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Tạo mới User", description = "Tạo mới một bản ghi User trong hệ thống")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody UserRequest request) {
        UserResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Cập nhật User", description = "Cập nhật thông tin bản ghi User theo ID")
    public ResponseEntity<ApiResponse<UserResponse>> update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        UserResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Xóa User", description = "Xóa bản ghi User khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
