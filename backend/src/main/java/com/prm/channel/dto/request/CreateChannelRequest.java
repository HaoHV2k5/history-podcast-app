package com.prm.channel.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChannelRequest {

    @NotBlank(message = "Tên kênh không được để trống")
    @Size(min = 3, max = 100, message = "Tên kênh phải từ 3 đến 100 ký tự")
    private String name;

    @NotBlank(message = "Mô tả kênh không được để trống")
    @Size(max = 1000, message = "Mô tả kênh không được vượt quá 1000 ký tự")
    private String description;

    private String avatarUrl;

    private String coverUrl;
}
