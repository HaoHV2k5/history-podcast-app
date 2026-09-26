package com.prm.channel.controller;

import com.prm.channel.dto.request.ArtifactRequest;
import com.prm.channel.dto.response.ArtifactResponse;
import com.prm.channel.service.ArtifactService;
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
@RequestMapping("/api/v1/artifacts")
@RequiredArgsConstructor
@Tag(name = "Artifact Management", description = "Quản lý và thao tác dữ liệu Artifact")
public class ArtifactController {

    private final ArtifactService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Artifact", description = "Trả về danh sách bản ghi Artifact")
    public ResponseEntity<ApiResponse<List<ArtifactResponse>>> getAll() {
        List<ArtifactResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Artifact theo ID", description = "Trả về chi tiết một bản ghi Artifact")
    public ResponseEntity<ApiResponse<ArtifactResponse>> getById(@PathVariable Long id) {
        ArtifactResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Artifact", description = "Tạo mới một bản ghi Artifact trong hệ thống")
    public ResponseEntity<ApiResponse<ArtifactResponse>> create(@Valid @RequestBody ArtifactRequest request) {
        ArtifactResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Artifact", description = "Cập nhật thông tin bản ghi Artifact theo ID")
    public ResponseEntity<ApiResponse<ArtifactResponse>> update(@PathVariable Long id, @Valid @RequestBody ArtifactRequest request) {
        ArtifactResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Artifact", description = "Xóa bản ghi Artifact khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
