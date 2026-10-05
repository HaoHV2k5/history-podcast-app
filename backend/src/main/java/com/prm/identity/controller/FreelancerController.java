package com.prm.identity.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.identity.dto.request.FreelancerOnboardRequest;
import com.prm.identity.dto.response.FreelancerProfileResponse;
import com.prm.identity.service.FreelancerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/freelancers")
@RequiredArgsConstructor
@Tag(name = "Freelancer Management", description = "Quản lý vai trò và hồ sơ Freelancer (Trở thành Freelancer, nhận việc)")
@SecurityRequirement(name = "Bearer Authentication")
public class FreelancerController {

    private final FreelancerService freelancerService;

    @PostMapping("/become-freelancer")
    @Operation(summary = "Trở thành Freelancer", description = "Kích hoạt vai trò FREELANCER trên tài khoản hiện tại, lưu thông tin hồ sơ và portfolio để bắt đầu nhận việc")
    public ResponseEntity<ApiResponse<FreelancerProfileResponse>> becomeFreelancer(@Valid @RequestBody FreelancerOnboardRequest request) {
        FreelancerProfileResponse response = freelancerService.onboard(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chúc mừng! Bạn đã kích hoạt thành công vai trò Freelancer", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Xem hồ sơ Freelancer của tôi", description = "Lấy thông tin chi tiết hồ sơ chuyên môn Freelancer của tài khoản hiện tại")
    public ResponseEntity<ApiResponse<FreelancerProfileResponse>> getMyProfile() {
        FreelancerProfileResponse response = freelancerService.getMyProfile();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @Operation(summary = "Cập nhật hồ sơ Freelancer của tôi", description = "Cập nhật tiêu đề, tiểu sử, kỹ năng, hoặc liên kết portfolio của Freelancer")
    public ResponseEntity<ApiResponse<FreelancerProfileResponse>> updateMyProfile(@Valid @RequestBody FreelancerOnboardRequest request) {
        FreelancerProfileResponse response = freelancerService.updateMyProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ Freelancer thành công", response));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Xem hồ sơ Freelancer theo User ID", description = "Xem thông tin hồ sơ năng lực Freelancer công khai của người dùng")
    public ResponseEntity<ApiResponse<FreelancerProfileResponse>> getProfileByUserId(@PathVariable Long userId) {
        FreelancerProfileResponse response = freelancerService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
