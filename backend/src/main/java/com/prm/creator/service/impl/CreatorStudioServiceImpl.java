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
import com.prm.common.enums.ActiveStatus;
import com.prm.common.enums.ArtifactStatus;
import com.prm.common.enums.ContentStatus;
import com.prm.common.service.FileStorageService;
import com.prm.common.util.SearchUtils;
import java.util.Comparator;
import com.prm.creator.dto.request.CreatorAiSettingRequest;
import com.prm.creator.dto.request.CreatorRenderRequest;
import com.prm.creator.dto.request.CreatorStoryboardRequest;
import com.prm.creator.dto.request.CreatorUpdateVideoRequest;
import com.prm.creator.dto.request.CreatorVoicePreviewRequest;
import com.prm.creator.dto.response.*;
import com.prm.creator.entity.CreatorAiSetting;
import com.prm.creator.repository.CreatorAiSettingRepository;
import com.prm.creator.service.CreatorStudioService;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.social.entity.Comment;
import com.prm.social.repository.CommentRepository;
import com.prm.social.repository.ReactionRepository;
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
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    @Value("${app.tool.url:http://localhost:8000}")
    private String toolUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
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
                    .version(HttpClient.Version.HTTP_1_1)
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
                    .version(HttpClient.Version.HTTP_1_1)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                String errorDetail = extractErrorDetail(response.body(), response.statusCode());
                log.error("Tool render initiation failed with HTTP {}: {}", response.statusCode(), errorDetail);
                artifact.setStatus(ArtifactStatus.FAILED.name());
                content.setStatus(ContentStatus.FAILED.name());
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
            artifact.setStatus(ArtifactStatus.FAILED.name());
            content.setStatus(ContentStatus.FAILED.name());
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
                    .version(HttpClient.Version.HTTP_1_1)
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

            // Nếu đã hoàn thành, cập nhật Artifact và Content trong DB (tự động đồng bộ lên Cloudinary nếu có)
            if ("completed".equalsIgnoreCase(status) && artifactId != null) {
                String rawVideoUrl = (String) jobData.get("video_url");
                if (StringUtils.hasText(rawVideoUrl)) {
                    artifactRepository.findById(artifactId).ifPresent(artifact -> {
                        String currentUrl = artifact.getFileUrl();
                        boolean needsUpload = !ArtifactStatus.COMPLETED.name().equalsIgnoreCase(artifact.getStatus())
                                || !StringUtils.hasText(currentUrl)
                                || currentUrl.startsWith("/outputs/");

                        if (needsUpload) {
                            String finalVideoUrl = rawVideoUrl;
                            if (fileStorageService.isConfigured()) {
                                try {
                                    log.info("Uploading rendered video to Cloudinary for job '{}' (Artifact ID: {})...", jobId, artifactId);
                                    String downloadUrl = toolUrl + (rawVideoUrl.startsWith("/") ? rawVideoUrl : "/" + rawVideoUrl);
                                    HttpRequest downloadReq = HttpRequest.newBuilder()
                                            .uri(URI.create(downloadUrl))
                                            .version(HttpClient.Version.HTTP_1_1)
                                            .timeout(Duration.ofSeconds(90))
                                            .GET()
                                            .build();

                                    HttpResponse<byte[]> downloadResp = httpClient.send(downloadReq, HttpResponse.BodyHandlers.ofByteArray());
                                    if (downloadResp.statusCode() == 200 && downloadResp.body() != null && downloadResp.body().length > 0) {
                                        String cloudUrl = fileStorageService.uploadVideo(downloadResp.body(), "whiteboard/videos", jobId);
                                        log.info("Successfully uploaded video to Cloudinary: {}", cloudUrl);
                                        finalVideoUrl = cloudUrl;
                                    } else {
                                        log.warn("Could not retrieve video stream from tool (HTTP {}), using local URL", downloadResp.statusCode());
                                    }
                                } catch (Exception e) {
                                    log.error("Failed to upload video to Cloudinary, falling back to local URL: {}", e.getMessage(), e);
                                }
                            }

                            artifact.setFileUrl(finalVideoUrl);
                            // Build optimized URL ngay sau upload — lúc này transcode đã hoàn thành
                            // nhưng chỉ expose khi nào content thực sự PUBLISHED
                            artifact.setOptimizedUrl(fileStorageService.buildOptimizedVideoUrl(finalVideoUrl));
                            artifact.setStatus(ArtifactStatus.COMPLETED.name());
                            artifactRepository.save(artifact);

                            if (artifact.getContent() != null) {
                                Content c = artifact.getContent();
                                c.setStatus(ContentStatus.PUBLISHED.name());
                                contentRepository.save(c);
                            }
                            log.info("Artifact ID {} updated with final video URL: {}, optimized URL built", artifactId, finalVideoUrl);
                        }

                        if (StringUtils.hasText(artifact.getFileUrl())) {
                            String activeUrl = artifact.getFileUrl();
                            jobData.put("video_url", activeUrl);
                            if (activeUrl.contains("cloudinary.com")) {
                                jobData.put("cloudinary_url", activeUrl);
                            }
                        }
                    });
                }
            } else if ("failed".equalsIgnoreCase(status) && artifactId != null) {
                artifactRepository.findById(artifactId).ifPresent(artifact -> {
                    artifact.setStatus(ArtifactStatus.FAILED.name());
                    artifactRepository.save(artifact);
                    if (artifact.getContent() != null) {
                        Content c = artifact.getContent();
                        c.setStatus(ContentStatus.FAILED.name());
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
                            .status(ActiveStatus.ACTIVE.name())
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
            if (node.has("detail")) {
                JsonNode detailNode = node.get("detail");
                if (detailNode.isTextual()) {
                    return detailNode.asText();
                } else if (detailNode.isArray() && !detailNode.isEmpty()) {
                    JsonNode firstErr = detailNode.get(0);
                    if (firstErr.has("msg")) {
                        return firstErr.get("msg").asText();
                    }
                    return detailNode.toString();
                } else {
                    return detailNode.toString();
                }
            }
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

    @Override
    @Transactional(readOnly = true)
    public List<CreatorVideoItemResponse> getCreatorVideos(String email) {
        return getCreatorVideos(email, null, null, null, "createdAt", "desc");
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreatorVideoItemResponse> getCreatorVideos(
            String email,
            String keyword,
            String status,
            Boolean isExclusive,
            String sortBy,
            String sortDir
    ) {
        User creator = getUserByEmail(email);
        List<Content> contents = contentRepository.findByCreatorId(creator.getId());

        String cleanKeyword = SearchUtils.normalizeWhitespace(keyword);

        List<CreatorVideoItemResponse> result = new ArrayList<>();
        for (Content content : contents) {
            // 1. Lọc theo trạng thái
            if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status.trim())) {
                String reqStatus = status.trim().toUpperCase();
                String curStatus = content.getStatus() != null ? content.getStatus().toUpperCase() : "";
                if ("PENDING".equals(reqStatus) || "PROCESSING".equals(reqStatus)) {
                    if (!"PENDING".equals(curStatus) && !"PROCESSING".equals(curStatus) && !"DRAFT".equals(curStatus)) {
                        continue;
                    }
                } else if (!reqStatus.equals(curStatus)) {
                    continue;
                }
            }

            // 2. Lọc theo quyền truy cập độc quyền VIP
            if (isExclusive != null) {
                boolean itemIsExclusive = Boolean.TRUE.equals(content.getIsExclusive());
                if (isExclusive != itemIsExclusive) {
                    continue;
                }
            }

            // 3. Tìm kiếm theo từ khóa trong tiêu đề và nội dung kịch bản (tự động trim và chuẩn hóa khoảng trắng thừa)
            if (StringUtils.hasText(cleanKeyword)) {
                boolean matchTitle = SearchUtils.matchesKeyword(content.getTitle(), cleanKeyword);
                boolean matchBody = SearchUtils.matchesKeyword(content.getTextBody(), cleanKeyword);
                if (!matchTitle && !matchBody) {
                    continue;
                }
            }

            Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId()).orElse(null);
            long likeCount = 0;
            long dislikeCount = 0;
            long commentCount = 0;
            String fileUrl = null;
            Integer duration = null;
            Long artifactId = null;

            if (artifact != null) {
                artifactId = artifact.getId();
                // Dùng optimizedUrl nếu content đã PUBLISHED, còn lại dùng raw URL để preview ngay
                boolean isPublished = ContentStatus.PUBLISHED.name().equalsIgnoreCase(content.getStatus());
                fileUrl = (isPublished && StringUtils.hasText(artifact.getOptimizedUrl()))
                        ? artifact.getOptimizedUrl()
                        : artifact.getFileUrl();
                duration = artifact.getDurationSeconds();
                likeCount = reactionRepository.countByArtifactIdAndType(artifact.getId(), "LIKE");
                dislikeCount = reactionRepository.countByArtifactIdAndType(artifact.getId(), "DISLIKE");
                commentCount = commentRepository.countByArtifactId(artifact.getId());
            }

            result.add(CreatorVideoItemResponse.builder()
                    .contentId(content.getId())
                    .artifactId(artifactId)
                    .channelId(content.getChannel() != null ? content.getChannel().getId() : null)
                    .channelName(content.getChannel() != null ? content.getChannel().getName() : null)
                    .title(content.getTitle())
                    .description(content.getTextBody())
                    .status(content.getStatus())
                    .fileUrl(fileUrl)
                    .durationSeconds(duration)
                    .isExclusive(content.getIsExclusive())
                    .createdAt(content.getCreatedAt())
                    .updatedAt(content.getUpdatedAt())
                    .likeCount(likeCount)
                    .dislikeCount(dislikeCount)
                    .commentCount(commentCount)
                    .build());
        }

        // 4. Sắp xếp danh sách video
        Comparator<CreatorVideoItemResponse> comparator = getCreatorVideoComparator(sortBy);
        if ("asc".equalsIgnoreCase(sortDir)) {
            result.sort(comparator);
        } else {
            result.sort(comparator.reversed());
        }

        return result;
    }

    private Comparator<CreatorVideoItemResponse> getCreatorVideoComparator(String sortBy) {
        if (!StringUtils.hasText(sortBy)) {
            sortBy = "createdAt";
        }
        Comparator<CreatorVideoItemResponse> primary;
        switch (sortBy.toLowerCase()) {
            case "title" -> primary = Comparator.comparing(
                    v -> v.getTitle() != null ? v.getTitle().toLowerCase() : "",
                    Comparator.naturalOrder()
            );
            case "likecount", "likes", "like" -> primary = Comparator.comparingLong(CreatorVideoItemResponse::getLikeCount);
            case "dislikecount", "dislikes" -> primary = Comparator.comparingLong(CreatorVideoItemResponse::getDislikeCount);
            case "commentcount", "comments", "comment" -> primary = Comparator.comparingLong(CreatorVideoItemResponse::getCommentCount);
            case "durationseconds", "duration" -> primary = Comparator.comparingInt(
                    v -> v.getDurationSeconds() != null ? v.getDurationSeconds() : 0
            );
            default -> primary = Comparator.comparing(
                    CreatorVideoItemResponse::getCreatedAt,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
        }

        return primary.thenComparing(
                Comparator.comparing(
                        CreatorVideoItemResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public CreatorVideoDetailResponse getVideoDetail(String email, Long contentId) {
        User creator = getUserByEmail(email);
        Content content = contentRepository.findByIdAndCreatorId(contentId, creator.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy video hoặc bạn không có quyền truy cập"));

        Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId()).orElse(null);
        long likeCount = 0;
        long dislikeCount = 0;
        long commentCount = 0;
        String fileUrl = null;
        Integer duration = null;
        Long artifactId = null;
        List<CreatorCommentItemResponse> commentItems = new ArrayList<>();

        if (artifact != null) {
            artifactId = artifact.getId();
            boolean isPublished = ContentStatus.PUBLISHED.name().equalsIgnoreCase(content.getStatus());
            fileUrl = (isPublished && StringUtils.hasText(artifact.getOptimizedUrl()))
                    ? artifact.getOptimizedUrl()
                    : artifact.getFileUrl();
            duration = artifact.getDurationSeconds();
            likeCount = reactionRepository.countByArtifactIdAndType(artifact.getId(), "LIKE");
            dislikeCount = reactionRepository.countByArtifactIdAndType(artifact.getId(), "DISLIKE");
            commentCount = commentRepository.countByArtifactId(artifact.getId());

            List<Comment> comments = commentRepository.findByArtifactIdWithUser(artifact.getId());
            for (Comment c : comments) {
                commentItems.add(CreatorCommentItemResponse.builder()
                        .id(c.getId())
                        .userId(c.getUser() != null ? c.getUser().getId() : null)
                        .userEmail(c.getUser() != null ? c.getUser().getEmail() : "Ẩn danh")
                        .textBody(c.getTextBody())
                        .status(c.getStatus())
                        .createdAt(c.getCreatedAt())
                        .build());
            }
        }

        return CreatorVideoDetailResponse.builder()
                .contentId(content.getId())
                .artifactId(artifactId)
                .channelId(content.getChannel() != null ? content.getChannel().getId() : null)
                .channelName(content.getChannel() != null ? content.getChannel().getName() : null)
                .title(content.getTitle())
                .description(content.getTextBody())
                .status(content.getStatus())
                .fileUrl(fileUrl)
                .durationSeconds(duration)
                .isExclusive(content.getIsExclusive())
                .createdAt(content.getCreatedAt())
                .updatedAt(content.getUpdatedAt())
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .commentCount(commentCount)
                .comments(commentItems)
                .build();
    }

    @Override
    @Transactional
    public CreatorVideoItemResponse updateVideo(String email, Long contentId, CreatorUpdateVideoRequest request) {
        User creator = getUserByEmail(email);
        Content content = contentRepository.findByIdAndCreatorId(contentId, creator.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy video hoặc bạn không có quyền chỉnh sửa"));

        content.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) {
            content.setTextBody(request.getDescription().trim());
        }
        if (request.getIsExclusive() != null) {
            content.setIsExclusive(request.getIsExclusive());
        }
        content.setUpdatedAt(Instant.now());
        Content saved = contentRepository.save(content);

        Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(saved.getId()).orElse(null);
        long likeCount = artifact != null ? reactionRepository.countByArtifactIdAndType(artifact.getId(), "LIKE") : 0;
        long dislikeCount = artifact != null ? reactionRepository.countByArtifactIdAndType(artifact.getId(), "DISLIKE") : 0;
        long commentCount = artifact != null ? commentRepository.countByArtifactId(artifact.getId()) : 0;

        return CreatorVideoItemResponse.builder()
                .contentId(saved.getId())
                .artifactId(artifact != null ? artifact.getId() : null)
                .channelId(saved.getChannel() != null ? saved.getChannel().getId() : null)
                .channelName(saved.getChannel() != null ? saved.getChannel().getName() : null)
                .title(saved.getTitle())
                .description(saved.getTextBody())
                .status(saved.getStatus())
                .fileUrl(artifact != null
                        ? (ContentStatus.PUBLISHED.name().equalsIgnoreCase(saved.getStatus()) && StringUtils.hasText(artifact.getOptimizedUrl())
                            ? artifact.getOptimizedUrl()
                            : artifact.getFileUrl())
                        : null)
                .durationSeconds(artifact != null ? artifact.getDurationSeconds() : null)
                .isExclusive(saved.getIsExclusive())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .commentCount(commentCount)
                .build();
    }

    @Override
    @Transactional
    public CreatorVideoItemResponse updateVideoVisibility(String email, Long contentId, Boolean hidden) {
        User creator = getUserByEmail(email);
        Content content = contentRepository.findByIdAndCreatorId(contentId, creator.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy video hoặc bạn không có quyền cập nhật"));

        String newStatus = Boolean.TRUE.equals(hidden) ? ContentStatus.HIDDEN.name() : ContentStatus.PUBLISHED.name();
        content.setStatus(newStatus);
        content.setUpdatedAt(Instant.now());
        Content saved = contentRepository.save(content);

        Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(saved.getId()).orElse(null);
        if (artifact != null) {
            artifact.setStatus(newStatus);
            // Khi publish: đảm bảo optimizedUrl đã được build (backup nếu lần render chưa build)
            if (ContentStatus.PUBLISHED.name().equals(newStatus) && !StringUtils.hasText(artifact.getOptimizedUrl())
                    && StringUtils.hasText(artifact.getFileUrl())) {
                artifact.setOptimizedUrl(fileStorageService.buildOptimizedVideoUrl(artifact.getFileUrl()));
                log.info("Built optimized URL on publish for artifact {}", artifact.getId());
            }
            artifactRepository.save(artifact);
        }

        long likeCount = artifact != null ? reactionRepository.countByArtifactIdAndType(artifact.getId(), "LIKE") : 0;
        long dislikeCount = artifact != null ? reactionRepository.countByArtifactIdAndType(artifact.getId(), "DISLIKE") : 0;
        long commentCount = artifact != null ? commentRepository.countByArtifactId(artifact.getId()) : 0;

        return CreatorVideoItemResponse.builder()
                .contentId(saved.getId())
                .artifactId(artifact != null ? artifact.getId() : null)
                .channelId(saved.getChannel() != null ? saved.getChannel().getId() : null)
                .channelName(saved.getChannel() != null ? saved.getChannel().getName() : null)
                .title(saved.getTitle())
                .description(saved.getTextBody())
                .status(saved.getStatus())
                .fileUrl(artifact != null
                        ? (ContentStatus.PUBLISHED.name().equalsIgnoreCase(newStatus) && StringUtils.hasText(artifact.getOptimizedUrl())
                            ? artifact.getOptimizedUrl()
                            : artifact.getFileUrl())
                        : null)
                .durationSeconds(artifact != null ? artifact.getDurationSeconds() : null)
                .isExclusive(saved.getIsExclusive())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .commentCount(commentCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreatorCommentItemResponse> getVideoComments(String email, Long contentId) {
        User creator = getUserByEmail(email);
        Content content = contentRepository.findByIdAndCreatorId(contentId, creator.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy video hoặc bạn không có quyền xem"));

        Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId()).orElse(null);
        if (artifact == null) {
            return Collections.emptyList();
        }

        List<Comment> comments = commentRepository.findByArtifactIdWithUser(artifact.getId());
        List<CreatorCommentItemResponse> result = new ArrayList<>();
        for (Comment c : comments) {
            result.add(CreatorCommentItemResponse.builder()
                    .id(c.getId())
                    .userId(c.getUser() != null ? c.getUser().getId() : null)
                    .userEmail(c.getUser() != null ? c.getUser().getEmail() : "Ẩn danh")
                    .textBody(c.getTextBody())
                    .status(c.getStatus())
                    .createdAt(c.getCreatedAt())
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreatorVoiceResponse> getVoiceCatalog(String email) {
        User creator = getUserByEmail(email);
        List<CreatorVoiceResponse> list = new ArrayList<>();

        // 1. Edge-TTS Voices (Hoàn toàn miễn phí, chuẩn giọng Việt)
        list.add(CreatorVoiceResponse.builder()
                .id("vi-VN-NamMinhNeural")
                .name("Nam Minh")
                .gender("male")
                .engine("edge-tts")
                .accent("Nam chuẩn Bắc, truyền cảm, tự nhiên")
                .recommendedFor("Thuyết minh phổ thông, podcast, tài liệu lịch sử")
                .vietnameseRating(5.0)
                .previewUrl("/audio/voices/vi-VN-NamMinhNeural.mp3")
                .sampleText("Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời.")
                .tags(List.of("free", "male", "recommended", "podcast"))
                .isRecommended(true)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("vi-VN-HoaiMyNeural")
                .name("Hoài My")
                .gender("female")
                .engine("edge-tts")
                .accent("Nữ chuẩn Bắc, dịu dàng, lắng đọng")
                .recommendedFor("Huyền sử, văn hóa nghệ thuật, nhân vật lịch sử")
                .vietnameseRating(5.0)
                .previewUrl("/audio/voices/vi-VN-HoaiMyNeural.mp3")
                .sampleText("Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời.")
                .tags(List.of("free", "female", "recommended", "culture"))
                .isRecommended(true)
                .isCloned(false)
                .build());

        // 2. ElevenLabs Curated Voices (Ưu tiên phát âm Tiếng Việt xuất sắc)
        list.add(CreatorVoiceResponse.builder()
                .id("Brian")
                .name("Brian (Hùng Tráng - Phim Tài Liệu)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Trầm ấm, hào sảng, uy lực, rất vang và tròn chữ")
                .recommendedFor("Chiến trận sử thi, Đại Việt chiến thắng, VTV Đặc Biệt")
                .vietnameseRating(5.0)
                .previewUrl("https://api.us.elevenlabs.io/v1/voices/nPczCjzI2devNBz1zQrb/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiIyZGQzZTcyYy00ZmQzLTQyZjEtOTNlYS1hYmM1ZDRlNWFhMWQubXAzIiwidGltZXN0YW1wIjoxNzkwNzY5NjAwMDAwMDAwfQ%3D%3D")
                .sampleText("Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời.")
                .tags(List.of("elevenlabs", "male", "recommended", "epic", "documentary"))
                .isRecommended(true)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Adam")
                .name("Adam (Podcast Tự Sự & Lắng Đọng)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Nam trầm ấm, tự nhiên, gần gũi, biểu cảm phong phú")
                .recommendedFor("Podcast lịch sử, tự sự cuộc đời danh nhân, đàm đạo sử xưa")
                .vietnameseRating(5.0)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/d6905d7a-dd26-4187-bfff-1bd3a5ea7cac.mp3")
                .sampleText("Mỗi trang sử Việt không chỉ là chiến tích, mà còn là tâm hồn của tiền nhân.")
                .tags(List.of("elevenlabs", "male", "recommended", "podcast", "storytelling"))
                .isRecommended(true)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Sarah")
                .name("Sarah (Nữ Truyền Cảm Dịu Dàng)")
                .gender("female")
                .engine("elevenlabs")
                .accent("Dịu dàng, sâu lắng, lay động lòng người, nhịp điệu tinh tế")
                .recommendedFor("Tình sử bi tráng, huyền sử dân tộc, giai nhân và biến cố lịch sử")
                .vietnameseRating(5.0)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3")
                .sampleText("Dòng sông Bạch Đằng cuộn sóng, mang theo khí phách ngàn năm của cha ông.")
                .tags(List.of("elevenlabs", "female", "recommended", "emotion", "culture"))
                .isRecommended(true)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("George")
                .name("George (Học Giả Đĩnh Đạc)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Đĩnh đạc, điềm tĩnh, phong thái học thuật uyên bác")
                .recommendedFor("Phân tích chiến thuật quân sự, bình luận bối cảnh triều đại")
                .vietnameseRating(5.0)
                .previewUrl("https://api.us.elevenlabs.io/v1/voices/JBFqnCBsd6RMkjVDRZzb/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiJlNjIwNmQxYS0wNzIxLTQ3ODctYWFmYi0wNmE2ZTcwNWNhYzUubXAzIiwidGltZXN0YW1wIjoxNzkwNzY5NjAwMDAwMDAwfQ%3D%3D")
                .sampleText("Chiến thắng Như Nguyệt là minh chứng kinh điển cho nghệ thuật tiên phát chế nhân.")
                .tags(List.of("elevenlabs", "male", "recommended", "scholarly"))
                .isRecommended(true)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Laura")
                .name("Laura (Nữ Sinh Động & Khám Phá)")
                .gender("female")
                .engine("elevenlabs")
                .accent("Tươi sáng, dõng dạc, cuốn hút, tràn đầy năng lượng")
                .recommendedFor("Khám phá di tích lịch sử, bảo tàng, video giáo dục ngắn")
                .vietnameseRating(4.8)
                .previewUrl("https://api.us.elevenlabs.io/v1/voices/FGY2WhTYpPnrIDTdsKH5/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiI2NzM0MTc1OS1hZDA4LTQxYTUtYmU2ZS1kZTEyZmU0NDg2MTgubXAzIiwidGltZXN0YW1wIjoxNzkwNzY5NjAwMDAwMDAwfQ%3D%3D")
                .sampleText("Bạn có biết bí mật nào ẩn sau bức tường Hoàng thành Thăng Long?")
                .tags(List.of("elevenlabs", "female", "energetic", "education"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Liam")
                .name("Liam (Nam Trẻ Trung Hiện Đại)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Dứt khoát, thanh thoát, phong cách kể chuyện nhanh hiện đại")
                .recommendedFor("Tóm tắt sử 60 giây, video TikTok / Shorts / Reels giới trẻ")
                .vietnameseRating(4.7)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148076-6363-42db-aea8-31424308b92c.mp3")
                .sampleText("Chỉ trong 60 giây, hãy xem Quang Trung thần tốc đại phá quân Thanh thế nào!")
                .tags(List.of("elevenlabs", "male", "modern", "shorts"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Callum")
                .name("Callum (Hào Khí Sử Thi & Hịch Chiến Trận)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Khàn uy lực, dồn dập, giàu kịch tính chiến đấu")
                .recommendedFor("Đọc Hịch Tướng Sĩ, trận đánh ác liệt, khoảnh khắc quyết tử")
                .vietnameseRating(4.8)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3")
                .sampleText("Ta thường nghe: Kỷ Tín đem mình chết thay, cứu thoát cho Cao Đế...")
                .tags(List.of("elevenlabs", "male", "epic", "battle"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Bill")
                .name("Bill (Già Cổ Kính & Tích Xưa)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Già dặn, ấm áp, từng trải, ngâm ngợi sự đời")
                .recommendedFor("Cổ tích sử học, chuyện xưa tích cũ, lời khuyên tiền nhân")
                .vietnameseRating(4.7)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/pqHfZKP75CvOlQylNhV4/d782b3ff-84ba-4029-848c-acf01285524d.mp3")
                .sampleText("Ngày xửa ngày xưa, trên mảnh đất Rồng Tiên, cha ông ta đã dựng nên cơ đồ này.")
                .tags(List.of("elevenlabs", "male", "ancient", "wise"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Alice")
                .name("Alice (Nữ Tri Thức Chuẩn Mực)")
                .gender("female")
                .engine("elevenlabs")
                .accent("Trong sáng, chuẩn chỉ, phong thái thuyết trình sư phạm")
                .recommendedFor("Tư liệu khảo cổ học, hiện vật bảo tàng, niên biểu lịch sử")
                .vietnameseRating(4.6)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/d10f7534-11f6-41fe-a012-2de1e482d336.mp3")
                .sampleText("Trống đồng Đông Sơn là biểu tượng rực rỡ của văn minh lúa nước Việt cổ.")
                .tags(List.of("elevenlabs", "female", "scholarly", "education"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("River")
                .name("River (Trung Tính Điềm Đạm)")
                .gender("neutral")
                .engine("elevenlabs")
                .accent("Điềm đạm, khách quan, tự nhiên, nhịp điệu hài hòa")
                .recommendedFor("Bản tin lịch sử, thời sự kỷ niệm, thông tin tổng quan")
                .vietnameseRating(4.5)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/SAz9YHcvj6GT2YYXdXww/e6c95f0b-2227-491a-b3d7-2249240decb7.mp3")
                .sampleText("Lịch sử là tấm gương soi chiếu để chúng ta tự tin bước tới tương lai.")
                .tags(List.of("elevenlabs", "neutral", "news"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Roger")
                .name("Roger (Nam Mộc Mạc Thư Thái)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Thư thả, mộc mạc, gần gũi với đời sống thôn quê xưa")
                .recommendedFor("Lịch sử làng nghề, văn hóa ẩm thực, phong tục tập quán")
                .vietnameseRating(4.5)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/CwhRBWXzGAHq8TQ4Fs17/58ee3ff5-f6f2-4628-93b8-e38eb31806b0.mp3")
                .sampleText("Những nếp nhà tranh, giếng nước gốc đa đã nuôi dưỡng tâm hồn người Việt.")
                .tags(List.of("elevenlabs", "male", "folk", "culture"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Harry")
                .name("Harry (Chiến Binh Quyết Đoán)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Đanh thép, dũng mãnh, đầy nhiệt huyết quật cường")
                .recommendedFor("Tuyên ngôn độc lập, kháng chiến chống ngoại xâm, lời thề cứu nước")
                .vietnameseRating(4.5)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/SOYHLrjzK2X1ezoPC6cr/86d178f6-f4b6-4e0e-85be-3de19f490794.mp3")
                .sampleText("Bao giờ người Tây nhổ hết cỏ nước Nam thì mới hết người Nam đánh Tây!")
                .tags(List.of("elevenlabs", "male", "warrior", "epic"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Matilda")
                .name("Matilda (Nữ Chuyên Nghiệp)")
                .gender("female")
                .engine("elevenlabs")
                .accent("Đĩnh đạc, rõ nét, phong thái học thuật")
                .recommendedFor("Phân tích tư liệu, khảo cứu văn bia, chiếu chỉ cổ")
                .vietnameseRating(4.4)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b930e18d-6b4d-466e-bab2-0ae97c6d8535.mp3")
                .sampleText("Chiếu dời đô của vua Lý Thái Tổ là quyết định thay đổi vận mệnh non sông.")
                .tags(List.of("elevenlabs", "female", "scholarly"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Will")
                .name("Will (Nam Lạc Quan Dịu Nhẹ)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Lạc quan, nhẹ nhàng, truyền cảm hứng tích cực")
                .recommendedFor("Những giai đoạn phục hưng hòa bình, kiến thiết đất nước")
                .vietnameseRating(4.4)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f3d-ad29-4980-af41-53f20c72d7a4.mp3")
                .sampleText("Thái bình nên gắng sức, non nước ấy ngàn thu.")
                .tags(List.of("elevenlabs", "male", "peace", "calm"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Daniel")
                .name("Daniel (Phát Thanh Viên Trang Trọng)")
                .gender("male")
                .engine("elevenlabs")
                .accent("Chuẩn chỉ, đĩnh đạc, âm vang phát thanh truyền hình")
                .recommendedFor("Bản tin trang trọng, sự kiện lịch sử trọng đại")
                .vietnameseRating(4.4)
                .previewUrl("https://api.us.elevenlabs.io/v1/voices/onwK4e9ZLuTAKqWW03F9/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiI3ZWVlMDIzNi0xYTcyLTRiODYtYjMwMy01ZGNhZGMwMDdiYTkubXAzIiwidGltZXN0YW1wIjoxNzkwNzY5NjAwMDAwMDAwfQ%3D%3D")
                .sampleText("Việt Nam Dân chủ Cộng hòa - Độc lập, Tự do, Hạnh phúc.")
                .tags(List.of("elevenlabs", "male", "formal", "broadcast"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Lily")
                .name("Lily (Nữ Quý Phái Lôi Cuốn)")
                .gender("female")
                .engine("elevenlabs")
                .accent("Đằm thắm, lôi cuốn, có chiều sâu kịch nghệ")
                .recommendedFor("Chuyện hậu cung, truyền kỳ mạn lục, giai thoại bí sử")
                .vietnameseRating(4.3)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3")
                .sampleText("Dưới ánh trăng thành xưa, từng trang sử như thì thầm những bí mật nghìn năm.")
                .tags(List.of("elevenlabs", "female", "mystery", "drama"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        list.add(CreatorVoiceResponse.builder()
                .id("Rachel")
                .name("Rachel (Nữ Điềm Đạm & Rõ Chữ)")
                .gender("female")
                .engine("elevenlabs")
                .accent("Điềm đạm, rõ chữ, thanh lịch, chuẩn mực")
                .recommendedFor("Thuyết minh tài liệu, lời dẫn chương trình, đọc truyện")
                .vietnameseRating(4.6)
                .previewUrl("https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/sample.mp3")
                .sampleText("Chào mừng các bạn đến với kênh kể chuyện lịch sử Việt Nam.")
                .tags(List.of("elevenlabs", "female", "calm", "narrative"))
                .isRecommended(false)
                .isCloned(false)
                .build());

        // Kiểm tra xem Creator có cấu hình ElevenLabs API key riêng không
        // Nếu có, truy vấn ElevenLabs API để lấy các giọng Cloned riêng của Creator
        Optional<CreatorAiSetting> settingOpt = creatorAiSettingRepository.findByUserId(creator.getId());
        String elKey = settingOpt.map(CreatorAiSetting::getElevenlabsApiKey).orElse("");
        if (StringUtils.hasText(elKey)) {
            try {
                HttpRequest elReq = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.elevenlabs.io/v1/voices"))
                        .header("xi-api-key", elKey.trim())
                        .timeout(Duration.ofSeconds(5))
                        .GET()
                        .build();
                HttpResponse<String> elResp = httpClient.send(elReq, HttpResponse.BodyHandlers.ofString());
                if (elResp.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(elResp.body());
                    JsonNode voicesNode = root.path("voices");
                    if (voicesNode.isArray()) {
                        int insertedIdx = 0;
                        for (JsonNode v : voicesNode) {
                            String cat = v.path("category").asText("");
                            if ("cloned".equalsIgnoreCase(cat) || "generated".equalsIgnoreCase(cat)) {
                                String vId = v.path("voice_id").asText();
                                String vName = v.path("name").asText("Giọng riêng");
                                String pUrl = v.path("preview_url").asText(null);
                                list.add(insertedIdx++, CreatorVoiceResponse.builder()
                                        .id(vId)
                                        .name(vName + " (Giọng Cloned Cá Nhân)")
                                        .gender("custom")
                                        .engine("elevenlabs")
                                        .accent("Giọng nhân bản tùy chỉnh cá nhân trên tài khoản của bạn")
                                        .recommendedFor("Thương hiệu cá nhân độc quyền của Creator")
                                        .vietnameseRating(5.0)
                                        .previewUrl(pUrl)
                                        .sampleText("Đây là giọng đọc được nhân bản từ tài khoản ElevenLabs của bạn.")
                                        .tags(List.of("elevenlabs", "cloned", "custom"))
                                        .isRecommended(true)
                                        .isCloned(true)
                                        .build());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Không thể tải custom voices từ ElevenLabs (có thể key hết hạn hoặc chưa có giọng clone): {}", e.getMessage());
            }
        }

        return list;
    }

    @Override
    public Map<String, Object> previewVoice(String email, CreatorVoicePreviewRequest request) {
        User creator = getUserByEmail(email);
        String apiKey = request.getElevenlabsApiKey();
        if (!StringUtils.hasText(apiKey)) {
            apiKey = creatorAiSettingRepository.findByUserId(creator.getId())
                    .map(CreatorAiSetting::getElevenlabsApiKey)
                    .orElse("");
        }

        try {
            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("engine", request.getEngine());
            reqBody.put("voice", request.getVoiceId());
            reqBody.put("text", request.getText());
            reqBody.put("elevenlabs_api_key", apiKey);

            String jsonPayload = objectMapper.writeValueAsString(reqBody);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(toolUrl + "/api/voice/preview"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                String body = response.body();
                log.warn("Lỗi khi tạo audio preview từ tool: status={}, body={}", response.statusCode(), body);
                throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Không thể tạo bản nghe thử: " + body);
            }

            JsonNode node = objectMapper.readTree(response.body());
            String relativeUrl = node.path("url").asText();
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("url", relativeUrl);
            res.put("filename", node.path("filename").asText());
            return res;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi kết nối tới engine tạo voice preview", e);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Lỗi kết nối engine âm thanh: " + e.getMessage());
        }
    }
}

