package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.contract.dto.request.CreateReviewRequest;
import com.prm.contract.dto.response.ReviewResponse;
import com.prm.contract.service.ReviewService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Review & Rating Management", description = "Đánh giá sao và nhận xét khi hoàn thành hợp đồng")
@SecurityRequirement(name = "Bearer Authentication")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/contract/{contractId}")
    @Operation(summary = "Đánh giá bên còn lại sau khi hợp đồng hoàn thành", description = "Chỉ mở khi hợp đồng ở trạng thái COMPLETED, mỗi bên chỉ đánh giá 1 lần (1..5 sao + comment)")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Long contractId,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        ReviewResponse response = reviewService.createReview(contractId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi đánh giá thành công", response));
    }

    @GetMapping("/contract/{contractId}")
    @Operation(summary = "Xem danh sách đánh giá của một hợp đồng")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviewsByContract(@PathVariable Long contractId) {
        List<ReviewResponse> response = reviewService.getReviewsByContract(contractId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Xem danh sách đánh giá uy tín của một người dùng")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getUserReviews(
            @PathVariable Long userId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<ReviewResponse> response = reviewService.getUserReviews(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
