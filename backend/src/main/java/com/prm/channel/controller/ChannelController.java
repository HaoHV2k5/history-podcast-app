package com.prm.channel.controller;

import com.prm.channel.dto.request.CreateChannelRequest;
import com.prm.channel.dto.request.UpdateChannelRequest;
import com.prm.channel.dto.response.ChannelResponse;
import com.prm.channel.service.ChannelService;
import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
@Tag(name = "Channel Management", description = "Quản lý Kênh Podcast và Upload Media (Avatar / Cover Banner)")
public class ChannelController {

    private final ChannelService service;

    @PostMapping
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "1. Tạo kênh Podcast mới", description = "Tạo kênh mới bằng JSON. Bắt buộc tài khoản đã được phê duyệt KYC Creator. Chặn trùng tên và chặn 1 người tạo 2 kênh.")
    public ResponseEntity<ApiResponse<ChannelResponse>> createChannel(@Valid @RequestBody CreateChannelRequest request) {
        ChannelResponse response = service.createChannel(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo kênh Podcast thành công", response));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "2. Tải ảnh đại diện kênh lên Cloudinary", description = "Chọn file ảnh từ máy (JPG, PNG, WEBP <= 10MB). Backend tải lên Cloudinary và tự động lưu URL vào kênh.")
    public ResponseEntity<ApiResponse<ChannelResponse>> uploadAvatar(
            @Parameter(description = "File ảnh đại diện (Square 1:1 khuyến nghị)", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
            @RequestParam("file") MultipartFile file
    ) {
        ChannelResponse response = service.uploadAvatar(file);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh đại diện lên thành công", response));
    }

    @PostMapping(value = "/me/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "3. Tải ảnh bìa kênh lên Cloudinary", description = "Chọn file ảnh từ máy (JPG, PNG, WEBP <= 10MB). Backend tải lên Cloudinary và tự động lưu URL vào kênh.")
    public ResponseEntity<ApiResponse<ChannelResponse>> uploadCover(
            @Parameter(description = "File ảnh bìa (Banner 16:9 khuyến nghị)", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
            @RequestParam("file") MultipartFile file
    ) {
        ChannelResponse response = service.uploadCover(file);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh bìa lên thành công", response));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "4. Lấy thông tin kênh của tôi", description = "Trả về thông tin chi tiết kênh thuộc sở hữu của Creator đang đăng nhập.")
    public ResponseEntity<ApiResponse<ChannelResponse>> getMyChannel() {
        ChannelResponse response = service.getMyChannel();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "5. Xem chi tiết kênh theo ID (Công khai)", description = "Khách vãng lai và thính giả có thể xem thông tin kênh bất kỳ.")
    public ResponseEntity<ApiResponse<ChannelResponse>> getChannelById(@PathVariable Long id) {
        ChannelResponse response = service.getChannelById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "6. Danh sách tất cả các kênh (Công khai)", description = "Lấy danh sách các kênh đang hoạt động (ACTIVE) có phân trang.")
    public ResponseEntity<ApiResponse<PageResponse<ChannelResponse>>> getAllChannels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ChannelResponse> response = service.getAllChannels(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "7. Cập nhật thông tin kênh", description = "Chỉ cho phép chính chủ kênh hoặc Quản trị viên cập nhật tên, mô tả.")
    public ResponseEntity<ApiResponse<ChannelResponse>> updateChannel(
            @PathVariable Long id,
            @Valid @RequestBody UpdateChannelRequest request
    ) {
        ChannelResponse response = service.updateChannel(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kênh thành công", response));
    }
}
