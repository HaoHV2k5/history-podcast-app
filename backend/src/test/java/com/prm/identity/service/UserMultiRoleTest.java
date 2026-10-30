package com.prm.identity.service;

import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.security.JwtProvider;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class UserMultiRoleTest {

    @Test
    @DisplayName("User Entity: Hỗ trợ nhiều role đồng thời (Many-to-Many)")
    void testUserEntity_MultipleRoles() {
        Role viewerRole = Role.builder().id(1L).name("VIEWER").build();
        Role creatorRole = Role.builder().id(2L).name("CREATOR").build();
        Role adminRole = Role.builder().id(3L).name("ADMIN").build();
        User user = User.builder().id(1L).email("user@test.com").build();

        user.addRole(viewerRole);
        assertTrue(user.hasRole("VIEWER"));
        assertEquals(1, user.getRoles().size());

        user.addRole(creatorRole);
        assertTrue(user.hasRole("VIEWER"));
        assertTrue(user.hasRole("CREATOR"));
        assertEquals(2, user.getRoles().size());

        user.addRole(adminRole);
        assertTrue(user.hasRole("VIEWER"));
        assertTrue(user.hasRole("CREATOR"));
        assertTrue(user.hasRole("ADMIN"));
        assertEquals(3, user.getRoles().size());

        user.removeRole(viewerRole);
        assertFalse(user.hasRole("VIEWER"));
        assertTrue(user.hasRole("CREATOR"));
        assertTrue(user.hasRole("ADMIN"));
        assertEquals(2, user.getRoles().size());
    }

    @Test
    @DisplayName("JwtProvider: Tạo token chứa danh sách nhiều role và trích xuất claims chính xác")
    void testJwtProvider_MultiRolesToken() {
        JwtProvider jwtProvider = new JwtProvider(
                "THIS_IS_A_VERY_SECRET_KEY_FOR_TESTING_JWT_MULTI_ROLES_2026_VERY_SECURE",
                3600000L,
                86400000L
        );

        Set<String> roles = Set.of("CREATOR", "VIEWER");
        String token = jwtProvider.generateAccessToken(100L, "an@historypodcast.com", roles);

        assertNotNull(token);
        assertTrue(jwtProvider.validateToken(token));

        Claims claims = jwtProvider.getClaims(token);
        assertEquals("an@historypodcast.com", claims.getSubject());
        assertEquals(100L, claims.get("userId", Long.class));

        @SuppressWarnings("unchecked")
        List<String> tokenRoles = claims.get("roles", List.class);
        assertNotNull(tokenRoles);
        assertTrue(tokenRoles.contains("CREATOR"));
        assertTrue(tokenRoles.contains("VIEWER"));
    }
}
