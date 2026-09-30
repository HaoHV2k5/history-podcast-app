package com.prm.membership.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipPlanResponse {
    private Long id;
    private Long channelId;
    private String channelName;
    private String name;
    private String description;
    private BigDecimal monthlyPrice;
    private List<String> perks;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
