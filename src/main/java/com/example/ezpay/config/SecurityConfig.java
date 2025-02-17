package com.example.ezpay.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    // 비밀번호 암호화
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // CSRF 보호 비활성화
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.DELETE,"/users/**", "/**").permitAll()// "/users" 경로 인증 없이 허용
                        .requestMatchers("/users/**").permitAll()
                        .anyRequest().authenticated() // 나머지 요청은 인증 필요
                )
                .formLogin(AbstractHttpConfigurer::disable) // 기본 로그인 비활성화
                .httpBasic(AbstractHttpConfigurer::disable); // 기본 인증 비활성화

        return http.build();
    }

}
