package com.prm.livestream.service;

import com.prm.channel.entity.Channel;
import com.prm.channel.repository.ChannelRepository;
import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.livestream.constant.LivestreamStatus;
import com.prm.livestream.dto.request.CreateLivestreamRequest;
import com.prm.livestream.dto.response.LivestreamResponse;
import com.prm.livestream.dto.response.LivestreamTokenResponse;
import com.prm.livestream.entity.LivestreamSession;
import com.prm.livestream.repository.LivestreamSessionRepository;
import com.prm.livestream.service.impl.LivestreamServiceImpl;
import com.prm.membership.repository.MembershipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LivestreamServiceTest {

    @Mock
    private LivestreamSessionRepository livestreamSessionRepository;

    @Mock
    private ChannelRepository channelRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MembershipRepository membershipRepository;

    @InjectMocks
    private LivestreamServiceImpl livestreamService;

    private User creator;
    private User viewer;
    private Channel channel;
    private LivestreamSession session;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(livestreamService, "agoraAppId", "test_app_id");
        ReflectionTestUtils.setField(livestreamService, "agoraAppCertificate", "test_app_cert");
        ReflectionTestUtils.setField(livestreamService, "agoraTokenExpiration", 3600);

        creator = User.builder()
                .id(1L)
                .email("creator@test.com")
                .fullName("Creator Test")
                .build();

        viewer = User.builder()
                .id(2L)
                .email("viewer@test.com")
                .fullName("Viewer Test")
                .build();

        channel = Channel.builder()
                .id(10L)
                .name("Kênh Lịch Sử")
                .creator(creator)
                .build();

        session = LivestreamSession.builder()
                .id(100L)
                .channel(channel)
                .creator(creator)
                .title("Livestream Chiến dịch Điện Biên Phủ")
                .agoraChannelName("prm_live_10_123456789")
                .isExclusive(false)
                .status(LivestreamStatus.LIVE)
                .viewerCount(0)
                .startedAt(Instant.now())
                .build();
    }

    private void authenticateUser(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList())
        );
    }

    @Test
    @DisplayName("Tạo phiên livestream thành công khi Creator là chủ sở hữu kênh")
    void createSession_Success() {
        authenticateUser("creator@test.com");
        when(userRepository.findByEmail("creator@test.com")).thenReturn(Optional.of(creator));
        when(channelRepository.findById(10L)).thenReturn(Optional.of(channel));
        when(livestreamSessionRepository.save(any(LivestreamSession.class))).thenAnswer(invocation -> {
            LivestreamSession s = invocation.getArgument(0);
            s.setId(100L);
            return s;
        });

        CreateLivestreamRequest request = CreateLivestreamRequest.builder()
                .channelId(10L)
                .title("Livestream Chiến dịch Điện Biên Phủ")
                .isExclusive(false)
                .build();

        LivestreamResponse response = livestreamService.createSession(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(LivestreamStatus.LIVE, response.getStatus());
        assertTrue(response.getAgoraChannelName().startsWith("prm_live_10_"));
        verify(livestreamSessionRepository, times(1)).save(any(LivestreamSession.class));
    }

    @Test
    @DisplayName("Creator lấy Token với quyền PUBLISHER")
    void getJoinToken_Creator_ReturnsPublisherToken() {
        authenticateUser("creator@test.com");
        when(userRepository.findByEmail("creator@test.com")).thenReturn(Optional.of(creator));
        when(livestreamSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        LivestreamTokenResponse tokenResponse = livestreamService.getJoinToken(100L);

        assertNotNull(tokenResponse);
        assertEquals("PUBLISHER", tokenResponse.getRole());
        assertEquals("prm_live_10_123456789", tokenResponse.getAgoraChannelName());
        assertEquals(1, tokenResponse.getUid());
        assertNotNull(tokenResponse.getToken());
    }

    @Test
    @DisplayName("Viewer lấy Token với quyền SUBSCRIBER trên phòng live công khai")
    void getJoinToken_Viewer_PublicRoom_ReturnsSubscriberToken() {
        authenticateUser("viewer@test.com");
        when(userRepository.findByEmail("viewer@test.com")).thenReturn(Optional.of(viewer));
        when(livestreamSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        LivestreamTokenResponse tokenResponse = livestreamService.getJoinToken(100L);

        assertNotNull(tokenResponse);
        assertEquals("SUBSCRIBER", tokenResponse.getRole());
        assertEquals(2, tokenResponse.getUid());
        verify(livestreamSessionRepository, times(1)).save(session);
    }

    @Test
    @DisplayName("Viewer bị từ chối khi vào phòng VIP mà chưa mua gói hội viên")
    void getJoinToken_Viewer_ExclusiveRoom_ThrowsMemberRequired() {
        session.setIsExclusive(true);
        authenticateUser("viewer@test.com");
        when(userRepository.findByEmail("viewer@test.com")).thenReturn(Optional.of(viewer));
        when(livestreamSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(membershipRepository.existsByViewerIdAndChannelIdAndStatusAndEndedAtAfter(
                eq(2L), eq(10L), eq("ACTIVE"), any(Instant.class)
        )).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> livestreamService.getJoinToken(100L));
        assertEquals(ErrorCode.LIVESTREAM_MEMBER_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Viewer có thẻ hội viên hợp lệ được phép vào phòng VIP")
    void getJoinToken_Viewer_ExclusiveRoom_ActiveMember_Success() {
        session.setIsExclusive(true);
        authenticateUser("viewer@test.com");
        when(userRepository.findByEmail("viewer@test.com")).thenReturn(Optional.of(viewer));
        when(livestreamSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(membershipRepository.existsByViewerIdAndChannelIdAndStatusAndEndedAtAfter(
                eq(2L), eq(10L), eq("ACTIVE"), any(Instant.class)
        )).thenReturn(true);

        LivestreamTokenResponse tokenResponse = livestreamService.getJoinToken(100L);
        assertNotNull(tokenResponse);
        assertEquals("SUBSCRIBER", tokenResponse.getRole());
    }

    @Test
    @DisplayName("Creator kết thúc phiên live thành công")
    void endSession_Success() {
        authenticateUser("creator@test.com");
        when(userRepository.findByEmail("creator@test.com")).thenReturn(Optional.of(creator));
        when(livestreamSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(livestreamSessionRepository.save(any(LivestreamSession.class))).thenAnswer(i -> i.getArgument(0));

        LivestreamResponse response = livestreamService.endSession(100L);

        assertNotNull(response);
        assertEquals(LivestreamStatus.ENDED, response.getStatus());
        assertNotNull(response.getEndedAt());
    }

    @Test
    @DisplayName("Lấy danh sách phiên live có phân trang")
    void getLivestreams_Pagination_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        when(livestreamSessionRepository.findByStatus(eq(LivestreamStatus.LIVE), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(session), pageable, 1));

        PageResponse<LivestreamResponse> page = livestreamService.getLivestreams(LivestreamStatus.LIVE, null, pageable);

        assertNotNull(page);
        assertEquals(1, page.getTotalElements());
        assertEquals(1, page.getItems().size());
        assertEquals("Livestream Chiến dịch Điện Biên Phủ", page.getItems().get(0).getTitle());
    }
}
