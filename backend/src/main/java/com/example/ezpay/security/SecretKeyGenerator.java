package com.example.ezpay.security;

import java.security.SecureRandom;
import java.util.Base64;

public class SecretKeyGenerator {
    public static String createSecretKey() {
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        return Base64.getEncoder().encodeToString(keyBytes);
    }
}
