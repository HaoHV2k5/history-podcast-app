package com.prm.payment.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.vnpay")
public class VnpayProperties {
    private String tmnCode;
    private String hashSecret;
    private String payUrl;
    private String returnUrl;
}
