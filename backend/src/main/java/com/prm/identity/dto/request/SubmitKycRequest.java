package com.prm.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitKycRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 255, message = "Họ và tên phải từ 2 đến 255 ký tự")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @NotBlank(message = "Email liên hệ không được để trống")
    @Email(message = "Email liên hệ không đúng định dạng")
    private String contactEmail;

    @NotBlank(message = "Tên ngân hàng không được để trống")
    private String bankName;

    @NotBlank(message = "Số tài khoản ngân hàng không được để trống")
    private String bankAccountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    private String bankAccountHolder;

    private String bio;

    private String portfolioUrl;
}
