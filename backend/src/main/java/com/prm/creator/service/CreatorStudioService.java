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
}
