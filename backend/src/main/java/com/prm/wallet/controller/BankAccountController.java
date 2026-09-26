package com.prm.wallet.controller;

import com.prm.wallet.dto.request.BankAccountRequest;
import com.prm.wallet.dto.response.BankAccountResponse;
import com.prm.wallet.service.BankAccountService;
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
@RequestMapping("/api/v1/bank-accounts")
@RequiredArgsConstructor
@Tag(name = "BankAccount Management", description = "Quản lý và thao tác dữ liệu BankAccount")
public class BankAccountController {

    private final BankAccountService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả BankAccount", description = "Trả về danh sách bản ghi BankAccount")
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getAll() {
        List<BankAccountResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết BankAccount theo ID", description = "Trả về chi tiết một bản ghi BankAccount")
    public ResponseEntity<ApiResponse<BankAccountResponse>> getById(@PathVariable Long id) {
        BankAccountResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới BankAccount", description = "Tạo mới một bản ghi BankAccount trong hệ thống")
    public ResponseEntity<ApiResponse<BankAccountResponse>> create(@Valid @RequestBody BankAccountRequest request) {
        BankAccountResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật BankAccount", description = "Cập nhật thông tin bản ghi BankAccount theo ID")
    public ResponseEntity<ApiResponse<BankAccountResponse>> update(@PathVariable Long id, @Valid @RequestBody BankAccountRequest request) {
        BankAccountResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa BankAccount", description = "Xóa bản ghi BankAccount khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
