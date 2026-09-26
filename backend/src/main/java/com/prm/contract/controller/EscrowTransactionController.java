package com.prm.contract.controller;

import com.prm.contract.dto.request.EscrowTransactionRequest;
import com.prm.contract.dto.response.EscrowTransactionResponse;
import com.prm.contract.service.EscrowTransactionService;
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
@RequestMapping("/api/v1/escrow-transactions")
@RequiredArgsConstructor
@Tag(name = "EscrowTransaction Management", description = "Quản lý và thao tác dữ liệu EscrowTransaction")
public class EscrowTransactionController {

    private final EscrowTransactionService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả EscrowTransaction", description = "Trả về danh sách bản ghi EscrowTransaction")
    public ResponseEntity<ApiResponse<List<EscrowTransactionResponse>>> getAll() {
        List<EscrowTransactionResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết EscrowTransaction theo ID", description = "Trả về chi tiết một bản ghi EscrowTransaction")
    public ResponseEntity<ApiResponse<EscrowTransactionResponse>> getById(@PathVariable Long id) {
        EscrowTransactionResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới EscrowTransaction", description = "Tạo mới một bản ghi EscrowTransaction trong hệ thống")
    public ResponseEntity<ApiResponse<EscrowTransactionResponse>> create(@Valid @RequestBody EscrowTransactionRequest request) {
        EscrowTransactionResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật EscrowTransaction", description = "Cập nhật thông tin bản ghi EscrowTransaction theo ID")
    public ResponseEntity<ApiResponse<EscrowTransactionResponse>> update(@PathVariable Long id, @Valid @RequestBody EscrowTransactionRequest request) {
        EscrowTransactionResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa EscrowTransaction", description = "Xóa bản ghi EscrowTransaction khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
