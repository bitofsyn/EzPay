package com.example.ezpay.modules.bankconnector.internal.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ezpay.plaid")
public class PlaidProperties {
    private String clientId;
    private String secret;
    private String baseUrl = "https://sandbox.plaid.com";
    private String clientName = "EzPay";
    private String language = "en";
    private String countryCode = "US";
    private int daysRequested = 90;
    private String webhookUrl;
}
