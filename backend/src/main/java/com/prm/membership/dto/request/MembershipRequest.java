package com.prm.membership.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipRequest {
    private Long viewerId;
    private Long channelId;
    private String status;
    private Instant startedAt;
    private Instant endedAt;
}
