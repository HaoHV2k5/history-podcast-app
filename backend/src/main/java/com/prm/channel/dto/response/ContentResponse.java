package com.prm.channel.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentResponse {
    private Long id;
    private Long channelId;
    private String title;
    private String textBody;
    private String sourceType;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
