package com.prm.channel.controller;

import com.prm.channel.dto.request.AiFilterLogRequest;
import com.prm.channel.dto.response.AiFilterLogResponse;
import com.prm.channel.service.AiFilterLogService;
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
@RequestMapping("/api/v1/ai-filter-logs")
@RequiredArgsConstructor
@Tag(name = "AiFilterLog Management", description = "Quản lý và thao tác dữ liệu AiFilterLog")
public class AiFilterLogController {

    private final AiFilterLogService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả AiFilterLog", description = "Trả về danh sách bản ghi AiFilterLog")
    public ResponseEntity<ApiResponse<List<AiFilterLogResponse>>> getAll() {
        List<AiFilterLogResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết AiFilterLog theo ID", description = "Trả về chi tiết một bản ghi AiFilterLog")
    public ResponseEntity<ApiResponse<AiFilterLogResponse>> getById(@PathVariable Long id) {
        AiFilterLogResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới AiFilterLog", description = "Tạo mới một bản ghi AiFilterLog trong hệ thống")
    public ResponseEntity<ApiResponse<AiFilterLogResponse>> create(@Valid @RequestBody AiFilterLogRequest request) {
        AiFilterLogResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật AiFilterLog", description = "Cập nhật thông tin bản ghi AiFilterLog theo ID")
    public ResponseEntity<ApiResponse<AiFilterLogResponse>> update(@PathVariable Long id, @Valid @RequestBody AiFilterLogRequest request) {
        AiFilterLogResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa AiFilterLog", description = "Xóa bản ghi AiFilterLog khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
