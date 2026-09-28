package com.prm.channel.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateChannelRequest {

    @Size(min = 3, max = 100, message = "Tên kênh phải từ 3 đến 100 ký tự")
    private String name;

    @Size(max = 1000, message = "Mô tả kênh không được vượt quá 1000 ký tự")
    private String description;

    private String avatarUrl;

    private String coverUrl;
}
