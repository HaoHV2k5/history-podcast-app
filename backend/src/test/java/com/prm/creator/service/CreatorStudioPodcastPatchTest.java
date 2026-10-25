package com.prm.creator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.entity.Transcript;
import com.prm.channel.repository.AiFilterLogRepository;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.ModerationReviewRepository;
import com.prm.channel.repository.TranscriptRepository;
import com.prm.channel.service.AiShieldPolicyService;
import com.prm.common.enums.ContentStatus;
import com.prm.common.exception.AppException;
import com.prm.common.service.FileStorageService;
import com.prm.creator.dto.request.CreatorPatchPodcastRequest;
import com.prm.creator.dto.request.CreatorSentencePatchItem;
import com.prm.creator.dto.response.CreatorPatchPodcastResponse;
import com.prm.creator.dto.response.CreatorPodcastSentencesResponse;
import com.prm.creator.entity.CreatorAiSetting;
import com.prm.creator.repository.CreatorAiSettingRepository;
import com.prm.creator.service.impl.CreatorStudioServiceImpl;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.social.repository.CommentRepository;
import com.prm.social.repository.ReactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CreatorStudioPodcastPatchTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CreatorAiSettingRepository creatorAiSettingRepository;
    @Mock
    private ChannelRepository channelRepository;
    @Mock
    private ContentRepository contentRepository;
    @Mock
    private ArtifactRepository artifactRepository;
    @Mock
    private TranscriptRepository transcriptRepository;
    @Mock
    private ReactionRepository reactionRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private AiFilterLogRepository aiFilterLogRepository;
    @Mock
    private ModerationReviewRepository moderationReviewRepository;
    @Mock
    private AiShieldPolicyService aiShieldPolicyService;

    private ObjectMapper objectMapper;
    private CreatorStudioServiceImpl creatorStudioService;

    private User mockCreator;
    private Channel mockChannel;

    private HttpResponse<String> createMockResponse(int statusCode, String body) {
        return new HttpResponse<>() {
            @Override public int statusCode() { return statusCode; }
            @Override public String body() { return body; }
            @Override public HttpRequest request() { return null; }
            @Override public Optional<HttpResponse<String>> previousResponse() { return Optional.empty(); }
            @Override public java.net.http.HttpHeaders headers() { return java.net.http.HttpHeaders.of(java.util.Map.of(), (k, v) -> true); }
            @Override public Optional<javax.net.ssl.SSLSession> sslSession() { return Optional.empty(); }
            @Override public java.net.URI uri() { return java.net.URI.create("http://localhost:8000"); }
            @Override public HttpClient.Version version() { return HttpClient.Version.HTTP_1_1; }
        };
    }

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        creatorStudioService = new CreatorStudioServiceImpl(
                userRepository,
                creatorAiSettingRepository,
                channelRepository,
                contentRepository,
                artifactRepository,
                transcriptRepository,
                reactionRepository,
                commentRepository,
                fileStorageService,
                objectMapper,
                aiFilterLogRepository,
                moderationReviewRepository,
                aiShieldPolicyService
        );

        mockCreator = new User();
        mockCreator.setId(10L);
        mockCreator.setEmail("creator@suku.vn");
        mockCreator.setFullName("Nguyễn Văn Creator");

        mockChannel = Channel.builder()
                .id(1L)
                .creator(mockCreator)
                .name("Sử Ký Hào Hùng")
                .build();

        creatorStudioService.setToolUrl("http://localhost:8000");

        when(userRepository.findByEmail("creator@suku.vn")).thenReturn(Optional.of(mockCreator));
    }

    @Test
    @DisplayName("getPodcastSentences: Fallback phân rã câu từ textBody khi không có file job từ engine")
    void testGetPodcastSentences_FallbackText() {
        Content content = Content.builder()
                .id(100L)
                .channel(mockChannel)
                .title("Lý Thường Kiệt và Sông Như Nguyệt")
                .textBody("Lý Thường Kiệt là danh tướng thời Lý.\n\nÔng đã chỉ huy trận chiến trên phòng tuyến sông Như Nguyệt lừng lẫy.")
                .status("COMPLETED")
                .build();

        Artifact artifact = Artifact.builder()
                .id(200L)
                .content(content)
                .type("VIDEO")
                .fileUrl("https://cloudinary.com/whiteboard/videos/sample.mp4")
                .build();

        when(contentRepository.findByIdAndCreatorId(100L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(100L)).thenReturn(Optional.of(artifact));
        when(transcriptRepository.findFirstByArtifactIdOrderByCreatedAtDesc(200L)).thenReturn(Optional.empty());

        CreatorPodcastSentencesResponse response = creatorStudioService.getPodcastSentences("creator@suku.vn", 100L);

        assertNotNull(response);
        assertEquals(2, response.getSentences().size());
        assertEquals("Lý Thường Kiệt là danh tướng thời Lý.", response.getSentences().get(0).getText());
        assertEquals(1, response.getSentences().get(0).getIndex());
    }

    @Test
    @DisplayName("patchPodcastVideo: Chặn không cho sửa kịch bản khi phiên bản đang PENDING_REVIEW")
    void testPatchPodcastVideo_BlockWhenPendingReview() {
        Content content = Content.builder()
                .id(101L)
                .channel(mockChannel)
                .title("Lý Thường Kiệt")
                .status(ContentStatus.PENDING_REVIEW.name())
                .build();

        Artifact artifact = Artifact.builder()
                .id(201L)
                .content(content)
                .status("PENDING_REVIEW")
                .fileUrl("https://cloudinary.com/whiteboard/videos/job_12345_sample.mp4")
                .build();

        when(contentRepository.findByIdAndCreatorId(101L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(artifact));

        CreatorPatchPodcastRequest request = CreatorPatchPodcastRequest.builder()
                .patches(List.of(
                        CreatorSentencePatchItem.builder().index(1).text("Câu mới").build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                creatorStudioService.patchPodcastVideo("creator@suku.vn", 101L, request)
        );
        assertTrue(ex.getMessage().contains("đang trong hàng đợi kiểm duyệt"));
    }

    @Test
    @DisplayName("patchPodcastVideo: Video đang PUBLISHED vẫn cho phép vá kịch bản tạo version mới mà không bị chặn")
    void testPatchPodcastVideo_WhenPublished_AllowedToCreateNewVersion() throws Exception {
        Content content = Content.builder()
                .id(102L)
                .channel(mockChannel)
                .title("Bạch Đằng Giang")
                .status(ContentStatus.PUBLISHED.name())
                .build();

        Artifact artifact = Artifact.builder()
                .id(202L)
                .content(content)
                .version(1)
                .status("PUBLISHED")
                .fileUrl("https://cloudinary.com/whiteboard/videos/job_88888_sample.mp4")
                .build();

        when(contentRepository.findByIdAndCreatorId(102L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(102L)).thenReturn(Optional.of(artifact));
        when(creatorAiSettingRepository.findByUserId(10L)).thenReturn(Optional.empty());

        CreatorPatchPodcastRequest request = CreatorPatchPodcastRequest.builder()
                .patches(List.of(
                        CreatorSentencePatchItem.builder().index(1).text("Câu chỉnh sửa").build()
                ))
                .build();

        creatorStudioService.setHttpSender(req -> { throw new IOException("Connect error"); });

        // Không bị ném ngoại lệ yêu cầu tạm ẩn video nữa!
        // Thay vào đó tiến hành kết nối máy chủ dựng (ném lỗi kết nối tool trong môi trường unit test không có server thật)
        AppException ex = assertThrows(AppException.class, () ->
                creatorStudioService.patchPodcastVideo("creator@suku.vn", 102L, request)
        );
        assertFalse(ex.getMessage().contains("Vui lòng bấm 'Tạm ẩn' tác phẩm"));
        assertTrue(ex.getMessage().contains("Không thể kết nối đến máy chủ xử lý video") || ex.getMessage().contains("Connect error"));
    }

    @Test
    @DisplayName("patchPodcastVideo: Vá kịch bản kèm đổi ảnh bìa mới -> tạo Artifact COVER v2 và trả về coverUrl")
    void testPatchPodcastVideo_Success_WithNewCoverImage_CreatesV2AndSavesCoverArtifact() {
        Content content = Content.builder()
                .id(103L)
                .channel(mockChannel)
                .title("Chiến thắng Điện Biên Phủ")
                .status(ContentStatus.PUBLISHED.name())
                .build();

        Artifact artifactV1 = Artifact.builder()
                .id(203L)
                .content(content)
                .version(1)
                .status("PUBLISHED")
                .sourceType("whiteboard")
                .durationSeconds(60)
                .fileUrl("https://cloudinary.com/whiteboard/videos/job_12345_sample.mp4")
                .build();

        when(contentRepository.findByIdAndCreatorId(103L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(103L)).thenReturn(Optional.of(artifactV1));
        when(creatorAiSettingRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(fileStorageService.isConfigured()).thenReturn(false);

        // Giả lập trả về từ tool Python engine
        String jsonBody = "{\n" +
                "  \"success\": true,\n" +
                "  \"job_id\": \"job_12345_sample\",\n" +
                "  \"status\": \"completed\",\n" +
                "  \"video_url\": \"/outputs/job_12345_sample/final_whiteboard_video.mp4\",\n" +
                "  \"cover_url\": \"/outputs/job_12345_sample/cover.png\",\n" +
                "  \"duration_seconds\": 65,\n" +
                "  \"modified_count\": 1,\n" +
                "  \"re_recorded_count\": 1,\n" +
                "  \"total_sentences\": 2,\n" +
                "  \"script_text\": \"Đại tướng Võ Nguyên Giáp chỉ huy chiến dịch.\\n\\nChiến thắng 'lừng lẫy năm châu'.\",\n" +
                "  \"has_new_cover\": true\n" +
                "}";
        creatorStudioService.setHttpSender(req -> createMockResponse(200, jsonBody));

        when(artifactRepository.save(any(Artifact.class))).thenAnswer(inv -> {
            Artifact a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(999L);
            }
            return a;
        });

        CreatorPatchPodcastRequest request = CreatorPatchPodcastRequest.builder()
                .patches(List.of(
                        CreatorSentencePatchItem.builder().index(1).text("Đại tướng Võ Nguyên Giáp chỉ huy chiến dịch.").build()
                ))
                .coverImage("https://cloudinary.com/podcasts/new_cover_16_9.jpg")
                .build();

        CreatorPatchPodcastResponse response = creatorStudioService.patchPodcastVideo("creator@suku.vn", 103L, request);

        assertNotNull(response);
        assertEquals(2, response.getVersion());
        assertEquals(1, response.getModifiedCount());
        assertEquals(1, response.getReRecordedCount());
        assertEquals("https://cloudinary.com/podcasts/new_cover_16_9.jpg", response.getCoverUrl());
        assertTrue(response.getMessage().contains("kèm ảnh bìa mới"));

        // Xác nhận Artifact VIDEO v2 đã được lưu
        verify(artifactRepository, atLeastOnce()).save(argThat(a ->
                "VIDEO".equals(a.getType()) && Integer.valueOf(2).equals(a.getVersion())
        ));

        // Xác nhận Artifact COVER v2 đã được lưu với URL mới
        verify(artifactRepository, atLeastOnce()).save(argThat(a ->
                "COVER".equals(a.getType()) && Integer.valueOf(2).equals(a.getVersion())
                        && "https://cloudinary.com/podcasts/new_cover_16_9.jpg".equals(a.getFileUrl())
        ));

        // Xác nhận Transcript mới được lưu cho Artifact v2
        verify(transcriptRepository, times(1)).save(argThat(t ->
                t.getTextBody().contains("Đại tướng Võ Nguyên Giáp")
        ));
    }

    @Test
    @DisplayName("patchPodcastVideo: Vá kịch bản không kèm ảnh bìa -> không lưu Artifact COVER")
    void testPatchPodcastVideo_Success_WithoutCoverImage_DoesNotSaveCoverArtifact() {
        Content content = Content.builder()
                .id(104L)
                .channel(mockChannel)
                .title("Chiến thắng Điện Biên Phủ")
                .status(ContentStatus.COMPLETED.name())
                .build();

        Artifact artifactV1 = Artifact.builder()
                .id(204L)
                .content(content)
                .version(1)
                .status("COMPLETED")
                .sourceType("whiteboard")
                .durationSeconds(60)
                .fileUrl("https://cloudinary.com/whiteboard/videos/job_12345_sample.mp4")
                .build();

        when(contentRepository.findByIdAndCreatorId(104L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(104L)).thenReturn(Optional.of(artifactV1));
        when(creatorAiSettingRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(fileStorageService.isConfigured()).thenReturn(false);

        String jsonBody = "{\n" +
                "  \"success\": true,\n" +
                "  \"job_id\": \"job_12345_sample\",\n" +
                "  \"status\": \"completed\",\n" +
                "  \"video_url\": \"/outputs/job_12345_sample/final_whiteboard_video.mp4\",\n" +
                "  \"duration_seconds\": 60,\n" +
                "  \"modified_count\": 1,\n" +
                "  \"re_recorded_count\": 0,\n" +
                "  \"total_sentences\": 2,\n" +
                "  \"script_text\": \"Câu 1\\n\\nCâu 2\",\n" +
                "  \"has_new_cover\": false\n" +
                "}";
        creatorStudioService.setHttpSender(req -> createMockResponse(200, jsonBody));

        when(artifactRepository.save(any(Artifact.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatorPatchPodcastRequest request = CreatorPatchPodcastRequest.builder()
                .patches(List.of(
                        CreatorSentencePatchItem.builder().index(1).text("Câu 1").build()
                ))
                .coverImage(null)
                .build();

        CreatorPatchPodcastResponse response = creatorStudioService.patchPodcastVideo("creator@suku.vn", 104L, request);

        assertNotNull(response);
        assertEquals(2, response.getVersion());
        assertNull(response.getCoverUrl());

        // Không có Artifact COVER nào được lưu
        verify(artifactRepository, never()).save(argThat(a -> "COVER".equals(a.getType())));
    }

    @Test
    @DisplayName("patchPodcastVideo: Request rỗng không có câu sửa cũng không có coverImage -> ném lỗi INVALID_REQUEST_DATA")
    void testPatchPodcastVideo_EmptyPayload_ThrowsException() {
        Content content = Content.builder()
                .id(105L)
                .channel(mockChannel)
                .title("Chiến thắng Điện Biên Phủ")
                .status(ContentStatus.COMPLETED.name())
                .build();

        Artifact artifactV1 = Artifact.builder()
                .id(205L)
                .content(content)
                .version(1)
                .status("COMPLETED")
                .sourceType("whiteboard")
                .durationSeconds(60)
                .fileUrl("https://cloudinary.com/whiteboard/videos/job_12345_sample.mp4")
                .build();

        when(contentRepository.findByIdAndCreatorId(105L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(105L)).thenReturn(Optional.of(artifactV1));

        CreatorPatchPodcastRequest emptyRequest = CreatorPatchPodcastRequest.builder().build();

        AppException ex = assertThrows(AppException.class, () ->
                creatorStudioService.patchPodcastVideo("creator@suku.vn", 105L, emptyRequest)
        );
        assertTrue(ex.getMessage().contains("Vui lòng cung cấp ít nhất một câu cần sửa hoặc ảnh bìa mới"));
    }

    @Test
    @DisplayName("patchPodcastVideo: Tải lên Cloudinary phải dùng versioned publicId (jobId_v2) để không ghi đè bản v1")
    void testPatchPodcastVideo_UploadToCloudinary_UsesVersionedPublicId() {
        Content content = Content.builder()
                .id(106L)
                .channel(mockChannel)
                .title("Chiến dịch Hồ Chí Minh")
                .status(ContentStatus.PUBLISHED.name())
                .build();

        Artifact artifactV1 = Artifact.builder()
                .id(206L)
                .content(content)
                .version(1)
                .status("PUBLISHED")
                .sourceType("whiteboard")
                .durationSeconds(90)
                .fileUrl("https://cloudinary.com/whiteboard/videos/job_99999_sample.mp4")
                .build();

        when(contentRepository.findByIdAndCreatorId(106L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(106L)).thenReturn(Optional.of(artifactV1));
        when(creatorAiSettingRepository.findByUserId(10L)).thenReturn(Optional.empty());

        // Bật Cloudinary
        when(fileStorageService.isConfigured()).thenReturn(true);
        when(fileStorageService.uploadVideo(any(), eq("whiteboard/videos"), eq("job_99999_sample_v2")))
                .thenReturn("https://res.cloudinary.com/demo/video/upload/whiteboard/videos/job_99999_sample_v2.mp4");

        String jsonBody = "{\n" +
                "  \"success\": true,\n" +
                "  \"job_id\": \"job_99999_sample\",\n" +
                "  \"status\": \"completed\",\n" +
                "  \"video_url\": \"/outputs/job_99999_sample/final_whiteboard_video.mp4\",\n" +
                "  \"duration_seconds\": 95,\n" +
                "  \"modified_count\": 1,\n" +
                "  \"re_recorded_count\": 1,\n" +
                "  \"total_sentences\": 3,\n" +
                "  \"script_text\": \"Câu 1\\n\\nCâu 2\\n\\nCâu 3\",\n" +
                "  \"has_new_cover\": false\n" +
                "}";
        creatorStudioService.setHttpSender(req -> createMockResponse(200, jsonBody));
        when(artifactRepository.save(any(Artifact.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatorPatchPodcastRequest request = CreatorPatchPodcastRequest.builder()
                .patches(List.of(
                        CreatorSentencePatchItem.builder().index(2).text("Câu 2 cập nhật").build()
                ))
                .build();

        CreatorPatchPodcastResponse response = creatorStudioService.patchPodcastVideo("creator@suku.vn", 106L, request);

        assertNotNull(response);
        assertEquals(2, response.getVersion());
    }
}
