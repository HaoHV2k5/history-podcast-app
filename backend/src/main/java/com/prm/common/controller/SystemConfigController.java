package com.prm.common.controller;

import com.prm.common.dto.request.SystemConfigRequest;
import com.prm.common.dto.response.SystemConfigResponse;
import com.prm.common.service.SystemConfigService;
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
@RequestMapping("/api/v1/system-configs")
@RequiredArgsConstructor
@Tag(name = "SystemConfig Management", description = "Quản lý và thao tác dữ liệu SystemConfig")
public class SystemConfigController {

    private final SystemConfigService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả SystemConfig", description = "Trả về danh sách bản ghi SystemConfig")
    public ResponseEntity<ApiResponse<List<SystemConfigResponse>>> getAll() {
        List<SystemConfigResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết SystemConfig theo ID", description = "Trả về chi tiết một bản ghi SystemConfig")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> getById(@PathVariable Long id) {
        SystemConfigResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới SystemConfig", description = "Tạo mới một bản ghi SystemConfig trong hệ thống")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> create(@Valid @RequestBody SystemConfigRequest request) {
        SystemConfigResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật SystemConfig", description = "Cập nhật thông tin bản ghi SystemConfig theo ID")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> update(@PathVariable Long id, @Valid @RequestBody SystemConfigRequest request) {
        SystemConfigResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa SystemConfig", description = "Xóa bản ghi SystemConfig khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
