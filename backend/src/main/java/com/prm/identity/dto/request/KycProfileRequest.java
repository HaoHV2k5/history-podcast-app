package com.prm.identity.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycProfileRequest {
    private Long userId;
    private String phone;
    private String otpCode;
    private Instant otpVerifiedAt;
    private String status;
    private Instant createdAt;
}
