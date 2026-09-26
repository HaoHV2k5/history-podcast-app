package com.prm.contract.controller;

import com.prm.contract.dto.request.DisputeRequest;
import com.prm.contract.dto.response.DisputeResponse;
import com.prm.contract.service.DisputeService;
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
@RequestMapping("/api/v1/disputes")
@RequiredArgsConstructor
@Tag(name = "Dispute Management", description = "Quản lý và thao tác dữ liệu Dispute")
public class DisputeController {

    private final DisputeService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Dispute", description = "Trả về danh sách bản ghi Dispute")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getAll() {
        List<DisputeResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Dispute theo ID", description = "Trả về chi tiết một bản ghi Dispute")
    public ResponseEntity<ApiResponse<DisputeResponse>> getById(@PathVariable Long id) {
        DisputeResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Dispute", description = "Tạo mới một bản ghi Dispute trong hệ thống")
    public ResponseEntity<ApiResponse<DisputeResponse>> create(@Valid @RequestBody DisputeRequest request) {
        DisputeResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Dispute", description = "Cập nhật thông tin bản ghi Dispute theo ID")
    public ResponseEntity<ApiResponse<DisputeResponse>> update(@PathVariable Long id, @Valid @RequestBody DisputeRequest request) {
        DisputeResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Dispute", description = "Xóa bản ghi Dispute khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
