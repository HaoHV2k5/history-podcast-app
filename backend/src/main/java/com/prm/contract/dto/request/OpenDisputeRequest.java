package com.prm.contract.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenDisputeRequest {

    @NotNull(message = "ID của milestone không được để trống")
    private Long milestoneId;

    @NotBlank(message = "Lý do khiếu nại/tranh chấp không được để trống")
    private String reason;

    private String evidence; // Nội dung giải trình hoặc link bằng chứng

    private List<String> attachmentUrls; // Danh sách đường dẫn tệp bằng chứng (Ảnh, PDF, DOCX, Audio, Video)
}
