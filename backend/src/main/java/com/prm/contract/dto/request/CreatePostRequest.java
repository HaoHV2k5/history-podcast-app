package com.prm.contract.dto.request;

import com.prm.contract.constant.PostType;
import com.prm.contract.constant.ServiceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {

    @NotNull(message = "Loại bài đăng (type) không được để trống")
    private PostType type; // BOOKING | JOB_SEEKING

    @NotNull(message = "Loại dịch vụ (serviceType) không được để trống")
    private ServiceType serviceType; // CONTENT | VOICE

    @NotBlank(message = "Tiêu đề bài đăng không được để trống")
    @Size(max = 255, message = "Tiêu đề không vượt quá 255 ký tự")
    private String title;

    @NotBlank(message = "Nội dung mô tả không được để trống")
    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Mức giá tham khảo phải lớn hơn 0")
    private BigDecimal referencePrice;

    private Integer expiresInDays; // Số ngày hết hạn bài đăng (mặc định 30 ngày nếu null)
}
