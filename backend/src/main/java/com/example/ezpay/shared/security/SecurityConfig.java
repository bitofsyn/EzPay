package com.example.ezpay.shared.security;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final List<String> allowedOriginPatterns;

    public SecurityConfig(
            JwtUtil jwtUtil,
            CustomUserDetailsService userDetailsService,
            @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}") String allowedOrigins
    ) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.allowedOriginPatterns = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> {})  // (1) 먼저 CORS 적용
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // SSE 타임아웃/연결 종료 시 컨테이너가 ASYNC·ERROR 디스패치로 재진입한다.
                        // JwtAuthenticationFilter(OncePerRequestFilter)는 이 디스패치를 건너뛰고 STATELESS라
                        // 컨텍스트도 유지되지 않아 익명으로 평가되어 AuthorizationDeniedException(/error 5xx)이 난다.
                        // 두 디스패치는 클라이언트가 직접 만들 수 없고, 최초 REQUEST 디스패치에서 이미
                        // 인가(관리자 전용 등)를 통과한 요청에만 발생하므로 허용해도 보안이 약해지지 않는다.
                        .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // (2) OPTIONS 요청 허용
                        .requestMatchers("/health").permitAll()
                        // Actuator: 헬스 체크와 Prometheus 스크레이프만 인증 없이 허용하고,
                        // 그 밖의 엔드포인트는 노출되더라도 관리자만 접근할 수 있게 한다.
                        .requestMatchers("/actuator/health", "/actuator/health/**",
                                "/actuator/info", "/actuator/prometheus").permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/users/signup", "/users/login",
                                "/users/find-email", "/users/oauth/*/login").permitAll()
                        .requestMatchers("/password-reset/**").permitAll()
                        // SSE(EventSource)/WebSocket은 헤더 대신 쿼리 파라미터(?token=)로 JWT를 전달받아 인증한다.
                        // (JwtAuthenticationFilter가 token 파라미터를 인식) → 관리자만 실시간 스트림 구독 가능.
                        .requestMatchers("/ws/**").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtUtil, userDetailsService), UsernamePasswordAuthenticationFilter.class)
                .build();
    }


    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(allowedOriginPatterns);
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
