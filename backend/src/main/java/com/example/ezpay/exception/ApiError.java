package com.example.ezpay.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

// 에러 응답 처리
@Getter
@AllArgsConstructor
public class ApiError {
    private String status; // 에러 상태 (예: "error")
    private String message; // 에러 메시지
    private int code;
}
