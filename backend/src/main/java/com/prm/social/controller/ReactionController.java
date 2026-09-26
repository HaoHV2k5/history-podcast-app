package com.prm.social.controller;

import com.prm.social.dto.request.ReactionRequest;
import com.prm.social.dto.response.ReactionResponse;
import com.prm.social.service.ReactionService;
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
@RequestMapping("/api/v1/reactions")
@RequiredArgsConstructor
@Tag(name = "Reaction Management", description = "Quản lý và thao tác dữ liệu Reaction")
public class ReactionController {

    private final ReactionService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Reaction", description = "Trả về danh sách bản ghi Reaction")
    public ResponseEntity<ApiResponse<List<ReactionResponse>>> getAll() {
        List<ReactionResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Reaction theo ID", description = "Trả về chi tiết một bản ghi Reaction")
    public ResponseEntity<ApiResponse<ReactionResponse>> getById(@PathVariable Long id) {
        ReactionResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Reaction", description = "Tạo mới một bản ghi Reaction trong hệ thống")
    public ResponseEntity<ApiResponse<ReactionResponse>> create(@Valid @RequestBody ReactionRequest request) {
        ReactionResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Reaction", description = "Cập nhật thông tin bản ghi Reaction theo ID")
    public ResponseEntity<ApiResponse<ReactionResponse>> update(@PathVariable Long id, @Valid @RequestBody ReactionRequest request) {
        ReactionResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Reaction", description = "Xóa bản ghi Reaction khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
