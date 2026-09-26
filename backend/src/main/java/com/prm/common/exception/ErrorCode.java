package com.prm.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Common System Errors (1000 - 1999)
    INTERNAL_SERVER_ERROR("ERR_1000", "Lỗi hệ thống máy chủ nội bộ", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST_DATA("ERR_1001", "Dữ liệu yêu cầu không hợp lệ hoặc thiếu trường bắt buộc", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("ERR_1002", "Không tìm thấy tài nguyên yêu cầu", HttpStatus.NOT_FOUND),
    UNAUTHORIZED_ACCESS("ERR_1003", "Yêu cầu cần xác thực trước khi thực hiện", HttpStatus.UNAUTHORIZED),
    FORBIDDEN_ACCESS("ERR_1004", "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),

    // Authentication & User Identity Errors (2000 - 2999)
    USER_NOT_FOUND("AUTH_2001", "Tài khoản không tồn tại trên hệ thống", HttpStatus.NOT_FOUND),
    INVALID_CREDENTIALS("AUTH_2002", "Email hoặc mật khẩu không chính xác", HttpStatus.BAD_REQUEST),
    ACCOUNT_INACTIVE_OR_LOCKED("AUTH_2003", "Tài khoản chưa được kích hoạt hoặc đang bị tạm khóa", HttpStatus.FORBIDDEN),
    EMAIL_ALREADY_EXISTS("AUTH_2004", "Địa chỉ email đã được đăng ký", HttpStatus.BAD_REQUEST),
    PHONE_ALREADY_EXISTS("AUTH_2005", "Số điện thoại đã được đăng ký", HttpStatus.BAD_REQUEST),
    PASSWORD_CONFIRM_NOT_MATCH("AUTH_2006", "Mật khẩu và xác nhận mật khẩu không trùng khớp", HttpStatus.BAD_REQUEST),
    INVALID_OR_EXPIRED_REFRESH_TOKEN("AUTH_2007", "Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REVOKED("AUTH_2008", "Refresh token đã bị thu hồi", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_FOUND("AUTH_2009", "Vai trò (Role) người dùng không tồn tại", HttpStatus.NOT_FOUND);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
