package com.prm.creator.dto.request;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorVideoVisibilityRequest {

    private Boolean hidden; // true = Ẩn video (HIDDEN), false = Hiện/Công khai (PUBLISHED)
}
