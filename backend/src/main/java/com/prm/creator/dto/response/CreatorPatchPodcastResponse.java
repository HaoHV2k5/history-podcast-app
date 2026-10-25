package com.prm.creator.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorPatchPodcastResponse {

    private Long contentId;

    private Long artifactId;

    private Integer version;

    private String jobId;

    private String status;

    private String fileUrl;

    /**
     * URL ảnh bìa của podcast (nếu có cập nhật ảnh bìa mới)
     */
    private String coverUrl;

    private Integer durationSeconds;

    private Integer modifiedCount;

    private Integer reRecordedCount;

    private Integer totalSentences;

    private String message;
}
