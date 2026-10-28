package com.prm.creator.service;

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
import com.prm.common.service.FileStorageService;
import com.prm.creator.dto.request.CreatorRenderRequest;
import com.prm.creator.dto.request.CreatorUpdateVideoRequest;
import com.prm.creator.dto.response.CreatorVideoItemResponse;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CreatorStudioAudioPodcastTest {

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

    private CreatorStudioServiceImpl creatorStudioService;

    private User mockCreator;
    private Channel mockChannel;

    @BeforeEach
    void setUp() {
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
                new ObjectMapper()
        ) {
            @Override
            protected String callToolRenderApi(String jsonBody) {
                return "{\"job_id\":\"job_test_123\"}";
            }
        };

        mockCreator = User.builder().id(10L).email("creator@example.com").build();
        mockChannel = Channel.builder().id(100L).name("Sử Việt Hào Hùng").creator(mockCreator).build();

        when(userRepository.findByEmail("creator@example.com")).thenReturn(Optional.of(mockCreator));
        when(creatorAiSettingRepository.findByUserId(10L)).thenReturn(Optional.of(
                CreatorAiSetting.builder()
                        .user(mockCreator)
                        .geminiApiKey("AIzaSyTestKey12345678901234567890123")
                        .ttsEngine("edge-tts")
                        .voiceName("vi-VN-NamMinhNeural")
                        .build()
        ));
        when(channelRepository.findByCreatorId(10L)).thenReturn(Optional.of(mockChannel));

        when(contentRepository.save(any(Content.class))).thenAnswer(inv -> {
            Content c = inv.getArgument(0);
            c.setId(101L);
            return c;
        });
        when(artifactRepository.save(any(Artifact.class))).thenAnswer(inv -> {
            Artifact a = inv.getArgument(0);
            a.setId(201L);
            return a;
        });
        when(transcriptRepository.save(any(Transcript.class))).thenAnswer(inv -> {
            Transcript t = inv.getArgument(0);
            t.setId(301L);
            return t;
        });
    }

    @Test
    @DisplayName("Audio Podcast Mode: Gửi scriptText kèm ảnh bìa thành công, lưu Content AI_PODCAST và Artifact PODCAST_STUDIO")
    void testRenderAndSaveVideo_AudioPodcastMode_Success() {
        CreatorRenderRequest request = CreatorRenderRequest.builder()
                .title("Lý Thường Kiệt và phòng tuyến sông Như Nguyệt")
                .renderMode("audio_podcast")
                .scriptText("Vào năm 1075, Lý Thường Kiệt chủ động đem quân tấn công sang đất Tống để tự vệ.")
                .coverImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
                .durationSec(60)
                .ttsEngine("edge-tts")
                .voiceName("vi-VN-NamMinhNeural")
                .build();

        var response = creatorStudioService.renderAndSaveVideo("creator@example.com", request);

        assertNotNull(response);
        assertEquals("job_test_123", response.getJobId());
        assertEquals(101L, response.getContentId());
        assertEquals(201L, response.getArtifactId());

        ArgumentCaptor<Content> contentCaptor = ArgumentCaptor.forClass(Content.class);
        verify(contentRepository).save(contentCaptor.capture());
        Content savedContent = contentCaptor.getValue();
        assertEquals("AI_PODCAST", savedContent.getSourceType());
        assertEquals("Vào năm 1075, Lý Thường Kiệt chủ động đem quân tấn công sang đất Tống để tự vệ.", savedContent.getTextBody());

        ArgumentCaptor<Artifact> artifactCaptor = ArgumentCaptor.forClass(Artifact.class);
        verify(artifactRepository, times(2)).save(artifactCaptor.capture());
        Artifact savedVideoArtifact = artifactCaptor.getAllValues().stream()
                .filter(a -> "VIDEO".equals(a.getType()))
                .findFirst()
                .orElseThrow();
        assertEquals("PODCAST_STUDIO", savedVideoArtifact.getSourceType());
        assertEquals("VIDEO", savedVideoArtifact.getType());

        Artifact savedCoverArtifact = artifactCaptor.getAllValues().stream()
                .filter(a -> "COVER".equals(a.getType()))
                .findFirst()
                .orElseThrow();
        assertEquals(request.getCoverImage(), savedCoverArtifact.getFileUrl());
    }

    @Test
    @DisplayName("Audio Podcast Mode: Thiếu ảnh bìa (thumbnail) -> Ném ngoại lệ AppException")
    void testRenderAndSaveVideo_AudioPodcastMode_MissingCoverImage_ThrowsException() {
        CreatorRenderRequest request = CreatorRenderRequest.builder()
                .title("Podcast nhưng không có ảnh bìa")
                .renderMode("audio_podcast")
                .scriptText("Kịch bản đầy đủ nhưng thiếu ảnh thumbnail.")
                .coverImage(null)
                .sceneImages(null)
                .durationSec(60)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                creatorStudioService.renderAndSaveVideo("creator@example.com", request)
        );
        assertTrue(ex.getMessage().contains("ảnh bìa") || ex.getMessage().contains("thumbnail"));
    }

    @Test
    @DisplayName("Audio Podcast Mode: Thiếu cả scriptText lẫn storyboard -> Ném ngoại lệ AppException")
    void testRenderAndSaveVideo_AudioPodcastMode_MissingScript_ThrowsException() {
        CreatorRenderRequest request = CreatorRenderRequest.builder()
                .title("Chưa có kịch bản")
                .renderMode("audio_podcast")
                .scriptText("   ")
                .coverImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
                .durationSec(60)
                .build();

        assertThrows(AppException.class, () ->
                creatorStudioService.renderAndSaveVideo("creator@example.com", request)
        );
    }

    @Test
    @DisplayName("Whiteboard Mode: Thiếu sceneImages -> Ném ngoại lệ AppException")
    void testRenderAndSaveVideo_WhiteboardMode_MissingSceneImages_ThrowsException() {
        CreatorRenderRequest request = CreatorRenderRequest.builder()
                .title("Vẽ tay nhưng thiếu ảnh")
                .renderMode("whiteboard")
                .storyboard(java.util.Map.of("title", "Demo"))
                .sceneImages(null)
                .durationSec(60)
                .build();

        assertThrows(AppException.class, () ->
                creatorStudioService.renderAndSaveVideo("creator@example.com", request)
        );
    }

    @Test
    @DisplayName("Whiteboard Mode: Creator chủ động thêm ảnh Thumbnail riêng biệt (thumbnailUrl)")
    void testRenderAndSaveVideo_WhiteboardMode_WithCustomThumbnail_Success() {
        CreatorRenderRequest request = CreatorRenderRequest.builder()
                .title("Chiến thắng Điện Biên Phủ")
                .renderMode("whiteboard")
                .storyboard(java.util.Map.of("title", "Chiến dịch 56 ngày đêm"))
                .sceneImages(java.util.Map.of("1", "https://example.com/scene1.jpg", "2", "https://example.com/scene2.jpg"))
                .thumbnailUrl("https://example.com/custom-creator-thumbnail.jpg")
                .durationSec(60)
                .ttsEngine("edge-tts")
                .voiceName("vi-VN-NamMinhNeural")
                .build();

        var response = creatorStudioService.renderAndSaveVideo("creator@example.com", request);
        assertNotNull(response);

        ArgumentCaptor<Artifact> artifactCaptor = ArgumentCaptor.forClass(Artifact.class);
        verify(artifactRepository, atLeastOnce()).save(artifactCaptor.capture());

        Artifact thumbArt = artifactCaptor.getAllValues().stream()
                .filter(a -> "THUMBNAIL".equals(a.getType()))
                .findFirst()
                .orElseThrow();
        assertEquals("https://example.com/custom-creator-thumbnail.jpg", thumbArt.getFileUrl());
    }

    @Test
    @DisplayName("Update Video: Creator cập nhật ảnh thumbnail đại diện qua CreatorUpdateVideoRequest")
    void testUpdateVideo_WithCustomThumbnail_Success() {
        Content content = Content.builder()
                .id(105L)
                .title("Video cũ")
                .channel(mockChannel)
                .status("DRAFT")
                .build();
        Artifact oldThumb = Artifact.builder()
                .id(205L)
                .content(content)
                .type("THUMBNAIL")
                .fileUrl("https://example.com/old-thumb.jpg")
                .build();

        when(contentRepository.findByIdAndCreatorId(105L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findLatestCoverArtifact(anyLong())).thenReturn(Optional.of(oldThumb));

        CreatorUpdateVideoRequest updateReq = CreatorUpdateVideoRequest.builder()
                .title("Tiêu đề mới")
                .description("Mô tả mới")
                .thumbnailUrl("https://example.com/brand-new-thumbnail.jpg")
                .build();

        CreatorVideoItemResponse res = creatorStudioService.updateVideo("creator@example.com", 105L, updateReq);

        assertNotNull(res);
        assertEquals("Tiêu đề mới", res.getTitle());
        assertEquals("https://example.com/brand-new-thumbnail.jpg", res.getThumbnailUrl());
        assertEquals("https://example.com/brand-new-thumbnail.jpg", oldThumb.getFileUrl());
        verify(artifactRepository).save(oldThumb);
    }

    @Test
    @DisplayName("Upload Thumbnail: Creator trực tiếp tải lên tệp ảnh thumbnail tùy chỉnh")
    void testUploadVideoThumbnail_Success() {
        Content content = Content.builder()
                .id(106L)
                .title("Trận Cầu Giấy 1873")
                .channel(mockChannel)
                .status("DRAFT")
                .build();

        when(contentRepository.findByIdAndCreatorId(106L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findLatestCoverArtifact(106L)).thenReturn(Optional.empty());
        when(fileStorageService.uploadImage(any(), eq("creator/thumbnails")))
                .thenReturn("https://res.cloudinary.com/prm/creator/thumbnails/custom_thumb.png");

        MockMultipartFile file = new MockMultipartFile(
                "file", "thumb.png", "image/png", "fake image bytes".getBytes()
        );

        CreatorVideoItemResponse res = creatorStudioService.uploadVideoThumbnail("creator@example.com", 106L, file);

        assertNotNull(res);
        assertEquals("https://res.cloudinary.com/prm/creator/thumbnails/custom_thumb.png", res.getThumbnailUrl());
        verify(fileStorageService).uploadImage(file, "creator/thumbnails");
        verify(artifactRepository, atLeastOnce()).save(any(Artifact.class));
    }
}
