package com.prm.creator.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.entity.Transcript;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.TranscriptRepository;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.FileStorageService;
import com.prm.creator.dto.request.CreatorAiSettingRequest;
import com.prm.creator.dto.request.CreatorRenderRequest;
import com.prm.creator.dto.request.CreatorStoryboardRequest;
import com.prm.creator.dto.response.CreatorAiSettingResponse;
import com.prm.creator.dto.response.CreatorRenderResponse;
import com.prm.creator.dto.response.CreatorUploadImageResponse;
import com.prm.creator.entity.CreatorAiSetting;
import com.prm.creator.repository.CreatorAiSettingRepository;
import com.prm.creator.service.CreatorStudioService;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreatorStudioServiceImpl implements CreatorStudioService {

    private final UserRepository userRepository;
    private final CreatorAiSettingRepository creatorAiSettingRepository;
    private final ChannelRepository channelRepository;
    private final ContentRepository contentRepository;
    private final ArtifactRepository artifactRepository;
    private final TranscriptRepository transcriptRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    @Value("${app.tool.url:http://localhost:8000}")
    private String toolUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Override
    @Transactional(readOnly = true)
    public CreatorAiSettingResponse getAiSettings(String email) {
        User user = getUserByEmail(email);
        return creatorAiSettingRepository.findByUserId(user.getId())
                .map(this::mapToSettingResponse)
                .orElseGet(() -> CreatorAiSettingResponse.builder()
                        .userId(user.getId())
                        .ttsEngine("edge-tts")
                        .voiceName("vi-VN-NamMinhNeural")
                        .hasGeminiKey(false)
                        .hasElevenlabsKey(false)
                        .build());
    }

    @Override
    @Transactional
    public CreatorAiSettingResponse saveAiSettings(String email, CreatorAiSettingRequest request) {
        User user = getUserByEmail(email);
        CreatorAiSetting setting = creatorAiSettingRepository.findByUserId(user.getId())
                .orElseGet(() -> CreatorAiSetting.builder().user(user).build());

        if (request.getGeminiApiKey() != null) {
            setting.setGeminiApiKey(request.getGeminiApiKey().trim());
        }
        if (request.getElevenlabsApiKey() != null) {
            setting.setElevenlabsApiKey(request.getElevenlabsApiKey().trim());
        }
        if (StringUtils.hasText(request.getTtsEngine())) {
            setting.setTtsEngine(request.getTtsEngine().trim());
        }
        if (StringUtils.hasText(request.getVoiceName())) {
            setting.setVoiceName(request.getVoiceName().trim());
        }

        setting = creatorAiSettingRepository.save(setting);
        log.info("Saved AI settings for creator '{}' (ID: {})", email, user.getId());
        return mapToSettingResponse(setting);
    }

    @Override
    public CreatorUploadImageResponse uploadSceneImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY, "Vui lòng chọn hình ảnh để tải lên");
        }
        log.info("Uploading creator scene image ({} bytes) to Cloudinary...", file.getSize());
        String secureUrl = fileStorageService.uploadImage(file, "whiteboard/scenes");
        log.info("Scene image uploaded successfully to Cloudinary: {}", secureUrl);
        return CreatorUploadImageResponse.builder()
                .imageUrl(secureUrl)
                .status("SUCCESS")
                .message("Đã tải ảnh lên Cloudinary thành công")
                .build();
    }

    @Override
    public Object generateStoryboard(String email, CreatorStoryboardRequest request) {
        User user = getUserByEmail(email);

        // 1. Phân giải Gemini API Key (Ưu tiên key gửi kèm, nếu không lấy từ DB của Creator)
        String geminiKey = request.getGeminiApiKey();
        if (!StringUtils.hasText(geminiKey)) {
            geminiKey = creatorAiSettingRepository.findByUserId(user.getId())
                    .map(CreatorAiSetting::getGeminiApiKey)
                    .orElse(null);
        }

        if (!StringUtils.hasText(geminiKey)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST_DATA,
                    "⚠️ Bạn chưa cấu hình Google Gemini API Key cá nhân. Vui lòng mở Cài đặt (⚙️) và nhập API Key của bạn để sử dụng hệ thống! (Key hệ thống chỉ dành cho Admin)."
            );
        }

        // 2. Chuẩn bị payload gửi sang Tool Python
        Map<String, Object> toolPayload = new HashMap<>();
        toolPayload.put("topic", request.getTopic().trim());
        toolPayload.put("duration_sec", request.getDurationSec() != null ? request.getDurationSec() : 60);
        toolPayload.put("gemini_api_key", geminiKey.trim());
        toolPayload.put("use_rag", true);

        log.info("Calling Python Tool for storyboard generation (topic='{}', duration={}s)...",
                request.getTopic(), request.getDurationSec());

        try {
            String jsonBody = objectMapper.writeValueAsString(toolPayload);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(toolUrl + "/api/storyboard"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(90))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                String errorDetail = extractErrorDetail(response.body(), response.statusCode());
                log.error("Tool storyboard failed with HTTP {}: {}", response.statusCode(), errorDetail);
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Lỗi tạo kịch bản: " + errorDetail);
            }

            // Trả về kết quả JSON để người dùng duyệt (KHÔNG lưu database ở bước này)
            return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Failed to communicate with Tool storyboard API", e);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể kết nối đến dịch vụ tạo kịch bản: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public CreatorRenderResponse renderAndSaveVideo(String email, CreatorRenderRequest request) {
        User user = getUserByEmail(email);

        // 1. Phân giải API keys & Settings của Creator
        Optional<CreatorAiSetting> settingOpt = creatorAiSettingRepository.findByUserId(user.getId());
        String geminiKey = settingOpt.map(CreatorAiSetting::getGeminiApiKey).orElse("");
        String elevenKey = settingOpt.map(CreatorAiSetting::getElevenlabsApiKey).orElse("");
        String ttsEngine = StringUtils.hasText(request.getTtsEngine())
                ? request.getTtsEngine()
                : settingOpt.map(CreatorAiSetting::getTtsEngine).orElse("edge-tts");
        String voiceName = StringUtils.hasText(request.getVoiceName())
                ? request.getVoiceName()
                : settingOpt.map(CreatorAiSetting::getVoiceName).orElse("vi-VN-NamMinhNeural");

        if (!StringUtils.hasText(geminiKey)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST_DATA,
                    "⚠️ Bạn chưa cấu hình Google Gemini API Key cá nhân trong Cài đặt (⚙️)!"
            );
        }

        // 2. Tìm hoặc tự động tạo Kênh cho Creator
        Channel channel = resolveOrCreateChannel(user, request.getChannelId());

        // 3. Trích xuất nội dung văn bản kịch bản từ storyboard để lưu vào DB
        String scriptNarration = extractNarrationScript(request.getStoryboard());

        // 4. LƯU VÀO DATABASE (Content & Artifact & Transcript)
        Content content = Content.builder()
                .channel(channel)
                .title(request.getTitle().trim())
                .textBody(scriptNarration)
                .sourceType("AI_WHITEBOARD")
                .status("PROCESSING")
                .isExclusive(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        content = contentRepository.save(content);

        Artifact artifact = Artifact.builder()
                .content(content)
                .type("VIDEO")
                .fileUrl(null)
                .sourceType("WHITEBOARD_STUDIO")
                .durationSeconds(request.getDurationSec())
                .status("PROCESSING")
                .createdAt(Instant.now())
                .build();
        artifact = artifactRepository.save(artifact);

        Transcript transcript = Transcript.builder()
                .artifact(artifact)
                .textBody(scriptNarration)
                .createdAt(Instant.now())
                .build();
        transcriptRepository.save(transcript);

        log.info("Saved Content (ID: {}), Artifact (ID: {}), Transcript for Creator '{}'",
                content.getId(), artifact.getId(), email);

        // 5. Chuyển tiếp tác vụ tạo video sang Python Rendering Engine (kèm Cloudinary Image URLs)
        Map<String, Object> toolPayload = new HashMap<>();
        toolPayload.put("topic", request.getTitle().trim());
        toolPayload.put("duration_sec", request.getDurationSec());
        toolPayload.put("storyboard", request.getStoryboard());
        toolPayload.put("custom_images", request.getSceneImages());
        toolPayload.put("gemini_api_key", geminiKey);
        toolPayload.put("elevenlabs_api_key", elevenKey);
        toolPayload.put("tts_engine", ttsEngine);
        toolPayload.put("voice_name", voiceName);

        try {
            String jsonBody = objectMapper.writeValueAsString(toolPayload);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(toolUrl + "/api/render"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                String errorDetail = extractErrorDetail(response.body(), response.statusCode());
                log.error("Tool render initiation failed with HTTP {}: {}", response.statusCode(), errorDetail);
                artifact.setStatus("FAILED");
                content.setStatus("FAILED");
                artifactRepository.save(artifact);
                contentRepository.save(content);
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Lỗi khởi tạo render video: " + errorDetail);
            }

            JsonNode resJson = objectMapper.readTree(response.body());
            String jobId = resJson.path("job_id").asText();

            log.info("Video rendering job started: jobId='{}' for Artifact ID: {}", jobId, artifact.getId());

            return CreatorRenderResponse.builder()
                    .jobId(jobId)
                    .contentId(content.getId())
                    .artifactId(artifact.getId())
                    .channelId(channel.getId())
                    .status("PROCESSING")
                    .message("Đã lưu kịch bản vào hệ thống và bắt đầu quá trình kết xuất video")
                    .build();

        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Failed to connect to Python render service", e);
            artifact.setStatus("FAILED");
            content.setStatus("FAILED");
            artifactRepository.save(artifact);
            contentRepository.save(content);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể kết nối đến máy chủ dựng video: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> getJobStatus(String email, String jobId, Long artifactId) {
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(toolUrl + "/api/jobs/" + jobId))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return Map.of("job_id", jobId, "status", "unknown", "error", "HTTP " + response.statusCode());
            }

            Map<String, Object> jobData = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
            String status = (String) jobData.get("status");

            // Nếu đã hoàn thành, cập nhật Artifact và Content trong DB
            if ("completed".equalsIgnoreCase(status) && artifactId != null) {
                String videoUrl = (String) jobData.get("video_url");
                if (StringUtils.hasText(videoUrl)) {
                    artifactRepository.findById(artifactId).ifPresent(artifact -> {
                        if (!"COMPLETED".equalsIgnoreCase(artifact.getStatus())) {
                            artifact.setFileUrl(videoUrl);
                            artifact.setStatus("COMPLETED");
                            artifactRepository.save(artifact);

                            if (artifact.getContent() != null) {
                                Content c = artifact.getContent();
                                c.setStatus("PUBLISHED");
                                contentRepository.save(c);
                            }
                            log.info("Artifact ID {} updated with video URL: {}", artifactId, videoUrl);
                        }
                    });
                }
            } else if ("failed".equalsIgnoreCase(status) && artifactId != null) {
                artifactRepository.findById(artifactId).ifPresent(artifact -> {
                    artifact.setStatus("FAILED");
                    artifactRepository.save(artifact);
                    if (artifact.getContent() != null) {
                        Content c = artifact.getContent();
                        c.setStatus("FAILED");
                        contentRepository.save(c);
                    }
                });
            }

            return jobData;
        } catch (Exception e) {
            log.warn("Error polling job status for jobId '{}': {}", jobId, e.getMessage());
            return Map.of("job_id", jobId, "status", "polling_error", "message", e.getMessage());
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng với email: " + email));
    }

    private Channel resolveOrCreateChannel(User user, Long preferredChannelId) {
        if (preferredChannelId != null) {
            return channelRepository.findById(preferredChannelId)
                    .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Không tìm thấy kênh chỉ định"));
        }

        return channelRepository.findByCreatorId(user.getId())
                .orElseGet(() -> {
                    log.info("Creator '{}' (ID: {}) chưa có kênh. Tự động khởi tạo kênh mặc định...",
                            user.getEmail(), user.getId());
                    Channel newChannel = Channel.builder()
                            .creator(user)
                            .name("Kênh Lịch Sử của " + (StringUtils.hasText(user.getEmail()) ? user.getEmail().split("@")[0] : "Creator"))
                            .description("Kênh hoạt họa lịch sử và podcast tự động tạo bởi Whiteboard Studio AI")
                            .status("ACTIVE")
                            .createdAt(Instant.now())
                            .build();
                    return channelRepository.save(newChannel);
                });
    }

    private String extractNarrationScript(Map<String, Object> storyboard) {
        if (storyboard == null) return "";
        StringBuilder sb = new StringBuilder();
        try {
            Object scenesObj = storyboard.get("scenes");
            if (scenesObj instanceof List<?> scenes) {
                for (Object sc : scenes) {
                    if (sc instanceof Map<?, ?> scMap) {
                        Object title = scMap.get("scene_title");
                        if (title != null) sb.append("=== ").append(title).append(" ===\n");
                        Object els = scMap.get("elements");
                        if (els instanceof List<?> elList) {
                            for (Object el : elList) {
                                if (el instanceof Map<?, ?> elMap) {
                                    Object subtitle = elMap.get("subtitle");
                                    if (subtitle != null) sb.append(subtitle).append("\n");
                                }
                            }
                        }
                        sb.append("\n");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract narration text from storyboard: {}", e.getMessage());
        }
        return sb.toString().trim();
    }

    private String extractErrorDetail(String body, int statusCode) {
        if (!StringUtils.hasText(body)) return "HTTP " + statusCode;
        try {
            JsonNode node = objectMapper.readTree(body);
            if (node.has("detail")) return node.get("detail").asText();
            if (node.has("message")) return node.get("message").asText();
        } catch (Exception ignored) {}
        return body.length() > 200 ? body.substring(0, 200) + "..." : body;
    }

    private CreatorAiSettingResponse mapToSettingResponse(CreatorAiSetting setting) {
        return CreatorAiSettingResponse.builder()
                .id(setting.getId())
                .userId(setting.getUser() != null ? setting.getUser().getId() : null)
                .geminiApiKey(setting.getGeminiApiKey())
                .elevenlabsApiKey(setting.getElevenlabsApiKey())
                .ttsEngine(setting.getTtsEngine())
                .voiceName(setting.getVoiceName())
                .hasGeminiKey(StringUtils.hasText(setting.getGeminiApiKey()))
                .hasElevenlabsKey(StringUtils.hasText(setting.getElevenlabsApiKey()))
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
