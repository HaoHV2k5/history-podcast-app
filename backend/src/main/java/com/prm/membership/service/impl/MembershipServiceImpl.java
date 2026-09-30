package com.prm.membership.service.impl;

import com.prm.channel.entity.Channel;
import com.prm.channel.repository.ChannelRepository;
import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.membership.dto.request.MembershipPlanRequest;
import com.prm.membership.dto.response.*;
import com.prm.membership.entity.ChannelMembershipPlan;
import com.prm.membership.entity.Membership;
import com.prm.membership.entity.MembershipPayment;
import com.prm.membership.repository.ChannelMembershipPlanRepository;
import com.prm.membership.repository.MembershipPaymentRepository;
import com.prm.membership.repository.MembershipRepository;
import com.prm.membership.service.MembershipService;
import com.prm.wallet.entity.Wallet;
import com.prm.wallet.entity.WalletTransaction;
import com.prm.wallet.repository.WalletRepository;
import com.prm.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MembershipServiceImpl implements MembershipService {

    private final ChannelMembershipPlanRepository planRepository;
    private final MembershipRepository membershipRepository;
    private final MembershipPaymentRepository membershipPaymentRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Override
    public MembershipPlanResponse upsertChannelPlan(Long channelId, MembershipPlanRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng"));

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Không tìm thấy kênh"));

        // Anti-IDOR: Chỉ chủ sở hữu kênh mới được phép cấu hình gói hội viên
        if (!channel.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Bạn không có quyền chỉnh sửa gói hội viên của kênh này");
        }

        ChannelMembershipPlan plan = planRepository.findByChannelId(channelId)
                .orElseGet(() -> ChannelMembershipPlan.builder()
                        .channel(channel)
                        .build());

        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        plan.setMonthlyPrice(request.getMonthlyPrice());
        plan.setPerks(request.getPerks() != null ? request.getPerks() : new ArrayList<>());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            plan.setStatus(request.getStatus().toUpperCase());
        }

        ChannelMembershipPlan saved = planRepository.save(plan);
        log.info("Creator cập nhật gói hội viên thành công: channelId={}, planId={}, price={}",
                channelId, saved.getId(), saved.getMonthlyPrice());

        return toPlanResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MembershipPlanResponse getChannelPlan(Long channelId) {
        ChannelMembershipPlan plan = planRepository.findByChannelId(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_PLAN_NOT_FOUND, "Kênh này chưa mở tính năng gói hội viên"));

        if (!"ACTIVE".equalsIgnoreCase(plan.getStatus())) {
            throw new AppException(ErrorCode.MEMBERSHIP_PLAN_NOT_FOUND, "Gói hội viên của kênh này hiện đang tạm đóng");
        }

        return toPlanResponse(plan);
    }

    @Override
    public MembershipSubscribeResponse subscribe(Long channelId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User viewer = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng"));

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Không tìm thấy kênh"));

        // 1. Chặn Creator tự mua gói của chính mình
        if (channel.getCreator().getId().equals(viewer.getId())) {
            throw new AppException(ErrorCode.CANNOT_SUBSCRIBE_OWN_CHANNEL, "Chủ kênh không thể tự mua gói hội viên của chính mình");
        }

        ChannelMembershipPlan plan = planRepository.findByChannelIdAndStatus(channelId, "ACTIVE")
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_PLAN_NOT_FOUND, "Kênh chưa thiết lập gói hội viên hoặc gói đang tạm đóng"));

        // Lấy hoặc tạo ví cho Viewer và Creator
        Wallet viewerWallet = walletRepository.findByUserId(viewer.getId())
                .orElseGet(() -> initWallet(viewer));
        Wallet creatorWallet = walletRepository.findByUserId(channel.getCreator().getId())
                .orElseGet(() -> initWallet(channel.getCreator()));

        // 2. Chống Deadlock: Luôn khóa 2 ví theo thứ tự wallet_id tăng dần
        Long firstId = Math.min(viewerWallet.getId(), creatorWallet.getId());
        Long secondId = Math.max(viewerWallet.getId(), creatorWallet.getId());
        walletRepository.findByIdForUpdate(firstId);
        walletRepository.findByIdForUpdate(secondId);

        // Nạp lại trạng thái mới nhất của ví sau khi đã khóa dòng
        viewerWallet = walletRepository.findById(viewerWallet.getId()).orElseThrow();
        creatorWallet = walletRepository.findById(creatorWallet.getId()).orElseThrow();

        // 3. Khóa Viewer Wallet trước giúp serialize request. Giờ kiểm tra Membership hiện tại
        Optional<Membership> existingOpt = membershipRepository.findByViewerIdAndChannelId(viewer.getId(), channelId);
        if (existingOpt.isPresent()) {
            Membership existing = existingOpt.get();
            if ("ACTIVE".equalsIgnoreCase(existing.getStatus())) {
                if (existing.getEndedAt() != null && existing.getEndedAt().isAfter(Instant.now())) {
                    throw new AppException(ErrorCode.ALREADY_ACTIVE_MEMBER, "Bạn đã là hội viên còn hiệu lực của kênh này");
                } else {
                    // Đã hết hạn thực tế -> cập nhật EXPIRED để tránh xung đột Partial Unique Index
                    existing.setStatus("EXPIRED");
                    membershipRepository.save(existing);
                }
            }
        }

        // 4. Kiểm tra số dư khả dụng của Viewer
        BigDecimal price = plan.getMonthlyPrice();
        if (viewerWallet.getAvailableBalance().compareTo(price) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_WALLET_BALANCE, "Số dư khả dụng trong ví không đủ để đăng ký gói hội viên");
        }

        // 5. Tính toán phân chia doanh thu (Rounding Rule rõ ràng)
        BigDecimal commission = price.multiply(BigDecimal.valueOf(0.20)).setScale(0, RoundingMode.HALF_UP);
        BigDecimal creatorEarning = price.subtract(commission);

        // 6. Trừ tiền Viewer & Cộng tiền Creator
        viewerWallet.setAvailableBalance(viewerWallet.getAvailableBalance().subtract(price));
        walletRepository.save(viewerWallet);

        creatorWallet.setAvailableBalance(creatorWallet.getAvailableBalance().add(creatorEarning));
        walletRepository.save(creatorWallet);

        // 7. Tạo mới Membership (Thời hạn 30 ngày)
        Instant startedAt = Instant.now();
        Instant endedAt = startedAt.plus(30, ChronoUnit.DAYS);

        Membership newMembership = Membership.builder()
                .viewer(viewer)
                .channel(channel)
                .plan(plan)
                .status("ACTIVE")
                .startedAt(startedAt)
                .endedAt(endedAt)
                .build();
        Membership savedMembership = membershipRepository.save(newMembership);

        // 8. Lưu MembershipPayment làm Source of Truth cho doanh thu
        MembershipPayment payment = MembershipPayment.builder()
                .membership(savedMembership)
                .amount(price)
                .commissionAmount(commission)
                .creatorEarning(creatorEarning)
                .status("SUCCESS")
                .paidAt(startedAt)
                .build();
        membershipPaymentRepository.save(payment);

        // 9. Ghi nhận 2 bản ghi WalletTransaction cho Viewer và Creator
        WalletTransaction viewerTx = WalletTransaction.builder()
                .wallet(viewerWallet)
                .type("MEMBERSHIP_FEE")
                .amount(price)
                .relatedType("MEMBERSHIP")
                .relatedId(savedMembership.getId())
                .status("SUCCESS")
                .description("Đăng ký gói hội viên kênh " + channel.getName())
                .createdAt(startedAt)
                .build();
        walletTransactionRepository.save(viewerTx);

        WalletTransaction creatorTx = WalletTransaction.builder()
                .wallet(creatorWallet)
                .type("MEMBERSHIP_INCOME")
                .amount(creatorEarning)
                .relatedType("MEMBERSHIP")
                .relatedId(savedMembership.getId())
                .status("SUCCESS")
                .description("Nhận doanh thu hội viên từ người nghe trên kênh " + channel.getName())
                .createdAt(startedAt)
                .build();
        walletTransactionRepository.save(creatorTx);

        log.info("Mua gói hội viên kênh thành công: viewerId={}, channelId={}, price={}, creatorEarning={}",
                viewer.getId(), channelId, price, creatorEarning);

        return MembershipSubscribeResponse.builder()
                .membershipId(savedMembership.getId())
                .channelId(channel.getId())
                .channelName(channel.getName())
                .planName(plan.getName())
                .amountPaid(price)
                .status(savedMembership.getStatus())
                .startedAt(startedAt)
                .endedAt(endedAt)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public MembershipCheckResponse checkMembership(Long channelId) {
        Optional<String> currentUserEmailOpt = SecurityUtils.getCurrentUserEmailOptional();
        if (currentUserEmailOpt.isEmpty()) {
            return MembershipCheckResponse.builder()
                    .channelId(channelId)
                    .isMember(false)
                    .validUntil(null)
                    .build();
        }

        User user = userRepository.findByEmail(currentUserEmailOpt.get()).orElse(null);
        if (user == null) {
            return MembershipCheckResponse.builder().channelId(channelId).isMember(false).build();
        }

        Channel channel = channelRepository.findById(channelId).orElse(null);
        if (channel == null) {
            return MembershipCheckResponse.builder().channelId(channelId).isMember(false).build();
        }

        // Nếu là chính chủ kênh hoặc ADMIN hệ thống thì có toàn quyền xem nội dung độc quyền
        if (channel.getCreator().getId().equals(user.getId()) || SecurityUtils.hasRole("ADMIN")) {
            return MembershipCheckResponse.builder()
                    .channelId(channelId)
                    .isMember(true)
                    .validUntil(null)
                    .build();
        }

        // Kiểm tra xem có membership ACTIVE và chưa hết hạn không
        Optional<Membership> activeMembershipOpt = membershipRepository
                .findByViewerIdAndChannelIdAndStatus(user.getId(), channelId, "ACTIVE");

        if (activeMembershipOpt.isPresent()) {
            Membership membership = activeMembershipOpt.get();
            if (membership.getEndedAt() != null && membership.getEndedAt().isAfter(Instant.now())) {
                return MembershipCheckResponse.builder()
                        .channelId(channelId)
                        .isMember(true)
                        .validUntil(membership.getEndedAt())
                        .build();
            }
        }

        return MembershipCheckResponse.builder()
                .channelId(channelId)
                .isMember(false)
                .validUntil(null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MyMembershipResponse> getMyMemberships(Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng"));

        Page<Membership> page = membershipRepository.findByViewerIdAndStatusAndEndedAtAfter(
                user.getId(), "ACTIVE", Instant.now(), pageable);

        List<MyMembershipResponse> items = page.getContent().stream()
                .map(m -> MyMembershipResponse.builder()
                        .membershipId(m.getId())
                        .channelId(m.getChannel().getId())
                        .channelName(m.getChannel().getName())
                        .channelAvatarUrl(m.getChannel().getAvatarUrl())
                        .planName(m.getPlan() != null ? m.getPlan().getName() : "Gói hội viên mặc định")
                        .startedAt(m.getStartedAt())
                        .endedAt(m.getEndedAt())
                        .status(m.getStatus())
                        .build())
                .toList();

        return PageResponse.of(page, items);
    }

    private Wallet initWallet(User user) {
        Wallet wallet = Wallet.builder()
                .user(user)
                .availableBalance(BigDecimal.ZERO)
                .pendingBalance(BigDecimal.ZERO)
                .currency("VND")
                .updatedAt(Instant.now())
                .build();
        return walletRepository.save(wallet);
    }

    private MembershipPlanResponse toPlanResponse(ChannelMembershipPlan plan) {
        return MembershipPlanResponse.builder()
                .id(plan.getId())
                .channelId(plan.getChannel().getId())
                .channelName(plan.getChannel().getName())
                .name(plan.getName())
                .description(plan.getDescription())
                .monthlyPrice(plan.getMonthlyPrice())
                .perks(plan.getPerks())
                .status(plan.getStatus())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }
}
