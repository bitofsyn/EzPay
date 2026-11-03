package com.example.ezpay.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class InternalApiInterceptor implements HandlerInterceptor {

    @Value("${ezpay.internal-api.secret-key}")
    private String internalApiSecretKey;

    private static final String INTERNAL_API_KEY_HEADER = "X-Internal-API-Key";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String apiKey = request.getHeader(INTERNAL_API_KEY_HEADER);

        if (apiKey != null && apiKey.equals(internalApiSecretKey)) {
            // 키가 유효하면 요청 통과
            return true;
        } else {
            // 키가 없거나 유효하지 않으면 접근 거부
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Access Denied: Invalid or missing internal API key.");
            return false;
        }
    }
}
