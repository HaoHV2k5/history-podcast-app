package com.prm.contract.controller;

import com.prm.contract.dto.request.ContractRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.service.ContractService;
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
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
@Tag(name = "Contract Management", description = "Quản lý và thao tác dữ liệu Contract")
public class ContractController {

    private final ContractService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Contract", description = "Trả về danh sách bản ghi Contract")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getAll() {
        List<ContractResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Contract theo ID", description = "Trả về chi tiết một bản ghi Contract")
    public ResponseEntity<ApiResponse<ContractResponse>> getById(@PathVariable Long id) {
        ContractResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Contract", description = "Tạo mới một bản ghi Contract trong hệ thống")
    public ResponseEntity<ApiResponse<ContractResponse>> create(@Valid @RequestBody ContractRequest request) {
        ContractResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Contract", description = "Cập nhật thông tin bản ghi Contract theo ID")
    public ResponseEntity<ApiResponse<ContractResponse>> update(@PathVariable Long id, @Valid @RequestBody ContractRequest request) {
        ContractResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Contract", description = "Xóa bản ghi Contract khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
