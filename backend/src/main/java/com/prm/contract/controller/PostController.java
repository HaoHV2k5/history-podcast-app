package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.PostType;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.dto.request.ApplyPostRequest;
import com.prm.contract.dto.request.CreatePostRequest;
import com.prm.contract.dto.request.UpdatePostRequest;
import com.prm.contract.dto.response.ApplicationResponse;
import com.prm.contract.dto.response.PostResponse;
import com.prm.contract.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
@Tag(name = "Post Management", description = "Quản lý bài đăng Booking (Creator) và Tìm việc (Freelancer), ứng tuyển")
@SecurityRequirement(name = "Bearer Authentication")
public class PostController {

    private final PostService postService;

    @PostMapping
    @Operation(summary = "Đăng bài mới", description = "Creator đăng bài BOOKING, Freelancer đăng bài JOB_SEEKING")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(@Valid @RequestBody CreatePostRequest request) {
        PostResponse response = postService.createPost(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng bài thành công", response));
    }

    @GetMapping
    @Operation(summary = "Tìm kiếm / Lọc danh sách bài đăng", description = "Tìm bài theo loại (BOOKING/JOB_SEEKING), loại dịch vụ, khoảng giá, từ khóa")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> searchPosts(
            @RequestParam(required = false) PostType type,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String keyword,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<PostResponse> response = postService.searchPosts(type, serviceType, minPrice, maxPrice, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Xem danh sách bài đăng của tôi", description = "Lấy các bài đăng do tài khoản hiện tại tạo")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getMyPosts(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<PostResponse> response = postService.getMyPosts(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết bài đăng theo ID")
    public ResponseEntity<ApiResponse<PostResponse>> getPostById(@PathVariable Long id) {
        PostResponse response = postService.getPostById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật bài đăng của tôi")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePostRequest request
    ) {
        PostResponse response = postService.updatePost(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bài đăng thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Đóng / Xóa bài đăng")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Đóng bài đăng thành công", null));
    }

    @PostMapping("/{id}/apply")
    @Operation(summary = "Ứng tuyển vào bài đăng BOOKING", description = "Freelancer gửi báo giá và lời nhắn ứng tuyển")
    public ResponseEntity<ApiResponse<ApplicationResponse>> applyToPost(
            @PathVariable Long id,
            @Valid @RequestBody ApplyPostRequest request
    ) {
        ApplicationResponse response = postService.applyToPost(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi đơn ứng tuyển thành công", response));
    }

    @GetMapping("/{id}/applications")
    @Operation(summary = "Xem danh sách ứng viên của bài đăng", description = "Chỉ chủ bài đăng (Creator) mới có quyền xem")
    public ResponseEntity<ApiResponse<PageResponse<ApplicationResponse>>> getApplicationsByPost(
            @PathVariable Long id,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<ApplicationResponse> response = postService.getApplicationsByPost(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/applications/me")
    @Operation(summary = "Xem danh sách các đơn ứng tuyển của tôi", description = "Dành cho Freelancer")
    public ResponseEntity<ApiResponse<PageResponse<ApplicationResponse>>> getMyApplications(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<ApplicationResponse> response = postService.getMyApplications(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/applications/{applicantId}/choose")
    @Operation(summary = "Chọn ứng viên", description = "Creator chọn Freelancer ứng tuyển, chuyển post sang IN_CONTRACT để tạo hợp đồng")
    public ResponseEntity<ApiResponse<ApplicationResponse>> chooseApplicant(
            @PathVariable Long id,
            @PathVariable Long applicantId
    ) {
        ApplicationResponse response = postService.chooseApplicant(id, applicantId);
        return ResponseEntity.ok(ApiResponse.success("Chọn ứng viên thành công", response));
    }
}
