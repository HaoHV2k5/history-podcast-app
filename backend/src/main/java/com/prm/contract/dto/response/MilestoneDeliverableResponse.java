package com.prm.contract.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneDeliverableResponse {

    private Long id;
    private Long milestoneId;
    private Integer milestoneOrderNo;
    private String milestoneTitle;
    private Long postId;
    private String postTitle;
    private Long contractId;
    private String contractTitle;
    private String title;
    private String description;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private Integer versionNo;
    private Long uploadedById;
    private String uploadedByFullName;
    private String downloadUrl;
    private String previewUrl;
    private Instant createdAt;
}
