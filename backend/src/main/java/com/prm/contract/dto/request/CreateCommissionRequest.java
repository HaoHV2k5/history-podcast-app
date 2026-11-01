package com.prm.contract.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommissionRequest {

    @Schema(description = "ID của Kênh Podcast muốn đặt làm nội dung (Ưu tiên truyền channelId hoặc creatorId)", example = "1")
    private Long channelId;

    @Schema(description = "ID của Creator chủ kênh (Tùy chọn nếu đã truyền channelId)", example = "2")
    private Long creatorId;

    @Schema(description = "Loại nội dung muốn đặt: SINGLE_VIDEO (Video/Podcast lẻ) hoặc SERIES (Chuỗi nhiều tập). Không hỗ trợ LIVESTREAM.", example = "SERIES", allowableValues = {"SINGLE_VIDEO", "SERIES"})
    private String contentType;

    @NotBlank(message = "Tiêu đề đề tài đặt làm nội dung không được để trống")
    @Size(max = 255, message = "Tiêu đề đề tài không vượt quá 255 ký tự")
    @Schema(description = "Tiêu đề đề tài lịch sử muốn đặt Creator sản xuất", example = "Series 3 tập: Toàn cảnh Chiến dịch Điện Biên Phủ 1954")
    private String title;

    @NotBlank(message = "Mô tả chi tiết yêu cầu không được để trống")
    @Size(max = 5000, message = "Mô tả chi tiết không vượt quá 5000 ký tự")
    @Schema(description = "Mô tả chi tiết mong muốn của người nghe (góc nhìn lịch sử, thời lượng mong muốn, phong cách kể chuyện...)", example = "Mình muốn đặt 3 tập phân tích sâu về hậu cần và chiến thuật pháo binh tại Điện Biên Phủ, mỗi tập khoảng 20-25 phút.")
    private String description;
}
