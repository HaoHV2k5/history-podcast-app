package com.prm.contract.controller;

import com.prm.contract.dto.request.HireRequestRequest;
import com.prm.contract.dto.response.HireRequestResponse;
import com.prm.contract.service.HireRequestService;
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
@RequestMapping("/api/v1/hire-requests")
@RequiredArgsConstructor
@Tag(name = "HireRequest Management", description = "Quản lý và thao tác dữ liệu HireRequest")
public class HireRequestController {

    private final HireRequestService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả HireRequest", description = "Trả về danh sách bản ghi HireRequest")
    public ResponseEntity<ApiResponse<List<HireRequestResponse>>> getAll() {
        List<HireRequestResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết HireRequest theo ID", description = "Trả về chi tiết một bản ghi HireRequest")
    public ResponseEntity<ApiResponse<HireRequestResponse>> getById(@PathVariable Long id) {
        HireRequestResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới HireRequest", description = "Tạo mới một bản ghi HireRequest trong hệ thống")
    public ResponseEntity<ApiResponse<HireRequestResponse>> create(@Valid @RequestBody HireRequestRequest request) {
        HireRequestResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật HireRequest", description = "Cập nhật thông tin bản ghi HireRequest theo ID")
    public ResponseEntity<ApiResponse<HireRequestResponse>> update(@PathVariable Long id, @Valid @RequestBody HireRequestRequest request) {
        HireRequestResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa HireRequest", description = "Xóa bản ghi HireRequest khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
