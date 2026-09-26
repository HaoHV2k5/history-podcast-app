package com.prm.channel.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelRequest {
    private Long creatorId;
    private String name;
    private String description;
    private String avatarUrl;
    private String coverUrl;
    private String status;
    private Instant createdAt;
}
