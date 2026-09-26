package com.prm.membership.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipResponse {
    private Long id;
    private Long viewerId;
    private Long channelId;
    private String status;
    private Instant startedAt;
    private Instant endedAt;
}
