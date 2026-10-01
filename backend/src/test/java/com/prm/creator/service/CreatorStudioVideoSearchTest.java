package com.prm.creator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.TranscriptRepository;
import com.prm.common.enums.ContentStatus;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CreatorStudioVideoSearchTest {

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
    private Content video1;
    private Content video2;
    private Content video3;

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
        );

        mockCreator = User.builder().id(10L).email("creator@example.com").build();
        mockChannel = Channel.builder().id(100L).name("Sử Việt Hào Hùng").creator(mockCreator).build();

        video1 = Content.builder()
                .id(1L)
                .channel(mockChannel)
                .title("Chiến thắng Bạch Đằng 938")
                .textBody("Ngô Quyền cắm cọc gỗ trên sông tiêu diệt quân Nam Hán")
                .status(ContentStatus.PUBLISHED.name())
                .isExclusive(false)
                .createdAt(Instant.ofEpochMilli(1000000000L))
                .build();

        video2 = Content.builder()
                .id(2L)
                .channel(mockChannel)
                .title("Chiến dịch Điện Biên Phủ 1954")
                .textBody("Lừng lẫy năm châu chấn động địa cầu")
                .status(ContentStatus.HIDDEN.name())
                .isExclusive(true)
                .createdAt(Instant.ofEpochMilli(2000000000L))
                .build();

        video3 = Content.builder()
                .id(3L)
                .channel(mockChannel)
                .title("Khởi nghĩa Lam Sơn")
                .textBody("Lê Lợi khởi nghĩa chống quân Minh xâm lược")
                .status(ContentStatus.FAILED.name())
                .isExclusive(false)
                .createdAt(Instant.ofEpochMilli(3000000000L))
                .build();

        lenient().when(userRepository.findByEmail("creator@example.com")).thenReturn(Optional.of(mockCreator));
        lenient().when(contentRepository.findByCreatorId(10L)).thenReturn(List.of(video1, video2, video3));

        Artifact a1 = Artifact.builder().id(11L).content(video1).durationSeconds(120).build();
        Artifact a2 = Artifact.builder().id(12L).content(video2).durationSeconds(300).build();
        Artifact a3 = Artifact.builder().id(13L).content(video3).durationSeconds(60).build();

        lenient().when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(a1));
        lenient().when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(2L)).thenReturn(Optional.of(a2));
        lenient().when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(3L)).thenReturn(Optional.of(a3));

        // Video 1: 50 likes, 1 dislikes, 10 comments
        lenient().when(reactionRepository.countByArtifactIdAndType(11L, "LIKE")).thenReturn(50L);
        lenient().when(reactionRepository.countByArtifactIdAndType(11L, "DISLIKE")).thenReturn(1L);
        lenient().when(commentRepository.countByArtifactId(11L)).thenReturn(10L);

        // Video 2: 100 likes, 2 dislikes, 5 comments
        lenient().when(reactionRepository.countByArtifactIdAndType(12L, "LIKE")).thenReturn(100L);
        lenient().when(reactionRepository.countByArtifactIdAndType(12L, "DISLIKE")).thenReturn(2L);
        lenient().when(commentRepository.countByArtifactId(12L)).thenReturn(5L);

        // Video 3: 0 likes, 0 dislikes, 0 comments
        lenient().when(reactionRepository.countByArtifactIdAndType(13L, "LIKE")).thenReturn(0L);
        lenient().when(reactionRepository.countByArtifactIdAndType(13L, "DISLIKE")).thenReturn(0L);
        lenient().when(commentRepository.countByArtifactId(13L)).thenReturn(0L);
    }

    @Test
    @DisplayName("Tìm kiếm video theo từ khóa tiếng Việt không dấu")
    void testSearchByKeywordUnaccented() {
        List<CreatorVideoItemResponse> res = creatorStudioService.getCreatorVideos(
                "creator@example.com", "bach dang", null, null, "createdAt", "desc"
        );
        assertEquals(1, res.size());
        assertEquals("Chiến thắng Bạch Đằng 938", res.get(0).getTitle());
    }

    @Test
    @DisplayName("Tìm kiếm từ khóa trong nội dung kịch bản")
    void testSearchInDescription() {
        List<CreatorVideoItemResponse> res = creatorStudioService.getCreatorVideos(
                "creator@example.com", "Nam Hán", null, null, "createdAt", "desc"
        );
        assertEquals(1, res.size());
        assertEquals(1L, res.get(0).getContentId());
    }

    @Test
    @DisplayName("Lọc theo trạng thái PUBLISHED")
    void testFilterByStatus() {
        List<CreatorVideoItemResponse> res = creatorStudioService.getCreatorVideos(
                "creator@example.com", null, "PUBLISHED", null, "createdAt", "desc"
        );
        assertEquals(1, res.size());
        assertEquals("PUBLISHED", res.get(0).getStatus());
        assertEquals("Chiến thắng Bạch Đằng 938", res.get(0).getTitle());
    }

    @Test
    @DisplayName("Lọc theo trạng thái HIDDEN")
    void testFilterByStatusHidden() {
        List<CreatorVideoItemResponse> res = creatorStudioService.getCreatorVideos(
                "creator@example.com", null, "HIDDEN", null, "createdAt", "desc"
        );
        assertEquals(1, res.size());
        assertEquals("HIDDEN", res.get(0).getStatus());
    }

    @Test
    @DisplayName("Lọc theo quyền truy cập VIP độc quyền")
    void testFilterByExclusive() {
        List<CreatorVideoItemResponse> resVip = creatorStudioService.getCreatorVideos(
                "creator@example.com", null, null, true, "createdAt", "desc"
        );
        assertEquals(1, resVip.size());
        assertTrue(resVip.get(0).getIsExclusive());
        assertEquals("Chiến dịch Điện Biên Phủ 1954", resVip.get(0).getTitle());

        List<CreatorVideoItemResponse> resFree = creatorStudioService.getCreatorVideos(
                "creator@example.com", null, null, false, "createdAt", "desc"
        );
        assertEquals(2, resFree.size());
    }

    @Test
    @DisplayName("Sắp xếp theo số lượt thích giảm dần (likeCount desc)")
    void testSortByLikesDesc() {
        List<CreatorVideoItemResponse> res = creatorStudioService.getCreatorVideos(
                "creator@example.com", null, null, null, "likeCount", "desc"
        );
        assertEquals(3, res.size());
        assertEquals(100L, res.get(0).getLikeCount()); // Video 2
        assertEquals(50L, res.get(1).getLikeCount());  // Video 1
        assertEquals(0L, res.get(2).getLikeCount());   // Video 3
    }

    @Test
    @DisplayName("Sắp xếp theo số lượng bình luận giảm dần (commentCount desc)")
    void testSortByCommentsDesc() {
        List<CreatorVideoItemResponse> res = creatorStudioService.getCreatorVideos(
                "creator@example.com", null, null, null, "commentCount", "desc"
        );
        assertEquals(3, res.size());
        assertEquals(10L, res.get(0).getCommentCount()); // Video 1
        assertEquals(5L, res.get(1).getCommentCount());  // Video 2
        assertEquals(0L, res.get(2).getCommentCount());  // Video 3
    }

    @Test
    @DisplayName("Sắp xếp theo ngày tạo tăng dần (cũ nhất trước)")
    void testSortByCreatedAtAsc() {
        List<CreatorVideoItemResponse> res = creatorStudioService.getCreatorVideos(
                "creator@example.com", null, null, null, "createdAt", "asc"
        );
        assertEquals(3, res.size());
        assertEquals(1L, res.get(0).getContentId());
        assertEquals(2L, res.get(1).getContentId());
        assertEquals(3L, res.get(2).getContentId());
    }
}
