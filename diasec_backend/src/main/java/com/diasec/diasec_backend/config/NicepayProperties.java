package com.diasec.diasec_backend.config;

/**
 * [배포·동기화 주의] nicepay.* 설정은 운영 서버 전용 값(키·webhook·return URL)입니다. 로컬 properties를 서버에 그대로 올리지 마세요.
 */

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "nicepay")
public class NicepayProperties {
    private String clientKey;
    private String secretKey;
    private String apiUrl;
    private String webhookUrl;
    private String webhookVbankUrl;
    private String returnUrl;
    private String frontendUrl;
}
