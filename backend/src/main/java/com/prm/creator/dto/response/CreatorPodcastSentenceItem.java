package com.prm.creator.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorPodcastSentenceItem {

    private Integer index;

    private String text;

    private String audioUrl;

    private Double duration;
}
