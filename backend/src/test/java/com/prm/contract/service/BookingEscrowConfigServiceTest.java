package com.prm.contract.service;

import com.prm.common.entity.SystemConfig;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.repository.SystemConfigRepository;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.dto.request.BookingEscrowConfigRequest;
import com.prm.contract.dto.response.BookingEscrowConfigResponse;
import com.prm.contract.entity.BookingEscrowConfig;
import com.prm.contract.repository.BookingEscrowConfigRepository;
import com.prm.contract.service.impl.BookingEscrowConfigServiceImpl;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingEscrowConfigServiceTest {

    @Mock
    private BookingEscrowConfigRepository configRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SystemConfigRepository systemConfigRepository;

    private BookingEscrowProperties properties;
    private BookingEscrowConfigServiceImpl service;

    private User admin;
    private User normalUser;

    @BeforeEach
    void setUp() {
        properties = new BookingEscrowProperties();
        properties.setContractAcceptHours(48);
        properties.setFundHours(48);
        properties.setFundPauseMaxDays(7);
        properties.setReviewDays(3);
        properties.setReleaseHoldDays(3);
        properties.setRevisionDays(2);
        properties.setMaxMilestones(20);
        properties.setMaxRevisionsDefault(2);
        properties.setPlatformFeePercent(new BigDecimal("5.0"));
        properties.setMembershipFeePercent(new BigDecimal("10.0"));
        properties.setMembershipDurationDays(30);
        properties.setWithdrawalSlaDays(2);
        properties.setWithdrawalMinAmount(new BigDecimal("50000"));
        properties.setDepositMinAmount(new BigDecimal("10000"));
        properties.setJobIntervalMinutes(60);

        Role adminRole = Role.builder().id(1L).name(RoleEnum.ADMIN.name()).build();
        Role userRole = Role.builder().id(2L).name(RoleEnum.VIEWER.name()).build();

        admin = User.builder().id(1L).email("admin@historypodcast.com").fullName("System Admin").roles(Set.of(adminRole)).build();
        normalUser = User.builder().id(2L).email("user@historypodcast.com").fullName("Normal User").roles(Set.of(userRole)).build();

        service = new BookingEscrowConfigServiceImpl(configRepository, properties, userRepository, systemConfigRepository);
        lenient().when(systemConfigRepository.findFirstByKeyOrderByIdDesc(anyString())).thenReturn(Optional.empty());
        lenient().when(systemConfigRepository.save(any(SystemConfig.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private void authenticateAs(User user) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("Lấy cấu hình hợp nhất toàn sàn (Escrow 5%, Membership 10%, Rút tiền SLA 2 ngày, Tối đa 20 Milestones)")
    void testGetConfig() {
        when(configRepository.findAll()).thenReturn(List.of());

        BookingEscrowConfigResponse res = service.getConfig();
        assertNotNull(res);
        assertEquals(48, res.getContractAcceptHours());
        assertEquals(48, res.getFundHours());
        assertEquals(3, res.getReviewDays());
        assertEquals(20, res.getMaxMilestones());
        assertEquals(new BigDecimal("5.0"), res.getPlatformFeePercent());
        assertEquals(new BigDecimal("10.0"), res.getMembershipFeePercent());
        assertEquals(2, res.getWithdrawalSlaDays());
        assertEquals(new BigDecimal("50000"), res.getWithdrawalMinAmount());
        assertEquals(new BigDecimal("10000"), res.getDepositMinAmount());
        assertNotNull(res.getRenderedTerms());
        assertTrue(res.getRenderedTerms().contains("95.0%"));
        assertTrue(res.getRenderedTerms().contains("2 ngày"));
    }

    @Test
    @DisplayName("Admin cập nhật cấu hình thông số sàn -> Cập nhật DB và Bean properties")
    void testAdminUpdateConfig() {
        authenticateAs(admin);
        when(configRepository.findByConfigKey(anyString())).thenReturn(Optional.empty());
        when(configRepository.save(any(BookingEscrowConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        BookingEscrowConfigRequest req = BookingEscrowConfigRequest.builder()
                .contractAcceptHours(72)
                .platformFeePercent(new BigDecimal("8.5"))
                .reviewDays(5)
                .maxMilestones(20)
                .membershipFeePercent(new BigDecimal("12.0"))
                .withdrawalSlaDays(2)
                .termsTemplate("ĐIỀU KHOẢN TÙY BIẾN: Phí {feePercent}, Creator nhận {creatorNetPercent}, Hạn duyệt {reviewDays}")
                .build();

        BookingEscrowConfigResponse res = service.updateConfig(req);
        assertNotNull(res);
        assertEquals(72, res.getContractAcceptHours());
        assertEquals(new BigDecimal("8.5"), res.getPlatformFeePercent());
        assertEquals(new BigDecimal("12.0"), res.getMembershipFeePercent());
        assertEquals(5, res.getReviewDays());
        assertEquals("ĐIỀU KHOẢN TÙY BIẾN: Phí {feePercent}, Creator nhận {creatorNetPercent}, Hạn duyệt {reviewDays}", res.getTermsTemplate());
        assertTrue(res.getRenderedTerms().contains("91.5%"));

        // Kiểm tra bean properties cũng được cập nhật ngay lập tức
        assertEquals(72, properties.getContractAcceptHours());
        assertEquals(new BigDecimal("8.5"), properties.getPlatformFeePercent());
        assertEquals(5, properties.getReviewDays());
        verify(configRepository, atLeastOnce()).save(any(BookingEscrowConfig.class));
    }

    @Test
    @DisplayName("Người dùng không phải Admin cập nhật cấu hình -> Quăng lỗi FORBIDDEN_ACCESS")
    void testNonAdminCannotUpdateConfig() {
        authenticateAs(normalUser);

        BookingEscrowConfigRequest req = BookingEscrowConfigRequest.builder()
                .platformFeePercent(new BigDecimal("10.0"))
                .build();

        AppException ex = assertThrows(AppException.class, () -> service.updateConfig(req));
        assertEquals(ErrorCode.FORBIDDEN_ACCESS, ex.getErrorCode());
        verify(configRepository, never()).save(any(BookingEscrowConfig.class));
    }

    @Test
    @DisplayName("Admin reset cấu hình về mặc định chuẩn toàn sàn")
    void testResetDefaultConfig() {
        authenticateAs(admin);
        when(configRepository.findByConfigKey(anyString())).thenReturn(Optional.empty());
        when(configRepository.save(any(BookingEscrowConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        properties.setPlatformFeePercent(new BigDecimal("12.0"));
        properties.setContractAcceptHours(96);
        properties.setMaxMilestones(5);
        properties.setTermsTemplate("Tùy biến cũ");

        BookingEscrowConfigResponse res = service.resetDefaultConfig();
        assertEquals(48, res.getContractAcceptHours());
        assertEquals(20, res.getMaxMilestones());
        assertEquals(new BigDecimal("5.0"), res.getPlatformFeePercent());
        assertEquals(new BigDecimal("10.0"), res.getMembershipFeePercent());
        assertEquals(2, res.getWithdrawalSlaDays());
        assertEquals(BookingEscrowProperties.DEFAULT_TERMS_TEMPLATE, res.getTermsTemplate());
    }
}
