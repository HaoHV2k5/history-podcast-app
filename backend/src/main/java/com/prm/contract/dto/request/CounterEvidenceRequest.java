package com.prm.contract.dto.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CounterEvidenceRequest {

    private String counterEvidence;

    private List<String> attachmentUrls; // Danh sách đường dẫn tệp bằng chứng đối chất (Ảnh, PDF, DOCX, Audio, Video)
}
