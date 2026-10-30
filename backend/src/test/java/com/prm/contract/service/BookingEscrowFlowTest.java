package com.prm.contract.service;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.*;
import com.prm.contract.dto.request.*;
import com.prm.contract.dto.response.CommissionResponse;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.dto.response.EscrowPaymentResponse;
import com.prm.contract.dto.response.MilestoneResponse;
import com.prm.contract.entity.Commission;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.repository.*;
import com.prm.contract.service.impl.CommissionServiceImpl;
import com.prm.contract.service.impl.ContractServiceImpl;
import com.prm.contract.service.impl.EscrowServiceImpl;
import com.prm.contract.service.impl.MilestoneServiceImpl;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.channel.entity.Channel;
import com.prm.channel.repository.ChannelRepository;
import com.prm.wallet.entity.Wallet;
import com.prm.wallet.entity.WalletTransaction;
import com.prm.wallet.repository.WalletRepository;
import com.prm.wallet.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingEscrowFlowTest {

    @Mock
    private ContractRepository contractRepository;
    @Mock
    private MilestoneRepository milestoneRepository;
    @Mock
    private SubmissionRepository submissionRepository;
    @Mock
    private RevisionRequestRepository revisionRequestRepository;
    @Mock
    private MilestoneDeliverableRepository deliverableRepository;
    @Mock
    private MilestoneReviewRepository milestoneReviewRepository;
    @Mock
    private DisputeRepository disputeRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private CommissionRepository commissionRepository;
    @Mock
    private ChannelRepository channelRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    private BookingEscrowProperties properties;
    private CommissionServiceImpl commissionService;
    private ContractServiceImpl contractService;
    private MilestoneServiceImpl milestoneService;
    private EscrowServiceImpl escrowService;
    private com.prm.contract.service.impl.DisputeServiceImpl disputeService;
    private com.prm.contract.service.impl.ReviewServiceImpl reviewService;

    private User creator;
    private User listener;
    private Channel creatorChannel;

    @BeforeEach
    void setUp() {
        properties = new BookingEscrowProperties();
        properties.setContractAcceptHours(48);
        properties.setFundHours(48);
        properties.setReviewDays(3);
        properties.setReleaseHoldDays(3);
        properties.setRevisionDays(2);
        properties.setMaxMilestones(20);
        properties.setMaxRevisionsDefault(2);
        properties.setPlatformFeePercent(new BigDecimal("5.0"));

        Role creatorRole = Role.builder().id(1L).name(RoleEnum.CREATOR.name()).build();
        Role viewerRole = Role.builder().id(2L).name(RoleEnum.VIEWER.name()).build();

        creator = User.builder()
                .id(10L)
                .email("creator@example.com")
                .fullName("Creator Sử Việt")
                .roles(Set.of(creatorRole))
                .build();

        listener = User.builder()
                .id(20L)
                .email("listener@example.com")
                .fullName("Listener Đặt Nội Dung")
                .roles(Set.of(viewerRole))
                .build();

        creatorChannel = Channel.builder()
                .id(5L)
                .creator(creator)
                .name("Kênh Sử Việt Toàn Thư")
                .build();

        escrowService = new EscrowServiceImpl(
                milestoneRepository,
                contractRepository,
                walletRepository,
                walletTransactionRepository,
                properties,
                commissionRepository
        );

        milestoneService = new MilestoneServiceImpl(
                milestoneRepository,
                contractRepository,
                submissionRepository,
                revisionRequestRepository,
                deliverableRepository,
                milestoneReviewRepository,
                walletRepository,
                walletTransactionRepository,
                userRepository,
                escrowService,
                properties,
                commissionRepository
        );

        contractService = new ContractServiceImpl(
                contractRepository,
                milestoneRepository,
                submissionRepository,
                revisionRequestRepository,
                userRepository,
                properties,
                commissionRepository
        );

        commissionService = new CommissionServiceImpl(
                commissionRepository,
                contractRepository,
                channelRepository,
                userRepository
        );

        disputeService = new com.prm.contract.service.impl.DisputeServiceImpl(
                disputeRepository,
                milestoneRepository,
                contractRepository,
                userRepository,
                escrowService,
                properties,
                commissionRepository
        );

        reviewService = new com.prm.contract.service.impl.ReviewServiceImpl(
                reviewRepository,
                contractRepository,
                userRepository
        );
    }

    private void authenticateAs(User user) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
        lenient().when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("Toàn bộ vòng lặp Đặt làm nội dung & Milestone chiều mới: Listener gửi yêu cầu -> Creator tạo lộ trình -> Listener chấp thuận & nạp quỹ M1 -> Creator nộp bài -> Listener yêu cầu sửa -> Listener duyệt M1 (mở M2) -> Giải ngân 95% về ví Creator")
    void testFullContractMilestoneEscrowLifecycle() {
        // --- BƯỚC 1: Creator tạo và gửi lộ trình Milestone cho Listener ---
        authenticateAs(creator);
        when(userRepository.findById(20L)).thenReturn(Optional.of(listener));
        when(contractRepository.existsByFreelancerIdAndStatusIn(eq(20L), anyList())).thenReturn(false);

        CreateContractRequest createReq = CreateContractRequest.builder()
                .requesterId(20L)
                .serviceType(ServiceType.CONTENT)
                .title("Sản xuất Series 2 tập: Chiến dịch Điện Biên Phủ")
                .description("Sản xuất trọn gói kịch bản và video 2 tập")
                .milestones(List.of(
                        MilestoneItemRequest.builder()
                                .title("Milestone 1: Tập 1 - Bối cảnh lịch sử")
                                .requirement("Giao video Tập 1 Full HD")
                                .amount(new BigDecimal("300000"))
                                .durationDays(3)
                                .maxRevisions(2)
                                .revisionDays(3)
                                .build(),
                        MilestoneItemRequest.builder()
                                .title("Milestone 2: Tập 2 - Chiến thắng Điện Biên")
                                .requirement("Giao video Tập 2 Full HD")
                                .amount(new BigDecimal("400000"))
                                .durationDays(4)
                                .maxRevisions(2)
                                .revisionDays(4)
                                .build()
                ))
                .build();

        Contract contract = Contract.builder()
                .id(100L)
                .creator(creator)
                .freelancer(listener)
                .serviceType(ServiceType.CONTENT)
                .title(createReq.getTitle())
                .description(createReq.getDescription())
                .totalAmount(new BigDecimal("700000"))
                .platformFeePercent(new BigDecimal("5.0"))
                .status(ContractStatus.PENDING)
                .acceptDueAt(Instant.now().plus(48, ChronoUnit.HOURS))
                .milestones(new ArrayList<>())
                .build();

        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract c = invocation.getArgument(0);
            if (c.getId() == null) {
                c.setId(100L);
            }
            return c;
        });

        Milestone m1 = Milestone.builder()
                .id(1L)
                .contract(contract)
                .orderNo(1)
                .title("Milestone 1: Tập 1 - Bối cảnh lịch sử")
                .requirement("Giao video Tập 1 Full HD")
                .amount(new BigDecimal("300000"))
                .durationDays(3)
                .maxRevisions(2)
                .revisionsUsed(0)
                .revisionDays(3)
                .status(MilestoneStatus.WAITING)
                .build();

        Milestone m2 = Milestone.builder()
                .id(2L)
                .contract(contract)
                .orderNo(2)
                .title("Milestone 2: Tập 2 - Chiến thắng Điện Biên")
                .requirement("Giao video Tập 2 Full HD")
                .amount(new BigDecimal("400000"))
                .durationDays(4)
                .maxRevisions(2)
                .revisionsUsed(0)
                .revisionDays(4)
                .status(MilestoneStatus.WAITING)
                .build();

        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(milestoneRepository.findByContractIdOrderByOrderNoAsc(100L)).thenReturn(List.of(m1, m2));

        ContractResponse contractRes = contractService.createAndSendContract(createReq);
        assertNotNull(contractRes);
        assertEquals(ContractStatus.PENDING, contractRes.getStatus());
        assertEquals(20L, contractRes.getRequesterId());
        assertEquals(new BigDecimal("700000"), contractRes.getTotalAmount());
        assertEquals(new BigDecimal("5.0"), contractRes.getPlatformFeePercent());
        assertEquals(new BigDecimal("35000.00"), contractRes.getPlatformFee());
        assertEquals(new BigDecimal("665000.00"), contractRes.getNetAmount());
        assertNotNull(contractRes.getTermsText());
        assertTrue(contractRes.getTermsText().contains("ĐIỀU KHOẢN TIÊU CHUẨN NỀN TẢNG"));
        assertTrue(contractRes.getTermsText().contains("5.0%"));
        assertTrue(contractRes.getTermsText().contains("Dispute Arbitration"));
        assertEquals(2, contractRes.getMilestones().size());

        // --- BƯỚC 2: Listener (Người đặt nội dung) chấp thuận toàn bộ lộ trình Milestone ---
        authenticateAs(listener);
        when(contractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(milestoneRepository.findByContractIdAndOrderNo(100L, 1)).thenReturn(Optional.of(m1));

        ContractResponse acceptedContract = contractService.acceptContract(100L);
        assertEquals(ContractStatus.ACTIVE, acceptedContract.getStatus());
        // Duy nhất Milestone 1 chuyển sang UNFUNDED, Milestone 2 vẫn WAITING
        assertEquals(MilestoneStatus.UNFUNDED, m1.getStatus());
        assertEquals(MilestoneStatus.WAITING, m2.getStatus());
        assertNotNull(m1.getFundDueAt());

        // --- BƯỚC 3: Listener Ký quỹ Milestone 1 ---
        authenticateAs(listener);
        when(milestoneRepository.findById(1L)).thenReturn(Optional.of(m1));

        Wallet listenerWallet = Wallet.builder()
                .id(2L)
                .user(listener)
                .availableBalance(new BigDecimal("1000000"))
                .currency("VND")
                .build();
        when(walletRepository.findByUserIdForUpdate(20L)).thenReturn(Optional.of(listenerWallet));

        MilestoneResponse fundedRes = milestoneService.fundMilestone(1L);
        assertEquals(MilestoneStatus.IN_PROGRESS, fundedRes.getStatus());
        assertNotNull(m1.getDueAt());
        // Số dư ví Người thuê bị trừ 300.000
        assertEquals(new BigDecimal("700000"), listenerWallet.getAvailableBalance());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));

        // --- BƯỚC 4: Creator Nộp sản phẩm Milestone 1 ---
        authenticateAs(creator);
        m1.setStatus(MilestoneStatus.IN_PROGRESS);
        when(submissionRepository.findByMilestoneIdOrderByVersionNoDesc(1L)).thenReturn(List.of());

        MilestoneResponse submitRes = milestoneService.submitDeliverable(1L,
                SubmitDeliverableRequest.builder().content("Link video bản nháp Tập 1").build());
        assertEquals(MilestoneStatus.SUBMITTED, submitRes.getStatus());
        assertNotNull(m1.getReviewDueAt());

        // --- BƯỚC 5: Listener Yêu cầu chỉnh sửa lần 1 ---
        authenticateAs(listener);
        m1.setStatus(MilestoneStatus.SUBMITTED);
        MilestoneResponse revRes = milestoneService.requestRevision(1L,
                RequestRevisionRequest.builder().note("Cần bổ sung thêm bản đồ chiến dịch").build());
        assertEquals(MilestoneStatus.IN_PROGRESS, revRes.getStatus());
        assertEquals(1, m1.getRevisionsUsed());
        assertEquals(3, revRes.getRevisionDays());
        assertNotNull(revRes.getDueAt());

        // --- BƯỚC 6: Listener Duyệt nghiệm thu Milestone 1 ---
        m1.setStatus(MilestoneStatus.SUBMITTED);
        when(milestoneRepository.findByContractIdAndOrderNo(100L, 2)).thenReturn(Optional.of(m2));

        MilestoneResponse approvedRes = milestoneService.approveMilestone(1L);
        assertEquals(MilestoneStatus.APPROVED, approvedRes.getStatus());
        assertNotNull(m1.getReleaseAt());
        // Ngay khi Milestone 1 được duyệt, Milestone 2 tự động mở khóa từ WAITING sang UNFUNDED
        assertEquals(MilestoneStatus.UNFUNDED, m2.getStatus());
        assertNotNull(m2.getFundDueAt());

        // --- BƯỚC 7: Giải ngân Escrow Milestone 1 (95% = 285k về ví Creator, 5% = 15k phí sàn) ---
        m1.setAmount(new BigDecimal("300000"));
        m1.setPlatformFee(new BigDecimal("15000.00"));
        m1.setNetAmount(new BigDecimal("285000.00"));
        m1.setEscrowStatus(EscrowStatus.HELD);
        when(milestoneRepository.findById(1L)).thenReturn(Optional.of(m1));

        Wallet creatorWallet = Wallet.builder()
                .id(1L)
                .user(creator)
                .availableBalance(BigDecimal.ZERO)
                .currency("VND")
                .build();
        when(walletRepository.findByUserIdForUpdate(10L)).thenReturn(Optional.of(creatorWallet));

        EscrowPaymentResponse releaseRes = escrowService.releaseMilestoneEscrow(1L);
        assertEquals(EscrowStatus.RELEASED, releaseRes.getStatus());
        assertEquals(MilestoneStatus.RELEASED, m1.getStatus());
        // Creator nhận 285.000 (95%)
        assertEquals(new BigDecimal("285000.00"), creatorWallet.getAvailableBalance());

        // --- BƯỚC 8: Giải ngân Escrow Milestone 2 (95% = 380k về ví Creator, 5% = 20k phí sàn) ---
        m2.setAmount(new BigDecimal("400000"));
        m2.setPlatformFee(new BigDecimal("20000.00"));
        m2.setNetAmount(new BigDecimal("380000.00"));
        m2.setEscrowStatus(EscrowStatus.HELD);
        when(milestoneRepository.findById(2L)).thenReturn(Optional.of(m2));

        EscrowPaymentResponse releaseM2Res = escrowService.releaseMilestoneEscrow(2L);
        assertEquals(EscrowStatus.RELEASED, releaseM2Res.getStatus());
        assertEquals(MilestoneStatus.RELEASED, m2.getStatus());
        assertEquals(ContractStatus.COMPLETED, contract.getStatus());
        // Creator nhận tổng cộng 285.000 + 380.000 = 665.000 (95% của 700.000)
        assertEquals(new BigDecimal("665000.00"), creatorWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("Quy tắc 1 Active Commission & Từ chối có lý do: Chặn gửi đơn thứ 2 khi đang có đơn active, mở khóa khi Creator từ chối có lý do")
    void testHireRequestOneActiveCommissionAndRejectWithReason() {
        authenticateAs(listener);
        when(channelRepository.findById(5L)).thenReturn(Optional.of(creatorChannel));

        CreateCommissionRequest req = CreateCommissionRequest.builder()
                .channelId(5L)
                .contentType(CommissionContentType.SERIES.name())
                .title("Đặt làm Series Nhà Trần")
                .description("3 tập về 3 lần kháng chiến chống Nguyên Mông")
                .build();

        // Khi đã có đơn đang PENDING -> chặn ACTIVE_COMMISSION_EXISTS
        when(commissionRepository.existsByNarratorIdAndStatusIn(eq(20L), anyList())).thenReturn(true);
        AppException activeEx = assertThrows(AppException.class, () -> commissionService.create(req));
        assertEquals(ErrorCode.ACTIVE_COMMISSION_EXISTS, activeEx.getErrorCode());

        // Khi chưa có đơn active -> tạo thành công
        when(commissionRepository.existsByNarratorIdAndStatusIn(eq(20L), anyList())).thenReturn(false);
        when(contractRepository.existsByFreelancerIdAndStatusIn(eq(20L), anyList())).thenReturn(false);

        Commission savedEntity = Commission.builder()
                .id(55L)
                .narrator(listener)
                .creator(creator)
                .channel(creatorChannel)
                .contentType("SERIES")
                .title(req.getTitle())
                .description(req.getDescription())
                .status("PENDING")
                .createdAt(Instant.now())
                .build();
        when(commissionRepository.save(any(Commission.class))).thenReturn(savedEntity);

        CommissionResponse created = commissionService.create(req);
        assertEquals("PENDING", created.getStatus());
        assertEquals("SERIES", created.getContentType());
        assertEquals(5L, created.getChannelId());

        // Creator từ chối nhưng thiếu lý do -> báo lỗi INVALID_REQUEST_DATA
        authenticateAs(creator);
        when(commissionRepository.findById(55L)).thenReturn(Optional.of(savedEntity));
        AppException blankReasonEx = assertThrows(AppException.class,
                () -> commissionService.rejectCommission(55L, new RejectCommissionRequest("   ")));
        assertEquals(ErrorCode.INVALID_REQUEST_DATA, blankReasonEx.getErrorCode());

        // Creator từ chối có lý do rõ ràng -> REJECTED + lưu rejectionReason
        CommissionResponse rejected = commissionService.rejectCommission(55L,
                new RejectCommissionRequest("Lịch sản xuất của kênh tháng này đã kín"));
        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("Lịch sản xuất của kênh tháng này đã kín", rejected.getRejectionReason());
    }

    @Test
    @DisplayName("Thương lượng lộ trình: Creator xóa 1 milestone (gộp 2 mốc cuối thành 1) & sửa thông tin milestone -> Tự động đánh lại orderNo và tính lại tổng tiền")
    void testEditAndDeleteMilestoneDuringNegotiation() {
        authenticateAs(creator);

        Commission hr = Commission.builder()
                .id(77L)
                .narrator(listener)
                .creator(creator)
                .channel(creatorChannel)
                .status("ACCEPTED")
                .build();

        Contract contract = Contract.builder()
                .id(400L)
                .hireRequest(hr)
                .creator(creator)
                .freelancer(listener)
                .title("Series 3 mốc thương lượng")
                .platformFeePercent(new BigDecimal("5.0"))
                .totalAmount(new BigDecimal("900000"))
                .platformFee(new BigDecimal("45000.00"))
                .netAmount(new BigDecimal("855000.00"))
                .status(ContractStatus.REJECTED) // Người thuê vừa reject để yêu cầu gộp mốc 2 & 3
                .build();

        Milestone m1 = Milestone.builder()
                .id(401L).contract(contract).orderNo(1).title("Mốc 1").requirement("Req 1")
                .amount(new BigDecimal("300000")).durationDays(3).status(MilestoneStatus.WAITING).build();
        Milestone m2 = Milestone.builder()
                .id(402L).contract(contract).orderNo(2).title("Mốc 2").requirement("Req 2")
                .amount(new BigDecimal("300000")).durationDays(3).status(MilestoneStatus.WAITING).build();
        Milestone m3 = Milestone.builder()
                .id(403L).contract(contract).orderNo(3).title("Mốc 3").requirement("Req 3")
                .amount(new BigDecimal("300000")).durationDays(3).status(MilestoneStatus.WAITING).build();

        when(milestoneRepository.findById(403L)).thenReturn(Optional.of(m3));
        when(milestoneRepository.findByContractIdOrderByOrderNoAsc(400L)).thenReturn(List.of(m1, m2, m3));
        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(inv -> inv.getArgument(0));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Creator xóa Mốc 3 để gộp vào Mốc 2
        ContractResponse afterDelete = milestoneService.deleteMilestone(403L);
        assertEquals(2, afterDelete.getMilestones().size());
        assertEquals(new BigDecimal("600000"), contract.getTotalAmount());
        assertEquals(ContractStatus.PENDING, contract.getStatus());
        assertEquals("CONTRACT_SENT", hr.getStatus());

        // 2. Creator cập nhật Mốc 2 (tăng thời gian lên 6 ngày và số tiền lên 550.000 sau khi gộp)
        when(milestoneRepository.findById(402L)).thenReturn(Optional.of(m2));
        when(milestoneRepository.findByContractIdOrderByOrderNoAsc(400L)).thenReturn(List.of(m1, m2));

        MilestoneItemRequest updateM2Req = MilestoneItemRequest.builder()
                .title("Mốc 2 & 3 gộp: Hoàn thiện toàn bộ phần còn lại")
                .requirement("Giao trọn bộ Tập 2 & 3")
                .amount(new BigDecimal("550000"))
                .durationDays(6)
                .build();

        MilestoneResponse updatedM2 = milestoneService.updateMilestone(402L, updateM2Req);
        assertEquals("Mốc 2 & 3 gộp: Hoàn thiện toàn bộ phần còn lại", updatedM2.getTitle());
        assertEquals(6, updatedM2.getDurationDays());
        assertEquals(new BigDecimal("850000"), contract.getTotalAmount());
        assertEquals(new BigDecimal("42500.00"), contract.getPlatformFee());
        assertEquals(new BigDecimal("807500.00"), contract.getNetAmount());

        // 3. Nếu chỉ còn 1 milestone duy nhất mà cố xóa tiếp -> chặn MILESTONE_MINIMUM_REQUIRED
        when(milestoneRepository.findById(401L)).thenReturn(Optional.of(m1));
        when(milestoneRepository.findByContractIdOrderByOrderNoAsc(400L)).thenReturn(List.of(m1));
        AppException minEx = assertThrows(AppException.class, () -> milestoneService.deleteMilestone(401L));
        assertEquals(ErrorCode.MILESTONE_MINIMUM_REQUIRED, minEx.getErrorCode());
    }

    @Test
    @DisplayName("Kịch bản Tranh chấp (Dispute): Mở report -> Escrow FROZEN -> Admin phân xử SPLIT 60% về Creator / 40% hoàn về Người thuê")
    void testDisputeSplitScenario() {
        Role adminRole = Role.builder().id(3L).name(RoleEnum.ADMIN.name()).build();
        User admin = User.builder().id(99L).email("admin@example.com").fullName("System Admin").roles(Set.of(adminRole)).build();

        Contract contract = Contract.builder()
                .id(200L)
                .creator(creator)
                .freelancer(listener)
                .title("Hợp đồng tranh chấp")
                .platformFeePercent(new BigDecimal("5.0"))
                .status(ContractStatus.ACTIVE)
                .build();
        Milestone milestone = Milestone.builder()
                .id(10L)
                .contract(contract)
                .orderNo(1)
                .title("Milestone 1")
                .amount(new BigDecimal("1000000"))
                .platformFee(new BigDecimal("50000.00"))
                .netAmount(new BigDecimal("950000.00"))
                .status(MilestoneStatus.SUBMITTED)
                .escrowStatus(EscrowStatus.HELD)
                .build();

        when(milestoneRepository.findById(10L)).thenReturn(Optional.of(milestone));
        when(disputeRepository.existsByMilestoneIdAndStatus(10L, DisputeStatus.OPEN)).thenReturn(false);

        // 1. Listener mở Dispute
        authenticateAs(listener);
        OpenDisputeRequest openReq = OpenDisputeRequest.builder()
                .milestoneId(10L)
                .reason("Chất lượng sản phẩm không đúng mô tả")
                .build();

        com.prm.contract.entity.Dispute savedDispute = com.prm.contract.entity.Dispute.builder()
                .id(50L)
                .contract(contract)
                .milestone(milestone)
                .raisedByUser(listener)
                .reason(openReq.getReason())
                .status(DisputeStatus.OPEN)
                .build();
        when(disputeRepository.save(any(com.prm.contract.entity.Dispute.class))).thenReturn(savedDispute);

        com.prm.contract.dto.response.DisputeResponse disputeRes = disputeService.openDispute(openReq);
        assertEquals(DisputeStatus.OPEN, disputeRes.getStatus());
        assertEquals(EscrowStatus.FROZEN, milestone.getEscrowStatus());
        assertEquals(MilestoneStatus.DISPUTED, milestone.getStatus());

        // 2. Admin phân xử SPLIT: Creator hưởng 60% (trừ phí sàn 5% = 570k), Người thuê nhận hoàn 40% (400k)
        authenticateAs(admin);
        when(disputeRepository.findById(50L)).thenReturn(Optional.of(savedDispute));

        Wallet creatorWallet = Wallet.builder().id(1L).user(creator).availableBalance(BigDecimal.ZERO).currency("VND").build();
        Wallet listenerWallet = Wallet.builder().id(2L).user(listener).availableBalance(BigDecimal.ZERO).currency("VND").build();
        when(walletRepository.findByUserIdForUpdate(10L)).thenReturn(Optional.of(creatorWallet));
        when(walletRepository.findByUserIdForUpdate(20L)).thenReturn(Optional.of(listenerWallet));

        ResolveDisputeRequest resolveReq = ResolveDisputeRequest.builder()
                .result(DisputeResult.SPLIT)
                .splitPercent(new BigDecimal("60.0"))
                .resolution("Chia tỉ lệ 60% Creator / 40% Người thuê sau khi đối chiếu bằng chứng")
                .build();

        com.prm.contract.dto.response.DisputeResponse resolved = disputeService.resolveDispute(50L, resolveReq);
        assertEquals(DisputeStatus.RESOLVED, resolved.getStatus());
        assertEquals(DisputeResult.SPLIT, resolved.getResult());

        // Người thuê nhận hoàn 40% (400.000)
        assertEquals(new BigDecimal("400000.00"), listenerWallet.getAvailableBalance());
        // Creator nhận 60% (600.000) trừ 5% phí sàn (30.000) = 570.000
        assertEquals(new BigDecimal("570000.00"), creatorWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("Người thuê hủy milestone khi Creator trễ hạn -> Hoàn 100% tiền ký quỹ về ví Người thuê")
    void testCancelOverdueMilestone() {
        authenticateAs(listener);

        Commission hr = Commission.builder().id(88L).status("CONTRACT_SENT").build();
        Contract contract = Contract.builder()
                .id(300L)
                .hireRequest(hr)
                .creator(creator)
                .freelancer(listener)
                .status(ContractStatus.ACTIVE)
                .build();
        Milestone milestone = Milestone.builder()
                .id(30L)
                .contract(contract)
                .orderNo(1)
                .amount(new BigDecimal("500000"))
                .status(MilestoneStatus.IN_PROGRESS)
                .escrowStatus(EscrowStatus.HELD)
                .dueAt(Instant.now().minus(2, ChronoUnit.DAYS)) // Quá hạn 2 ngày
                .build();

        when(milestoneRepository.findById(30L)).thenReturn(Optional.of(milestone));

        Wallet listenerWallet = Wallet.builder().id(2L).user(listener).availableBalance(new BigDecimal("200000")).currency("VND").build();
        when(walletRepository.findByUserIdForUpdate(20L)).thenReturn(Optional.of(listenerWallet));

        MilestoneResponse res = milestoneService.cancelOverdueMilestone(30L);
        assertEquals(MilestoneStatus.CANCELLED, milestone.getStatus());
        assertEquals(ContractStatus.CANCELLED, contract.getStatus());
        assertEquals("CANCELLED", hr.getStatus());
        // Toàn bộ 500k được hoàn trả 100% về ví Người thuê (200k + 500k = 700k)
        assertEquals(new BigDecimal("700000"), listenerWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("Hợp đồng có mốc cuối nhỏ hơn tổng phí sàn vẫn tạo thành công và khấu trừ phí từng mốc chuẩn xác")
    void testContractWithSmallLastMilestonePerMilestoneFee() {
        authenticateAs(creator);
        when(userRepository.findById(20L)).thenReturn(Optional.of(listener));
        when(contractRepository.existsByFreelancerIdAndStatusIn(eq(20L), anyList())).thenReturn(false);

        CreateContractRequest createReq = CreateContractRequest.builder()
                .requesterId(20L)
                .serviceType(ServiceType.CONTENT)
                .title("Hợp đồng 3 mốc kiểm tra phí sàn độc lập")
                .description("Mốc 3 giá trị nhỏ")
                .milestones(List.of(
                        MilestoneItemRequest.builder()
                                .title("M1")
                                .requirement("Req 1")
                                .amount(new BigDecimal("300000"))
                                .durationDays(3)
                                .build(),
                        MilestoneItemRequest.builder()
                                .title("M2")
                                .requirement("Req 2")
                                .amount(new BigDecimal("300000"))
                                .durationDays(3)
                                .build(),
                        MilestoneItemRequest.builder()
                                .title("M3")
                                .requirement("Req 3 nhỏ")
                                .amount(new BigDecimal("10000"))
                                .durationDays(1)
                                .build()
                ))
                .build();

        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Milestone> savedMilestones = new ArrayList<>();
        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(invocation -> {
            Milestone m = invocation.getArgument(0);
            savedMilestones.add(m);
            return m;
        });

        ContractResponse res = contractService.createAndSendContract(createReq);
        assertNotNull(res);
        assertEquals(new BigDecimal("610000"), res.getTotalAmount());
        assertEquals(new BigDecimal("30500.00"), res.getPlatformFee());
        assertEquals(new BigDecimal("579500.00"), res.getNetAmount());

        assertEquals(3, savedMilestones.size());
        assertEquals(new BigDecimal("15000.00"), savedMilestones.get(0).getPlatformFee());
        assertEquals(new BigDecimal("285000.00"), savedMilestones.get(0).getNetAmount());
        assertEquals(new BigDecimal("15000.00"), savedMilestones.get(1).getPlatformFee());
        assertEquals(new BigDecimal("285000.00"), savedMilestones.get(1).getNetAmount());
        assertEquals(new BigDecimal("500.00"), savedMilestones.get(2).getPlatformFee());
        assertEquals(new BigDecimal("9500.00"), savedMilestones.get(2).getNetAmount());
    }
}
