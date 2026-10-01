package com.prm.channel.controller;

import com.prm.channel.dto.request.ContentRequest;
import com.prm.channel.dto.response.ContentResponse;
import com.prm.channel.dto.response.PublicVideoItemResponse;
import com.prm.channel.service.ContentService;
import com.prm.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contents")
@RequiredArgsConstructor
@Tag(name = "Content Management", description = "Quản lý và thao tác dữ liệu Content")
public class ContentController {

    private final ContentService service;

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm & lọc video công khai cho người xem", 
               description = "Tìm kiếm video đã xuất bản theo từ khóa (tiêu đề, nội dung kịch bản), lọc theo kênh, độc quyền VIP, và sắp xếp theo ngày tạo, lượt like, bình luận, thời lượng")
    public ResponseEntity<ApiResponse<List<PublicVideoItemResponse>>> searchVideos(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long channelId,
            @RequestParam(required = false) Boolean isExclusive,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir
    ) {
        List<PublicVideoItemResponse> list = service.searchPublicVideos(keyword, channelId, isExclusive, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Content", description = "Trả về danh sách bản ghi Content")
    public ResponseEntity<ApiResponse<List<ContentResponse>>> getAll() {
        List<ContentResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Content theo ID", description = "Trả về chi tiết một bản ghi Content")
    public ResponseEntity<ApiResponse<ContentResponse>> getById(@PathVariable Long id) {
        ContentResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Content", description = "Tạo mới một bản ghi Content trong hệ thống")
    public ResponseEntity<ApiResponse<ContentResponse>> create(@Valid @RequestBody ContentRequest request) {
        ContentResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Content", description = "Cập nhật thông tin bản ghi Content theo ID")
    public ResponseEntity<ApiResponse<ContentResponse>> update(@PathVariable Long id, @Valid @RequestBody ContentRequest request) {
        ContentResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Content", description = "Xóa bản ghi Content khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
