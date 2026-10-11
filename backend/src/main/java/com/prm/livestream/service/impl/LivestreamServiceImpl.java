package com.prm.livestream.service.impl;

import com.prm.channel.entity.Channel;
import com.prm.channel.repository.ChannelRepository;
import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.livestream.constant.LivestreamStatus;
import com.prm.livestream.dto.request.CreateLivestreamRequest;
import com.prm.livestream.dto.response.LivestreamResponse;
import com.prm.livestream.dto.response.LivestreamTokenResponse;
import com.prm.livestream.entity.LivestreamSession;
import com.prm.livestream.repository.LivestreamSessionRepository;
import com.prm.livestream.service.LivestreamService;
import com.prm.livestream.util.AgoraTokenUtil;
import com.prm.membership.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LivestreamServiceImpl implements LivestreamService {

    private final LivestreamSessionRepository livestreamSessionRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;

    @Value("${app.agora.app-id:}")
    private String agoraAppId;

    @Value("${app.agora.app-certificate:}")
    private String agoraAppCertificate;

    @Value("${app.agora.token-expiration-in-seconds:3600}")
    private int agoraTokenExpiration;

    @Override
    @Transactional
    public LivestreamResponse createSession(CreateLivestreamRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản"));

        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Không tìm thấy kênh"));

        if (!channel.getCreator().getId().equals(creator.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Bạn không phải chủ sở hữu của kênh này để tạo livestream");
        }

        String agoraChannelName = "prm_live_" + channel.getId() + "_" + System.currentTimeMillis();

        LivestreamSession session = LivestreamSession.builder()
                .channel(channel)
                .creator(creator)
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .agoraChannelName(agoraChannelName)
                .isExclusive(Boolean.TRUE.equals(request.getIsExclusive()))
                .status(LivestreamStatus.LIVE)
                .viewerCount(0)
                .startedAt(Instant.now())
                .build();

        LivestreamSession saved = livestreamSessionRepository.save(session);
        log.info("Created livestream session id: {}, agoraChannel: {}", saved.getId(), saved.getAgoraChannelName());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public LivestreamTokenResponse getJoinToken(Long sessionId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản"));

        LivestreamSession session = livestreamSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.LIVESTREAM_NOT_FOUND));

        if (session.getStatus() == LivestreamStatus.ENDED) {
            throw new AppException(ErrorCode.LIVESTREAM_ALREADY_ENDED);
        }

        AgoraTokenUtil.Role role;
        if (session.getCreator().getId().equals(currentUser.getId())) {
            role = AgoraTokenUtil.Role.PUBLISHER;
        } else {
            // Kiểm tra điều kiện phòng live VIP độc quyền cho hội viên
            if (Boolean.TRUE.equals(session.getIsExclusive())) {
                boolean isMember = membershipRepository.existsByViewerIdAndChannelIdAndStatusAndEndedAtAfter(
                        currentUser.getId(), session.getChannel().getId(), "ACTIVE", Instant.now());
                if (!isMember) {
                    throw new AppException(ErrorCode.LIVESTREAM_MEMBER_REQUIRED);
                }
            }
            role = AgoraTokenUtil.Role.SUBSCRIBER;

            // Tăng số lượng người xem
            session.setViewerCount(session.getViewerCount() + 1);
            livestreamSessionRepository.save(session);
        }

        int uid = currentUser.getId().intValue();
        String token = AgoraTokenUtil.buildToken(
                agoraAppId,
                agoraAppCertificate,
                session.getAgoraChannelName(),
                uid,
                role,
                agoraTokenExpiration
        );

        return LivestreamTokenResponse.builder()
                .appId(agoraAppId)
                .token(token)
                .agoraChannelName(session.getAgoraChannelName())
                .uid(uid)
                .role(role.name())
                .expirationSeconds(agoraTokenExpiration)
                .build();
    }

    @Override
    @Transactional
    public LivestreamResponse endSession(Long sessionId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản"));

        LivestreamSession session = livestreamSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.LIVESTREAM_NOT_FOUND));

        if (!session.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Chỉ Creator của phòng mới có quyền kết thúc livestream");
        }

        session.setStatus(LivestreamStatus.ENDED);
        session.setEndedAt(Instant.now());
        LivestreamSession updated = livestreamSessionRepository.save(session);
        log.info("Livestream session id: {} has been ended by creator", sessionId);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public LivestreamResponse getSession(Long sessionId) {
        LivestreamSession session = livestreamSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.LIVESTREAM_NOT_FOUND));
        return mapToResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<LivestreamResponse> getLivestreams(LivestreamStatus status, Long channelId, Pageable pageable) {
        Page<LivestreamSession> page;
        if (channelId != null && status != null) {
            page = livestreamSessionRepository.findByChannelIdAndStatus(channelId, status, pageable);
        } else if (channelId != null) {
            page = livestreamSessionRepository.findByChannelId(channelId, pageable);
        } else if (status != null) {
            page = livestreamSessionRepository.findByStatus(status, pageable);
        } else {
            page = livestreamSessionRepository.findAll(pageable);
        }

        List<LivestreamResponse> mapped = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.of(page, mapped);
    }

    private LivestreamResponse mapToResponse(LivestreamSession session) {
        return LivestreamResponse.builder()
                .id(session.getId())
                .channelId(session.getChannel().getId())
                .channelName(session.getChannel().getName())
                .channelAvatarUrl(session.getChannel().getAvatarUrl())
                .creatorId(session.getCreator().getId())
                .creatorName(session.getCreator().getFullName() != null ? session.getCreator().getFullName() : session.getCreator().getEmail())
                .title(session.getTitle())
                .description(session.getDescription())
                .thumbnailUrl(session.getThumbnailUrl())
                .agoraChannelName(session.getAgoraChannelName())
                .isExclusive(session.getIsExclusive())
                .status(session.getStatus())
                .viewerCount(session.getViewerCount())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
