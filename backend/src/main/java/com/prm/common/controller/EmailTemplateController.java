package com.prm.common.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.request.EmailTemplateRequest;
import com.prm.common.dto.response.EmailTemplateResponse;
import com.prm.common.service.EmailTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/email-templates")
@RequiredArgsConstructor
@Tag(name = "Email Template Management", description = "Quản lý và tùy biến các mẫu giao diện Email HTML lưu trong Database")
public class EmailTemplateController {

    private final EmailTemplateService service;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả Email Template", description = "Trả về toàn bộ các mẫu email HTML đang có trong hệ thống")
    public ResponseEntity<ApiResponse<List<EmailTemplateResponse>>> getAll() {
        List<EmailTemplateResponse> list = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết Email Template theo ID", description = "Trả về chi tiết một mẫu email bao gồm mã, tiêu đề và mã nguồn HTML")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> getById(@PathVariable Long id) {
        EmailTemplateResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Lấy chi tiết Email Template theo Code", description = "Tìm kiếm mẫu email theo mã định danh duy nhất (ví dụ: FORGOT_PASSWORD_OTP)")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> getByCode(@PathVariable String code) {
        EmailTemplateResponse response = service.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo mới một Email Template", description = "Tạo mới mẫu email với giao diện HTML và các biến thay thế dạng {{tên_biến}}")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> create(@Valid @RequestBody EmailTemplateRequest request) {
        EmailTemplateResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo mới email template thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Email Template", description = "Thay đổi giao diện HTML, tiêu đề hoặc nội dung email template tại runtime mà không cần sửa code")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EmailTemplateRequest request) {
        EmailTemplateResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật email template thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa Email Template", description = "Xóa mẫu email template khỏi cơ sở dữ liệu")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa email template thành công", null));
    }
}
