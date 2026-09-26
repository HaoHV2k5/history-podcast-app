package com.prm.narrator.controller;

import com.prm.narrator.dto.request.NarratorProfileRequest;
import com.prm.narrator.dto.response.NarratorProfileResponse;
import com.prm.narrator.service.NarratorProfileService;
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
@RequestMapping("/api/v1/narrator-profiles")
@RequiredArgsConstructor
@Tag(name = "NarratorProfile Management", description = "Quản lý và thao tác dữ liệu NarratorProfile")
public class NarratorProfileController {

    private final NarratorProfileService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả NarratorProfile", description = "Trả về danh sách bản ghi NarratorProfile")
    public ResponseEntity<ApiResponse<List<NarratorProfileResponse>>> getAll() {
        List<NarratorProfileResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết NarratorProfile theo ID", description = "Trả về chi tiết một bản ghi NarratorProfile")
    public ResponseEntity<ApiResponse<NarratorProfileResponse>> getById(@PathVariable Long id) {
        NarratorProfileResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới NarratorProfile", description = "Tạo mới một bản ghi NarratorProfile trong hệ thống")
    public ResponseEntity<ApiResponse<NarratorProfileResponse>> create(@Valid @RequestBody NarratorProfileRequest request) {
        NarratorProfileResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật NarratorProfile", description = "Cập nhật thông tin bản ghi NarratorProfile theo ID")
    public ResponseEntity<ApiResponse<NarratorProfileResponse>> update(@PathVariable Long id, @Valid @RequestBody NarratorProfileRequest request) {
        NarratorProfileResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa NarratorProfile", description = "Xóa bản ghi NarratorProfile khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
