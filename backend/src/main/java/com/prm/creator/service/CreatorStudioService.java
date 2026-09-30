package com.prm.creator.service;

import com.prm.creator.dto.request.CreatorAiSettingRequest;
import com.prm.creator.dto.request.CreatorRenderRequest;
import com.prm.creator.dto.request.CreatorStoryboardRequest;
import com.prm.creator.dto.response.CreatorAiSettingResponse;
import com.prm.creator.dto.response.CreatorRenderResponse;
import com.prm.creator.dto.response.CreatorUploadImageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface CreatorStudioService {

    /**
     * Lấy cấu hình AI (Gemini Key, ElevenLabs Key, Voice) của Creator hiện tại.
     */
    CreatorAiSettingResponse getAiSettings(String email);

    /**
     * Lưu/Cập nhật cấu hình AI (Gemini Key, ElevenLabs Key, Voice) của Creator.
     */
    CreatorAiSettingResponse saveAiSettings(String email, CreatorAiSettingRequest request);

    /**
     * Upload ảnh vẽ tay/minh họa cảnh lên Cloudinary và trả về Cloudinary HTTPS URL.
     */
    CreatorUploadImageResponse uploadSceneImage(MultipartFile file);

    /**
     * Gọi RAG & Gemini để nghiên cứu kịch bản dựa trên chủ đề (KHÔNG lưu vào database ở bước này).
     */
    Object generateStoryboard(String email, CreatorStoryboardRequest request);

    /**
     * Khi Creator chấp nhận kịch bản và nhấn tạo video:
     * Lưu Content, Artifact, Transcript vào DB, sau đó chuyển việc render cho Python service.
     */
    CreatorRenderResponse renderAndSaveVideo(String email, CreatorRenderRequest request);

    /**
     * Kiểm tra tiến trình render và cập nhật Artifact trong DB khi video hoàn thành.
     */
    Map<String, Object> getJobStatus(String email, String jobId, Long artifactId);

    /**
     * Lấy danh sách video của Creator kèm các chỉ số tương tác (like, dislike, comment count).
     */
    java.util.List<com.prm.creator.dto.response.CreatorVideoItemResponse> getCreatorVideos(String email);

    /**
     * Lấy chi tiết thông tin video kèm thống kê tương tác và danh sách bình luận.
     */
    com.prm.creator.dto.response.CreatorVideoDetailResponse getVideoDetail(String email, Long contentId);

    /**
     * Chỉnh sửa thông tin video (tiêu đề, mô tả/nội dung, trạng thái độc quyền).
     */
    com.prm.creator.dto.response.CreatorVideoItemResponse updateVideo(String email, Long contentId, com.prm.creator.dto.request.CreatorUpdateVideoRequest request);

    /**
     * Ẩn hoặc Hiện video (chuyển đổi trạng thái PUBLISHED <-> HIDDEN).
     */
    com.prm.creator.dto.response.CreatorVideoItemResponse updateVideoVisibility(String email, Long contentId, Boolean hidden);

    /**
     * Xem danh sách các bình luận của một video.
     */
    java.util.List<com.prm.creator.dto.response.CreatorCommentItemResponse> getVideoComments(String email, Long contentId);

    /**
     * Lấy danh mục các giọng đọc AI chất lượng cao (ưu tiên tiếng Việt) từ ElevenLabs & Edge-TTS.
     */
    java.util.List<com.prm.creator.dto.response.CreatorVoiceResponse> getVoiceCatalog(String email);

    /**
     * Tạo âm thanh nghe thử trực tiếp câu tiếng Việt theo giọng đọc và engine được chọn.
     */
    Map<String, Object> previewVoice(String email, com.prm.creator.dto.request.CreatorVoicePreviewRequest request);
}

