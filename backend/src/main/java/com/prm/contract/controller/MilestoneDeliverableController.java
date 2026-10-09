package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.contract.dto.response.MilestoneDeliverableResponse;
import com.prm.contract.entity.MilestoneDeliverable;
import com.prm.contract.service.MilestoneDeliverableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Milestone Deliverables", description = "Quản lý sản phẩm đầu ra theo từng giai đoạn Milestone & liên kết bài Post")
@SecurityRequirement(name = "Bearer Authentication")
public class MilestoneDeliverableController {

    private final MilestoneDeliverableService deliverableService;

    @PostMapping(value = "/api/v1/milestones/{milestoneId}/deliverables", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Freelancer tải lên sản phẩm đầu ra cho Milestone",
            description = "Tải tệp sản phẩm (PDF, ZIP, tài liệu...), tự động lưu phiên bản, liên kết với Post và chuyển Milestone sang SUBMITTED")
    public ResponseEntity<ApiResponse<MilestoneDeliverableResponse>> uploadDeliverable(
            @PathVariable Long milestoneId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestPart("file") MultipartFile file
    ) {
        MilestoneDeliverableResponse response = deliverableService.uploadDeliverable(milestoneId, title, description, file);
        return ResponseEntity.ok(ApiResponse.success("Nộp sản phẩm đầu ra thành công!", response));
    }

    @GetMapping("/api/v1/milestones/{milestoneId}/deliverables")
    @Operation(summary = "Lấy danh sách sản phẩm đầu ra của một Milestone",
            description = "Chỉ Creator và Freelancer của hợp đồng mới có quyền xem danh sách này")
    public ResponseEntity<ApiResponse<List<MilestoneDeliverableResponse>>> getDeliverablesByMilestone(
            @PathVariable Long milestoneId
    ) {
        List<MilestoneDeliverableResponse> list = deliverableService.getDeliverablesByMilestone(milestoneId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/api/v1/posts/{postId}/deliverables")
    @Operation(summary = "Lấy danh sách tất cả sản phẩm đầu ra của các hợp đồng thuộc bài đăng Post",
            description = "Dành cho chủ bài đăng Post hoặc Freelancer nhận việc để theo dõi các sản phẩm đã bàn giao")
    public ResponseEntity<ApiResponse<List<MilestoneDeliverableResponse>>> getDeliverablesByPost(
            @PathVariable Long postId
    ) {
        List<MilestoneDeliverableResponse> list = deliverableService.getDeliverablesByPost(postId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/api/v1/deliverables/{id}/view")
    @Operation(summary = "Xem trực tiếp file sản phẩm trên hệ thống (Preview/Inline)",
            description = "Hiển thị trực tiếp file (PDF, hình ảnh, tài liệu...) trên trình duyệt/app mà không cần tải về máy. Đảm bảo bảo mật kiểm tra token.")
    public ResponseEntity<Resource> viewDeliverable(@PathVariable Long id) {
        return buildFileResponse(id, false);
    }

    @GetMapping("/api/v1/deliverables/{id}/download")
    @Operation(summary = "Tải file sản phẩm về máy (Download/Attachment)",
            description = "Kiểm tra quyền thành viên hợp đồng trước khi cấp phát stream tải file. Ngăn chặn người ngoài tiếp cận trái phép.")
    public ResponseEntity<Resource> downloadDeliverable(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "true") boolean download
    ) {
        return buildFileResponse(id, download);
    }

    private ResponseEntity<Resource> buildFileResponse(Long id, boolean asAttachment) {
        MilestoneDeliverable deliverable = deliverableService.getDeliverableEntity(id);
        Resource resource = deliverableService.downloadDeliverable(id);

        String encodedFileName = URLEncoder.encode(deliverable.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");
        String contentType = deliverable.getContentType() != null ? deliverable.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        String disposition = asAttachment ? "attachment" : "inline";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + deliverable.getFileName() + "\"; filename*=UTF-8''" + encodedFileName)
                .body(resource);
    }
}
