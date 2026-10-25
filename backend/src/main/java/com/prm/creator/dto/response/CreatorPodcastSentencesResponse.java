package com.prm.creator.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorPodcastSentencesResponse {

    private String jobId;

    private String topic;

    private String ttsEngine;

    private String voiceName;

    private List<CreatorPodcastSentenceItem> sentences;
}
