package com.prm.identity.controller;

import com.prm.identity.dto.request.KycProfileRequest;
import com.prm.identity.dto.response.KycProfileResponse;
import com.prm.identity.service.KycProfileService;
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
@RequestMapping("/api/v1/kyc-profiles")
@RequiredArgsConstructor
@Tag(name = "KycProfile Management", description = "Quản lý và thao tác dữ liệu KycProfile")
public class KycProfileController {

    private final KycProfileService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả KycProfile", description = "Trả về danh sách bản ghi KycProfile")
    public ResponseEntity<ApiResponse<List<KycProfileResponse>>> getAll() {
        List<KycProfileResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết KycProfile theo ID", description = "Trả về chi tiết một bản ghi KycProfile")
    public ResponseEntity<ApiResponse<KycProfileResponse>> getById(@PathVariable Long id) {
        KycProfileResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới KycProfile", description = "Tạo mới một bản ghi KycProfile trong hệ thống")
    public ResponseEntity<ApiResponse<KycProfileResponse>> create(@Valid @RequestBody KycProfileRequest request) {
        KycProfileResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật KycProfile", description = "Cập nhật thông tin bản ghi KycProfile theo ID")
    public ResponseEntity<ApiResponse<KycProfileResponse>> update(@PathVariable Long id, @Valid @RequestBody KycProfileRequest request) {
        KycProfileResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa KycProfile", description = "Xóa bản ghi KycProfile khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
