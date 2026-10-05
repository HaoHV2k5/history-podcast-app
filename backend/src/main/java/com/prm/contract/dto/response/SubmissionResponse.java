package com.prm.contract.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {

    private Long id;
    private Long milestoneId;
    private Integer versionNo;
    private String content;
    private String fileUrl;
    private Instant createdAt;
}
