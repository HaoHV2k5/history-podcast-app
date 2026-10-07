package com.prm.contract.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitDeliverableRequest {

    private String content;

    @Size(max = 1000, message = "Đường dẫn file không vượt quá 1000 ký tự")
    private String fileUrl;
}
