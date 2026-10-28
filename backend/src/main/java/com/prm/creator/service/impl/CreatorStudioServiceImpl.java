package com.prm.creator.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prm.channel.entity.AiFilterLog;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.entity.ModerationReview;
import com.prm.channel.entity.Transcript;
import com.prm.channel.repository.AiFilterLogRepository;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.ModerationReviewRepository;
import com.prm.channel.repository.TranscriptRepository;
import com.prm.channel.service.AiShieldPolicyService;
import com.prm.channel.service.SeriesService;
import com.prm.common.enums.AiShieldTier;
import java.math.BigDecimal;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.enums.ActiveStatus;
import com.prm.common.enums.ArtifactStatus;
import com.prm.common.enums.ContentStatus;
import com.prm.common.service.FileStorageService;
import com.prm.common.util.SearchUtils;
import java.util.Comparator;
import com.prm.creator.dto.request.CreatorAiSettingRequest;
import com.prm.creator.dto.request.CreatorPatchPodcastRequest;
import com.prm.creator.dto.request.CreatorRenderRequest;
import com.prm.creator.dto.request.CreatorSentencePatchItem;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
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
    private final AiFilterLogRepository aiFilterLogRepository;
    private final ModerationReviewRepository moderationReviewRepository;
    private final AiShieldPolicyService aiShieldPolicyService;

    @Autowired
    public CreatorStudioServiceImpl(
            UserRepository userRepository,
            CreatorAiSettingRepository creatorAiSettingRepository,
            ChannelRepository channelRepository,
            ContentRepository contentRepository,
            ArtifactRepository artifactRepository,
            TranscriptRepository transcriptRepository,
            ReactionRepository reactionRepository,
            CommentRepository commentRepository,
            FileStorageService fileStorageService,
            ObjectMapper objectMapper,
            AiFilterLogRepository aiFilterLogRepository,
            ModerationReviewRepository moderationReviewRepository,
            AiShieldPolicyService aiShieldPolicyService
    ) {
        this.userRepository = userRepository;
        this.creatorAiSettingRepository = creatorAiSettingRepository;
        this.channelRepository = channelRepository;
        this.contentRepository = contentRepository;
        this.artifactRepository = artifactRepository;
        this.transcriptRepository = transcriptRepository;
        this.reactionRepository = reactionRepository;
        this.commentRepository = commentRepository;
        this.fileStorageService = fileStorageService;
        this.objectMapper = objectMapper;
        this.aiFilterLogRepository = aiFilterLogRepository;
        this.moderationReviewRepository = moderationReviewRepository;
        this.aiShieldPolicyService = aiShieldPolicyService;
    }

    public CreatorStudioServiceImpl(
            UserRepository userRepository,
            CreatorAiSettingRepository creatorAiSettingRepository,
            ChannelRepository channelRepository,
            ContentRepository contentRepository,
            ArtifactRepository artifactRepository,
            TranscriptRepository transcriptRepository,
            ReactionRepository reactionRepository,
            CommentRepository commentRepository,
            FileStorageService fileStorageService,
            ObjectMapper objectMapper
    ) {
        this(userRepository, creatorAiSettingRepository, channelRepository, contentRepository,
                artifactRepository, transcriptRepository, reactionRepository, commentRepository,
                fileStorageService, objectMapper, null, null, null);
    }

    public CreatorStudioServiceImpl(
            UserRepository userRepository,
            CreatorAiSettingRepository creatorAiSettingRepository,
            ChannelRepository channelRepository,
            ContentRepository contentRepository,
            ArtifactRepository artifactRepository,
            TranscriptRepository transcriptRepository,
            ReactionRepository reactionRepository,
            CommentRepository commentRepository,
            FileStorageService fileStorageService,
            ObjectMapper objectMapper,
            AiFilterLogRepository aiFilterLogRepository,
            ModerationReviewRepository moderationReviewRepository
    ) {
        this(userRepository, creatorAiSettingRepository, channelRepository, contentRepository,
                artifactRepository, transcriptRepository, reactionRepository, commentRepository,
                fileStorageService, objectMapper, aiFilterLogRepository, moderationReviewRepository, null);
    }

    @Value("${app.tool.url:http://localhost:8000}")
    private String toolUrl;

    @Autowired(required = false)
    private SeriesService seriesService;

    private HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @FunctionalInterface
    public interface HttpSender {
        HttpResponse<String> send(HttpRequest request) throws IOException, InterruptedException;
    }

    private HttpSender httpSender = req -> httpClient.send(req, HttpResponse.BodyHandlers.ofString());

    public void setHttpClient(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    public void setHttpSender(HttpSender httpSender) {
        this.httpSender = httpSender;
    }

    public void setToolUrl(String toolUrl) {
        this.toolUrl = toolUrl;
    }

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
        return uploadSceneImage(file, "whiteboard/scenes");
    }

    private static final Set<String> ALLOWED_UPLOAD_FOLDERS = Set.of(
            "whiteboard/scenes",
            "whiteboard/thumbnails",
            "whiteboard/covers",
            "podcasts/covers",
            "series/covers"
    );

    @Override
    public CreatorUploadImageResponse uploadSceneImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY, "Vui lòng chọn hình ảnh để tải lên");
        }
        String targetFolder = (StringUtils.hasText(folder) && ALLOWED_UPLOAD_FOLDERS.contains(folder.trim()))
                ? folder.trim()
                : "whiteboard/scenes";
        log.info("Uploading creator image ({} bytes) to Cloudinary folder '{}'...", file.getSize(), targetFolder);
        String secureUrl = fileStorageService.uploadImage(file, targetFolder);
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

            HttpResponse<String> response = httpSender.send(httpRequest);

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
    public Object verifyScript(String email, String script) {
        if (!StringUtils.hasText(script)) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Nội dung kịch bản cần thẩm định không được để trống");
        }

        User user = getUserByEmail(email);
        String geminiKey = creatorAiSettingRepository.findByUserId(user.getId())
                .map(CreatorAiSetting::getGeminiApiKey)
                .orElse("");

        Map<String, Object> toolPayload = new HashMap<>();
        toolPayload.put("script", script.trim());
        if (StringUtils.hasText(geminiKey)) {
            toolPayload.put("gemini_api_key", geminiKey.trim());
        }

        try {
            String jsonBody = objectMapper.writeValueAsString(toolPayload);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(toolUrl + "/api/script/verify"))
                    .version(HttpClient.Version.HTTP_1_1)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpSender.send(httpRequest);
            if (response.statusCode() != 200) {
                String errorDetail = extractErrorDetail(response.body(), response.statusCode());
                log.error("Tool verify-script failed with HTTP {}: {}", response.statusCode(), errorDetail);
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Lỗi thẩm định kịch bản: " + errorDetail);
            }

            return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Failed to communicate with Tool verify-script API", e);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể kết nối đến dịch vụ thẩm định kịch bản: " + e.getMessage());
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
                ? request.getTtsEngine().trim().toLowerCase()
                : settingOpt.map(CreatorAiSetting::getTtsEngine).orElse("edge-tts");
        String voiceName = StringUtils.hasText(request.getVoiceName())
                ? request.getVoiceName().trim()
                : settingOpt.map(CreatorAiSetting::getVoiceName).orElse("vi-VN-NamMinhNeural");

        // Tự động chuẩn hóa tương thích giữa công nghệ TTS và mã giọng đọc
        if ("elevenlabs".equalsIgnoreCase(ttsEngine)) {
            if (!StringUtils.hasText(elevenKey)) {
                log.warn("Creator '{}' selected ElevenLabs but has no ElevenLabs key. Falling back to edge-tts.", email);
                ttsEngine = "edge-tts";
                voiceName = "vi-VN-NamMinhNeural";
            } else if (voiceName.startsWith("vi-VN-") || voiceName.contains("-")) {
                voiceName = "Brian";
            }
        } else {
            ttsEngine = "edge-tts";
            if (!voiceName.startsWith("vi-VN-")) {
                voiceName = "vi-VN-NamMinhNeural";
            }
        }

        String renderMode = StringUtils.hasText(request.getRenderMode()) ? request.getRenderMode().trim().toLowerCase() : "whiteboard";
        boolean isAudioPodcast = "audio_podcast".equals(renderMode) || "podcast".equals(renderMode) || "audio".equals(renderMode);

        String coverB64 = null;
        if (!isAudioPodcast) {
            if (request.getStoryboard() == null || request.getStoryboard().isEmpty()) {
                throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Kịch bản (storyboard) không được để trống");
            }
            if (request.getSceneImages() == null || request.getSceneImages().isEmpty()) {
                throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Danh sách ảnh minh họa cảnh không được để trống");
            }
            if (!StringUtils.hasText(geminiKey)) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST_DATA,
                        "⚠️ Bạn chưa cấu hình Google Gemini API Key cá nhân trong Cài đặt (⚙️)!"
                );
            }
        } else {
            // Cho phép dán trực tiếp kịch bản HOẶC phân cảnh
            if (!StringUtils.hasText(request.getScriptText()) && (request.getStoryboard() == null || request.getStoryboard().isEmpty())) {
                throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Vui lòng nhập nội dung kịch bản thuyết minh (scriptText) hoặc phân cảnh (storyboard)");
            }
            if (!StringUtils.hasText(geminiKey) && !StringUtils.hasText(request.getScriptText()) && request.getStoryboard() == null) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST_DATA,
                        "⚠️ Bạn chưa cấu hình Google Gemini API Key cá nhân trong Cài đặt (⚙️)!"
                );
            }
            // Bắt buộc phải có ảnh bìa (thumbnail) cho video Audio Podcast
            coverB64 = StringUtils.hasText(request.getCoverImage()) ? request.getCoverImage().trim() : null;
            if (coverB64 == null && request.getSceneImages() != null && !request.getSceneImages().isEmpty()) {
                coverB64 = request.getSceneImages().get("cover");
                if (coverB64 == null) {
                    coverB64 = request.getSceneImages().get("1");
                }
                if (coverB64 == null) {
                    coverB64 = request.getSceneImages().values().iterator().next();
                }
            }
            if (!StringUtils.hasText(coverB64)) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST_DATA,
                        "⚠️ Bắt buộc phải có ảnh bìa (thumbnail) cho video Audio Podcast!"
                );
            }
        }

        // 2. Tìm hoặc tự động tạo Kênh cho Creator
        Channel channel = resolveOrCreateChannel(user, request.getChannelId());

        // 3. Trích xuất nội dung văn bản kịch bản từ scriptText hoặc storyboard để lưu vào DB
        String scriptNarration;
        if (StringUtils.hasText(request.getScriptText())) {
            scriptNarration = request.getScriptText().trim();
        } else {
            scriptNarration = extractNarrationScript(request.getStoryboard());
        }

        // 4. LƯU VÀO DATABASE (Content & Artifact & Transcript)
        String contentSourceType = isAudioPodcast ? "AI_PODCAST" : "AI_WHITEBOARD";
        String artifactSourceType = isAudioPodcast ? "PODCAST_STUDIO" : "WHITEBOARD_STUDIO";

        Content content = Content.builder()
                .channel(channel)
                .title(request.getTitle().trim())
                .textBody(scriptNarration)
                .sourceType(contentSourceType)
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
                .sourceType(artifactSourceType)
                .durationSeconds(request.getDurationSec())
                .status("PROCESSING")
                .version(1)
                .createdAt(Instant.now())
                .build();
        artifact = artifactRepository.save(artifact);

        // Trích xuất ảnh bìa / thumbnail cho video:
        // - Ưu tiên hàng đầu: thumbnailUrl hoặc coverImage do chính Creator tải lên / chỉ định
        // - Với Podcast: dùng coverImage (hoặc thumbnailUrl)
        // - Với Bảng trắng (Whiteboard): dùng thumbnailUrl do Creator thêm vô; 
        //   nếu Creator chưa cung cấp, tự động lấy ảnh Cảnh 1 (sceneImages["1"]) làm dự phòng (fallback)
        String thumbImg = null;
        if (StringUtils.hasText(request.getThumbnailUrl())) {
            thumbImg = request.getThumbnailUrl().trim();
        } else if (StringUtils.hasText(request.getCoverImage())) {
            thumbImg = request.getCoverImage().trim();
        } else if (StringUtils.hasText(coverB64)) {
            thumbImg = coverB64;
        }

        if (!isAudioPodcast && !StringUtils.hasText(thumbImg)) {
            if (request.getSceneImages() != null && !request.getSceneImages().isEmpty()) {
                thumbImg = request.getSceneImages().get("thumbnail");
                if (thumbImg == null) {
                    thumbImg = request.getSceneImages().get("cover");
                }
                if (thumbImg == null) {
                    thumbImg = request.getSceneImages().get("1");
                }
                if (thumbImg == null) {
                    thumbImg = request.getSceneImages().values().iterator().next();
                }
            }
        }

        if (StringUtils.hasText(thumbImg)) {
            Artifact thumbArtifact = Artifact.builder()
                    .content(content)
                    .type(isAudioPodcast ? "COVER" : "THUMBNAIL")
                    .fileUrl(thumbImg)
                    .optimizedUrl(thumbImg)
                    .sourceType(artifactSourceType)
                    .status("PROCESSING")
                    .version(1)
                    .createdAt(Instant.now())
                    .build();
            artifactRepository.save(thumbArtifact);
        }

        Transcript transcript = Transcript.builder()
                .artifact(artifact)
                .textBody(scriptNarration)
                .createdAt(Instant.now())
                .build();
        transcriptRepository.save(transcript);

        log.info("Saved Content (ID: {}, mode: {}), Artifact (ID: {}), Transcript for Creator '{}'",
                content.getId(), renderMode, artifact.getId(), email);

        if (request.getSeriesId() != null && seriesService != null) {
            try {
                seriesService.addContentToSeriesDirectly(content.getId(), request.getSeriesId());
            } catch (Exception ex) {
                log.warn("Failed to auto-assign content {} to series {}: {}", content.getId(), request.getSeriesId(), ex.getMessage());
            }
        }

        // 5. Chuyển tiếp tác vụ tạo video sang Python Rendering Engine (kèm Cloudinary Image URLs)
        Map<String, Object> toolPayload = new HashMap<>();
        toolPayload.put("topic", request.getTitle().trim());
        toolPayload.put("duration_sec", request.getDurationSec());
        toolPayload.put("render_mode", isAudioPodcast ? "audio_podcast" : "whiteboard");
        if (StringUtils.hasText(request.getScriptText())) {
            toolPayload.put("script_text", request.getScriptText().trim());
        }
        if (StringUtils.hasText(coverB64)) {
            toolPayload.put("cover_image_b64", coverB64);
        } else if (StringUtils.hasText(request.getCoverImage())) {
            toolPayload.put("cover_image_b64", request.getCoverImage().trim());
        }
        if (request.getStoryboard() != null) {
            toolPayload.put("storyboard", request.getStoryboard());
        }
        if (request.getSceneImages() != null) {
            Map<String, String> normalizedImages = new HashMap<>(request.getSceneImages());
            request.getSceneImages().forEach((k, v) -> {
                if (v != null) {
                    String cleanKey = k.toLowerCase().replace("scene_", "").replace("scene", "").trim();
                    normalizedImages.put(cleanKey, v);
                    normalizedImages.put("scene_" + cleanKey, v);
                }
            });
            toolPayload.put("custom_images", normalizedImages);
        }
        toolPayload.put("gemini_api_key", geminiKey);
        toolPayload.put("elevenlabs_api_key", elevenKey);
        toolPayload.put("tts_engine", ttsEngine);
        toolPayload.put("voice_name", voiceName);

        try {
            String jsonBody = objectMapper.writeValueAsString(toolPayload);
            String responseBody = callToolRenderApi(jsonBody);

            JsonNode resJson = objectMapper.readTree(responseBody);
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
            artifact.setStatus(ArtifactStatus.FAILED.name());
            content.setStatus(ContentStatus.FAILED.name());
            artifactRepository.save(artifact);
            contentRepository.save(content);
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

    protected String callToolRenderApi(String jsonBody) throws Exception {
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
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Lỗi khởi tạo render video: " + errorDetail);
        }
        return response.body();
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

            HttpResponse<String> response = httpSender.send(httpRequest);

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
                                c.setStatus(ContentStatus.COMPLETED.name());
                                contentRepository.save(c);

                                List<Artifact> companionArtifacts = artifactRepository.findByContentId(c.getId());
                                for (Artifact ca : companionArtifacts) {
                                    if (!ca.getId().equals(artifact.getId()) && "PROCESSING".equalsIgnoreCase(ca.getStatus())) {
                                        ca.setStatus(ArtifactStatus.COMPLETED.name());
                                        artifactRepository.save(ca);
                                    }
                                }
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
            Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId()).orElse(null);

            // 1. Lọc theo trạng thái (Hỗ trợ lọc theo Content status hoặc Artifact version status)
            if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status.trim())) {
                String reqStatus = status.trim().toUpperCase();
                String curStatus = content.getStatus() != null ? content.getStatus().toUpperCase() : "";
                String artStatus = (artifact != null && artifact.getStatus() != null) ? artifact.getStatus().toUpperCase() : "";

                boolean matchContent = ("PENDING".equals(reqStatus) || "PROCESSING".equals(reqStatus))
                        ? ("PENDING".equals(curStatus) || "PROCESSING".equals(curStatus) || "DRAFT".equals(curStatus) || "PENDING_REVIEW".equals(curStatus))
                        : reqStatus.equals(curStatus);

                boolean matchArtifact = artifact != null && (("PENDING".equals(reqStatus) || "PROCESSING".equals(reqStatus))
                        ? ("PENDING_REVIEW".equals(artStatus) || "PROCESSING".equals(artStatus))
                        : reqStatus.equals(artStatus));

                if (!matchContent && !matchArtifact) {
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

            long likeCount = 0;
            long dislikeCount = 0;
            long commentCount = 0;
            String fileUrl = null;
            Integer duration = null;
            Long artifactId = null;
            BigDecimal aiShieldScore = null;
            AiShieldTier aiShieldTier = null;
            String aiShieldTierLabel = null;
            String aiShieldReason = null;
            String modDecision = null;
            String modReason = null;

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

                if (aiFilterLogRepository != null) {
                    Optional<AiFilterLog> aiLogOpt = aiFilterLogRepository.findTopByArtifactIdOrderByIdDesc(artifact.getId());
                    if (aiLogOpt.isPresent()) {
                        aiShieldScore = aiLogOpt.get().getScore();
                        aiShieldReason = aiLogOpt.get().getReason();
                        if (aiShieldPolicyService != null && aiShieldScore != null) {
                            var eval = aiShieldPolicyService.resolveTier(aiShieldScore);
                            aiShieldTier = eval.tier();
                            aiShieldTierLabel = eval.label();
                        } else {
                            aiShieldTier = AiShieldTier.fromString(aiLogOpt.get().getResult());
                            aiShieldTierLabel = aiShieldTier != null ? aiShieldTier.getDefaultLabel() : resolveTierLabel(aiLogOpt.get().getResult());
                        }
                    }
                }
                if (moderationReviewRepository != null) {
                    Optional<ModerationReview> modOpt = moderationReviewRepository.findTopByArtifactIdOrderByIdDesc(artifact.getId());
                    if (modOpt.isPresent()) {
                        modDecision = modOpt.get().getDecision();
                        modReason = modOpt.get().getReason();
                    }
                }
            }

            String itemStatus = content.getStatus();
            if (artifact != null && StringUtils.hasText(artifact.getStatus())
                    && !ArtifactStatus.PUBLISHED.name().equalsIgnoreCase(artifact.getStatus())
                    && (ArtifactStatus.COMPLETED.name().equalsIgnoreCase(artifact.getStatus())
                        || ArtifactStatus.PENDING_REVIEW.name().equalsIgnoreCase(artifact.getStatus())
                        || ArtifactStatus.REJECTED.name().equalsIgnoreCase(artifact.getStatus()))
                    && ContentStatus.PUBLISHED.name().equalsIgnoreCase(content.getStatus())) {
                itemStatus = artifact.getStatus();
            }

            String thumbnailUrl = null;
            Optional<Artifact> coverOpt = artifactRepository.findLatestCoverArtifact(content.getId());
            if (coverOpt.isPresent()) {
                Artifact coverArt = coverOpt.get();
                thumbnailUrl = StringUtils.hasText(coverArt.getOptimizedUrl()) ? coverArt.getOptimizedUrl() : coverArt.getFileUrl();
            }

            result.add(CreatorVideoItemResponse.builder()
                    .contentId(content.getId())
                    .artifactId(artifactId)
                    .channelId(content.getChannel() != null ? content.getChannel().getId() : null)
                    .channelName(content.getChannel() != null ? content.getChannel().getName() : null)
                    .title(content.getTitle())
                    .description(content.getTextBody())
                    .status(itemStatus)
                    .version(artifact != null ? artifact.getVersion() : 1)
                    .fileUrl(fileUrl)
                    .thumbnailUrl(thumbnailUrl)
                    .durationSeconds(duration)
                    .isExclusive(content.getIsExclusive())
                    .createdAt(content.getCreatedAt())
                    .updatedAt(content.getUpdatedAt())
                    .likeCount(likeCount)
                    .dislikeCount(dislikeCount)
                    .commentCount(commentCount)
                    .aiShieldScore(aiShieldScore)
                    .aiShieldTier(aiShieldTier)
                    .aiShieldTierLabel(aiShieldTierLabel)
                    .aiShieldReason(aiShieldReason)
                    .moderationDecision(modDecision)
                    .moderationReason(modReason)
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
        BigDecimal aiShieldScore = null;
        AiShieldTier aiShieldTier = null;
        String aiShieldTierLabel = null;
        String aiShieldReason = null;
        String modDecision = null;
        String modReason = null;

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

            if (aiFilterLogRepository != null) {
                Optional<AiFilterLog> aiLogOpt = aiFilterLogRepository.findTopByArtifactIdOrderByIdDesc(artifact.getId());
                if (aiLogOpt.isPresent()) {
                    aiShieldScore = aiLogOpt.get().getScore();
                    aiShieldReason = aiLogOpt.get().getReason();
                    if (aiShieldPolicyService != null && aiShieldScore != null) {
                        var eval = aiShieldPolicyService.resolveTier(aiShieldScore);
                        aiShieldTier = eval.tier();
                        aiShieldTierLabel = eval.label();
                    } else {
                        aiShieldTier = AiShieldTier.fromString(aiLogOpt.get().getResult());
                        aiShieldTierLabel = aiShieldTier != null ? aiShieldTier.getDefaultLabel() : resolveTierLabel(aiLogOpt.get().getResult());
                    }
                }
            }
            if (moderationReviewRepository != null) {
                Optional<ModerationReview> modOpt = moderationReviewRepository.findTopByArtifactIdOrderByIdDesc(artifact.getId());
                if (modOpt.isPresent()) {
                    modDecision = modOpt.get().getDecision();
                    modReason = modOpt.get().getReason();
                }
            }

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

        String detailStatus = content.getStatus();
        if (artifact != null && StringUtils.hasText(artifact.getStatus())
                && !ArtifactStatus.PUBLISHED.name().equalsIgnoreCase(artifact.getStatus())
                && (ArtifactStatus.COMPLETED.name().equalsIgnoreCase(artifact.getStatus())
                    || ArtifactStatus.PENDING_REVIEW.name().equalsIgnoreCase(artifact.getStatus())
                    || ArtifactStatus.REJECTED.name().equalsIgnoreCase(artifact.getStatus()))
                && ContentStatus.PUBLISHED.name().equalsIgnoreCase(content.getStatus())) {
            detailStatus = artifact.getStatus();
        }

        String thumbnailUrl = null;
        Optional<Artifact> coverOpt = artifactRepository.findLatestCoverArtifact(content.getId());
        if (coverOpt.isPresent()) {
            Artifact coverArt = coverOpt.get();
            thumbnailUrl = StringUtils.hasText(coverArt.getOptimizedUrl()) ? coverArt.getOptimizedUrl() : coverArt.getFileUrl();
        }

        return CreatorVideoDetailResponse.builder()
                .contentId(content.getId())
                .artifactId(artifactId)
                .channelId(content.getChannel() != null ? content.getChannel().getId() : null)
                .channelName(content.getChannel() != null ? content.getChannel().getName() : null)
                .title(content.getTitle())
                .description(content.getTextBody())
                .status(detailStatus)
                .version(artifact != null ? artifact.getVersion() : 1)
                .fileUrl(fileUrl)
                .thumbnailUrl(thumbnailUrl)
                .durationSeconds(duration)
                .isExclusive(content.getIsExclusive())
                .createdAt(content.getCreatedAt())
                .updatedAt(content.getUpdatedAt())
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .commentCount(commentCount)
                .comments(commentItems)
                .aiShieldScore(aiShieldScore)
                .aiShieldTier(aiShieldTier)
                .aiShieldTierLabel(aiShieldTierLabel)
                .aiShieldReason(aiShieldReason)
                .moderationDecision(modDecision)
                .moderationReason(modReason)
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

        String thumbnailUrl = null;
        if (StringUtils.hasText(request.getThumbnailUrl())) {
            String newThumb = request.getThumbnailUrl().trim();
            thumbnailUrl = newThumb;
            Optional<Artifact> coverOpt = artifactRepository.findLatestCoverArtifact(saved.getId());
            if (coverOpt.isPresent()) {
                Artifact existingThumb = coverOpt.get();
                existingThumb.setFileUrl(newThumb);
                existingThumb.setOptimizedUrl(newThumb);
                existingThumb.setStatus("COMPLETED");
                artifactRepository.save(existingThumb);
            } else {
                Artifact newThumbArtifact = Artifact.builder()
                        .content(saved)
                        .type("THUMBNAIL")
                        .fileUrl(newThumb)
                        .optimizedUrl(newThumb)
                        .sourceType(saved.getSourceType() != null ? saved.getSourceType() : "CREATOR_STUDIO")
                        .status("COMPLETED")
                        .version(artifact != null ? artifact.getVersion() : 1)
                        .createdAt(Instant.now())
                        .build();
                artifactRepository.save(newThumbArtifact);
            }
        } else {
            Optional<Artifact> coverOpt = artifactRepository.findLatestCoverArtifact(saved.getId());
            if (coverOpt.isPresent()) {
                Artifact coverArt = coverOpt.get();
                thumbnailUrl = StringUtils.hasText(coverArt.getOptimizedUrl()) ? coverArt.getOptimizedUrl() : coverArt.getFileUrl();
            }
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
                .version(artifact != null ? artifact.getVersion() : 1)
                .fileUrl(artifact != null
                        ? (ContentStatus.PUBLISHED.name().equalsIgnoreCase(saved.getStatus()) && StringUtils.hasText(artifact.getOptimizedUrl())
                            ? artifact.getOptimizedUrl()
                            : artifact.getFileUrl())
                        : null)
                .thumbnailUrl(thumbnailUrl)
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
    public CreatorVideoItemResponse uploadVideoThumbnail(String email, Long contentId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY, "Vui lòng chọn hình ảnh thumbnail để tải lên");
        }
        User creator = getUserByEmail(email);
        Content content = contentRepository.findByIdAndCreatorId(contentId, creator.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy video hoặc bạn không có quyền chỉnh sửa"));

        String secureUrl = fileStorageService.uploadImage(file, "creator/thumbnails");
        log.info("Uploaded custom video thumbnail for content {}: {}", contentId, secureUrl);

        Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId()).orElse(null);
        Optional<Artifact> coverOpt = artifactRepository.findLatestCoverArtifact(content.getId());
        if (coverOpt.isPresent()) {
            Artifact existingThumb = coverOpt.get();
            existingThumb.setFileUrl(secureUrl);
            existingThumb.setOptimizedUrl(secureUrl);
            existingThumb.setStatus("COMPLETED");
            artifactRepository.save(existingThumb);
        } else {
            Artifact newThumbArtifact = Artifact.builder()
                    .content(content)
                    .type("THUMBNAIL")
                    .fileUrl(secureUrl)
                    .optimizedUrl(secureUrl)
                    .sourceType(content.getSourceType() != null ? content.getSourceType() : "CREATOR_STUDIO")
                    .status("COMPLETED")
                    .version(artifact != null ? artifact.getVersion() : 1)
                    .createdAt(Instant.now())
                    .build();
            artifactRepository.save(newThumbArtifact);
        }

        content.setUpdatedAt(Instant.now());
        Content saved = contentRepository.save(content);

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
                .version(artifact != null ? artifact.getVersion() : 1)
                .fileUrl(artifact != null
                        ? (ContentStatus.PUBLISHED.name().equalsIgnoreCase(saved.getStatus()) && StringUtils.hasText(artifact.getOptimizedUrl())
                            ? artifact.getOptimizedUrl()
                            : artifact.getFileUrl())
                        : null)
                .thumbnailUrl(secureUrl)
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

        String thumbnailUrl = null;
        Optional<Artifact> coverOpt = artifactRepository.findLatestCoverArtifact(saved.getId());
        if (coverOpt.isPresent()) {
            Artifact coverArt = coverOpt.get();
            thumbnailUrl = StringUtils.hasText(coverArt.getOptimizedUrl()) ? coverArt.getOptimizedUrl() : coverArt.getFileUrl();
        }

        return CreatorVideoItemResponse.builder()
                .contentId(saved.getId())
                .artifactId(artifact != null ? artifact.getId() : null)
                .channelId(saved.getChannel() != null ? saved.getChannel().getId() : null)
                .channelName(saved.getChannel() != null ? saved.getChannel().getName() : null)
                .title(saved.getTitle())
                .description(saved.getTextBody())
                .status(saved.getStatus())
                .version(artifact != null ? artifact.getVersion() : 1)
                .fileUrl(artifact != null
                        ? (ContentStatus.PUBLISHED.name().equalsIgnoreCase(newStatus) && StringUtils.hasText(artifact.getOptimizedUrl())
                            ? artifact.getOptimizedUrl()
                            : artifact.getFileUrl())
                        : null)
                .thumbnailUrl(thumbnailUrl)
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

            HttpResponse<String> response = httpSender.send(httpRequest);

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

    @Override
    @Transactional
    public CreatorVideoItemResponse submitVideoForPublish(String email, Long contentId) {
        User creator = getUserByEmail(email);
        Content content = contentRepository.findByIdAndCreatorId(contentId, creator.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy video hoặc bạn không có quyền truy cập"));

        Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy tệp video của bài đăng này"));

        if (!StringUtils.hasText(artifact.getFileUrl())) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Video chưa hoàn tất quá trình kết xuất hoặc chưa có tệp video");
        }

        if (ArtifactStatus.PENDING_REVIEW.name().equalsIgnoreCase(artifact.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Phiên bản này đang trong hàng đợi chờ Admin kiểm duyệt!");
        }
        if (ArtifactStatus.PUBLISHED.name().equalsIgnoreCase(artifact.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Phiên bản này đã được xuất bản công khai trên hệ thống!");
        }

        Optional<CreatorAiSetting> settingOpt = creatorAiSettingRepository.findByUserId(creator.getId());
        String geminiKey = settingOpt.map(CreatorAiSetting::getGeminiApiKey).orElse("");

        Map<String, Object> aiShieldPayload = new HashMap<>();
        aiShieldPayload.put("content_id", content.getId());
        aiShieldPayload.put("artifact_id", artifact.getId());
        aiShieldPayload.put("title", content.getTitle());
        aiShieldPayload.put("script_text", content.getTextBody());
        aiShieldPayload.put("video_url", artifact.getFileUrl());
        if (StringUtils.hasText(geminiKey)) {
            aiShieldPayload.put("gemini_api_key", geminiKey);
        }

        String tier = "FAIR";
        String tierLabel = "Khá";
        BigDecimal score = BigDecimal.valueOf(70.0);
        String reason = "Đã gửi vào hàng đợi AI Shield & Admin kiểm duyệt";

        try {
            String jsonReq = objectMapper.writeValueAsString(aiShieldPayload);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(toolUrl + "/api/ai-shield/verify"))
                    .version(HttpClient.Version.HTTP_1_1)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonReq))
                    .build();

            HttpResponse<String> response = httpSender.send(httpRequest);
            if (response.statusCode() == 200) {
                JsonNode resNode = objectMapper.readTree(response.body());
                if (resNode.has("tier")) {
                    tier = resNode.path("tier").asText();
                }
                if (resNode.has("tier_label")) {
                    tierLabel = resNode.path("tier_label").asText();
                }
                if (resNode.has("score")) {
                    score = BigDecimal.valueOf(resNode.path("score").asDouble());
                }
                if (resNode.has("reason")) {
                    reason = resNode.path("reason").asText();
                }
            } else {
                log.warn("Tool AI Shield returned HTTP {}: {}, falling back to default evaluation", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to call Tool AI Shield API: {}", e.getMessage(), e);
        }

        AiShieldTier aiShieldTier = null;
        if (aiShieldPolicyService != null) {
            var eval = aiShieldPolicyService.resolveTier(score);
            aiShieldTier = eval.tier();
            tierLabel = eval.label();
            tier = aiShieldTier.name();
        } else {
            aiShieldTier = AiShieldTier.fromString(tier);
            if (aiShieldTier == null) {
                aiShieldTier = score.compareTo(BigDecimal.valueOf(50)) < 0 ? AiShieldTier.RED_ALERT
                        : score.compareTo(BigDecimal.valueOf(80)) < 0 ? AiShieldTier.FAIR
                        : score.compareTo(BigDecimal.valueOf(90)) <= 0 ? AiShieldTier.GOOD
                        : AiShieldTier.EXCELLENT;
            }
            tier = aiShieldTier.name();
            tierLabel = aiShieldTier.getDefaultLabel();
        }

        // Lưu bản ghi vào ai_filter_logs
        AiFilterLog aiLog = null;
        if (aiFilterLogRepository != null) {
            aiLog = AiFilterLog.builder()
                    .artifact(artifact)
                    .result(tier)
                    .score(score)
                    .reason("[" + tierLabel + " - " + score + "%] " + reason)
                    .checkedAt(Instant.now())
                    .build();
            aiLog = aiFilterLogRepository.save(aiLog);
        }

        // Lưu / cập nhật bản ghi vào moderation_reviews
        ModerationReview review = null;
        if (moderationReviewRepository != null) {
            review = moderationReviewRepository.findTopByArtifactIdOrderByIdDesc(artifact.getId())
                    .orElseGet(() -> ModerationReview.builder().artifact(artifact).build());
            review.setArtifact(artifact);
            review.setDecision("PENDING");
            review.setReason("AI Shield: [" + tierLabel + " - " + score + "%] " + reason);
            review.setModerator(null);
            review.setReviewedAt(null);
            review = moderationReviewRepository.save(review);
        }

        // Đặt trạng thái artifact sang PENDING_REVIEW (bao gồm cả artifact đồng hành như COVER cùng version)
        artifact.setStatus(ArtifactStatus.PENDING_REVIEW.name());
        artifactRepository.save(artifact);

        List<Artifact> sameVersionArtifacts = artifactRepository.findByContentId(content.getId());
        for (Artifact a : sameVersionArtifacts) {
            if (!a.getId().equals(artifact.getId()) && Objects.equals(a.getVersion(), artifact.getVersion())) {
                a.setStatus(ArtifactStatus.PENDING_REVIEW.name());
                artifactRepository.save(a);
            }
        }

        // Quy tắc an toàn:
        // Nếu video trước đó chưa từng PUBLISHED (lần đầu xuất bản), cập nhật Content sang PENDING_REVIEW
        // Nếu video trước đó đã PUBLISHED (đang có phiên bản cũ phát sóng), GIỮ NGUYÊN PUBLISHED trên Content
        // để khán giả ngoài hệ thống không bị gián đoạn hay mất video!
        boolean wasPublished = ContentStatus.PUBLISHED.name().equalsIgnoreCase(content.getStatus());
        if (!wasPublished) {
            content.setStatus(ContentStatus.PENDING_REVIEW.name());
        }
        content.setUpdatedAt(Instant.now());
        content = contentRepository.save(content);

        log.info("Creator '{}' submitted video ID '{}' (Artifact ID: {}, version: {}) for review. AI Shield Tier: {}, Score: {}",
                email, content.getId(), artifact.getId(), artifact.getVersion(), tier, score);

        long likeCount = reactionRepository.countByArtifactIdAndType(artifact.getId(), "LIKE");
        long dislikeCount = reactionRepository.countByArtifactIdAndType(artifact.getId(), "DISLIKE");
        long commentCount = commentRepository.countByArtifactId(artifact.getId());

        String thumbnailUrl = null;
        Optional<Artifact> coverOpt = artifactRepository.findLatestCoverArtifact(content.getId());
        if (coverOpt.isPresent()) {
            Artifact coverArt = coverOpt.get();
            thumbnailUrl = StringUtils.hasText(coverArt.getOptimizedUrl()) ? coverArt.getOptimizedUrl() : coverArt.getFileUrl();
        }

        return CreatorVideoItemResponse.builder()
                .contentId(content.getId())
                .artifactId(artifact.getId())
                .channelId(content.getChannel() != null ? content.getChannel().getId() : null)
                .channelName(content.getChannel() != null ? content.getChannel().getName() : null)
                .title(content.getTitle())
                .description(content.getTextBody())
                .status(ArtifactStatus.PENDING_REVIEW.name())
                .version(artifact.getVersion() != null ? artifact.getVersion() : 1)
                .fileUrl(artifact.getFileUrl())
                .thumbnailUrl(thumbnailUrl)
                .durationSeconds(artifact.getDurationSeconds())
                .isExclusive(content.getIsExclusive())
                .createdAt(content.getCreatedAt())
                .updatedAt(content.getUpdatedAt())
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .commentCount(commentCount)
                .aiShieldScore(score)
                .aiShieldTier(aiShieldTier)
                .aiShieldTierLabel(tierLabel)
                .aiShieldReason(aiLog != null ? aiLog.getReason() : reason)
                .moderationDecision("PENDING")
                .moderationReason(review != null ? review.getReason() : null)
                .build();
    }

    private String resolveTierLabel(String tier) {
        if (tier == null) return null;
        String upper = tier.toUpperCase();
        if (upper.contains("RED") || upper.contains("CRITICAL")) {
            return "Báo động đỏ";
        } else if (upper.contains("FAIR") || upper.contains("WARNING") || upper.contains("KHÁ")) {
            return "Khá";
        } else if (upper.contains("GOOD") || upper.contains("TỐT")) {
            return "Tốt";
        } else if (upper.contains("EXCELLENT") || upper.contains("XUẤT SẮC")) {
            return "Xuất sắc";
        }
        return tier;
    }

    @Override
    @Transactional(readOnly = true)
    public CreatorPodcastSentencesResponse getPodcastSentences(String email, Long contentId) {
        User creator = getUserByEmail(email);
        Content content = contentRepository.findByIdAndCreatorId(contentId, creator.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy video hoặc bạn không có quyền truy cập"));

        Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy tệp video của bài đăng này"));

        String jobId = extractJobId(artifact.getFileUrl());
        if (StringUtils.hasText(jobId)) {
            try {
                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(toolUrl + "/api/podcast/" + jobId + "/sentences"))
                        .version(HttpClient.Version.HTTP_1_1)
                        .header("Accept", "application/json")
                        .timeout(Duration.ofSeconds(15))
                        .GET()
                        .build();

                HttpResponse<String> response = httpSender.send(httpRequest);
                if (response.statusCode() == 200) {
                    CreatorPodcastSentencesResponse sentencesRes = objectMapper.readValue(
                            response.body(), CreatorPodcastSentencesResponse.class);

                    // Chuẩn hóa audioUrl sang proxy backend nếu bắt đầu bằng /outputs/
                    if (sentencesRes.getSentences() != null) {
                        for (CreatorPodcastSentenceItem item : sentencesRes.getSentences()) {
                            if (StringUtils.hasText(item.getAudioUrl()) && item.getAudioUrl().startsWith("/outputs/")) {
                                item.setAudioUrl("/api/v1/creator/studio" + item.getAudioUrl());
                            }
                        }
                    }
                    return sentencesRes;
                }
            } catch (Exception e) {
                log.warn("Không thể lấy danh sách câu từ Python tool cho jobId '{}': {}", jobId, e.getMessage());
            }
        }

        // Fallback: Tách câu từ Transcript hoặc Content textBody
        String rawText = "";
        Optional<Transcript> transcriptOpt = transcriptRepository.findFirstByArtifactIdOrderByCreatedAtDesc(artifact.getId());
        if (transcriptOpt.isPresent() && StringUtils.hasText(transcriptOpt.get().getTextBody())) {
            rawText = transcriptOpt.get().getTextBody();
        } else if (StringUtils.hasText(content.getTextBody())) {
            rawText = content.getTextBody();
        }

        List<CreatorPodcastSentenceItem> items = new ArrayList<>();
        if (StringUtils.hasText(rawText)) {
            String[] split = rawText.split("\\n\\n+|\\n");
            int idx = 1;
            for (String s : split) {
                String trimmed = s.trim();
                if (!trimmed.isEmpty()) {
                    items.add(CreatorPodcastSentenceItem.builder()
                            .index(idx++)
                            .text(trimmed)
                            .audioUrl(null)
                            .duration(null)
                            .build());
                }
            }
        }

        return CreatorPodcastSentencesResponse.builder()
                .jobId(jobId)
                .topic(content.getTitle())
                .ttsEngine("edge-tts")
                .voiceName("vi-VN-NamMinhNeural")
                .sentences(items)
                .build();
    }

    @Override
    @Transactional
    public CreatorPatchPodcastResponse patchPodcastVideo(String email, Long contentId, CreatorPatchPodcastRequest request) {
        User creator = getUserByEmail(email);
        Content content = contentRepository.findByIdAndCreatorId(contentId, creator.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy video hoặc bạn không có quyền truy cập"));

        Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy tệp video của bài đăng này"));

        if (ArtifactStatus.PENDING_REVIEW.name().equalsIgnoreCase(artifact.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Phiên bản này đang trong hàng đợi kiểm duyệt, vui lòng chờ Admin phản hồi trước khi chỉnh sửa tiếp!");
        }

        if ((request.getPatches() == null || request.getPatches().isEmpty())
                && (request.getSentences() == null || request.getSentences().isEmpty())
                && !StringUtils.hasText(request.getCoverImage())) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Vui lòng cung cấp ít nhất một câu cần sửa hoặc ảnh bìa mới để vá kịch bản!");
        }

        String jobId = extractJobId(artifact.getFileUrl());
        if (!StringUtils.hasText(jobId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Không thể xác định mã kết xuất (jobId) của video để thực hiện vá!");
        }

        Optional<CreatorAiSetting> settingOpt = creatorAiSettingRepository.findByUserId(creator.getId());
        String elevenKey = settingOpt.map(CreatorAiSetting::getElevenlabsApiKey).orElse("");
        String ttsEngine = settingOpt.map(CreatorAiSetting::getTtsEngine).orElse("edge-tts");
        String voiceName = settingOpt.map(CreatorAiSetting::getVoiceName).orElse("vi-VN-NamMinhNeural");
        if ("elevenlabs".equalsIgnoreCase(ttsEngine) && (voiceName.startsWith("vi-VN-") || voiceName.contains("-"))) {
            voiceName = "Brian";
        }

        Map<String, Object> toolPayload = new HashMap<>();
        toolPayload.put("job_id", jobId);
        if (request.getPatches() != null && !request.getPatches().isEmpty()) {
            toolPayload.put("patches", request.getPatches());
        }
        if (request.getSentences() != null && !request.getSentences().isEmpty()) {
            toolPayload.put("sentences", request.getSentences());
        }
        if (StringUtils.hasText(request.getCoverImage())) {
            toolPayload.put("cover_image_b64", request.getCoverImage().trim());
        }
        toolPayload.put("tts_engine", ttsEngine);
        toolPayload.put("voice_name", voiceName);
        if (StringUtils.hasText(elevenKey)) {
            toolPayload.put("elevenlabs_api_key", elevenKey);
        }

        try {
            String jsonBody = objectMapper.writeValueAsString(toolPayload);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(toolUrl + "/api/podcast/patch"))
                    .version(HttpClient.Version.HTTP_1_1)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(90))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpSender.send(httpRequest);
            if (response.statusCode() != 200) {
                String errorDetail = extractErrorDetail(response.body(), response.statusCode());
                log.error("Tool patch podcast failed with HTTP {}: {}", response.statusCode(), errorDetail);
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Lỗi khi vá video podcast: " + errorDetail);
            }

            JsonNode resJson = objectMapper.readTree(response.body());
            String rawVideoUrl = resJson.path("video_url").asText();
            int durationSeconds = resJson.path("duration_seconds").asInt(artifact.getDurationSeconds() != null ? artifact.getDurationSeconds() : 60);
            int modifiedCount = resJson.path("modified_count").asInt(0);
            int reRecordedCount = resJson.path("re_recorded_count").asInt(0);
            int totalSentences = resJson.path("total_sentences").asInt(0);
            String newScriptText = resJson.path("script_text").asText();

            // Quản lý Version: Lưu phiên bản mới sau mỗi lần vá kịch bản
            int currentVersion = (artifact.getVersion() != null) ? artifact.getVersion() : 1;
            int nextVersion = currentVersion + 1;

            String finalVideoUrl = rawVideoUrl;
            // Upload lên Cloudinary nếu có cấu hình (dùng versioned publicId để không ghi đè bản v1 đang công khai)
            if (fileStorageService.isConfigured() && StringUtils.hasText(rawVideoUrl)) {
                try {
                    log.info("Đang tải video đã vá lên Cloudinary cho job '{}' (Artifact ID: {}, version: v{})...", jobId, artifact.getId(), nextVersion);
                    String downloadUrl = toolUrl + (rawVideoUrl.startsWith("/") ? rawVideoUrl : "/" + rawVideoUrl);
                    HttpRequest downloadReq = HttpRequest.newBuilder()
                            .uri(URI.create(downloadUrl))
                            .version(HttpClient.Version.HTTP_1_1)
                            .timeout(Duration.ofSeconds(90))
                            .GET()
                            .build();

                    HttpResponse<byte[]> downloadResp = httpClient.send(downloadReq, HttpResponse.BodyHandlers.ofByteArray());
                    if (downloadResp.statusCode() == 200 && downloadResp.body() != null && downloadResp.body().length > 0) {
                        String versionedPublicId = jobId + "_v" + nextVersion;
                        String cloudUrl = fileStorageService.uploadVideo(downloadResp.body(), "whiteboard/videos", versionedPublicId);
                        log.info("Đã upload lại video vá lên Cloudinary thành công với publicId '{}': {}", versionedPublicId, cloudUrl);
                        finalVideoUrl = cloudUrl;
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi tải video vá lên Cloudinary, fallback về URL cục bộ: {}", e.getMessage(), e);
                }
            }

            // Nếu bản artifact trước đó đang là PUBLISHED (ví dụ v1 đang công khai),
            // TUYỆT ĐỐI KHÔNG archive nó ngay để người xem ngoài trang chủ vẫn tiếp tục xem được bản v1.
            // Chỉ archive nếu bản trước đó là bản nháp chưa công khai (COMPLETED/ARCHIVED).
            if (!ArtifactStatus.PUBLISHED.name().equalsIgnoreCase(artifact.getStatus())) {
                artifact.setStatus(ArtifactStatus.ARCHIVED.name());
                artifactRepository.save(artifact);
            }

            // Tạo Artifact mới đại diện cho phiên bản tiếp theo
            Artifact newArtifact = Artifact.builder()
                    .content(content)
                    .type("VIDEO")
                    .fileUrl(finalVideoUrl)
                    .optimizedUrl(fileStorageService.buildOptimizedVideoUrl(finalVideoUrl))
                    .sourceType(artifact.getSourceType())
                    .durationSeconds(durationSeconds)
                    .status(ArtifactStatus.COMPLETED.name())
                    .version(nextVersion)
                    .createdAt(Instant.now())
                    .build();
            newArtifact = artifactRepository.save(newArtifact);

            // Cập nhật Transcript gắn trực tiếp vào Artifact phiên bản mới
            if (StringUtils.hasText(newScriptText)) {
                Transcript newTranscript = Transcript.builder()
                        .artifact(newArtifact)
                        .textBody(newScriptText)
                        .createdAt(Instant.now())
                        .build();
                transcriptRepository.save(newTranscript);
            }

            // Xử lý lưu ảnh bìa mới cho Audio Podcast nếu có thay đổi trong bản vá và được engine xử lý thành công
            String finalCoverUrl = null;
            boolean hasNewCover = resJson.path("has_new_cover").asBoolean(false);
            if (hasNewCover && StringUtils.hasText(request.getCoverImage())) {
                if (request.getCoverImage().trim().startsWith("http://") || request.getCoverImage().trim().startsWith("https://")) {
                    finalCoverUrl = request.getCoverImage().trim();
                } else {
                    String rawCoverUrl = resJson.path("cover_url").asText(null);
                    if (StringUtils.hasText(rawCoverUrl)) {
                        finalCoverUrl = rawCoverUrl.startsWith("http") ? rawCoverUrl : toolUrl + (rawCoverUrl.startsWith("/") ? rawCoverUrl : "/" + rawCoverUrl);
                    } else {
                        finalCoverUrl = toolUrl + "/outputs/" + jobId + "/cover.png";
                    }
                }

                Artifact coverArtifact = Artifact.builder()
                        .content(content)
                        .type("COVER")
                        .fileUrl(finalCoverUrl)
                        .optimizedUrl(finalCoverUrl)
                        .sourceType(artifact.getSourceType())
                        .status(ArtifactStatus.COMPLETED.name())
                        .version(nextVersion)
                        .createdAt(Instant.now())
                        .build();
                artifactRepository.save(coverArtifact);
            }

            // Quy tắc an toàn:
            // Nếu video trước đó đang PUBLISHED, giữ nguyên status PUBLISHED trên Content để không làm gián đoạn người xem bản v1!
            // Nếu video chưa từng PUBLISHED, đặt status content là COMPLETED
            boolean isPublished = ContentStatus.PUBLISHED.name().equalsIgnoreCase(content.getStatus());
            if (!isPublished) {
                content.setStatus(ContentStatus.COMPLETED.name());
            }
            content.setUpdatedAt(Instant.now());
            contentRepository.save(content);

            String message = isPublished
                    ? String.format("Vá kịch bản thành công! Đã tạo phiên bản mới v%d (phiên bản hiện tại vẫn đang phát sóng công khai)%s. Bạn có thể kiểm tra nghe thử và bấm 'Gửi kiểm duyệt' khi sẵn sàng thay thế.",
                            nextVersion, finalCoverUrl != null ? " kèm ảnh bìa mới" : "")
                    : String.format("Vá kịch bản thành công! Đã tạo phiên bản v%d với %d câu cập nhật (thu âm lại %d câu)%s, tiết kiệm chi phí tối đa.",
                            nextVersion, modifiedCount, reRecordedCount, finalCoverUrl != null ? " và cập nhật ảnh bìa mới" : "");

            return CreatorPatchPodcastResponse.builder()
                    .contentId(content.getId())
                    .artifactId(newArtifact.getId())
                    .version(newArtifact.getVersion())
                    .jobId(jobId)
                    .status(ArtifactStatus.COMPLETED.name())
                    .fileUrl(finalVideoUrl)
                    .coverUrl(finalCoverUrl)
                    .durationSeconds(durationSeconds)
                    .modifiedCount(modifiedCount)
                    .reRecordedCount(reRecordedCount)
                    .totalSentences(totalSentences)
                    .message(message)
                    .build();

        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Lỗi khi kết nối đến dịch vụ vá video podcast: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể kết nối đến máy chủ xử lý video: " + e.getMessage());
        }
    }

    private String extractJobId(String url) {
        if (!StringUtils.hasText(url)) return null;
        Matcher m = Pattern.compile("(job_\\d+_[a-zA-Z0-9]+)").matcher(url);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }
}

