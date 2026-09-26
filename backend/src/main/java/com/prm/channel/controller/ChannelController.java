package com.prm.channel.controller;

import com.prm.channel.dto.request.ChannelRequest;
import com.prm.channel.dto.response.ChannelResponse;
import com.prm.channel.service.ChannelService;
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
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
@Tag(name = "Channel Management", description = "Quản lý và thao tác dữ liệu Channel")
public class ChannelController {

    private final ChannelService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Channel", description = "Trả về danh sách bản ghi Channel")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getAll() {
        List<ChannelResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Channel theo ID", description = "Trả về chi tiết một bản ghi Channel")
    public ResponseEntity<ApiResponse<ChannelResponse>> getById(@PathVariable Long id) {
        ChannelResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Channel", description = "Tạo mới một bản ghi Channel trong hệ thống")
    public ResponseEntity<ApiResponse<ChannelResponse>> create(@Valid @RequestBody ChannelRequest request) {
        ChannelResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Channel", description = "Cập nhật thông tin bản ghi Channel theo ID")
    public ResponseEntity<ApiResponse<ChannelResponse>> update(@PathVariable Long id, @Valid @RequestBody ChannelRequest request) {
        ChannelResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Channel", description = "Xóa bản ghi Channel khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
