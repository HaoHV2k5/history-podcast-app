package com.prm.membership.controller;

import com.prm.membership.dto.request.MembershipPaymentRequest;
import com.prm.membership.dto.response.MembershipPaymentResponse;
import com.prm.membership.service.MembershipPaymentService;
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
@RequestMapping("/api/v1/membership-payments")
@RequiredArgsConstructor
@Tag(name = "MembershipPayment Management", description = "Quản lý và thao tác dữ liệu MembershipPayment")
public class MembershipPaymentController {

    private final MembershipPaymentService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả MembershipPayment", description = "Trả về danh sách bản ghi MembershipPayment")
    public ResponseEntity<ApiResponse<List<MembershipPaymentResponse>>> getAll() {
        List<MembershipPaymentResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết MembershipPayment theo ID", description = "Trả về chi tiết một bản ghi MembershipPayment")
    public ResponseEntity<ApiResponse<MembershipPaymentResponse>> getById(@PathVariable Long id) {
        MembershipPaymentResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới MembershipPayment", description = "Tạo mới một bản ghi MembershipPayment trong hệ thống")
    public ResponseEntity<ApiResponse<MembershipPaymentResponse>> create(@Valid @RequestBody MembershipPaymentRequest request) {
        MembershipPaymentResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật MembershipPayment", description = "Cập nhật thông tin bản ghi MembershipPayment theo ID")
    public ResponseEntity<ApiResponse<MembershipPaymentResponse>> update(@PathVariable Long id, @Valid @RequestBody MembershipPaymentRequest request) {
        MembershipPaymentResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa MembershipPayment", description = "Xóa bản ghi MembershipPayment khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
