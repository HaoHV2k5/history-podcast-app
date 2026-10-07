package com.prm.livestream.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestreamTokenResponse {

    private String appId;
    private String token;
    private String agoraChannelName;
    private Integer uid;
    private String role; // PUBLISHER | SUBSCRIBER
    private Integer expirationSeconds;
}
