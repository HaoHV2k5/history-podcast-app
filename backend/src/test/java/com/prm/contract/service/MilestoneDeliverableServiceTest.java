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
import com.prm.contract.repository.MilestoneDeliverableRepository;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.service.impl.MilestoneDeliverableServiceImpl;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
    private UserRepository userRepository;
    @Mock
    private FileStorageService fileStorageService;

    private BookingEscrowProperties properties;
    private MilestoneDeliverableServiceImpl deliverableService;

    private User creator;
    private User requester;
    private User stranger;
    private Contract contract;
    private Milestone milestone;

    @BeforeEach
    void setUp() {
        properties = new BookingEscrowProperties();
        properties.setReviewDays(3);

        deliverableService = new MilestoneDeliverableServiceImpl(
                deliverableRepository,
                milestoneRepository,
                userRepository,
                fileStorageService,
                properties
        );

        Role creatorRole = Role.builder().id(1L).name(RoleEnum.CREATOR.name()).build();
        Role viewerRole = Role.builder().id(2L).name(RoleEnum.VIEWER.name()).build();

        creator = User.builder().id(1L).email("creator@test.com").fullName("Creator User").roles(Set.of(creatorRole)).build();
        requester = User.builder().id(2L).email("listener@test.com").fullName("Listener User").roles(Set.of(viewerRole)).build();
        stranger = User.builder().id(99L).email("stranger@test.com").fullName("Stranger").roles(Set.of(viewerRole)).build();

        contract = Contract.builder()
                .id(10L)
                .creator(creator)
                .freelancer(requester)
                .title("Hợp đồng sản xuất Series Lịch sử")
                .totalAmount(BigDecimal.valueOf(10000000))
                .build();

        milestone = Milestone.builder()
                .id(50L)
                .contract(contract)
                .orderNo(1)
                .title("Giai đoạn 1: Đề cương kịch bản")
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
    @DisplayName("Creator nộp tệp sản phẩm bàn giao thành công và chuyển milestone sang SUBMITTED")
    void testUploadDeliverable_Success() {
        authenticateAs(creator);

        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));
        when(fileStorageService.uploadRawFile(any(), anyString())).thenReturn("https://storage.cloud/deliverables/script_v1.pdf");
        when(deliverableRepository.findByMilestoneIdOrderByCreatedAtDesc(50L)).thenReturn(Collections.emptyList());

        when(deliverableRepository.save(any(MilestoneDeliverable.class))).thenAnswer(invocation -> {
            MilestoneDeliverable d = invocation.getArgument(0);
            d.setId(1001L);
            return d;
        });

        MockMultipartFile file = new MockMultipartFile("file", "script_v1.pdf", "application/pdf", "fake pdf content".getBytes());

        MilestoneDeliverableResponse response = deliverableService.uploadDeliverable(50L, "Kịch bản giai đoạn 1", "Mô tả kịch bản", file);

        assertNotNull(response);
        assertEquals(1001L, response.getId());
        assertEquals("Kịch bản giai đoạn 1", response.getTitle());
        assertEquals(1, response.getVersionNo());
        assertEquals(10L, response.getContractId());
        assertEquals(MilestoneStatus.SUBMITTED, milestone.getStatus());
        verify(milestoneRepository).save(milestone);
    }

    @Test
    @DisplayName("Người thuê (Customer) hoặc Người ngoài không được phép tải lên tệp bàn giao (chỉ Creator được nộp)")
    void testUploadDeliverable_ForbiddenForRequesterAndOutsider() {
        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));
        MockMultipartFile file = new MockMultipartFile("file", "script_v1.pdf", "application/pdf", "content".getBytes());

        authenticateAs(requester);
        AppException exReq = assertThrows(AppException.class, () ->
                deliverableService.uploadDeliverable(50L, "Kịch bản", "Mô tả", file));
        assertEquals(ErrorCode.CONTRACT_ACCESS_DENIED, exReq.getErrorCode());

        authenticateAs(stranger);
        AppException exStranger = assertThrows(AppException.class, () ->
                deliverableService.uploadDeliverable(50L, "Kịch bản", "Mô tả", file));
        assertEquals(ErrorCode.CONTRACT_ACCESS_DENIED, exStranger.getErrorCode());

        verify(deliverableRepository, never()).save(any());
    }

    @Test
    @DisplayName("Creator và Người đặt nội dung được quyền tải sản phẩm, người ngoài bị chặn 403")
    void testDownloadDeliverable_AccessControl() throws Exception {
        java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("deliverable_test_", ".pdf");
        java.nio.file.Files.writeString(tempFile, "real pdf content for test");
        try {
            MilestoneDeliverable deliverable = MilestoneDeliverable.builder()
                    .id(888L)
                    .milestone(milestone)
                    .uploadedBy(creator)
                    .fileName("script_design.pdf")
                    .filePath(tempFile.toAbsolutePath().toString())
                    .versionNo(1)
                    .createdAt(Instant.now())
                    .build();

            when(deliverableRepository.findById(888L)).thenReturn(Optional.of(deliverable));

            authenticateAs(requester);
            Resource resource = deliverableService.downloadDeliverable(888L);
            assertNotNull(resource);

            authenticateAs(creator);
            assertNotNull(deliverableService.downloadDeliverable(888L));

            authenticateAs(stranger);
            AppException ex = assertThrows(AppException.class, () -> deliverableService.downloadDeliverable(888L));
            assertEquals(ErrorCode.DELIVERABLE_ACCESS_DENIED, ex.getErrorCode());
        } finally {
            java.nio.file.Files.deleteIfExists(tempFile);
        }
    }

    @Test
    @DisplayName("Lấy danh sách sản phẩm theo Milestone thành công")
    void testGetDeliverablesByMilestone_Success() {
        authenticateAs(creator);

        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));

        MilestoneDeliverable d1 = MilestoneDeliverable.builder()
                .id(1L)
                .milestone(milestone)
                .uploadedBy(creator)
                .title("Script Diagram")
                .fileName("script.pdf")
                .filePath("url1")
                .versionNo(1)
                .createdAt(Instant.now())
                .build();

        when(deliverableRepository.findByMilestoneIdOrderByCreatedAtDesc(50L)).thenReturn(List.of(d1));

        List<MilestoneDeliverableResponse> responses = deliverableService.getDeliverablesByMilestone(50L);

        assertEquals(1, responses.size());
        assertEquals("Script Diagram", responses.get(0).getTitle());
        assertEquals(10L, responses.get(0).getContractId());
    }
}
