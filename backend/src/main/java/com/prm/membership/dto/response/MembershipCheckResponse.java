package com.prm.membership.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipCheckResponse {
    private Long channelId;
    private boolean isMember;
    private Instant validUntil;
}
