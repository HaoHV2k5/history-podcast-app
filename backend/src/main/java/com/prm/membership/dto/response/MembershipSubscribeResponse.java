package com.prm.membership.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipSubscribeResponse {
    private Long membershipId;
    private Long channelId;
    private String channelName;
    private String planName;
    private BigDecimal amountPaid;
    private String status;
    private Instant startedAt;
    private Instant endedAt;
}
