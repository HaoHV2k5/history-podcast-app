package com.prm.contract.service;

import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.dto.request.CreateContractRequest;
import com.prm.contract.dto.request.MilestoneItemRequest;
import com.prm.contract.dto.request.RequestRevisionRequest;
import com.prm.contract.dto.request.SubmitDeliverableRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.dto.response.EscrowPaymentResponse;
import com.prm.contract.dto.response.MilestoneResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.repository.*;
import com.prm.contract.service.impl.ContractServiceImpl;
import com.prm.contract.service.impl.EscrowServiceImpl;
import com.prm.contract.service.impl.MilestoneServiceImpl;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
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
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    private BookingEscrowProperties properties;
    private ContractServiceImpl contractService;
    private MilestoneServiceImpl milestoneService;
    private EscrowServiceImpl escrowService;
    private com.prm.contract.service.impl.DisputeServiceImpl disputeService;
    private com.prm.contract.service.impl.ReviewServiceImpl reviewService;

    private User creator;
    private User freelancer;

    @BeforeEach
    void setUp() {
        properties = new BookingEscrowProperties();
        properties.setContractAcceptHours(48);
        properties.setFundHours(48);
        properties.setReviewDays(3);
        properties.setReleaseHoldDays(3);
        properties.setRevisionDays(2);
        properties.setMaxMilestones(5);
        properties.setMaxRevisionsDefault(2);
        properties.setPlatformFeePercent(new BigDecimal("5.0"));

        Role creatorRole = Role.builder().id(1L).name(RoleEnum.CREATOR.name()).build();
        Role freelancerRole = Role.builder().id(2L).name(RoleEnum.FREELANCER.name()).build();

        creator = User.builder()
                .id(10L)
                .email("creator@example.com")
                .fullName("Creator User")
                .roles(Set.of(creatorRole))
                .build();

        freelancer = User.builder()
                .id(20L)
                .email("freelancer@example.com")
                .fullName("Freelancer User")
                .roles(Set.of(freelancerRole))
                .build();

        escrowService = new EscrowServiceImpl(
                milestoneRepository,
                contractRepository,
                walletRepository,
                walletTransactionRepository,
                properties
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
                properties
        );

        contractService = new ContractServiceImpl(
                contractRepository,
                milestoneRepository,
                submissionRepository,
                revisionRequestRepository,
                postRepository,
                userRepository,
                properties
        );

        disputeService = new com.prm.contract.service.impl.DisputeServiceImpl(
                disputeRepository,
                milestoneRepository,
                contractRepository,
                userRepository,
                escrowService,
                properties
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
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("Toàn bộ vòng lặp Hợp đồng & Milestone: Tạo -> Chấp thuận -> Ký quỹ -> Nộp -> Sửa -> Duyệt -> Giải ngân ví")
    void testFullContractMilestoneEscrowLifecycle() {
        // --- BƯỚC 1: Creator tạo và gửi hợp đồng ---
        authenticateAs(creator);
        when(userRepository.findById(20L)).thenReturn(Optional.of(freelancer));

        CreateContractRequest createReq = CreateContractRequest.builder()
                .freelancerId(20L)
                .serviceType(ServiceType.CONTENT)
                .title("Viết kịch bản Podcast Lịch sử tập 1 & 2")
                .description("Hợp đồng viết 2 kịch bản chi tiết")
                .milestones(List.of(
                        MilestoneItemRequest.builder()
                                .title("Milestone 1: Kịch bản tập 1")
                                .requirement("Giao bản thảo 3000 từ")
                                .amount(new BigDecimal("300000"))
                                .durationDays(3)
                                .maxRevisions(2)
                                .build(),
                        MilestoneItemRequest.builder()
                                .title("Milestone 2: Kịch bản tập 2")
                                .requirement("Giao bản thảo 3000 từ")
                                .amount(new BigDecimal("400000"))
                                .durationDays(4)
                                .maxRevisions(2)
                                .build()
                ))
                .build();

        Contract contract = Contract.builder()
                .id(100L)
                .creator(creator)
                .freelancer(freelancer)
                .serviceType(ServiceType.CONTENT)
                .title(createReq.getTitle())
                .description(createReq.getDescription())
                .totalAmount(new BigDecimal("700000"))
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
                .title("Milestone 1: Kịch bản tập 1")
                .requirement("Giao bản thảo 3000 từ")
                .amount(new BigDecimal("300000"))
                .durationDays(3)
                .maxRevisions(2)
                .revisionsUsed(0)
                .status(MilestoneStatus.WAITING)
                .build();

        Milestone m2 = Milestone.builder()
                .id(2L)
                .contract(contract)
                .orderNo(2)
                .title("Milestone 2: Kịch bản tập 2")
                .requirement("Giao bản thảo 3000 từ")
                .amount(new BigDecimal("400000"))
                .durationDays(4)
                .maxRevisions(2)
                .revisionsUsed(0)
                .status(MilestoneStatus.WAITING)
                .build();

        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(milestoneRepository.findByContractIdOrderByOrderNoAsc(100L)).thenReturn(List.of(m1, m2));

        ContractResponse contractRes = contractService.createAndSendContract(createReq);
        assertNotNull(contractRes);
        assertEquals(ContractStatus.PENDING, contractRes.getStatus());
        assertEquals(new BigDecimal("700000"), contractRes.getTotalAmount());
        assertEquals(new BigDecimal("5.0"), contractRes.getPlatformFeePercent());
        assertEquals(new BigDecimal("35000.00"), contractRes.getPlatformFee());
        assertEquals(new BigDecimal("665000.00"), contractRes.getNetAmount());
        assertNotNull(contractRes.getTermsText());
        assertTrue(contractRes.getTermsText().contains("ĐIỀU KHOẢN TIÊU CHUẨN NỀN TẢNG"));
        assertTrue(contractRes.getTermsText().contains("5.0%"));
        assertTrue(contractRes.getTermsText().contains("Dispute Arbitration"));
        assertEquals(2, contractRes.getMilestones().size());

        // --- BƯỚC 2: Freelancer chấp nhận hợp đồng ---
        authenticateAs(freelancer);
        when(contractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(milestoneRepository.findByContractIdAndOrderNo(100L, 1)).thenReturn(Optional.of(m1));

        ContractResponse acceptedContract = contractService.acceptContract(100L);
        assertEquals(ContractStatus.ACTIVE, acceptedContract.getStatus());
        // Milestone 1 phải chuyển sang UNFUNDED
        assertEquals(MilestoneStatus.UNFUNDED, m1.getStatus());
        assertNotNull(m1.getFundDueAt());

        // --- BƯỚC 3: Creator Ký quỹ Milestone 1 ---
        authenticateAs(creator);
        when(milestoneRepository.findById(1L)).thenReturn(Optional.of(m1));

        Wallet creatorWallet = Wallet.builder()
                .id(1L)
                .user(creator)
                .availableBalance(new BigDecimal("1000000"))
                .currency("VND")
                .build();
        when(walletRepository.findByUserIdForUpdate(10L)).thenReturn(Optional.of(creatorWallet));

        MilestoneResponse fundedRes = milestoneService.fundMilestone(1L);
        assertEquals(MilestoneStatus.IN_PROGRESS, fundedRes.getStatus());
        assertNotNull(m1.getDueAt());
        // Số dư ví Creator bị trừ 300.000
        assertEquals(new BigDecimal("700000"), creatorWallet.getAvailableBalance());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));

        // --- BƯỚC 4: Freelancer Nộp bài Milestone 1 ---
        authenticateAs(freelancer);
        m1.setStatus(MilestoneStatus.IN_PROGRESS);
        when(submissionRepository.findByMilestoneIdOrderByVersionNoDesc(1L)).thenReturn(List.of());

        MilestoneResponse submitRes = milestoneService.submitDeliverable(1L,
                SubmitDeliverableRequest.builder().content("Link Google Docs bản thảo").build());
        assertEquals(MilestoneStatus.SUBMITTED, submitRes.getStatus());
        assertNotNull(m1.getReviewDueAt());

        // --- BƯỚC 5: Creator Yêu cầu chỉnh sửa lần 1 ---
        authenticateAs(creator);
        m1.setStatus(MilestoneStatus.SUBMITTED);
        MilestoneResponse revRes = milestoneService.requestRevision(1L,
                RequestRevisionRequest.builder().note("Cần bổ sung thêm thông tin về triều đại").build());
        assertEquals(MilestoneStatus.IN_PROGRESS, revRes.getStatus());
        assertEquals(1, m1.getRevisionsUsed());

        // --- BƯỚC 6: Creator Duyệt Milestone 1 ---
        m1.setStatus(MilestoneStatus.SUBMITTED);
        when(milestoneRepository.findByContractIdAndOrderNo(100L, 2)).thenReturn(Optional.of(m2));

        MilestoneResponse approvedRes = milestoneService.approveMilestone(1L);
        assertEquals(MilestoneStatus.APPROVED, approvedRes.getStatus());
        assertNotNull(m1.getReleaseAt());
        // Milestone 2 tự động chuyển sang UNFUNDED
        assertEquals(MilestoneStatus.UNFUNDED, m2.getStatus());
        assertNotNull(m2.getFundDueAt());

        // --- BƯỚC 7: Giải ngân Escrow Milestone 1 (Mỗi milestone tự khấu trừ 5% phí sàn: 300k - 15k = 285k) ---
        m1.setAmount(new BigDecimal("300000"));
        m1.setPlatformFee(new BigDecimal("15000.00")); // 5% của 300.000 = 15.000
        m1.setNetAmount(new BigDecimal("285000.00")); // 300.000 - 15.000 = 285.000
        m1.setEscrowStatus(EscrowStatus.HELD);
        when(milestoneRepository.findById(1L)).thenReturn(Optional.of(m1));

        Wallet freelancerWallet = Wallet.builder()
                .id(2L)
                .user(freelancer)
                .availableBalance(BigDecimal.ZERO)
                .currency("VND")
                .build();
        when(walletRepository.findByUserIdForUpdate(20L)).thenReturn(Optional.of(freelancerWallet));

        EscrowPaymentResponse releaseRes = escrowService.releaseMilestoneEscrow(1L);
        assertEquals(EscrowStatus.RELEASED, releaseRes.getStatus());
        assertEquals(MilestoneStatus.RELEASED, m1.getStatus());
        // Freelancer nhận 285.000 (đã trừ 15.000 phí sàn của Milestone 1)
        assertEquals(new BigDecimal("285000.00"), freelancerWallet.getAvailableBalance());

        // --- BƯỚC 8: Giải ngân Escrow Milestone 2 (Mỗi milestone tự khấu trừ 5% phí sàn: 400k - 20k = 380k) ---
        m2.setAmount(new BigDecimal("400000"));
        m2.setPlatformFee(new BigDecimal("20000.00")); // 5% của 400.000 = 20.000
        m2.setNetAmount(new BigDecimal("380000.00")); // 400.000 - 20.000 = 380.000
        m2.setEscrowStatus(EscrowStatus.HELD);
        when(milestoneRepository.findById(2L)).thenReturn(Optional.of(m2));

        EscrowPaymentResponse releaseM2Res = escrowService.releaseMilestoneEscrow(2L);
        assertEquals(EscrowStatus.RELEASED, releaseM2Res.getStatus());
        assertEquals(MilestoneStatus.RELEASED, m2.getStatus());
        // Freelancer nhận thêm 380.000 -> Tổng nhận cả hợp đồng là 285.000 + 380.000 = 665.000 (đúng netAmount của hợp đồng)
        assertEquals(new BigDecimal("665000.00"), freelancerWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("Kịch bản Tranh chấp (Dispute): Mở report -> Escrow FROZEN -> Admin phân xử SPLIT 60/40")
    void testDisputeSplitScenario() {
        Role adminRole = Role.builder().id(3L).name(RoleEnum.ADMIN.name()).build();
        User admin = User.builder().id(99L).email("admin@example.com").fullName("System Admin").roles(Set.of(adminRole)).build();

        Contract contract = Contract.builder().id(200L).creator(creator).freelancer(freelancer).title("Hợp đồng tranh chấp").status(ContractStatus.ACTIVE).build();
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
        when(disputeRepository.existsByMilestoneIdAndStatus(10L, com.prm.contract.constant.DisputeStatus.OPEN)).thenReturn(false);

        // 1. Creator mở Dispute
        authenticateAs(creator);
        com.prm.contract.dto.request.OpenDisputeRequest openReq = com.prm.contract.dto.request.OpenDisputeRequest.builder()
                .milestoneId(10L)
                .reason("Chất lượng sản phẩm không đúng mô tả")
                .build();

        com.prm.contract.entity.Dispute savedDispute = com.prm.contract.entity.Dispute.builder()
                .id(50L)
                .contract(contract)
                .milestone(milestone)
                .raisedByUser(creator)
                .reason(openReq.getReason())
                .status(com.prm.contract.constant.DisputeStatus.OPEN)
                .build();
        when(disputeRepository.save(any(com.prm.contract.entity.Dispute.class))).thenReturn(savedDispute);

        com.prm.contract.dto.response.DisputeResponse disputeRes = disputeService.openDispute(openReq);
        assertEquals(com.prm.contract.constant.DisputeStatus.OPEN, disputeRes.getStatus());
        // Tiền ký quỹ bị FROZEN và Milestone chuyển sang DISPUTED
        assertEquals(EscrowStatus.FROZEN, milestone.getEscrowStatus());
        assertEquals(MilestoneStatus.DISPUTED, milestone.getStatus());

        // 2. Admin phân xử SPLIT: Freelancer 60%, Creator 40%
        authenticateAs(admin);
        when(disputeRepository.findById(50L)).thenReturn(Optional.of(savedDispute));

        Wallet creatorWallet = Wallet.builder().id(1L).user(creator).availableBalance(BigDecimal.ZERO).currency("VND").build();
        Wallet freelancerWallet = Wallet.builder().id(2L).user(freelancer).availableBalance(BigDecimal.ZERO).currency("VND").build();
        when(walletRepository.findByUserIdForUpdate(10L)).thenReturn(Optional.of(creatorWallet));
        when(walletRepository.findByUserIdForUpdate(20L)).thenReturn(Optional.of(freelancerWallet));

        com.prm.contract.dto.request.ResolveDisputeRequest resolveReq = com.prm.contract.dto.request.ResolveDisputeRequest.builder()
                .result(com.prm.contract.constant.DisputeResult.SPLIT)
                .splitPercent(new BigDecimal("60.0"))
                .resolution("Chia tỉ lệ 60/40 sau khi đối chiếu bằng chứng hai bên")
                .build();

        com.prm.contract.dto.response.DisputeResponse resolved = disputeService.resolveDispute(50L, resolveReq);
        assertEquals(com.prm.contract.constant.DisputeStatus.RESOLVED, resolved.getStatus());
        assertEquals(com.prm.contract.constant.DisputeResult.SPLIT, resolved.getResult());

        // Creator nhận lại 40% (400.000)
        assertEquals(new BigDecimal("400000.00"), creatorWallet.getAvailableBalance());
        // Freelancer nhận 60% (600.000) trừ 5% phí sàn (30.000) = 570.000
        assertEquals(new BigDecimal("570000.00"), freelancerWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("Creator hủy milestone khi Freelancer trễ hạn -> Hoàn 100% tiền ký quỹ về ví Creator")
    void testCancelOverdueMilestone() {
        authenticateAs(creator);

        Contract contract = Contract.builder().id(300L).creator(creator).freelancer(freelancer).status(ContractStatus.ACTIVE).build();
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

        Wallet creatorWallet = Wallet.builder().id(1L).user(creator).availableBalance(new BigDecimal("200000")).currency("VND").build();
        when(walletRepository.findByUserIdForUpdate(10L)).thenReturn(Optional.of(creatorWallet));

        MilestoneResponse res = milestoneService.cancelOverdueMilestone(30L);
        // Milestone CANCELLED, Contract CANCELLED
        assertEquals(MilestoneStatus.CANCELLED, milestone.getStatus());
        assertEquals(ContractStatus.CANCELLED, contract.getStatus());
        // Toàn bộ 500k được hoàn trả lại ví Creator (200k + 500k = 700k)
        assertEquals(new BigDecimal("700000"), creatorWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("Hợp đồng có mốc cuối nhỏ hơn tổng phí sàn vẫn tạo thành công và khấu trừ phí từng mốc chuẩn xác")
    void testContractWithSmallLastMilestonePerMilestoneFee() {
        authenticateAs(creator);
        when(userRepository.findById(20L)).thenReturn(Optional.of(freelancer));

        CreateContractRequest createReq = CreateContractRequest.builder()
                .freelancerId(20L)
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
                                .amount(new BigDecimal("10000")) // Nhỏ hơn nhiều so với tổng phí sàn 30.500
                                .durationDays(1)
                                .build()
                ))
                .build();

        Contract savedContract = Contract.builder()
                .id(500L)
                .creator(creator)
                .freelancer(freelancer)
                .title(createReq.getTitle())
                .totalAmount(new BigDecimal("610000"))
                .platformFee(new BigDecimal("30500.00"))
                .netAmount(new BigDecimal("579500.00"))
                .status(ContractStatus.PENDING)
                .milestones(new ArrayList<>())
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
        // M1: 300k, fee 15k, net 285k
        assertEquals(new BigDecimal("15000.00"), savedMilestones.get(0).getPlatformFee());
        assertEquals(new BigDecimal("285000.00"), savedMilestones.get(0).getNetAmount());
        // M2: 300k, fee 15k, net 285k
        assertEquals(new BigDecimal("15000.00"), savedMilestones.get(1).getPlatformFee());
        assertEquals(new BigDecimal("285000.00"), savedMilestones.get(1).getNetAmount());
        // M3: 10k, fee 500, net 9.500
        assertEquals(new BigDecimal("500.00"), savedMilestones.get(2).getPlatformFee());
        assertEquals(new BigDecimal("9500.00"), savedMilestones.get(2).getNetAmount());
    }
}

