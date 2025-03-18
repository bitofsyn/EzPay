package com.example.ezpay.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

public class AccountNumberGenerator {
    private static final Map<String, String> BANK_PREFIXES = new HashMap<>();
    private static final int ACCOUNT_LENGTH = 10; // 계좌번호 총 길이 (앞자리 포함)

    static {
        BANK_PREFIXES.put("신한은행", "12");
        BANK_PREFIXES.put("우리은행", "34");
        BANK_PREFIXES.put("KB국민은행", "56");
        BANK_PREFIXES.put("NH농협은행", "78");
        BANK_PREFIXES.put("기업은행", "90");
        BANK_PREFIXES.put("카카오뱅크", "13");
        BANK_PREFIXES.put("토스뱅크", "24");
    }

    public static String generateAccountNumber(String bankName) {
        String prefix = BANK_PREFIXES.getOrDefault(bankName, "99"); // 기본값 "99" (미지정 은행)
        int randomDigitsLength = ACCOUNT_LENGTH - prefix.length();
        StringBuilder accountNumber = new StringBuilder(prefix);

        Random random = new Random();
        for (int i = 0; i < randomDigitsLength; i++) {
            accountNumber.append(random.nextInt(10)); // 0~9 랜덤 숫자 추가
        }

        return accountNumber.toString();
    }
}
