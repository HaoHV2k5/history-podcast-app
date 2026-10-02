package com.prm.channel.dto.response;

import com.prm.common.enums.AiShieldTier;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiShieldPolicyConfigResponse {

    private Long id;
    private AiShieldTier tier;
    private String label;
    private BigDecimal minScore;
    private BigDecimal maxScore;
    private String description;
    private String actionType;
    private Boolean isActive;
    private Integer displayOrder;
    private Instant createdAt;
    private Instant updatedAt;
}
