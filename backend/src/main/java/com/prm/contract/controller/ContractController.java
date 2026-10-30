package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.dto.request.CreateContractRequest;
import com.prm.contract.dto.request.UpdateContractRequest;
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
@Tag(name = "Contract & Milestone Roadmap Management", description = "Quản lý hợp đồng & lộ trình Milestone giữa Người đặt nội dung (Listener) và Creator (tạo, chỉnh sửa lộ trình, duyệt, từ chối, hủy)")
@SecurityRequirement(name = "Bearer Authentication")
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    @Operation(summary = "Creator lập & gửi lộ trình Milestone (Hợp đồng)",
               description = "Creator tạo lộ trình từ 1 đến tối đa 20 milestone cho đơn đặt nội dung. Hợp đồng ở trạng thái PENDING chờ Người thuê chấp thuận toàn bộ lộ trình trong 48h")
    public ResponseEntity<ApiResponse<ContractResponse>> createAndSendContract(@Valid @RequestBody CreateContractRequest request) {
        ContractResponse response = contractService.createAndSendContract(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo và gửi lộ trình Milestone thành công (Chờ Người thuê phản hồi)", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Creator chỉnh sửa toàn bộ lộ trình Milestone & gửi lại",
               description = "Khi hợp đồng đang ở trạng thái PENDING hoặc REJECTED (chưa nạp tiền ký quỹ), Creator có thể thêm/bớt/gộp milestone và gửi lại cho Người thuê duyệt")
    public ResponseEntity<ApiResponse<ContractResponse>> updatePendingContract(
            @PathVariable Long id,
            @Valid @RequestBody UpdateContractRequest request
    ) {
        ContractResponse response = contractService.updatePendingContract(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật và gửi lại lộ trình Milestone thành công", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết hợp đồng theo ID", description = "Xem chi tiết hợp đồng kèm danh sách milestone, tiến độ và trạng thái ký quỹ")
    public ResponseEntity<ApiResponse<ContractResponse>> getById(@PathVariable Long id) {
        ContractResponse response = contractService.getContractById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy danh sách hợp đồng của tôi", description = "Xem các hợp đồng của người dùng hiện tại (với vai trò Creator hoặc Người đặt nội dung)")
    public ResponseEntity<ApiResponse<PageResponse<ContractResponse>>> getMyContracts(
            @RequestParam(required = false) ContractStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<ContractResponse> response = contractService.getMyContracts(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-milestones")
    @Operation(summary = "Lấy danh sách milestone của tôi", description = "Xem các milestone của người dùng hiện tại, có thể lọc theo trạng thái và hợp đồng")
    public ResponseEntity<ApiResponse<PageResponse<com.prm.contract.dto.response.MilestoneResponse>>> getMyMilestones(
            @RequestParam(required = false) com.prm.contract.constant.MilestoneStatus status,
            @RequestParam(required = false) Long contractId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<com.prm.contract.dto.response.MilestoneResponse> response = contractService.getMyMilestones(status, contractId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/milestone-financials")
    @Operation(summary = "Xem tổng quan tài chính milestone của tôi",
               description = "Creator xem thu nhập thực nhận (95%), chờ nhận, phí sàn (5%); Người thuê xem chi tiêu, tiền escrow đang giữ, hoàn tiền")
    public ResponseEntity<ApiResponse<com.prm.contract.dto.response.MyMilestoneFinancialResponse>> getMyMilestoneFinancials() {
        com.prm.contract.dto.response.MyMilestoneFinancialResponse response = contractService.getMyMilestoneFinancials();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Người thuê chấp nhận toàn bộ lộ trình Milestone",
               description = "Hợp đồng chuyển sang ACTIVE, mở khóa duy nhất Milestone #1 sang UNFUNDED để Người thuê nạp tiền ký quỹ trong 48h (các Milestone tiếp theo giữ trạng thái WAITING)")
    public ResponseEntity<ApiResponse<ContractResponse>> acceptContract(@PathVariable Long id) {
        ContractResponse response = contractService.acceptContract(id);
        return ResponseEntity.ok(ApiResponse.success("Chấp thuận lộ trình Milestone thành công! Vui lòng nạp tiền ký quỹ cho Milestone #1 để bắt đầu", response));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Người thuê từ chối lộ trình Milestone để thương lượng lại",
               description = "Hợp đồng chuyển sang REJECTED, đơn HireRequest quay về ACCEPTED để hai bên trao đổi thêm và Creator chỉnh sửa/gộp/xóa milestone rồi gửi lại")
    public ResponseEntity<ApiResponse<ContractResponse>> rejectContract(@PathVariable Long id) {
        ContractResponse response = contractService.rejectContract(id);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối lộ trình Milestone để thương lượng lại", response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy hợp đồng khi còn ở trạng thái PENDING hoặc REJECTED",
               description = "Creator hoặc Người thuê có thể chủ động hủy hợp đồng trước khi nạp tiền ký quỹ, giải phóng giới hạn 1 đơn đang thực hiện")
    public ResponseEntity<ApiResponse<ContractResponse>> cancelContract(@PathVariable Long id) {
        ContractResponse response = contractService.cancelContract(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy hợp đồng thành công", response));
    }
}
