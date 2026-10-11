package com.prm.livestream.util;

import com.prm.livestream.agora.RtcTokenBuilder2;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

@Slf4j
public class AgoraTokenUtil {

    public enum Role {
        PUBLISHER(1),
        SUBSCRIBER(2);

        private final int value;

        Role(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }
    }

    private static final RtcTokenBuilder2 tokenBuilder = new RtcTokenBuilder2();

    /**
     * Sinh Agora RTC Token chuẩn theo AccessToken2 của Agora
     */
    public static String buildToken(String appId, String appCertificate, String channelName, int uid, Role role, int expirationSeconds) {
        if (!StringUtils.hasText(appId) || !StringUtils.hasText(appCertificate) 
                || "your_agora_app_id".equalsIgnoreCase(appId) 
                || "your_agora_app_certificate".equalsIgnoreCase(appCertificate)) {
            log.info("Agora credentials not fully configured. Using mock token for channel: {}, uid: {}, role: {}", channelName, uid, role);
            return "mock_agora_token_" + channelName + "_" + uid + "_" + role.name().toLowerCase() + "_" + System.currentTimeMillis();
        }

        try {
            int expire = expirationSeconds > 0 ? expirationSeconds : 3600;
            RtcTokenBuilder2.Role agoraRole = (role == Role.PUBLISHER)
                    ? RtcTokenBuilder2.Role.ROLE_PUBLISHER
                    : RtcTokenBuilder2.Role.ROLE_SUBSCRIBER;

            return tokenBuilder.buildTokenWithUid(
                    appId.trim(),
                    appCertificate.trim(),
                    channelName.trim(),
                    uid,
                    agoraRole,
                    expire,
                    expire
            );
        } catch (Exception e) {
            log.error("Lỗi khi sinh Agora RTC Token bằng RtcTokenBuilder2: {}", e.getMessage(), e);
            return "agora_token_fallback_" + channelName + "_" + uid + "_" + role.name().toLowerCase();
        }
    }
}
