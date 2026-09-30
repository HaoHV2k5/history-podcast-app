package com.prm.membership.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyMembershipResponse {
    private Long membershipId;
    private Long channelId;
    private String channelName;
    private String channelAvatarUrl;
    private String planName;
    private Instant startedAt;
    private Instant endedAt;
    private String status;
}
