package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.dto.request.CreateContractRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.service.ContractService;
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

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
@Tag(name = "Contract Management", description = "Quản lý hợp đồng Creator - Freelancer (tạo, duyệt, từ chối, hủy)")
@SecurityRequirement(name = "Bearer Authentication")
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    @Operation(summary = "Creator tạo & gửi hợp đồng", description = "Creator tạo hợp đồng với các milestone, hợp đồng ở trạng thái PENDING chờ Freelancer chấp thuận trong 48h")
    public ResponseEntity<ApiResponse<ContractResponse>> createAndSendContract(@Valid @RequestBody CreateContractRequest request) {
        ContractResponse response = contractService.createAndSendContract(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo và gửi hợp đồng thành công (Chờ Freelancer phản hồi)", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết hợp đồng theo ID", description = "Xem chi tiết hợp đồng kèm danh sách milestone, tiến độ và trạng thái ký quỹ")
    public ResponseEntity<ApiResponse<ContractResponse>> getById(@PathVariable Long id) {
        ContractResponse response = contractService.getContractById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy danh sách hợp đồng của tôi", description = "Xem các hợp đồng của người dùng hiện tại (với vai trò Creator hoặc Freelancer)")
    public ResponseEntity<ApiResponse<PageResponse<ContractResponse>>> getMyContracts(
            @RequestParam(required = false) ContractStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<ContractResponse> response = contractService.getMyContracts(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Freelancer chấp nhận hợp đồng", description = "Hợp đồng chuyển sang ACTIVE, khóa điều khoản, Milestone #1 chuyển sang UNFUNDED để Creator ký quỹ")
    public ResponseEntity<ApiResponse<ContractResponse>> acceptContract(@PathVariable Long id) {
        ContractResponse response = contractService.acceptContract(id);
        return ResponseEntity.ok(ApiResponse.success("Chấp nhận hợp đồng thành công! Đã gửi thông báo yêu cầu Creator ký quỹ Milestone #1", response));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Freelancer từ chối hợp đồng", description = "Hợp đồng chuyển sang REJECTED, bài đăng (nếu có) được mở lại OPEN")
    public ResponseEntity<ApiResponse<ContractResponse>> rejectContract(@PathVariable Long id) {
        ContractResponse response = contractService.rejectContract(id);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối hợp đồng", response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy hợp đồng khi còn ở trạng thái PENDING", description = "Creator có thể chủ động hủy hợp đồng trước khi Freelancer chấp thuận")
    public ResponseEntity<ApiResponse<ContractResponse>> cancelContract(@PathVariable Long id) {
        ContractResponse response = contractService.cancelContract(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy hợp đồng thành công", response));
    }
}
