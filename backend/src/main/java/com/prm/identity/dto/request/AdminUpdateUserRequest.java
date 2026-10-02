package com.prm.identity.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserRequest {

    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    private String roleName;

    private Long roleId;

    private String status;

    @Size(max = 2000, message = "Tiểu sử tối đa 2000 ký tự")
    private String bio;

    @Size(max = 1000, message = "URL ảnh đại diện tối đa 1000 ký tự")
    private String avatarUrl;
}
