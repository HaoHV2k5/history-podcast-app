package com.prm.common.controller;

import com.prm.common.dto.request.AuditLogRequest;
import com.prm.common.dto.response.AuditLogResponse;
import com.prm.common.service.AuditLogService;
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
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@Tag(name = "AuditLog Management", description = "Quản lý và thao tác dữ liệu AuditLog")
public class AuditLogController {

    private final AuditLogService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả AuditLog", description = "Trả về danh sách bản ghi AuditLog")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAll() {
        List<AuditLogResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết AuditLog theo ID", description = "Trả về chi tiết một bản ghi AuditLog")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getById(@PathVariable Long id) {
        AuditLogResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới AuditLog", description = "Tạo mới một bản ghi AuditLog trong hệ thống")
    public ResponseEntity<ApiResponse<AuditLogResponse>> create(@Valid @RequestBody AuditLogRequest request) {
        AuditLogResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật AuditLog", description = "Cập nhật thông tin bản ghi AuditLog theo ID")
    public ResponseEntity<ApiResponse<AuditLogResponse>> update(@PathVariable Long id, @Valid @RequestBody AuditLogRequest request) {
        AuditLogResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa AuditLog", description = "Xóa bản ghi AuditLog khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
