package com.prm.narrator.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarratorProfileResponse {
    private Long id;
    private Long userId;
    private String bio;
    private String languages;
    private BigDecimal baseRate;
    private String status;
    private Instant createdAt;
}
