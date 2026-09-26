package com.prm.contract.controller;

import com.prm.contract.dto.request.DeliverableRequest;
import com.prm.contract.dto.response.DeliverableResponse;
import com.prm.contract.service.DeliverableService;
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
@RequestMapping("/api/v1/deliverables")
@RequiredArgsConstructor
@Tag(name = "Deliverable Management", description = "Quản lý và thao tác dữ liệu Deliverable")
public class DeliverableController {

    private final DeliverableService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Deliverable", description = "Trả về danh sách bản ghi Deliverable")
    public ResponseEntity<ApiResponse<List<DeliverableResponse>>> getAll() {
        List<DeliverableResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Deliverable theo ID", description = "Trả về chi tiết một bản ghi Deliverable")
    public ResponseEntity<ApiResponse<DeliverableResponse>> getById(@PathVariable Long id) {
        DeliverableResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Deliverable", description = "Tạo mới một bản ghi Deliverable trong hệ thống")
    public ResponseEntity<ApiResponse<DeliverableResponse>> create(@Valid @RequestBody DeliverableRequest request) {
        DeliverableResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Deliverable", description = "Cập nhật thông tin bản ghi Deliverable theo ID")
    public ResponseEntity<ApiResponse<DeliverableResponse>> update(@PathVariable Long id, @Valid @RequestBody DeliverableRequest request) {
        DeliverableResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Deliverable", description = "Xóa bản ghi Deliverable khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
