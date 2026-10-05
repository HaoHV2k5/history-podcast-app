package com.prm.identity.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtProvider(
            @Value("${jwt.secret:PRM_PLATFORM_SUPER_SECRET_KEY_FOR_JWT_SIGNING_2026_VERY_SECURE}") String secret,
            @Value("${jwt.access-token-expiration-ms:86400000}") long accessTokenExpirationMs, // 24 hours
            @Value("${jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs // 7 days
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(Long userId, String email, java.util.Collection<String> roles) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessTokenExpirationMs);
        java.util.List<String> roleList = roles != null ? new java.util.ArrayList<>(roles) : java.util.Collections.emptyList();
        String primaryRole = roleList.contains("ADMIN") ? "ADMIN"
                : (roleList.contains("CREATOR") ? "CREATOR"
                : (roleList.contains("FREELANCER") ? "FREELANCER"
                : (roleList.isEmpty() ? "USER" : roleList.get(0))));

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", primaryRole)
                .claim("roles", roleList)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public String generateAccessToken(Long userId, String email, String role) {
        return generateAccessToken(userId, email, role != null ? java.util.List.of(role) : java.util.Collections.emptyList());
    }

    public String generateRefreshToken(Long userId, String email) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(refreshTokenExpirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public Long getUserIdFromToken(String token) {
        return getClaims(token).get("userId", Long.class);
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }
}
