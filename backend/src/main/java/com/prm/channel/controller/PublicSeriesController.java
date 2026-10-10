package com.prm.channel.controller;

import com.prm.channel.dto.response.SeriesDetailResponse;
import com.prm.channel.dto.response.SeriesResponse;
import com.prm.channel.service.SeriesService;
import com.prm.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Public Series", description = "Các API công khai dành cho khán giả khám phá Tuyển tập / Series Podcast và Video")
public class PublicSeriesController {

    private final SeriesService seriesService;

    @Operation(summary = "Xem danh sách Series của Kênh", description = "Lấy các Series công khai (PUBLISHED) thuộc về một Kênh sáng tạo")
    @GetMapping("/api/v1/channels/{channelId}/series")
    public ApiResponse<List<SeriesResponse>> getChannelSeries(@PathVariable Long channelId) {
        List<SeriesResponse> list = seriesService.getPublicChannelSeries(channelId);
        return ApiResponse.success("Lấy danh sách Series của kênh thành công", list);
    }

    @Operation(summary = "Xem chi tiết Series và danh sách tập", description = "Lấy thông tin Series công khai và toàn bộ danh sách các tập podcast theo thứ tự phát")
    @GetMapping("/api/v1/series/{seriesId}")
    public ApiResponse<SeriesDetailResponse> getSeriesDetail(@PathVariable Long seriesId) {
        SeriesDetailResponse detail = seriesService.getPublicSeriesDetail(seriesId);
        return ApiResponse.success("Lấy chi tiết Series thành công", detail);
    }
}
