package com.prm.creator.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.util.SecurityUtils;
import com.prm.creator.dto.request.CreatorAiSettingRequest;
import com.prm.creator.dto.request.CreatorRenderRequest;
import com.prm.creator.dto.request.CreatorStoryboardRequest;
import com.prm.creator.dto.response.CreatorAiSettingResponse;
import com.prm.creator.dto.response.CreatorRenderResponse;
import com.prm.creator.dto.response.CreatorUploadImageResponse;
import com.prm.creator.service.CreatorStudioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/creator/studio")
@RequiredArgsConstructor
@Tag(name = "Creator Studio - Whiteboard AI", description = "Bộ công cụ tự động tạo kịch bản, ảnh bảng trắng và video hoạt họa lịch sử dành riêng cho Creator")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('CREATOR')")
public class CreatorStudioController {

    private final CreatorStudioService creatorStudioService;

    @Operation(summary = "Lấy cấu hình AI của Creator", description = "Truy xuất Gemini API Key, ElevenLabs Key và thiết lập giọng đọc đã lưu của Creator")
    @GetMapping("/settings")
    public ApiResponse<CreatorAiSettingResponse> getSettings() {
        String email = SecurityUtils.getCurrentUserEmail();
        CreatorAiSettingResponse response = creatorStudioService.getAiSettings(email);
        return ApiResponse.success("Lấy cấu hình AI thành công", response);
    }

    @Operation(summary = "Lưu / Cập nhật cấu hình AI của Creator", description = "Lưu Gemini API Key cá nhân và ElevenLabs Key vào cơ sở dữ liệu")
    @PutMapping("/settings")
    public ApiResponse<CreatorAiSettingResponse> saveSettings(@Valid @RequestBody CreatorAiSettingRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        CreatorAiSettingResponse response = creatorStudioService.saveAiSettings(email, request);
        return ApiResponse.success("Lưu cấu hình AI thành công", response);
    }

    @Operation(summary = "Tải ảnh minh họa cảnh lên Cloudinary", description = "Upload file ảnh cảnh vẽ tay lên Cloudinary, trả về link HTTPS an toàn để lưu vào hệ thống")
    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CreatorUploadImageResponse> uploadSceneImage(@RequestParam("file") MultipartFile file) {
        CreatorUploadImageResponse response = creatorStudioService.uploadSceneImage(file);
        return ApiResponse.success("Tải ảnh lên Cloudinary thành công", response);
    }

    @Operation(summary = "Tạo kịch bản và gợi ý prompt (Chưa lưu DB)", description = "Gọi RAG đối chiếu sử liệu và Gemini sinh kịch bản. Bước này chỉ xem trước, KHÔNG lưu vào DB")
    @PostMapping("/storyboard")
    public ApiResponse<Object> generateStoryboard(@Valid @RequestBody CreatorStoryboardRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        Object storyboard = creatorStudioService.generateStoryboard(email, request);
        return ApiResponse.success("Tạo kịch bản thành công", storyboard);
    }

    @Operation(summary = "Chấp nhận kịch bản & Xuất bản Video (Lưu DB)", description = "Lưu Content, Artifact, Transcript vào DB và gửi yêu cầu render sang engine")
    @PostMapping("/render")
    public ApiResponse<CreatorRenderResponse> renderVideo(@Valid @RequestBody CreatorRenderRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        CreatorRenderResponse response = creatorStudioService.renderAndSaveVideo(email, request);
        return ApiResponse.success("Đã lưu kịch bản vào DB và khởi chạy render video", response);
    }

    @Operation(summary = "Kiểm tra tiến trình render video", description = "Thăm dò tiến độ xuất bản video và tự động cập nhật Artifact khi video sẵn sàng")
    @GetMapping("/jobs/{jobId}")
    public ApiResponse<Map<String, Object>> getJobStatus(
            @PathVariable String jobId,
            @RequestParam(required = false) Long artifactId
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        Map<String, Object> status = creatorStudioService.getJobStatus(email, jobId, artifactId);
        return ApiResponse.success("Lấy trạng thái render thành công", status);
    }
}
