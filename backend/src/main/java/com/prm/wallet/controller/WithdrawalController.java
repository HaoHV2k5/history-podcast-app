package com.prm.wallet.controller;

import com.prm.wallet.dto.request.WithdrawalRequest;
import com.prm.wallet.dto.response.WithdrawalResponse;
import com.prm.wallet.service.WithdrawalService;
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
@RequestMapping("/api/v1/withdrawals")
@RequiredArgsConstructor
@Tag(name = "Withdrawal Management", description = "Quản lý và thao tác dữ liệu Withdrawal")
public class WithdrawalController {

    private final WithdrawalService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Withdrawal", description = "Trả về danh sách bản ghi Withdrawal")
    public ResponseEntity<ApiResponse<List<WithdrawalResponse>>> getAll() {
        List<WithdrawalResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Withdrawal theo ID", description = "Trả về chi tiết một bản ghi Withdrawal")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> getById(@PathVariable Long id) {
        WithdrawalResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Withdrawal", description = "Tạo mới một bản ghi Withdrawal trong hệ thống")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> create(@Valid @RequestBody WithdrawalRequest request) {
        WithdrawalResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Withdrawal", description = "Cập nhật thông tin bản ghi Withdrawal theo ID")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> update(@PathVariable Long id, @Valid @RequestBody WithdrawalRequest request) {
        WithdrawalResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Withdrawal", description = "Xóa bản ghi Withdrawal khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
