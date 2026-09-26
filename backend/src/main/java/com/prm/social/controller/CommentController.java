package com.prm.social.controller;

import com.prm.social.dto.request.CommentRequest;
import com.prm.social.dto.response.CommentResponse;
import com.prm.social.service.CommentService;
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
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
@Tag(name = "Comment Management", description = "Quản lý và thao tác dữ liệu Comment")
public class CommentController {

    private final CommentService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Comment", description = "Trả về danh sách bản ghi Comment")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getAll() {
        List<CommentResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Comment theo ID", description = "Trả về chi tiết một bản ghi Comment")
    public ResponseEntity<ApiResponse<CommentResponse>> getById(@PathVariable Long id) {
        CommentResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Comment", description = "Tạo mới một bản ghi Comment trong hệ thống")
    public ResponseEntity<ApiResponse<CommentResponse>> create(@Valid @RequestBody CommentRequest request) {
        CommentResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Comment", description = "Cập nhật thông tin bản ghi Comment theo ID")
    public ResponseEntity<ApiResponse<CommentResponse>> update(@PathVariable Long id, @Valid @RequestBody CommentRequest request) {
        CommentResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Comment", description = "Xóa bản ghi Comment khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
