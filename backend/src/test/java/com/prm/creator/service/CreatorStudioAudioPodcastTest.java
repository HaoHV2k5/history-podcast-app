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
    @DisplayName("Audio Podcast Mode: Gửi scriptText thành công, lưu Content AI_PODCAST và Artifact PODCAST_STUDIO")
    void testRenderAndSaveVideo_AudioPodcastMode_Success() {
        CreatorRenderRequest request = CreatorRenderRequest.builder()
                .title("Lý Thường Kiệt và phòng tuyến sông Như Nguyệt")
                .renderMode("audio_podcast")
                .scriptText("Vào năm 1075, Lý Thường Kiệt chủ động đem quân tấn công sang đất Tống để tự vệ.")
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
        verify(artifactRepository).save(artifactCaptor.capture());
        Artifact savedArtifact = artifactCaptor.getValue();
        assertEquals("PODCAST_STUDIO", savedArtifact.getSourceType());
        assertEquals("VIDEO", savedArtifact.getType());
    }

    @Test
    @DisplayName("Audio Podcast Mode: Thiếu cả scriptText lẫn storyboard -> Ném ngoại lệ AppException")
    void testRenderAndSaveVideo_AudioPodcastMode_MissingScript_ThrowsException() {
        CreatorRenderRequest request = CreatorRenderRequest.builder()
                .title("Chưa có kịch bản")
                .renderMode("audio_podcast")
                .scriptText("   ")
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
}
