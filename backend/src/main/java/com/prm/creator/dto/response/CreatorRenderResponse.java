package com.prm.creator.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorRenderResponse {

    private String jobId;
    private Long contentId;
    private Long artifactId;
    private Long channelId;
    private String status;
    private String message;
}
