package com.prm.contract.service;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.dto.request.CreateMilestoneReviewRequest;
import com.prm.contract.dto.response.MilestoneReviewResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.entity.MilestoneReview;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.repository.MilestoneReviewRepository;
import com.prm.contract.service.impl.MilestoneReviewServiceImpl;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MilestoneReviewServiceTest {

    @Mock
    private MilestoneReviewRepository milestoneReviewRepository;
    @Mock
    private MilestoneRepository milestoneRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MilestoneReviewServiceImpl milestoneReviewService;

    private User creator;
    private User freelancer;
    private User stranger;
    private Contract contract;
    private Milestone milestone;

    @BeforeEach
    void setUp() {
        Role creatorRole = Role.builder().id(1L).name(RoleEnum.CREATOR.name()).build();
        Role freelancerRole = Role.builder().id(2L).name(RoleEnum.FREELANCER.name()).build();

        creator = User.builder().id(1L).email("creator@test.com").fullName("Creator User").roles(Set.of(creatorRole)).build();
        freelancer = User.builder().id(2L).email("freelancer@test.com").fullName("Freelancer User").roles(Set.of(freelancerRole)).build();
        stranger = User.builder().id(99L).email("stranger@test.com").fullName("Stranger").roles(Set.of(freelancerRole)).build();

        contract = Contract.builder()
                .id(10L)
                .creator(creator)
                .freelancer(freelancer)
                .title("Hop dong phat trien web")
                .totalAmount(BigDecimal.valueOf(10000000))
                .build();

        milestone = Milestone.builder()
                .id(50L)
                .contract(contract)
                .orderNo(1)
                .title("Giai doan 1: Actor + ERD")
                .status(MilestoneStatus.APPROVED)
                .amount(BigDecimal.valueOf(3000000))
                .build();
    }

    private void authenticateAs(User user) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user.getEmail(), null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
        lenient().when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("Creator đánh giá thành công khi Milestone ở trạng thái APPROVED")
    void testCreateMilestoneReview_SuccessWhenApproved() {
        authenticateAs(creator);

        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));
        when(milestoneReviewRepository.existsByMilestoneIdAndReviewerId(50L, 1L)).thenReturn(false);

        when(milestoneReviewRepository.save(any(MilestoneReview.class))).thenAnswer(invocation -> {
            MilestoneReview r = invocation.getArgument(0);
            r.setId(101L);
            return r;
        });

        CreateMilestoneReviewRequest request = CreateMilestoneReviewRequest.builder()
                .rating(5)
                .comment("San pham rat tot, giao dung han")
                .build();

        MilestoneReviewResponse response = milestoneReviewService.createMilestoneReview(50L, request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals(5, response.getRating());
        assertEquals(50L, response.getMilestoneId());
        assertEquals(1L, response.getReviewerId());
        assertEquals(2L, response.getRevieweeId());
        verify(milestoneReviewRepository).save(any(MilestoneReview.class));
    }

    @Test
    @DisplayName("Bị từ chối đánh giá khi Milestone chưa hoàn thành (IN_PROGRESS)")
    void testCreateMilestoneReview_ThrowsWhenInProgress() {
        authenticateAs(creator);
        milestone.setStatus(MilestoneStatus.IN_PROGRESS);

        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));

        CreateMilestoneReviewRequest request = CreateMilestoneReviewRequest.builder()
                .rating(4)
                .comment("Chua xong nhung muon danh gia")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                milestoneReviewService.createMilestoneReview(50L, request));

        assertEquals(ErrorCode.MILESTONE_INVALID_STATE, ex.getErrorCode());
        verify(milestoneReviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Bị từ chối khi đã đánh giá milestone này rồi (tránh spam)")
    void testCreateMilestoneReview_AlreadyExists() {
        authenticateAs(creator);

        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));
        when(milestoneReviewRepository.existsByMilestoneIdAndReviewerId(50L, 1L)).thenReturn(true);

        CreateMilestoneReviewRequest request = CreateMilestoneReviewRequest.builder()
                .rating(5)
                .comment("Danh gia lan nua")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                milestoneReviewService.createMilestoneReview(50L, request));

        assertEquals(ErrorCode.REVIEW_ALREADY_EXISTS, ex.getErrorCode());
        verify(milestoneReviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Người ngoài không thuộc hợp đồng bị chặn đánh giá")
    void testCreateMilestoneReview_AccessDeniedForStranger() {
        authenticateAs(stranger);

        when(milestoneRepository.findById(50L)).thenReturn(Optional.of(milestone));

        CreateMilestoneReviewRequest request = CreateMilestoneReviewRequest.builder()
                .rating(5)
                .comment("Nguoi ngoai vao review")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                milestoneReviewService.createMilestoneReview(50L, request));

        assertEquals(ErrorCode.CONTRACT_ACCESS_DENIED, ex.getErrorCode());
        verify(milestoneReviewRepository, never()).save(any());
    }
}
