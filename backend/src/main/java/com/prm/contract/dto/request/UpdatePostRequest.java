package com.prm.contract.dto.request;

import com.prm.contract.constant.PostStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePostRequest {

    @Size(max = 255, message = "Tiêu đề không vượt quá 255 ký tự")
    private String title;

    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Mức giá tham khảo phải lớn hơn 0")
    private BigDecimal referencePrice;

    private PostStatus status;
}
