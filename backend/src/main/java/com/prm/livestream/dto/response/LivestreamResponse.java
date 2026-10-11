package com.prm.livestream.dto.response;

import com.prm.livestream.constant.LivestreamStatus;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestreamResponse {

    private Long id;
    private Long channelId;
    private String channelName;
    private String channelAvatarUrl;
    private Long creatorId;
    private String creatorName;
    private String title;
    private String description;
    private String thumbnailUrl;
    private String agoraChannelName;
    private Boolean isExclusive;
    private LivestreamStatus status;
    private Integer viewerCount;
    private Instant startedAt;
    private Instant endedAt;
    private Instant createdAt;
}
