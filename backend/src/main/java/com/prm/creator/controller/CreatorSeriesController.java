package com.prm.creator.controller;

import com.prm.channel.dto.request.AddSeriesItemRequest;
import com.prm.channel.dto.request.CreateSeriesRequest;
import com.prm.channel.dto.request.ReorderSeriesItemsRequest;
import com.prm.channel.dto.request.UpdateSeriesRequest;
import com.prm.channel.dto.response.SeriesDetailResponse;
import com.prm.channel.dto.response.SeriesResponse;
import com.prm.channel.service.SeriesService;
import com.prm.common.dto.ApiResponse;
import com.prm.common.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/creator/series")
@RequiredArgsConstructor
@Tag(name = "Creator Series Management", description = "Quản lý Tuyển tập / Series Podcast và Video dành riêng cho Creator")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('CREATOR')")
public class CreatorSeriesController {

    private final SeriesService seriesService;

    @Operation(summary = "Tạo Series mới", description = "Tạo một Series/Tuyển tập mới và có thể gán danh sách các video ban đầu vào Series")
    @PostMapping
    public ApiResponse<SeriesResponse> createSeries(@Valid @RequestBody CreateSeriesRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        SeriesResponse response = seriesService.createSeries(email, request);
        return ApiResponse.success("Tạo Series thành công", response);
    }

    @Operation(summary = "Danh sách Series của Creator", description = "Lấy toàn bộ các Series thuộc kênh của Creator kèm số lượng tập và thời lượng")
    @GetMapping
    public ApiResponse<List<SeriesResponse>> getMySeries() {
        String email = SecurityUtils.getCurrentUserEmail();
        List<SeriesResponse> list = seriesService.getCreatorSeries(email);
        return ApiResponse.success("Lấy danh sách Series thành công", list);
    }

    @Operation(summary = "Chi tiết Series", description = "Lấy thông tin chi tiết của một Series kèm danh sách tất cả các tập được sắp xếp theo thứ tự")
    @GetMapping("/{seriesId}")
    public ApiResponse<SeriesDetailResponse> getSeriesDetail(@PathVariable Long seriesId) {
        String email = SecurityUtils.getCurrentUserEmail();
        SeriesDetailResponse detail = seriesService.getSeriesDetail(email, seriesId);
        return ApiResponse.success("Lấy chi tiết Series thành công", detail);
    }

    @Operation(summary = "Cập nhật thông tin Series", description = "Chỉnh sửa tiêu đề, mô tả, ảnh bìa hoặc trạng thái ẩn/hiện của Series")
    @PutMapping("/{seriesId}")
    public ApiResponse<SeriesResponse> updateSeries(
            @PathVariable Long seriesId,
            @Valid @RequestBody UpdateSeriesRequest request
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        SeriesResponse updated = seriesService.updateSeries(email, seriesId, request);
        return ApiResponse.success("Cập nhật Series thành công", updated);
    }

    @Operation(summary = "Xóa Series", description = "Xóa một Series khỏi kênh (các video/podcast gốc vẫn được giữ nguyên)")
    @DeleteMapping("/{seriesId}")
    public ApiResponse<Void> deleteSeries(@PathVariable Long seriesId) {
        String email = SecurityUtils.getCurrentUserEmail();
        seriesService.deleteSeries(email, seriesId);
        return ApiResponse.success("Xóa Series thành công", null);
    }

    @Operation(summary = "Thêm video vào Series", description = "Thêm một video đã xuất bản vào Series, tự động gán vào cuối danh sách hoặc thứ tự chỉ định")
    @PostMapping("/{seriesId}/items")
    public ApiResponse<SeriesDetailResponse> addSeriesItem(
            @PathVariable Long seriesId,
            @Valid @RequestBody AddSeriesItemRequest request
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        SeriesDetailResponse updated = seriesService.addSeriesItem(email, seriesId, request);
        return ApiResponse.success("Thêm video vào Series thành công", updated);
    }

    @Operation(summary = "Gỡ video khỏi Series", description = "Xóa một video ra khỏi Series (không xóa video gốc khỏi hệ thống)")
    @DeleteMapping("/{seriesId}/items/{contentId}")
    public ApiResponse<SeriesDetailResponse> removeSeriesItem(
            @PathVariable Long seriesId,
            @PathVariable Long contentId
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        SeriesDetailResponse updated = seriesService.removeSeriesItem(email, seriesId, contentId);
        return ApiResponse.success("Đã gỡ video khỏi Series", updated);
    }

    @Operation(summary = "Sắp xếp lại thứ tự các tập trong Series", description = "Cập nhật lại toàn bộ thứ tự (orderNo) của các video trong Series theo danh sách ID gửi lên")
    @PutMapping("/{seriesId}/reorder")
    public ApiResponse<SeriesDetailResponse> reorderSeriesItems(
            @PathVariable Long seriesId,
            @Valid @RequestBody ReorderSeriesItemsRequest request
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        SeriesDetailResponse updated = seriesService.reorderSeriesItems(email, seriesId, request);
        return ApiResponse.success("Sắp xếp lại thứ tự các tập thành công", updated);
    }
}
