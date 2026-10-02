package com.prm.creator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prm.channel.entity.AiFilterLog;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.entity.ModerationReview;
import com.prm.channel.repository.AiFilterLogRepository;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.ModerationReviewRepository;
import com.prm.channel.repository.TranscriptRepository;
import com.prm.common.enums.ContentStatus;
import com.prm.common.exception.AppException;
import com.prm.common.service.FileStorageService;
import com.prm.creator.dto.response.CreatorVideoItemResponse;
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

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreatorStudioSubmitPublishTest {

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

    private CreatorStudioServiceImpl creatorStudioService;

    private User creator;
    private Channel channel;
    private Content content;
    private Artifact artifact;

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
                new ObjectMapper(),
                aiFilterLogRepository,
                moderationReviewRepository
        );

        creator = User.builder().id(10L).email("creator@historypodcast.com").build();
        channel = Channel.builder().id(20L).name("Lịch Sử Văn Minh").creator(creator).build();

        content = Content.builder()
                .id(100L)
                .channel(channel)
                .title("Chiến Thắng Điện Biên Phủ")
                .textBody("Lừng lẫy năm châu, chấn động địa cầu")
                .status(ContentStatus.COMPLETED.name())
                .createdAt(Instant.now())
                .build();

        artifact = Artifact.builder()
                .id(200L)
                .content(content)
                .fileUrl("https://cloudinary.com/dienbienphu.mp4")
                .durationSeconds(180)
                .status("COMPLETED")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Creator gửi video duyệt thành công: Trạng thái chuyển sang PENDING_REVIEW và tạo bản ghi AI log & Review")
    void testSubmitVideoForPublish_Success() {
        when(userRepository.findByEmail("creator@historypodcast.com")).thenReturn(Optional.of(creator));
        when(contentRepository.findByIdAndCreatorId(100L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(100L)).thenReturn(Optional.of(artifact));
        when(creatorAiSettingRepository.findByUserId(10L)).thenReturn(Optional.empty());

        when(aiFilterLogRepository.save(any(AiFilterLog.class))).thenAnswer(i -> i.getArgument(0));
        when(moderationReviewRepository.findTopByArtifactIdOrderByIdDesc(200L)).thenReturn(Optional.empty());
        when(moderationReviewRepository.save(any(ModerationReview.class))).thenAnswer(i -> i.getArgument(0));
        when(contentRepository.save(any(Content.class))).thenAnswer(i -> i.getArgument(0));

        CreatorVideoItemResponse response = creatorStudioService.submitVideoForPublish("creator@historypodcast.com", 100L);

        assertNotNull(response);
        assertEquals(ContentStatus.PENDING_REVIEW.name(), response.getStatus());
        assertEquals(ContentStatus.PENDING_REVIEW.name(), content.getStatus());
        assertEquals("PENDING", response.getModerationDecision());
        assertNotNull(response.getAiShieldTier());
        assertNotNull(response.getAiShieldScore());

        verify(aiFilterLogRepository, times(1)).save(any(AiFilterLog.class));
        verify(moderationReviewRepository, times(1)).save(any(ModerationReview.class));
        verify(contentRepository, times(1)).save(content);
    }

    @Test
    @DisplayName("Video đang ở trạng thái PENDING_REVIEW không được gửi trùng lặp")
    void testSubmitVideoForPublish_AlreadyPendingReview() {
        content.setStatus(ContentStatus.PENDING_REVIEW.name());

        when(userRepository.findByEmail("creator@historypodcast.com")).thenReturn(Optional.of(creator));
        when(contentRepository.findByIdAndCreatorId(100L, 10L)).thenReturn(Optional.of(content));

        AppException ex = assertThrows(AppException.class, () ->
                creatorStudioService.submitVideoForPublish("creator@historypodcast.com", 100L)
        );
        assertTrue(ex.getMessage().contains("chờ Admin kiểm duyệt"));
    }

    @Test
    @DisplayName("Video đã PUBLISHED không được gửi duyệt lại")
    void testSubmitVideoForPublish_AlreadyPublished() {
        content.setStatus(ContentStatus.PUBLISHED.name());

        when(userRepository.findByEmail("creator@historypodcast.com")).thenReturn(Optional.of(creator));
        when(contentRepository.findByIdAndCreatorId(100L, 10L)).thenReturn(Optional.of(content));

        AppException ex = assertThrows(AppException.class, () ->
                creatorStudioService.submitVideoForPublish("creator@historypodcast.com", 100L)
        );
        assertTrue(ex.getMessage().contains("đã được xuất bản"));
    }

    @Test
    @DisplayName("Video chưa hoàn tất render (không có fileUrl) thì không thể gửi duyệt")
    void testSubmitVideoForPublish_MissingVideoFile() {
        artifact.setFileUrl(null);

        when(userRepository.findByEmail("creator@historypodcast.com")).thenReturn(Optional.of(creator));
        when(contentRepository.findByIdAndCreatorId(100L, 10L)).thenReturn(Optional.of(content));
        when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(100L)).thenReturn(Optional.of(artifact));

        AppException ex = assertThrows(AppException.class, () ->
                creatorStudioService.submitVideoForPublish("creator@historypodcast.com", 100L)
        );
        assertTrue(ex.getMessage().contains("chưa hoàn tất quá trình kết xuất"));
    }
}
