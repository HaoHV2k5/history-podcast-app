package com.prm.wallet.controller;

import com.prm.wallet.dto.request.WalletRequest;
import com.prm.wallet.dto.response.WalletResponse;
import com.prm.wallet.service.WalletService;
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
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallet Management", description = "Quản lý và thao tác dữ liệu Wallet")
public class WalletController {

    private final WalletService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Wallet", description = "Trả về danh sách bản ghi Wallet")
    public ResponseEntity<ApiResponse<List<WalletResponse>>> getAll() {
        List<WalletResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Wallet theo ID", description = "Trả về chi tiết một bản ghi Wallet")
    public ResponseEntity<ApiResponse<WalletResponse>> getById(@PathVariable Long id) {
        WalletResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Wallet", description = "Tạo mới một bản ghi Wallet trong hệ thống")
    public ResponseEntity<ApiResponse<WalletResponse>> create(@Valid @RequestBody WalletRequest request) {
        WalletResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Wallet", description = "Cập nhật thông tin bản ghi Wallet theo ID")
    public ResponseEntity<ApiResponse<WalletResponse>> update(@PathVariable Long id, @Valid @RequestBody WalletRequest request) {
        WalletResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Wallet", description = "Xóa bản ghi Wallet khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
