package com.prm.creator.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorCommentItemResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private String textBody;
    private String status;
    private Instant createdAt;
}
