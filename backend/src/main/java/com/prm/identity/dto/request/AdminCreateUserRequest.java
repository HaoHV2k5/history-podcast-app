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
public class AdminCreateUserRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có tối thiểu 6 ký tự")
    private String password;

    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    private String roleName; // E.g. VIEWER, CREATOR, NARRATOR, ADMIN

    private Long roleId;

    private String status; // Mặc định ACTIVE nếu null

    @Size(max = 2000, message = "Tiểu sử tối đa 2000 ký tự")
    private String bio;

    @Size(max = 1000, message = "URL ảnh đại diện tối đa 1000 ký tự")
    private String avatarUrl;
}
