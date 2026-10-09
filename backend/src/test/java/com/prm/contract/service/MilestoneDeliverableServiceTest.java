package com.prm.contract.service;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.FileStorageService;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.dto.response.MilestoneDeliverableResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.entity.MilestoneDeliverable;
import com.prm.contract.entity.Post;
import com.prm.contract.repository.MilestoneDeliverableRepository;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.repository.PostRepository;
import com.prm.contract.service.impl.MilestoneDeliverableServiceImpl;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MilestoneDeliverableServiceTest {

    @Mock
    private MilestoneDeliverableRepository deliverableRepository;
    @Mock
    private MilestoneRepository milestoneRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FileStorageService fileStorageService;

    private BookingEscrowProperties properties;
    private MilestoneDeliverableServiceImpl deliverableService;

    private User creator;
    private User freelancer;
    private User stranger;
    private Contract contract;
    private Milestone milestone;
    private Post post;

    @BeforeEach
    void setUp() {
        properties = new BookingEscrowProperties();
        properties.setReviewDays(3);

        deliverableService = new MilestoneDeliverableServiceImpl(
                deliverableRepository,
                milestoneRepository,
                postRepository,
                userRepository,
                fileStorageService,
                properties
        );

        Role creatorRole = Role.builder().id(1L).name(RoleEnum.CREATOR.name()).build();
        Role freelancerRole = Role.builder().id(2L).name(RoleEnum.FREELANCER.name()).build();

        creator = User.builder().id(1L).email("creator@test.com").fullName("Creator User").roles(Set.of(creatorRole)).build();
        freelancer = User.builder().id(2L).email("freelancer@test.com").fullName("Freelancer User").roles(Set.of(freelancerRole)).build();
        stranger = User.builder().id(99L).email("stranger@test.com").fullName("Stranger").roles(Set.of(freelancerRole)).build();

        post = Post.builder().id(100L).user(creator).title("Tuyen dung lam website ban hang").build();

        contract = Contract.builder()
                .id(10L)
                .creator(creator)
                .freelancer(freelancer)
                .post(post)
                .title("Hop dong phat trien web")
                .totalAmount(BigDecimal.valueOf(10000000))
                .build();

        milestone = Milestone.builder()
                .id(50L)
                .contract(contract)
                .orderNo(1)
                .title("Giai doan 1: Actor + ERD")
                .status(MilestoneStatus.IN_PROGRESS)
                .amount(BigDecimal.valueOf(3000000))
                .build();
    }

    private void authenticateAs(User user) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user.getEmail(), null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
        lenient().when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("Freelancer nộp sản phẩm thành công và chuyển milestone sang SUBMITTED")
    void testUploadDeliverable_Success() {
        authenticateAs(freelancer);

        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));
        when(fileStorageService.uploadRawFile(any(), anyString())).thenReturn("https://storage.cloud/deliverables/erd_v1.pdf");
        when(deliverableRepository.findByMilestoneIdOrderByCreatedAtDesc(50L)).thenReturn(Collections.emptyList());

        when(deliverableRepository.save(any(MilestoneDeliverable.class))).thenAnswer(invocation -> {
            MilestoneDeliverable d = invocation.getArgument(0);
            d.setId(1001L);
            return d;
        });

        MockMultipartFile file = new MockMultipartFile("file", "erd_v1.pdf", "application/pdf", "fake pdf content".getBytes());

        MilestoneDeliverableResponse response = deliverableService.uploadDeliverable(50L, "Tai lieu ERD giai doan 1", "Mo ta ERD", file);

        assertNotNull(response);
        assertEquals(1001L, response.getId());
        assertEquals("Tai lieu ERD giai doan 1", response.getTitle());
        assertEquals(1, response.getVersionNo());
        assertEquals(100L, response.getPostId());
        assertEquals(MilestoneStatus.SUBMITTED, milestone.getStatus());
        verify(milestoneRepository).save(milestone);
    }

    @Test
    @DisplayName("Người ngoài không có quyền nộp sản phẩm cho milestone")
    void testUploadDeliverable_ForbiddenOutsider() {
        authenticateAs(stranger);

        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));

        MockMultipartFile file = new MockMultipartFile("file", "erd_v1.pdf", "application/pdf", "content".getBytes());

        AppException ex = assertThrows(AppException.class, () ->
                deliverableService.uploadDeliverable(50L, "ERD", "Mo ta", file));

        assertEquals(ErrorCode.CONTRACT_ACCESS_DENIED, ex.getErrorCode());
        verify(deliverableRepository, never()).save(any());
    }

    @Test
    @DisplayName("Creator và Freelancer được quyền tải sản phẩm, người ngoài bị chặn 403")
    void testDownloadDeliverable_AccessControl() {
        MilestoneDeliverable deliverable = MilestoneDeliverable.builder()
                .id(888L)
                .milestone(milestone)
                .post(post)
                .uploadedBy(freelancer)
                .fileName("erd_design.pdf")
                .filePath("local_simulated_path")
                .versionNo(1)
                .createdAt(Instant.now())
                .build();

        when(deliverableRepository.findById(888L)).thenReturn(Optional.of(deliverable));

        // 1. Creator tải thành công
        authenticateAs(creator);
        Resource resource = deliverableService.downloadDeliverable(888L);
        assertNotNull(resource);

        // 2. Stranger tải bị chặn ACCESS_DENIED
        authenticateAs(stranger);
        AppException ex = assertThrows(AppException.class, () -> deliverableService.downloadDeliverable(888L));
        assertEquals(ErrorCode.DELIVERABLE_ACCESS_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lấy danh sách sản phẩm theo bài Post thành công")
    void testGetDeliverablesByPost_Success() {
        authenticateAs(creator);

        when(postRepository.findById(100L)).thenReturn(Optional.of(post));

        MilestoneDeliverable d1 = MilestoneDeliverable.builder()
                .id(1L)
                .milestone(milestone)
                .post(post)
                .uploadedBy(freelancer)
                .title("ERD Diagram")
                .fileName("erd.pdf")
                .filePath("url1")
                .versionNo(1)
                .createdAt(Instant.now())
                .build();

        when(deliverableRepository.findByPostIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(d1));

        List<MilestoneDeliverableResponse> responses = deliverableService.getDeliverablesByPost(100L);

        assertEquals(1, responses.size());
        assertEquals("ERD Diagram", responses.get(0).getTitle());
        assertEquals(100L, responses.get(0).getPostId());
    }
}
