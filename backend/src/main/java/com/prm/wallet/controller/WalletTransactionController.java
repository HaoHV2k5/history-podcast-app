package com.prm.wallet.controller;

import com.prm.wallet.dto.request.WalletTransactionRequest;
import com.prm.wallet.dto.response.WalletTransactionResponse;
import com.prm.wallet.service.WalletTransactionService;
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
@RequestMapping("/api/v1/wallet-transactions")
@RequiredArgsConstructor
@Tag(name = "WalletTransaction Management", description = "Quản lý và thao tác dữ liệu WalletTransaction")
public class WalletTransactionController {

    private final WalletTransactionService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả WalletTransaction", description = "Trả về danh sách bản ghi WalletTransaction")
    public ResponseEntity<ApiResponse<List<WalletTransactionResponse>>> getAll() {
        List<WalletTransactionResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết WalletTransaction theo ID", description = "Trả về chi tiết một bản ghi WalletTransaction")
    public ResponseEntity<ApiResponse<WalletTransactionResponse>> getById(@PathVariable Long id) {
        WalletTransactionResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới WalletTransaction", description = "Tạo mới một bản ghi WalletTransaction trong hệ thống")
    public ResponseEntity<ApiResponse<WalletTransactionResponse>> create(@Valid @RequestBody WalletTransactionRequest request) {
        WalletTransactionResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật WalletTransaction", description = "Cập nhật thông tin bản ghi WalletTransaction theo ID")
    public ResponseEntity<ApiResponse<WalletTransactionResponse>> update(@PathVariable Long id, @Valid @RequestBody WalletTransactionRequest request) {
        WalletTransactionResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa WalletTransaction", description = "Xóa bản ghi WalletTransaction khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
