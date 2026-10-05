package com.prm.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FreelancerOnboardRequest {

    @NotBlank(message = "Tiêu đề chuyên môn không được để trống")
    @Size(max = 255, message = "Tiêu đề chuyên môn không vượt quá 255 ký tự")
    private String headline;

    @Size(max = 5000, message = "Giới thiệu bản thân không vượt quá 5000 ký tự")
    private String bio;

    private String skills;

    @Size(max = 1000, message = "Đường dẫn portfolio không vượt quá 1000 ký tự")
    private String portfolioUrl;
}
