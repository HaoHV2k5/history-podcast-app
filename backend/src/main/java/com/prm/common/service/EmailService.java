package com.prm.common.service;

public interface EmailService {

    /**
     * Send an OTP code to a recipient email for verification.
     *
     * @param toEmail recipient email address
     * @param otpCode 6-digit verification code
     */
    void sendOtpEmail(String toEmail, String otpCode);

    /**
     * Send an OTP code to a recipient email for password reset verification.
     *
     * @param toEmail recipient email address
     * @param otpCode 6-digit verification code
     */
    void sendPasswordResetOtpEmail(String toEmail, String otpCode);

    /**
     * Send a general transactional email.
     *
     * @param toEmail     recipient email address
     * @param subject     email subject
     * @param htmlContent HTML body content
     */
    void sendEmail(String toEmail, String subject, String htmlContent);

    /**
     * Send an email by loading template from database and substituting variable placeholders.
     *
     * @param toEmail      recipient email address
     * @param templateCode unique code of the email template in the database
     * @param variables    map of key-value variables to replace in subject and HTML body
     */
    void sendEmailWithTemplate(String toEmail, String templateCode, java.util.Map<String, String> variables);
}
