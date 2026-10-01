package com.prm.common.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final RestClient restClient;
    private final String apiKey;
    private final String senderEmail;
    private final String senderName;
    private final String apiUrl;

    public EmailServiceImpl(
            @Value("${app.email.brevo.api-key:}") String apiKey,
            @Value("${app.email.brevo.sender-email:no-reply@historypodcast.com}") String senderEmail,
            @Value("${app.email.brevo.sender-name:History Podcast Platform}") String senderName,
            @Value("${app.email.brevo.api-url:https://api.brevo.com/v3/smtp/email}") String apiUrl
    ) {
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.apiUrl = apiUrl;
        this.restClient = RestClient.builder().build();

        if (StringUtils.hasText(apiKey)) {
            log.info("Brevo Email Service configured successfully via REST API HTTPS port 443");
        } else {
            log.warn("BREVO_API_KEY is not configured. Email sending is disabled.");
        }
    }

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "[History Podcast] Mã xác thực OTP đăng ký Nhà Sáng Tạo (Creator)";
        String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #8b0000; margin-bottom: 16px;">Xác Thực Hồ Sơ Creator</h2>
                    <p>Xin chào bạn,</p>
                    <p>Bạn đang thực hiện quy trình đăng ký trở thành <strong>Nhà Sáng Tạo (Creator)</strong> trên nền tảng <strong>History Podcast</strong>.</p>
                    <p>Mã xác thực OTP của bạn là:</p>
                    <div style="text-align: center; margin: 24px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a1a1a; background-color: #f4f4f4; padding: 12px 24px; border-radius: 6px; display: inline-block;">%s</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">Mã này có hiệu lực trong <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                </div>
                """.formatted(otpCode);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendPasswordResetOtpEmail(String toEmail, String otpCode) {
        String subject = "[History Podcast] Mã OTP đặt lại mật khẩu tài khoản";
        String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #8b0000; margin-bottom: 16px;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
                    <p>Xin chào bạn,</p>
                    <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>History Podcast</strong> liên kết với email này.</p>
                    <p>Mã xác thực OTP của bạn là:</p>
                    <div style="text-align: center; margin: 24px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #8b0000; background-color: #fdf2f2; border: 1px solid #fecaca; padding: 12px 24px; border-radius: 6px; display: inline-block;">%s</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">Mã xác thực này có hiệu lực trong <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai khác.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email để đảm bảo an toàn cho tài khoản của bạn.</p>
                </div>
                """.formatted(otpCode);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendEmail(String toEmail, String subject, String htmlContent) {
        if (!StringUtils.hasText(apiKey)) {
            log.error("BREVO_API_KEY is not configured. Cannot send email to: {}", toEmail);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Dịch vụ gửi email chưa được cấu hình khóa API (BREVO_API_KEY)");
        }

        try {
            Map<String, Object> body = Map.of(
                    "sender", Map.of("name", senderName, "email", senderEmail),
                    "to", List.of(Map.of("email", toEmail)),
                    "subject", subject,
                    "htmlContent", htmlContent
            );

            restClient.post()
                    .uri(apiUrl)
                    .header("api-key", apiKey)
                    .header("accept", "application/json")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully sent email via Brevo REST API to: {}", toEmail);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to send email via Brevo REST API to: {}. Error: {}", toEmail, e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể gửi email lúc này. Vui lòng kiểm tra lại cấu hình hoặc thử lại sau.");
        }
    }
}
