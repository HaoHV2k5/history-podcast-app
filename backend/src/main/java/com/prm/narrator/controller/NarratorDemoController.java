package com.prm.narrator.controller;

import com.prm.narrator.dto.request.NarratorDemoRequest;
import com.prm.narrator.dto.response.NarratorDemoResponse;
import com.prm.narrator.service.NarratorDemoService;
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
@RequestMapping("/api/v1/narrator-demos")
@RequiredArgsConstructor
@Tag(name = "NarratorDemo Management", description = "Quản lý và thao tác dữ liệu NarratorDemo")
public class NarratorDemoController {

    private final NarratorDemoService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả NarratorDemo", description = "Trả về danh sách bản ghi NarratorDemo")
    public ResponseEntity<ApiResponse<List<NarratorDemoResponse>>> getAll() {
        List<NarratorDemoResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết NarratorDemo theo ID", description = "Trả về chi tiết một bản ghi NarratorDemo")
    public ResponseEntity<ApiResponse<NarratorDemoResponse>> getById(@PathVariable Long id) {
        NarratorDemoResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới NarratorDemo", description = "Tạo mới một bản ghi NarratorDemo trong hệ thống")
    public ResponseEntity<ApiResponse<NarratorDemoResponse>> create(@Valid @RequestBody NarratorDemoRequest request) {
        NarratorDemoResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật NarratorDemo", description = "Cập nhật thông tin bản ghi NarratorDemo theo ID")
    public ResponseEntity<ApiResponse<NarratorDemoResponse>> update(@PathVariable Long id, @Valid @RequestBody NarratorDemoRequest request) {
        NarratorDemoResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa NarratorDemo", description = "Xóa bản ghi NarratorDemo khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
