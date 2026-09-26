package com.prm.channel.controller;

import com.prm.channel.dto.request.TranscriptRequest;
import com.prm.channel.dto.response.TranscriptResponse;
import com.prm.channel.service.TranscriptService;
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
@RequestMapping("/api/v1/transcripts")
@RequiredArgsConstructor
@Tag(name = "Transcript Management", description = "Quản lý và thao tác dữ liệu Transcript")
public class TranscriptController {

    private final TranscriptService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Transcript", description = "Trả về danh sách bản ghi Transcript")
    public ResponseEntity<ApiResponse<List<TranscriptResponse>>> getAll() {
        List<TranscriptResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Transcript theo ID", description = "Trả về chi tiết một bản ghi Transcript")
    public ResponseEntity<ApiResponse<TranscriptResponse>> getById(@PathVariable Long id) {
        TranscriptResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Transcript", description = "Tạo mới một bản ghi Transcript trong hệ thống")
    public ResponseEntity<ApiResponse<TranscriptResponse>> create(@Valid @RequestBody TranscriptRequest request) {
        TranscriptResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Transcript", description = "Cập nhật thông tin bản ghi Transcript theo ID")
    public ResponseEntity<ApiResponse<TranscriptResponse>> update(@PathVariable Long id, @Valid @RequestBody TranscriptRequest request) {
        TranscriptResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Transcript", description = "Xóa bản ghi Transcript khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
