package com.prm.channel.controller;

import com.prm.channel.dto.request.ModerationReviewRequest;
import com.prm.channel.dto.response.ModerationReviewResponse;
import com.prm.channel.service.ModerationReviewService;
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
@RequestMapping("/api/v1/moderation-reviews")
@RequiredArgsConstructor
@Tag(name = "ModerationReview Management", description = "Quản lý và thao tác dữ liệu ModerationReview")
public class ModerationReviewController {

    private final ModerationReviewService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả ModerationReview", description = "Trả về danh sách bản ghi ModerationReview")
    public ResponseEntity<ApiResponse<List<ModerationReviewResponse>>> getAll() {
        List<ModerationReviewResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết ModerationReview theo ID", description = "Trả về chi tiết một bản ghi ModerationReview")
    public ResponseEntity<ApiResponse<ModerationReviewResponse>> getById(@PathVariable Long id) {
        ModerationReviewResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới ModerationReview", description = "Tạo mới một bản ghi ModerationReview trong hệ thống")
    public ResponseEntity<ApiResponse<ModerationReviewResponse>> create(@Valid @RequestBody ModerationReviewRequest request) {
        ModerationReviewResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật ModerationReview", description = "Cập nhật thông tin bản ghi ModerationReview theo ID")
    public ResponseEntity<ApiResponse<ModerationReviewResponse>> update(@PathVariable Long id, @Valid @RequestBody ModerationReviewRequest request) {
        ModerationReviewResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa ModerationReview", description = "Xóa bản ghi ModerationReview khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
