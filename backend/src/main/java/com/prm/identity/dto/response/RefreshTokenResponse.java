package com.prm.identity.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenResponse {
    private Long id;
    private Long userId;
    private String token;
    private Instant issuedAt;
    private Instant expiresAt;
    private Boolean revoked;
    private Instant revokedAt;
}
