package com.prm.creator.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.util.SecurityUtils;
import com.prm.creator.dto.request.*;
import com.prm.creator.dto.response.*;
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

import java.util.List;
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

    @Operation(summary = "Danh sách, Tìm kiếm & Lọc video của Creator", 
               description = "Lấy danh sách video của Creator kèm tìm kiếm theo từ khóa (tiêu đề, nội dung), lọc theo trạng thái (PUBLISHED, HIDDEN, FAILED, PROCESSING), lọc độc quyền VIP, và sắp xếp theo ngày tạo, lượt like, bình luận, thời lượng")
    @GetMapping("/videos")
    public ApiResponse<List<CreatorVideoItemResponse>> getVideos(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isExclusive,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        List<CreatorVideoItemResponse> videos = creatorStudioService.getCreatorVideos(
                email, keyword, status, isExclusive, sortBy, sortDir
        );
        return ApiResponse.success("Lấy danh sách video thành công", videos);
    }

    @Operation(summary = "Chi tiết video và tương tác", description = "Lấy thông tin chi tiết một video kèm danh sách bình luận của khán giả")
    @GetMapping("/videos/{contentId}")
    public ApiResponse<CreatorVideoDetailResponse> getVideoDetail(@PathVariable Long contentId) {
        String email = SecurityUtils.getCurrentUserEmail();
        CreatorVideoDetailResponse detail = creatorStudioService.getVideoDetail(email, contentId);
        return ApiResponse.success("Lấy chi tiết video thành công", detail);
    }

    @Operation(summary = "Chỉnh sửa thông tin video", description = "Cập nhật tiêu đề, mô tả hoặc chế độ độc quyền của video")
    @PutMapping("/videos/{contentId}")
    public ApiResponse<CreatorVideoItemResponse> updateVideo(
            @PathVariable Long contentId,
            @Valid @RequestBody CreatorUpdateVideoRequest request
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        CreatorVideoItemResponse updated = creatorStudioService.updateVideo(email, contentId, request);
        return ApiResponse.success("Cập nhật thông tin video thành công", updated);
    }

    @Operation(summary = "Ẩn hoặc Hiện video", description = "Chuyển trạng thái video thành HIDDEN (ẩn) hoặc PUBLISHED (công khai)")
    @PatchMapping("/videos/{contentId}/visibility")
    public ApiResponse<CreatorVideoItemResponse> updateVisibility(
            @PathVariable Long contentId,
            @RequestBody CreatorVideoVisibilityRequest request
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        CreatorVideoItemResponse updated = creatorStudioService.updateVideoVisibility(email, contentId, request.getHidden());
        String msg = Boolean.TRUE.equals(request.getHidden()) ? "Đã ẩn video khỏi danh sách công khai" : "Đã công khai video";
        return ApiResponse.success(msg, updated);
    }

    @Operation(summary = "Danh sách bình luận của video", description = "Xem tất cả bình luận của người xem dưới video")
    @GetMapping("/videos/{contentId}/comments")
    public ApiResponse<List<CreatorCommentItemResponse>> getVideoComments(@PathVariable Long contentId) {
        String email = SecurityUtils.getCurrentUserEmail();
        List<CreatorCommentItemResponse> comments = creatorStudioService.getVideoComments(email, contentId);
        return ApiResponse.success("Lấy danh sách bình luận thành công", comments);
    }

    @Operation(summary = "Thư viện giọng đọc AI cho thuyết minh sử Việt", description = "Danh mục các giọng đọc ElevenLabs (ưu tiên nói tốt tiếng Việt) và Microsoft Edge-TTS kèm file nghe thử trực tiếp")
    @GetMapping("/voices")
    public ApiResponse<List<CreatorVoiceResponse>> getVoices() {
        String email = SecurityUtils.getCurrentUserEmail();
        List<CreatorVoiceResponse> voices = creatorStudioService.getVoiceCatalog(email);
        return ApiResponse.success("Lấy danh mục giọng đọc AI thành công", voices);
    }

    @Operation(summary = "Tạo bản nghe thử giọng đọc trực tiếp", description = "Sinh tệp âm thanh nghe thử câu tiếng Việt tùy ý với engine và giọng đọc đã chọn")
    @PostMapping("/voices/preview")
    public ApiResponse<Map<String, Object>> previewVoice(@Valid @RequestBody CreatorVoicePreviewRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        Map<String, Object> result = creatorStudioService.previewVoice(email, request);
        return ApiResponse.success("Tạo âm thanh nghe thử thành công", result);
    }
}

