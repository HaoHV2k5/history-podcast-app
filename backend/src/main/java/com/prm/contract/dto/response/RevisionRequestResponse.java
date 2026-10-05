package com.prm.contract.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevisionRequestResponse {

    private Long id;
    private Long milestoneId;
    private Long submissionId;
    private String note;
    private Instant createdAt;
}
