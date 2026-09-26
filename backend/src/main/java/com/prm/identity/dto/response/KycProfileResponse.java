package com.prm.identity.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycProfileResponse {
    private Long id;
    private Long userId;
    private String phone;
    private String otpCode;
    private Instant otpVerifiedAt;
    private String status;
    private Instant createdAt;
}
