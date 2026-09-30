package com.prm.creator.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorUploadImageResponse {

    private String imageUrl;
    private String status;
    private String message;
}
