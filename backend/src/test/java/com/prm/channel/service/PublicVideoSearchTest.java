package com.prm.channel.service;

import com.prm.channel.dto.response.PublicVideoItemResponse;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.service.impl.ContentServiceImpl;
import com.prm.common.enums.ContentStatus;
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
class PublicVideoSearchTest {

    @Mock
    private ContentRepository contentRepository;
    @Mock
    private ArtifactRepository artifactRepository;
    @Mock
    private ReactionRepository reactionRepository;
    @Mock
    private CommentRepository commentRepository;

    private ContentServiceImpl contentService;

    private Channel channel;
    private Content vFree;
    private Content vVip;

    @BeforeEach
    void setUp() {
        contentService = new ContentServiceImpl(
                contentRepository,
                null,
                null,
                null,
                artifactRepository,
                reactionRepository,
                commentRepository
        );

        channel = Channel.builder().id(10L).name("Lịch Sử Văn Minh").build();

        vFree = Content.builder()
                .id(101L)
                .channel(channel)
                .title("Chiến thắng Ngọc Hồi Đống Đa")
                .textBody("Vua Quang Trung đại phá 29 vạn quân Thanh mùa xuân năm Kỷ Dậu 1789")
                .status(ContentStatus.PUBLISHED.name())
                .isExclusive(false)
                .createdAt(Instant.ofEpochMilli(1000000000L))
                .build();

        vVip = Content.builder()
                .id(102L)
                .channel(channel)
                .title("Bí mật quân sự thời Trần")
                .textBody("Chiến thuật vây hãm và thủy chiến của Hưng Đạo Đại Vương")
                .status(ContentStatus.PUBLISHED.name())
                .isExclusive(true)
                .createdAt(Instant.ofEpochMilli(2000000000L))
                .build();

        lenient().when(contentRepository.findByStatus("PUBLISHED")).thenReturn(List.of(vFree, vVip));
        lenient().when(contentRepository.findByChannelIdAndStatus(10L, "PUBLISHED")).thenReturn(List.of(vFree, vVip));

        Artifact a1 = Artifact.builder().id(201L).content(vFree).durationSeconds(240).fileUrl("https://example.com/v1.mp4").build();
        Artifact a2 = Artifact.builder().id(202L).content(vVip).durationSeconds(500).fileUrl("https://example.com/v2.mp4").build();

        lenient().when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(a1));
        lenient().when(artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(102L)).thenReturn(Optional.of(a2));

        // vFree: 200 likes, 40 comments
        lenient().when(reactionRepository.countByArtifactIdAndType(201L, "LIKE")).thenReturn(200L);
        lenient().when(reactionRepository.countByArtifactIdAndType(201L, "DISLIKE")).thenReturn(3L);
        lenient().when(commentRepository.countByArtifactId(201L)).thenReturn(40L);

        // vVip: 500 likes, 80 comments
        lenient().when(reactionRepository.countByArtifactIdAndType(202L, "LIKE")).thenReturn(500L);
        lenient().when(reactionRepository.countByArtifactIdAndType(202L, "DISLIKE")).thenReturn(1L);
        lenient().when(commentRepository.countByArtifactId(202L)).thenReturn(80L);
    }

    @Test
    @DisplayName("Khán giả chưa đăng nhập tìm kiếm từ khóa có nhiều khoảng trắng thừa và không dấu")
    void testSearchPublicWithMessyWhitespaceKeyword() {
        List<PublicVideoItemResponse> res = contentService.searchPublicVideos(
                "   ngoc    hoi   dong    da   ",
                "PUBLISHED",
                null,
                null,
                "createdAt",
                "desc"
        );

        assertEquals(1, res.size());
        assertEquals("Chiến thắng Ngọc Hồi Đống Đa", res.get(0).getTitle());
        assertFalse(res.get(0).getIsExclusive());
    }

    @Test
    @DisplayName("Lọc danh sách chỉ lấy video Free cho khán giả xem miễn phí")
    void testFilterFreeVideosOnly() {
        List<PublicVideoItemResponse> res = contentService.searchPublicVideos(
                null,
                "PUBLISHED",
                null,
                false, // Chỉ lấy Free
                "createdAt",
                "desc"
        );

        assertEquals(1, res.size());
        assertEquals(101L, res.get(0).getContentId());
        assertFalse(res.get(0).getIsExclusive());
    }

    @Test
    @DisplayName("Lọc danh sách chỉ lấy video độc quyền Hội viên VIP")
    void testFilterVipVideosOnly() {
        List<PublicVideoItemResponse> res = contentService.searchPublicVideos(
                null,
                "PUBLISHED",
                null,
                true, // Chỉ lấy VIP
                "createdAt",
                "desc"
        );

        assertEquals(1, res.size());
        assertEquals(102L, res.get(0).getContentId());
        assertTrue(res.get(0).getIsExclusive());
    }

    @Test
    @DisplayName("Sắp xếp video công khai theo số lượt thích (likeCount desc)")
    void testSortByLikesDesc() {
        List<PublicVideoItemResponse> res = contentService.searchPublicVideos(
                null,
                "PUBLISHED",
                null,
                null,
                "likeCount",
                "desc"
        );

        assertEquals(2, res.size());
        assertEquals(500L, res.get(0).getLikeCount()); // vVip
        assertEquals(200L, res.get(1).getLikeCount()); // vFree
    }

    @Test
    @DisplayName("Sắp xếp video công khai theo số lượng bình luận (commentCount desc)")
    void testSortByCommentCountDesc() {
        List<PublicVideoItemResponse> res = contentService.searchPublicVideos(
                null,
                "PUBLISHED",
                null,
                null,
                "commentCount",
                "desc"
        );

        assertEquals(2, res.size());
        assertEquals(80L, res.get(0).getCommentCount()); // vVip
        assertEquals(40L, res.get(1).getCommentCount()); // vFree
    }
}
