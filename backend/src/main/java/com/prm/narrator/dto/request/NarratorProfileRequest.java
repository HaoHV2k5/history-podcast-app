package com.prm.narrator.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarratorProfileRequest {
    private Long userId;
    private String bio;
    private String languages;
    private BigDecimal baseRate;
    private String status;
    private Instant createdAt;
}
