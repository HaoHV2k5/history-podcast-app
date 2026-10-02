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
    METHOD_NOT_ALLOWED("ERR_1005", "Phương thức HTTP không được hỗ trợ cho tài nguyên này", HttpStatus.METHOD_NOT_ALLOWED),

    // Authentication & User Identity Errors (2000 - 2999)
    USER_NOT_FOUND("AUTH_2001", "Tài khoản không tồn tại trên hệ thống", HttpStatus.NOT_FOUND),
    INVALID_CREDENTIALS("AUTH_2002", "Email hoặc mật khẩu không chính xác", HttpStatus.BAD_REQUEST),
    ACCOUNT_INACTIVE_OR_LOCKED("AUTH_2003", "Tài khoản chưa được kích hoạt hoặc đang bị tạm khóa", HttpStatus.FORBIDDEN),
    EMAIL_ALREADY_EXISTS("AUTH_2004", "Địa chỉ email đã được đăng ký", HttpStatus.BAD_REQUEST),
    PHONE_ALREADY_EXISTS("AUTH_2005", "Số điện thoại đã được đăng ký", HttpStatus.BAD_REQUEST),
    PASSWORD_CONFIRM_NOT_MATCH("AUTH_2006", "Mật khẩu và xác nhận mật khẩu không trùng khớp", HttpStatus.BAD_REQUEST),
    INVALID_OR_EXPIRED_REFRESH_TOKEN("AUTH_2007", "Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REVOKED("AUTH_2008", "Refresh token đã bị thu hồi", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_FOUND("AUTH_2009", "Vai trò (Role) người dùng không tồn tại", HttpStatus.NOT_FOUND),
    OTP_INVALID("AUTH_2010", "Mã xác thực OTP không chính xác", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED("AUTH_2011", "Mã xác thực OTP đã hết hạn sau 5 phút. Vui lòng gửi lại", HttpStatus.BAD_REQUEST),
    OTP_COOLDOWN("AUTH_2012", "Vui lòng đợi trước khi yêu cầu mã OTP mới", HttpStatus.TOO_MANY_REQUESTS),
    RESET_TOKEN_INVALID("AUTH_2013", "Mã xác nhận đặt lại mật khẩu không hợp lệ hoặc chưa được xác thực", HttpStatus.BAD_REQUEST),
    RESET_TOKEN_ALREADY_USED("AUTH_2014", "Yêu cầu đặt lại mật khẩu này đã được sử dụng trước đó", HttpStatus.BAD_REQUEST),
    OLD_PASSWORD_INCORRECT("AUTH_2015", "Mật khẩu hiện tại không chính xác", HttpStatus.BAD_REQUEST),
    CANNOT_MODIFY_OWN_ROLE("AUTH_2016", "Quản trị viên không thể tự thay đổi vai trò của chính mình", HttpStatus.BAD_REQUEST),
    CANNOT_DEACTIVATE_OWN_ACCOUNT("AUTH_2017", "Quản trị viên không thể tự khóa hoặc vô hiệu hóa tài khoản của chính mình", HttpStatus.BAD_REQUEST),
    CANNOT_DELETE_OWN_ACCOUNT("AUTH_2018", "Quản trị viên không thể tự xóa tài khoản của chính mình", HttpStatus.BAD_REQUEST),

    // KYC Creator Verification Errors (3000 - 3999)
    KYC_NOT_FOUND("KYC_3000", "Không tìm thấy hồ sơ KYC", HttpStatus.NOT_FOUND),
    KYC_REQUIRED_FOR_CHANNEL("KYC_3001", "Bạn cần hoàn tất và được duyệt KYC trước khi tạo kênh", HttpStatus.FORBIDDEN),
    KYC_ALREADY_SUBMITTED("KYC_3002", "Hồ sơ KYC của bạn đang chờ duyệt hoặc đã được phê duyệt", HttpStatus.CONFLICT),
    KYC_OTP_INVALID("KYC_3003", "Mã xác thực OTP không chính xác hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    KYC_OTP_COOLDOWN("KYC_3004", "Vui lòng đợi 60 giây trước khi yêu cầu mã OTP mới", HttpStatus.TOO_MANY_REQUESTS),
    KYC_OTP_NOT_VERIFIED("KYC_3005", "Vui lòng xác thực mã OTP email/số điện thoại trước khi nộp hồ sơ", HttpStatus.BAD_REQUEST),
    KYC_INVALID_STATUS("KYC_3006", "Trạng thái phê duyệt không hợp lệ", HttpStatus.BAD_REQUEST),
    FIREBASE_TOKEN_INVALID("KYC_3007", "Mã xác thực Firebase (IdToken) không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    PHONE_NUMBER_MISMATCH("KYC_3008", "Số điện thoại gửi lên không khớp với số đã xác thực qua Firebase", HttpStatus.BAD_REQUEST),

    // Channel Management Errors (4000 - 4999)
    CHANNEL_NAME_EXISTS("CHAN_4001", "Tên kênh đã tồn tại, vui lòng chọn tên khác", HttpStatus.CONFLICT),
    CHANNEL_ALREADY_EXISTS("CHAN_4002", "Mỗi nhà sáng tạo chỉ được phép tạo tối đa 1 kênh", HttpStatus.CONFLICT),
    CHANNEL_NOT_FOUND("CHAN_4003", "Không tìm thấy kênh", HttpStatus.NOT_FOUND),
    CHANNEL_ACCESS_DENIED("CHAN_4004", "Bạn không có quyền chỉnh sửa kênh này", HttpStatus.FORBIDDEN),

    // File Storage & Media Errors (5000 - 5999)
    FILE_EMPTY("FILE_5001", "Tệp tải lên không được để trống", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE("FILE_5002", "Dung lượng tệp vượt quá giới hạn cho phép", HttpStatus.BAD_REQUEST),
    FILE_INVALID_FORMAT("FILE_5003", "Định dạng tệp không hợp lệ (chỉ chấp nhận JPG, JPEG, PNG, WEBP)", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED("FILE_5004", "Tải tệp lên hệ thống lưu trữ thất bại", HttpStatus.INTERNAL_SERVER_ERROR),

    // Wallet & Payment Errors (6000 - 6999)
    WALLET_NOT_FOUND("PAY_6001", "Không tìm thấy ví người dùng", HttpStatus.NOT_FOUND),
    INSUFFICIENT_WALLET_BALANCE("PAY_6002", "Số dư ví không đủ để thực hiện giao dịch", HttpStatus.BAD_REQUEST),
    INVALID_PAYMENT_AMOUNT("PAY_6003", "Số tiền nạp không hợp lệ (tối thiểu 10.000 VNĐ)", HttpStatus.BAD_REQUEST),
    TRANSACTION_NOT_FOUND("PAY_6004", "Không tìm thấy giao dịch", HttpStatus.NOT_FOUND),
    TRANSACTION_ALREADY_PROCESSED("PAY_6005", "Giao dịch đã được xử lý trước đó", HttpStatus.BAD_REQUEST),
    INVALID_CHECKSUM("PAY_6006", "Chữ ký bảo mật (checksum) không hợp lệ", HttpStatus.BAD_REQUEST),
    BANK_ACCOUNT_NOT_FOUND("PAY_6007", "Không tìm thấy tài khoản ngân hàng chính chủ", HttpStatus.NOT_FOUND),
    PENDING_WITHDRAWAL_EXISTS("PAY_6008", "Bạn đang có yêu cầu rút tiền đang chờ xử lý", HttpStatus.CONFLICT),
    INVALID_WITHDRAWAL_STATE("PAY_6009", "Trạng thái yêu cầu rút tiền không hợp lệ cho thao tác này", HttpStatus.BAD_REQUEST),

    // Channel Membership Errors (7000 - 7999)
    MEMBERSHIP_PLAN_NOT_FOUND("MEM_7001", "Kênh chưa thiết lập gói hội viên hoặc gói đang tạm đóng", HttpStatus.NOT_FOUND),
    ALREADY_ACTIVE_MEMBER("MEM_7002", "Bạn đã là hội viên còn hiệu lực của kênh này", HttpStatus.CONFLICT),
    CANNOT_SUBSCRIBE_OWN_CHANNEL("MEM_7003", "Chủ kênh không thể tự mua gói hội viên của chính mình", HttpStatus.BAD_REQUEST);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
