package com.prm.contract.service;

import com.prm.channel.entity.Channel;
import com.prm.channel.repository.ChannelRepository;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.membership.dto.response.MembershipSubscribeResponse;
import com.prm.membership.entity.ChannelMembershipPlan;
import com.prm.membership.entity.Membership;
import com.prm.membership.entity.MembershipPayment;
import com.prm.membership.repository.ChannelMembershipPlanRepository;
import com.prm.membership.repository.MembershipPaymentRepository;
import com.prm.membership.repository.MembershipRepository;
import com.prm.membership.service.impl.MembershipServiceImpl;
import com.prm.wallet.dto.request.WithdrawalRequest;
import com.prm.wallet.dto.response.WithdrawalResponse;
import com.prm.wallet.entity.BankAccount;
import com.prm.wallet.entity.Wallet;
import com.prm.wallet.entity.Withdrawal;
import com.prm.wallet.repository.BankAccountRepository;
import com.prm.wallet.repository.WalletRepository;
import com.prm.wallet.repository.WalletTransactionRepository;
import com.prm.wallet.repository.WithdrawalRepository;
import com.prm.wallet.service.impl.WithdrawalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformPolicyFinancialFlowTest {

    @Mock
    private ChannelMembershipPlanRepository planRepository;
    @Mock
    private MembershipRepository membershipRepository;
    @Mock
    private MembershipPaymentRepository membershipPaymentRepository;
    @Mock
    private ChannelRepository channelRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletTransactionRepository walletTransactionRepository;
    @Mock
    private WithdrawalRepository withdrawalRepository;
    @Mock
    private BankAccountRepository bankAccountRepository;

    private BookingEscrowProperties policyProperties;
    private MembershipServiceImpl membershipService;
    private WithdrawalServiceImpl withdrawalService;

    private User creator;
    private User viewer;
    private Channel channel;

    @BeforeEach
    void setUp() {
        policyProperties = new BookingEscrowProperties();
        policyProperties.setMembershipFeePercent(new BigDecimal("10.0"));
        policyProperties.setMembershipDurationDays(30);
        policyProperties.setWithdrawalSlaDays(2);
        policyProperties.setWithdrawalMinAmount(new BigDecimal("50000"));
        policyProperties.setDepositMinAmount(new BigDecimal("10000"));

        creator = User.builder().id(10L).email("creator@test.com").fullName("Creator Sử Việt").build();
        viewer = User.builder().id(20L).email("viewer@test.com").fullName("Viewer Hội Viên").build();
        channel = Channel.builder().id(5L).creator(creator).name("Sử Việt Toàn Thư").build();

        membershipService = new MembershipServiceImpl(
                planRepository,
                membershipRepository,
                membershipPaymentRepository,
                channelRepository,
                userRepository,
                walletRepository,
                walletTransactionRepository,
                policyProperties
        );

        withdrawalService = new WithdrawalServiceImpl(
                withdrawalRepository,
                walletRepository,
                bankAccountRepository,
                userRepository,
                walletTransactionRepository,
                policyProperties
        );
    }

    private void authenticateAs(User user) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
        lenient().when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("Chính sách Gói Hội Viên Kênh: Phí sàn 10%, Creator thực nhận 90% ngay vào ví khả dụng, thời hạn 30 ngày")
    void testMembershipSubscribe_Uses10PercentPlatformFeeAnd90PercentCreatorEarning() {
        authenticateAs(viewer);

        ChannelMembershipPlan plan = ChannelMembershipPlan.builder()
                .id(1L)
                .channel(channel)
                .name("Hội Viên Sử Việt VIP")
                .monthlyPrice(new BigDecimal("100000"))
                .status("ACTIVE")
                .build();

        Wallet viewerWallet = Wallet.builder().id(101L).user(viewer).availableBalance(new BigDecimal("250000")).pendingBalance(BigDecimal.ZERO).build();
        Wallet creatorWallet = Wallet.builder().id(102L).user(creator).availableBalance(new BigDecimal("50000")).pendingBalance(BigDecimal.ZERO).build();

        when(channelRepository.findById(5L)).thenReturn(Optional.of(channel));
        when(planRepository.findByChannelIdAndStatus(5L, "ACTIVE")).thenReturn(Optional.of(plan));
        when(walletRepository.findByUserId(20L)).thenReturn(Optional.of(viewerWallet));
        when(walletRepository.findByUserId(10L)).thenReturn(Optional.of(creatorWallet));
        when(walletRepository.findById(101L)).thenReturn(Optional.of(viewerWallet));
        when(walletRepository.findById(102L)).thenReturn(Optional.of(creatorWallet));
        when(membershipRepository.findByViewerIdAndChannelId(20L, 5L)).thenReturn(Optional.empty());
        when(membershipRepository.save(any(Membership.class))).thenAnswer(inv -> {
            Membership m = inv.getArgument(0);
            m.setId(500L);
            return m;
        });

        MembershipSubscribeResponse res = membershipService.subscribe(5L);

        assertNotNull(res);
        assertEquals(new BigDecimal("100000"), res.getAmountPaid());
        assertEquals(30L, ChronoUnit.DAYS.between(res.getStartedAt(), res.getEndedAt()));

        // Ví Viewer bị trừ 100.000 (250k -> 150k)
        assertEquals(new BigDecimal("150000"), viewerWallet.getAvailableBalance());
        // Ví Creator được cộng 90% = 90.000 (50k -> 140k)
        assertEquals(new BigDecimal("140000"), creatorWallet.getAvailableBalance());

        ArgumentCaptor<MembershipPayment> paymentCaptor = ArgumentCaptor.forClass(MembershipPayment.class);
        verify(membershipPaymentRepository).save(paymentCaptor.capture());
        MembershipPayment savedPayment = paymentCaptor.getValue();
        assertEquals(new BigDecimal("10000"), savedPayment.getCommissionAmount());
        assertEquals(new BigDecimal("90000"), savedPayment.getCreatorEarning());
    }

    @Test
    @DisplayName("Chính sách Rút tiền Ví: Chặn rút dưới 50.000 VNĐ và trả về hạn cam kết SLA 2 ngày (48h) trên đơn rút tiền")
    void testWithdrawalSlaAndMinAmountPolicy() {
        authenticateAs(creator);

        // 1. Rút dưới 50.000 VNĐ -> báo lỗi INVALID_REQUEST_DATA
        WithdrawalRequest invalidReq = WithdrawalRequest.builder()
                .amount(new BigDecimal("30000"))
                .bankAccountId(1L)
                .build();
        AppException minEx = assertThrows(AppException.class, () -> withdrawalService.requestWithdrawal(invalidReq));
        assertEquals(ErrorCode.INVALID_REQUEST_DATA, minEx.getErrorCode());

        // 2. Rút hợp lệ 200.000 VNĐ -> trả về slaDueAt = requestedAt + 2 ngày
        BankAccount bankAccount = BankAccount.builder()
                .id(1L)
                .user(creator)
                .bankName("Vietcombank")
                .accountNumber("0123456789")
                .accountHolderName("NGUYEN VAN CREATOR")
                .verified(true)
                .build();
        Wallet creatorWallet = Wallet.builder()
                .id(102L)
                .user(creator)
                .availableBalance(new BigDecimal("500000"))
                .pendingBalance(BigDecimal.ZERO)
                .build();

        when(bankAccountRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(bankAccount));
        when(walletRepository.findByUserIdForUpdate(10L)).thenReturn(Optional.of(creatorWallet));
        when(withdrawalRepository.existsByWalletIdAndStatusIn(eq(102L), anyList())).thenReturn(false);
        when(withdrawalRepository.save(any(Withdrawal.class))).thenAnswer(inv -> {
            Withdrawal w = inv.getArgument(0);
            w.setId(900L);
            return w;
        });

        WithdrawalRequest validReq = WithdrawalRequest.builder()
                .amount(new BigDecimal("200000"))
                .bankAccountId(1L)
                .build();

        WithdrawalResponse res = withdrawalService.requestWithdrawal(validReq);
        assertNotNull(res);
        assertEquals(900L, res.getId());
        assertEquals(new BigDecimal("200000"), res.getAmount());
        assertEquals(new BigDecimal("300000"), creatorWallet.getAvailableBalance());
        assertEquals(new BigDecimal("200000"), creatorWallet.getPendingBalance());
        assertNotNull(res.getRequestedAt());
        assertNotNull(res.getSlaDueAt());
        assertEquals(48L, ChronoUnit.HOURS.between(res.getRequestedAt(), res.getSlaDueAt()));
        assertTrue(res.getSlaPolicyNote().contains("2 ngày"));
    }
}
