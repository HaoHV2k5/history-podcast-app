package com.prm.identity.service;

import com.prm.common.exception.AppException;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.dto.request.FreelancerOnboardRequest;
import com.prm.identity.dto.response.FreelancerProfileResponse;
import com.prm.identity.entity.FreelancerProfile;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.mapper.FreelancerProfileMapper;
import com.prm.identity.repository.FreelancerProfileRepository;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.security.JwtProvider;
import com.prm.identity.service.impl.FreelancerServiceImpl;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserMultiRoleAndFreelancerTest {

    @Mock
    private FreelancerProfileRepository freelancerProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private FreelancerProfileMapper mapper;

    @InjectMocks
    private FreelancerServiceImpl freelancerService;

    private User sampleAn;
    private Role creatorRole;
    private Role freelancerRole;

    @BeforeEach
    void setUp() {
        creatorRole = Role.builder().id(2L).name("CREATOR").description("Creator Role").build();
        freelancerRole = Role.builder().id(5L).name("FREELANCER").description("Freelancer Role").build();

        sampleAn = User.builder()
                .id(100L)
                .email("an@historypodcast.com")
                .fullName("Bạn An")
                .phone("0987654321")
                .status("ACTIVE")
                .role(creatorRole)
                .build();
        sampleAn.addRole(creatorRole);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("an@historypodcast.com", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("User Entity: Hỗ trợ nhiều role đồng thời (Many-to-Many)")
    void testUserEntity_MultipleRoles() {
        Role viewerRole = Role.builder().id(1L).name("VIEWER").build();
        User user = User.builder().id(1L).email("user@test.com").build();

        user.addRole(viewerRole);
        assertTrue(user.hasRole("VIEWER"));
        assertEquals(1, user.getRoles().size());

        // Bật thêm role CREATOR
        user.addRole(creatorRole);
        assertTrue(user.hasRole("VIEWER"));
        assertTrue(user.hasRole("CREATOR"));
        assertEquals(2, user.getRoles().size());

        // Bật thêm role FREELANCER
        user.addRole(freelancerRole);
        assertTrue(user.hasRole("VIEWER"));
        assertTrue(user.hasRole("CREATOR"));
        assertTrue(user.hasRole("FREELANCER"));
        assertEquals(3, user.getRoles().size());

        // Xóa một role
        user.removeRole(viewerRole);
        assertFalse(user.hasRole("VIEWER"));
        assertTrue(user.hasRole("CREATOR"));
        assertTrue(user.hasRole("FREELANCER"));
        assertEquals(2, user.getRoles().size());
    }

    @Test
    @DisplayName("Onboard Freelancer: Bạn An đang là Creator, kích hoạt thêm vai trò Freelancer thành công")
    void testFreelancerOnboard_Success() {
        FreelancerOnboardRequest request = FreelancerOnboardRequest.builder()
                .headline("Biên kịch nội dung & Giọng đọc truyền cảm")
                .bio("3 năm kinh nghiệm viết sử ký")
                .skills("Content Writing, Voice Over")
                .portfolioUrl("https://prm-platform.com/portfolio/an")
                .build();

        when(userRepository.findByEmail("an@historypodcast.com")).thenReturn(Optional.of(sampleAn));
        when(freelancerProfileRepository.findByUserId(100L)).thenReturn(Optional.empty());
        when(roleRepository.findByName("FREELANCER")).thenReturn(Optional.of(freelancerRole));

        FreelancerProfile savedProfile = FreelancerProfile.builder()
                .id(1L)
                .user(sampleAn)
                .headline(request.getHeadline())
                .bio(request.getBio())
                .skills(request.getSkills())
                .portfolioUrl(request.getPortfolioUrl())
                .status("ACTIVE")
                .build();
        when(freelancerProfileRepository.save(any(FreelancerProfile.class))).thenReturn(savedProfile);

        FreelancerProfileResponse expectedResponse = FreelancerProfileResponse.builder()
                .id(1L)
                .userId(100L)
                .userEmail("an@historypodcast.com")
                .headline(request.getHeadline())
                .roles(Set.of("CREATOR", "FREELANCER"))
                .status("ACTIVE")
                .build();
        when(mapper.toResponse(savedProfile)).thenReturn(expectedResponse);

        FreelancerProfileResponse response = freelancerService.onboard(request);

        assertNotNull(response);
        assertEquals("ACTIVE", response.getStatus());
        assertEquals("an@historypodcast.com", response.getUserEmail());

        // Kiểm tra An giờ có cả vai trò CREATOR và FREELANCER
        assertTrue(sampleAn.hasRole("CREATOR"));
        assertTrue(sampleAn.hasRole("FREELANCER"));
        verify(userRepository, times(1)).save(sampleAn);
        verify(freelancerProfileRepository, times(1)).save(any(FreelancerProfile.class));
    }

    @Test
    @DisplayName("GetMyProfile: Trả về hồ sơ Freelancer của tài khoản hiện tại")
    void testGetMyProfile_Success() {
        when(userRepository.findByEmail("an@historypodcast.com")).thenReturn(Optional.of(sampleAn));

        FreelancerProfile profile = FreelancerProfile.builder()
                .id(1L)
                .user(sampleAn)
                .headline("Voice Talent Lịch Sử")
                .status("ACTIVE")
                .build();
        when(freelancerProfileRepository.findByUserId(100L)).thenReturn(Optional.of(profile));

        FreelancerProfileResponse expected = FreelancerProfileResponse.builder()
                .id(1L)
                .userId(100L)
                .headline("Voice Talent Lịch Sử")
                .build();
        when(mapper.toResponse(profile)).thenReturn(expected);

        FreelancerProfileResponse result = freelancerService.getMyProfile();

        assertNotNull(result);
        assertEquals("Voice Talent Lịch Sử", result.getHeadline());
    }

    @Test
    @DisplayName("GetMyProfile: Ném exception khi chưa đăng ký Freelancer")
    void testGetMyProfile_NotFound() {
        when(userRepository.findByEmail("an@historypodcast.com")).thenReturn(Optional.of(sampleAn));
        when(freelancerProfileRepository.findByUserId(100L)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> freelancerService.getMyProfile());
    }

    @Test
    @DisplayName("JwtProvider: Tạo token chứa danh sách nhiều role và trích xuất claims chính xác")
    void testJwtProvider_MultiRolesToken() {
        JwtProvider jwtProvider = new JwtProvider(
                "THIS_IS_A_VERY_SECRET_KEY_FOR_TESTING_JWT_MULTI_ROLES_2026_VERY_SECURE",
                3600000L,
                86400000L
        );

        Set<String> roles = Set.of("CREATOR", "FREELANCER");
        String token = jwtProvider.generateAccessToken(100L, "an@historypodcast.com", roles);

        assertNotNull(token);
        assertTrue(jwtProvider.validateToken(token));

        Claims claims = jwtProvider.getClaims(token);
        assertEquals("an@historypodcast.com", claims.getSubject());
        assertEquals(100L, claims.get("userId", Long.class));
        assertEquals("CREATOR", claims.get("role", String.class)); // primary role

        @SuppressWarnings("unchecked")
        List<String> tokenRoles = claims.get("roles", List.class);
        assertNotNull(tokenRoles);
        assertTrue(tokenRoles.contains("CREATOR"));
        assertTrue(tokenRoles.contains("FREELANCER"));
    }
}
