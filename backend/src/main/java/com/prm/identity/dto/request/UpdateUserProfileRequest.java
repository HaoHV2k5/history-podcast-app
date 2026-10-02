package com.prm.identity.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {

    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    @Size(max = 1000, message = "URL ảnh đại diện tối đa 1000 ký tự")
    private String avatarUrl;

    @Size(max = 2000, message = "Tiểu sử (bio) tối đa 2000 ký tự")
    private String bio;
}
