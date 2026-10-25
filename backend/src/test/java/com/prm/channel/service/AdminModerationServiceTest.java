package com.prm.channel.service;

import com.prm.channel.dto.request.AdminModerationDecisionRequest;
import com.prm.channel.dto.response.AdminModerationItemResponse;
import com.prm.channel.entity.AiFilterLog;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.entity.ModerationReview;
import com.prm.channel.repository.AiFilterLogRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.ModerationReviewRepository;
import com.prm.channel.service.impl.AdminModerationServiceImpl;
import com.prm.common.dto.PageResponse;
import com.prm.common.enums.AiShieldTier;
import com.prm.common.enums.ContentStatus;
import com.prm.common.exception.AppException;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.TranscriptRepository;
import com.prm.common.enums.ArtifactStatus;
import com.prm.common.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminModerationServiceTest {

    @Mock
    private ModerationReviewRepository moderationReviewRepository;

    @Mock
    private AiFilterLogRepository aiFilterLogRepository;

    @Mock
    private ContentRepository contentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiShieldPolicyService aiShieldPolicyService;

    @Mock
    private ArtifactRepository artifactRepository;

    @Mock
    private TranscriptRepository transcriptRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private AdminModerationServiceImpl adminModerationService;

    private User adminUser;
    private User creatorUser;
    private Channel channel;
    private Content content;
    private Artifact artifact;
    private ModerationReview review;
    private AiFilterLog aiFilterLog;

    @BeforeEach
    void setUp() {
        adminUser = User.builder().id(1L).email("admin@historypodcast.com").build();
        creatorUser = User.builder().id(2L).email("creator@historypodcast.com").build();
        channel = Channel.builder().id(10L).name("Sử Việt Ký").creator(creatorUser).build();

        content = Content.builder()
                .id(100L)
                .channel(channel)
                .title("Chiến thắng Bạch Đằng 938")
                .textBody("Kịch bản chiến thắng oanh liệt trên sông Bạch Đằng")
                .status(ContentStatus.PENDING_REVIEW.name())
                .createdAt(Instant.now())
                .build();

        artifact = Artifact.builder()
                .id(200L)
                .content(content)
                .fileUrl("https://cloudinary.com/bachdang.mp4")
                .durationSeconds(120)
                .status("COMPLETED")
                .createdAt(Instant.now())
                .build();

        review = ModerationReview.builder()
                .id(300L)
                .artifact(artifact)
                .decision("PENDING")
                .reason("AI Shield [Khá - 75.0%]: Kịch bản phù hợp")
                .build();

        aiFilterLog = AiFilterLog.builder()
                .id(400L)
                .artifact(artifact)
                .result("FAIR")
                .score(BigDecimal.valueOf(75.0))
                .reason("Khá: Nội dung cơ bản chuẩn xác")
                .checkedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Admin lấy danh sách hàng đợi kiểm duyệt thành công")
    void testSearchReviews_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<ModerationReview> page = new PageImpl<>(List.of(review), pageable, 1);

        when(moderationReviewRepository.searchReviews(eq("PENDING"), isNull(), eq(pageable))).thenReturn(page);
        when(aiFilterLogRepository.findTopByArtifactIdOrderByIdDesc(200L)).thenReturn(Optional.of(aiFilterLog));

        PageResponse<AdminModerationItemResponse> response = adminModerationService.searchReviews("PENDING", null, null, pageable);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        AdminModerationItemResponse item = response.getItems().get(0);
        assertEquals(300L, item.getReviewId());
        assertEquals("Chiến thắng Bạch Đằng 938", item.getTitle());
        assertEquals("PENDING", item.getDecision());
        assertEquals(AiShieldTier.FAIR, item.getAiShieldTier());
        assertEquals("Khá", item.getAiShieldTierLabel());
        assertEquals(BigDecimal.valueOf(75.0), item.getAiShieldScore());
    }

    @Test
    @DisplayName("Admin xem chi tiết phiên kiểm duyệt thành công")
    void testGetReviewDetail_Success() {
        when(moderationReviewRepository.findById(300L)).thenReturn(Optional.of(review));
        when(aiFilterLogRepository.findTopByArtifactIdOrderByIdDesc(200L)).thenReturn(Optional.of(aiFilterLog));

        AdminModerationItemResponse detail = adminModerationService.getReviewDetail(300L);

        assertNotNull(detail);
        assertEquals(300L, detail.getReviewId());
        assertEquals(100L, detail.getContentId());
        assertEquals("creator@historypodcast.com", detail.getCreatorEmail());
        assertEquals("Khá", detail.getAiShieldTierLabel());
    }

    @Test
    @DisplayName("Admin phê duyệt video: Trạng thái chuyển sang PUBLISHED")
    void testProcessDecision_Approved() {
        when(moderationReviewRepository.findById(300L)).thenReturn(Optional.of(review));
        when(userRepository.findByEmail("admin@historypodcast.com")).thenReturn(Optional.of(adminUser));
        when(moderationReviewRepository.save(any(ModerationReview.class))).thenAnswer(i -> i.getArgument(0));
        when(contentRepository.save(any(Content.class))).thenAnswer(i -> i.getArgument(0));

        AdminModerationDecisionRequest request = AdminModerationDecisionRequest.builder()
                .decision("APPROVED")
                .reason("Nội dung chuẩn xác, cho phép xuất bản")
                .build();

        AdminModerationItemResponse result = adminModerationService.processDecision(300L, "admin@historypodcast.com", request);

        assertNotNull(result);
        assertEquals("APPROVED", result.getDecision());
        assertEquals(ContentStatus.PUBLISHED.name(), content.getStatus());
        assertEquals("admin@historypodcast.com", result.getModeratorEmail());
        verify(contentRepository, times(1)).save(content);
        verify(moderationReviewRepository, times(1)).save(review);
    }

    @Test
    @DisplayName("Admin từ chối video: Trạng thái chuyển sang REJECTED và lưu lý do")
    void testProcessDecision_Rejected() {
        when(moderationReviewRepository.findById(300L)).thenReturn(Optional.of(review));
        when(userRepository.findByEmail("admin@historypodcast.com")).thenReturn(Optional.of(adminUser));
        when(moderationReviewRepository.save(any(ModerationReview.class))).thenAnswer(i -> i.getArgument(0));
        when(contentRepository.save(any(Content.class))).thenAnswer(i -> i.getArgument(0));

        AdminModerationDecisionRequest request = AdminModerationDecisionRequest.builder()
                .decision("REJECTED")
                .reason("Cần chỉnh sửa lại mốc năm lịch sử ở cảnh 2")
                .build();

        AdminModerationItemResponse result = adminModerationService.processDecision(300L, "admin@historypodcast.com", request);

        assertNotNull(result);
        assertEquals("REJECTED", result.getDecision());
        assertEquals(ContentStatus.REJECTED.name(), content.getStatus());
        assertEquals("Cần chỉnh sửa lại mốc năm lịch sử ở cảnh 2", review.getReason());
        verify(contentRepository, times(1)).save(content);
    }

    @Test
    @DisplayName("Admin phê duyệt phiên bản mới v2: v2 chuyển sang PUBLISHED, v1 cũ được ARCHIVED để thay thế")
    void testProcessDecision_ApprovedNewVersion_ArchivesOldVersion() {
        Artifact artifactV1 = Artifact.builder()
                .id(201L)
                .content(content)
                .version(1)
                .status("PUBLISHED")
                .fileUrl("https://cloudinary.com/v1.mp4")
                .build();

        Artifact artifactV2 = Artifact.builder()
                .id(202L)
                .content(content)
                .version(2)
                .status("PENDING_REVIEW")
                .fileUrl("https://cloudinary.com/v2.mp4")
                .build();

        ModerationReview reviewV2 = ModerationReview.builder()
                .id(301L)
                .artifact(artifactV2)
                .decision("PENDING")
                .build();

        when(moderationReviewRepository.findById(301L)).thenReturn(Optional.of(reviewV2));
        when(userRepository.findByEmail("admin@historypodcast.com")).thenReturn(Optional.of(adminUser));
        when(moderationReviewRepository.save(any(ModerationReview.class))).thenAnswer(i -> i.getArgument(0));
        when(contentRepository.save(any(Content.class))).thenAnswer(i -> i.getArgument(0));
        when(artifactRepository.findByContentId(content.getId())).thenReturn(List.of(artifactV2, artifactV1));

        AdminModerationDecisionRequest request = AdminModerationDecisionRequest.builder()
                .decision("APPROVED")
                .reason("Bản v2 đã sửa phát âm chuẩn xác")
                .build();

        AdminModerationItemResponse result = adminModerationService.processDecision(301L, "admin@historypodcast.com", request);

        assertNotNull(result);
        assertEquals("APPROVED", result.getDecision());
        assertEquals("PUBLISHED", artifactV2.getStatus());
        assertEquals("ARCHIVED", artifactV1.getStatus());
        assertEquals(ContentStatus.PUBLISHED.name(), content.getStatus());
        verify(artifactRepository, atLeastOnce()).save(artifactV2);
        verify(artifactRepository, atLeastOnce()).save(artifactV1);
    }

    @Test
    @DisplayName("Admin từ chối bản vá v2: v2 bị REJECTED, nhưng v1 vẫn giữ nguyên PUBLISHED không bị gãy")
    void testProcessDecision_RejectedNewVersion_PreservesPublishedV1() {
        Artifact artifactV1 = Artifact.builder()
                .id(201L)
                .content(content)
                .version(1)
                .status("PUBLISHED")
                .fileUrl("https://cloudinary.com/v1.mp4")
                .build();

        Artifact artifactV2 = Artifact.builder()
                .id(202L)
                .content(content)
                .version(2)
                .status("PENDING_REVIEW")
                .fileUrl("https://cloudinary.com/v2.mp4")
                .build();

        ModerationReview reviewV2 = ModerationReview.builder()
                .id(302L)
                .artifact(artifactV2)
                .decision("PENDING")
                .build();

        content.setStatus(ContentStatus.PUBLISHED.name());

        when(moderationReviewRepository.findById(302L)).thenReturn(Optional.of(reviewV2));
        when(userRepository.findByEmail("admin@historypodcast.com")).thenReturn(Optional.of(adminUser));
        when(moderationReviewRepository.save(any(ModerationReview.class))).thenAnswer(i -> i.getArgument(0));
        when(contentRepository.save(any(Content.class))).thenAnswer(i -> i.getArgument(0));
        when(artifactRepository.findByContentId(content.getId())).thenReturn(List.of(artifactV2, artifactV1));

        AdminModerationDecisionRequest request = AdminModerationDecisionRequest.builder()
                .decision("REJECTED")
                .reason("Câu 3 phát âm sai")
                .build();

        AdminModerationItemResponse result = adminModerationService.processDecision(302L, "admin@historypodcast.com", request);

        assertNotNull(result);
        assertEquals("REJECTED", result.getDecision());
        assertEquals("REJECTED", artifactV2.getStatus());
        // Content vẫn giữ PUBLISHED để phục vụ người xem bản v1
        assertEquals(ContentStatus.PUBLISHED.name(), content.getStatus());
    }

    @Test
    @DisplayName("Admin ra quyết định không hợp lệ thì ném ngoại lệ AppException")
    void testProcessDecision_InvalidDecision() {
        when(moderationReviewRepository.findById(300L)).thenReturn(Optional.of(review));
        when(userRepository.findByEmail("admin@historypodcast.com")).thenReturn(Optional.of(adminUser));

        AdminModerationDecisionRequest request = AdminModerationDecisionRequest.builder()
                .decision("MAYBE")
                .reason("Chưa rõ")
                .build();

        assertThrows(AppException.class, () ->
                adminModerationService.processDecision(300L, "admin@historypodcast.com", request)
        );
    }
}
