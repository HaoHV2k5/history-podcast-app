package com.prm.identity.controller;

import com.prm.identity.dto.request.RefreshTokenRequest;
import com.prm.identity.dto.response.RefreshTokenResponse;
import com.prm.identity.service.RefreshTokenService;
import com.prm.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/refresh-tokens")
@RequiredArgsConstructor
@Tag(name = "RefreshToken Management", description = "Quản lý và thao tác dữ liệu RefreshToken")
public class RefreshTokenController {

    private final RefreshTokenService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả RefreshToken", description = "Trả về danh sách bản ghi RefreshToken")
    public ResponseEntity<ApiResponse<List<RefreshTokenResponse>>> getAll() {
        List<RefreshTokenResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết RefreshToken theo ID", description = "Trả về chi tiết một bản ghi RefreshToken")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> getById(@PathVariable Long id) {
        RefreshTokenResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới RefreshToken", description = "Tạo mới một bản ghi RefreshToken trong hệ thống")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> create(@Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật RefreshToken", description = "Cập nhật thông tin bản ghi RefreshToken theo ID")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> update(@PathVariable Long id, @Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa RefreshToken", description = "Xóa bản ghi RefreshToken khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
