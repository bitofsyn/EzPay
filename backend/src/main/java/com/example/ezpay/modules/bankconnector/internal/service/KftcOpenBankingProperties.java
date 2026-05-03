package com.example.ezpay.modules.bankconnector.internal.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ezpay.kftc")
public class KftcOpenBankingProperties {
    private boolean enabled = false;
    private String clientId;
    private String clientSecret;
    private String baseUrl = "https://openapi.openbanking.or.kr";
    private String authorizeUrl = "https://testapi.openbanking.or.kr/oauth/2.0/authorize_account";
    private String tokenUrl = "https://testapi.openbanking.or.kr/oauth/2.0/token";
    private String redirectUri;
    private String clientUseCode;
    private String webhookUrl;
    private String scope = "sa inquiry";
    private String fintechUseNum;
    private String inquiryStartDate;
    private String inquiryEndDate;
    private String inquiryBankType = "1";
    private String authType = "0";
}
