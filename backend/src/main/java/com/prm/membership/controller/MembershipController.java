package com.prm.membership.controller;

import com.prm.membership.dto.request.MembershipRequest;
import com.prm.membership.dto.response.MembershipResponse;
import com.prm.membership.service.MembershipService;
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
@RequestMapping("/api/v1/memberships")
@RequiredArgsConstructor
@Tag(name = "Membership Management", description = "Quản lý và thao tác dữ liệu Membership")
public class MembershipController {

    private final MembershipService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Membership", description = "Trả về danh sách bản ghi Membership")
    public ResponseEntity<ApiResponse<List<MembershipResponse>>> getAll() {
        List<MembershipResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Membership theo ID", description = "Trả về chi tiết một bản ghi Membership")
    public ResponseEntity<ApiResponse<MembershipResponse>> getById(@PathVariable Long id) {
        MembershipResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Membership", description = "Tạo mới một bản ghi Membership trong hệ thống")
    public ResponseEntity<ApiResponse<MembershipResponse>> create(@Valid @RequestBody MembershipRequest request) {
        MembershipResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Membership", description = "Cập nhật thông tin bản ghi Membership theo ID")
    public ResponseEntity<ApiResponse<MembershipResponse>> update(@PathVariable Long id, @Valid @RequestBody MembershipRequest request) {
        MembershipResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Membership", description = "Xóa bản ghi Membership khỏi hệ thống theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}
