package com.prm.livestream.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestreamChatMessageResponse {
    private String id;
    private String author;
    private String role;
    private String text;
    private long timestamp;
    private String timeFormatted;
}
