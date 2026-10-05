package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.DisputeStatus;
import com.prm.contract.dto.request.CounterEvidenceRequest;
import com.prm.contract.dto.request.OpenDisputeRequest;
import com.prm.contract.dto.request.ResolveDisputeRequest;
import com.prm.contract.dto.response.DisputeResponse;
import com.prm.contract.service.DisputeService;
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
@RequestMapping("/api/v1/disputes")
@RequiredArgsConstructor
@Tag(name = "Dispute Management", description = "Quản lý khiếu nại, tranh chấp hợp đồng và phân xử Admin")
@SecurityRequirement(name = "Bearer Authentication")
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping
    @Operation(summary = "Mở khiếu nại / tranh chấp (Report Dispute)", description = "Creator hoặc Freelancer mở khiếu nại khi milestone IN_PROGRESS/SUBMITTED/APPROVED. Khoản ký quỹ bị đóng băng (FROZEN)")
    public ResponseEntity<ApiResponse<DisputeResponse>> openDispute(@Valid @RequestBody OpenDisputeRequest request) {
        DisputeResponse response = disputeService.openDispute(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mở khiếu nại thành công, khoản ký quỹ đã được đóng băng để Admin phân xử", response));
    }

    @PostMapping("/{id}/counter-evidence")
    @Operation(summary = "Bên còn lại nộp bằng chứng phản hồi", description = "Bên bị khiếu nại gửi thêm giải trình và bằng chứng đối chứng")
    public ResponseEntity<ApiResponse<DisputeResponse>> submitCounterEvidence(
            @PathVariable Long id,
            @Valid @RequestBody CounterEvidenceRequest request
    ) {
        DisputeResponse response = disputeService.submitCounterEvidence(id, request);
        return ResponseEntity.ok(ApiResponse.success("Nộp bằng chứng phản hồi thành công", response));
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Admin phân xử tranh chấp", description = "Admin đưa ra kết quả phân xử: 100% Freelancer, 100% Creator, hoặc Chia tỉ lệ %")
    public ResponseEntity<ApiResponse<DisputeResponse>> resolveDispute(
            @PathVariable Long id,
            @Valid @RequestBody ResolveDisputeRequest request
    ) {
        DisputeResponse response = disputeService.resolveDispute(id, request);
        return ResponseEntity.ok(ApiResponse.success("Phân xử tranh chấp thành công, tiền ký quỹ đã được xử lý", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết tranh chấp theo ID")
    public ResponseEntity<ApiResponse<DisputeResponse>> getById(@PathVariable Long id) {
        DisputeResponse response = disputeService.getDisputeById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/contract/{contractId}")
    @Operation(summary = "Xem danh sách tranh chấp của một hợp đồng")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getByContract(@PathVariable Long contractId) {
        List<DisputeResponse> response = disputeService.getDisputesByContract(contractId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Admin lấy danh sách tất cả tranh chấp", description = "Lọc theo trạng thái (OPEN/RESOLVED)")
    public ResponseEntity<ApiResponse<PageResponse<DisputeResponse>>> getAllDisputes(
            @RequestParam(required = false) DisputeStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<DisputeResponse> response = disputeService.getAllDisputes(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
