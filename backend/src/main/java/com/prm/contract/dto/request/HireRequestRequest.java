package com.prm.contract.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HireRequestRequest {
    private Long creatorId;
    private Long narratorId;
    private Long channelId;
    private String description;
    private BigDecimal proposedPrice;
    private LocalDate deadline;
    private String status;
    private Instant createdAt;
}
