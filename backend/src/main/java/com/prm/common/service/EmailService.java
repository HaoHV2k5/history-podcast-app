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
     * Send a general transactional email.
     *
     * @param toEmail     recipient email address
     * @param subject     email subject
     * @param htmlContent HTML body content
     */
    void sendEmail(String toEmail, String subject, String htmlContent);
}
