package com.prm.common.service.impl;

import com.prm.common.entity.EmailTemplate;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.repository.EmailTemplateRepository;
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
    private final EmailTemplateRepository emailTemplateRepository;
    private final String apiKey;
    private final String senderEmail;
    private final String senderName;
    private final String apiUrl;

    public EmailServiceImpl(
            EmailTemplateRepository emailTemplateRepository,
            @Value("${app.email.brevo.api-key:}") String apiKey,
            @Value("${app.email.brevo.sender-email:no-reply@historypodcast.com}") String senderEmail,
            @Value("${app.email.brevo.sender-name:History Podcast Platform}") String senderName,
            @Value("${app.email.brevo.api-url:https://api.brevo.com/v3/smtp/email}") String apiUrl
    ) {
        this.emailTemplateRepository = emailTemplateRepository;
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
    public void sendEmailWithTemplate(String toEmail, String templateCode, Map<String, String> variables) {
        EmailTemplate template = emailTemplateRepository.findByCodeAndStatus(templateCode, "ACTIVE")
                .orElseGet(() -> emailTemplateRepository.findByCode(templateCode)
                        .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                                "Không tìm thấy mẫu email với mã template: " + templateCode)));

        String subject = template.getSubject();
        String htmlContent = template.getHtmlContent();

        if (variables != null) {
            for (Map.Entry<String, String> entry : variables.entrySet()) {
                String placeholder = "{{" + entry.getKey() + "}}";
                String val = entry.getValue() != null ? entry.getValue() : "";
                subject = subject.replace(placeholder, val);
                htmlContent = htmlContent.replace(placeholder, val);
            }
        }

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        sendEmailWithTemplate(toEmail, "CREATOR_KYC_OTP", Map.of(
                "otpCode", otpCode,
                "email", toEmail,
                "expiryMinutes", "5"
        ));
    }

    @Override
    public void sendPasswordResetOtpEmail(String toEmail, String otpCode) {
        sendEmailWithTemplate(toEmail, "FORGOT_PASSWORD_OTP", Map.of(
                "otpCode", otpCode,
                "email", toEmail,
                "expiryMinutes", "5"
        ));
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
