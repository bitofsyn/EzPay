# 보안 구현 가이드

**작성일:** 2026-06-28  
**대상:** 백엔드 개발자  
**기준:** OWASP Top 10

---

## 📋 목차

1. [인증 (Authentication)](#인증-authentication)
2. [권한 (Authorization)](#권한-authorization)
3. [데이터 검증](#데이터-검증)
4. [암호화](#암호화)
5. [API 보안](#api-보안)
6. [WebSocket 보안](#websocket-보안)

---

## 인증 (Authentication)

### 1. JWT 토큰 구현

```java
@Component
public class JwtTokenProvider {

  private static final String SECRET_KEY = "${jwt.secret}";
  private static final long EXPIRATION_TIME = 86400000; // 24시간

  @Value("${jwt.secret}")
  private String secretKey;

  private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

  @PostConstruct
  protected void init() {
    secretKey = Base64.getEncoder().encodeToString(secretKey.getBytes());
  }

  // 토큰 생성
  public String generateToken(String userId, String role) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + EXPIRATION_TIME);

    return Jwts.builder()
        .setSubject(userId)
        .claim("role", role)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(SignatureAlgorithm.HS512, secretKey)
        .compact();
  }

  // 토큰 검증
  public boolean validateToken(String token) {
    try {
      Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token);
      return true;
    } catch (SecurityException e) {
      logger.error("Invalid JWT signature: {}", e);
    } catch (MalformedJwtException e) {
      logger.error("Invalid JWT token: {}", e);
    } catch (ExpiredJwtException e) {
      logger.error("Expired JWT token: {}", e);
    } catch (UnsupportedJwtException e) {
      logger.error("Unsupported JWT token: {}", e);
    } catch (IllegalArgumentException e) {
      logger.error("JWT claims string is empty: {}", e);
    }
    return false;
  }

  // 토큰에서 사용자 ID 추출
  public String getUserIdFromToken(String token) {
    return Jwts.parser()
        .setSigningKey(secretKey)
        .parseClaimsJws(token)
        .getBody()
        .getSubject();
  }

  // 토큰에서 역할 추출
  public String getRoleFromToken(String token) {
    return Jwts.parser()
        .setSigningKey(secretKey)
        .parseClaimsJws(token)
        .getBody()
        .get("role", String.class);
  }
}
```

### 2. JWT 필터

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtTokenProvider jwtTokenProvider;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    try {
      String jwt = extractTokenFromRequest(request);

      if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
        String userId = jwtTokenProvider.getUserIdFromToken(jwt);
        String role = jwtTokenProvider.getRoleFromToken(jwt);

        // SecurityContext에 사용자 정보 저장
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );

        SecurityContextHolder.getContext().setAuthentication(authentication);
      }

    } catch (Exception e) {
      logger.error("Cannot set user authentication: {}", e);
    }

    filterChain.doFilter(request, response);
  }

  private String extractTokenFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }
    return null;
  }
}
```

### 3. Security Config

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http
        .csrf().disable()
        .cors()
        .and()
        .authorizeRequests()
          .antMatchers("/api/v1/auth/**").permitAll()
          .antMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
          .antMatchers("/ws/**").authenticated()
          .anyRequest().authenticated()
        .and()
        .exceptionHandling()
          .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
          .accessDeniedHandler(new JwtAccessDeniedHandler())
        .and()
        .sessionManagement()
          .sessionCreationPolicy(SessionCreationPolicy.STATELESS);

    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(
        "http://localhost:3000",
        "http://localhost:5173",
        "https://app.ezpay.com"
    ));
    configuration.setAllowedMethods(List.of("*"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
```

---

## 권한 (Authorization)

### 1. @PreAuthorize 사용

```java
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

  private final AdminService adminService;

  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  @GetMapping("/risk-transactions")
  public ResponseEntity<ApiResponse<?>> getRiskTransactions() {
    // 관리자만 접근 가능
    return ResponseEntity.ok(ApiResponse.success("조회 성공", 
        adminService.getRiskTransactions()));
  }

  @PreAuthorize("hasRole('SUPER_ADMIN')")
  @DeleteMapping("/users/{userId}")
  public ResponseEntity<ApiResponse<?>> deleteUser(@PathVariable Long userId) {
    // 슈퍼 관리자만 접근 가능
    adminService.deleteUser(userId);
    return ResponseEntity.ok(ApiResponse.success("삭제 완료", null));
  }
}
```

### 2. 커스텀 권한 검사

```java
@Component
public class AdminAuthorizationService {

  public boolean canAccessTransaction(String userId, Long transactionId) {
    // 사용자가 해당 거래에 접근 권한이 있는지 확인
    // 예: 자신의 거래는 모두, 타인의 거래는 관리자만
    return true; // TODO: 실제 로직 구현
  }

  public boolean canApproveRiskTransaction(String userId, Long riskTxId) {
    // 위험 거래 승인 권한 확인
    User user = userRepository.findById(Long.parseLong(userId));
    return user.hasRole(UserRole.ADMIN) || user.hasRole(UserRole.SUPER_ADMIN);
  }
}

@RestController
@RequestMapping("/admin/risk-transactions")
@RequiredArgsConstructor
public class RiskTransactionController {

  private final AdminAuthorizationService authService;
  private final RiskTransactionService service;

  @PostMapping("/{transactionId}/approve")
  public ResponseEntity<ApiResponse<?>> approveRiskTransaction(
      @PathVariable String transactionId,
      @AuthenticationPrincipal String userId
  ) {
    if (!authService.canApproveRiskTransaction(userId, Long.parseLong(transactionId))) {
      throw new UnauthorizedException("권한 없음");
    }

    return ResponseEntity.ok(ApiResponse.success("승인 완료", 
        service.approveRiskTransaction(transactionId)));
  }
}
```

---

## 데이터 검증

### 1. Input Validation

```java
@Data
@Validated
public class RiskTransactionApprovalRequest {

  @NotBlank(message = "거래 ID는 필수입니다")
  @Size(min = 1, max = 50)
  private String transactionId;

  @Size(max = 500, message = "코멘트는 500자 이하입니다")
  private String comment;

  @Email(message = "유효한 이메일이 아닙니다")
  private String notificationEmail;
}

@PostMapping("/{transactionId}/approve")
public ResponseEntity<ApiResponse<?>> approveRiskTransaction(
    @Validated @RequestBody RiskTransactionApprovalRequest request
) {
  // 요청 검증 자동 수행
  return ResponseEntity.ok(ApiResponse.success("승인 완료", null));
}
```

### 2. Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<?>> handleValidationException(
      MethodArgumentNotValidException e
  ) {
    StringBuilder message = new StringBuilder();
    e.getBindingResult().getFieldErrors().forEach(error ->
        message.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ")
    );

    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error("VALIDATION_ERROR", message.toString()));
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiResponse<?>> handleUnauthorizedException(
      UnauthorizedException e
  ) {
    return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(ApiResponse.error("UNAUTHORIZED", e.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<?>> handleException(Exception e) {
    logger.error("Unexpected error: {}", e.getMessage(), e);
    
    return ResponseEntity
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error("INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다"));
  }
}
```

---

## 암호화

### 1. 비밀번호 암호화

```java
@Service
public class UserService {

  private final PasswordEncoder passwordEncoder;
  private final UserRepository userRepository;

  public void createUser(CreateUserRequest request) {
    User user = User.builder()
        .email(request.getEmail())
        .name(request.getName())
        .passwordHash(passwordEncoder.encode(request.getPassword()))
        .build();

    userRepository.save(user);
  }

  public void changePassword(String userId, String oldPassword, String newPassword) {
    User user = userRepository.findById(Long.parseLong(userId))
        .orElseThrow(() -> new ResourceNotFoundException("사용자 없음"));

    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
      throw new BadCredentialsException("기존 비밀번호가 일치하지 않습니다");
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);
  }
}
```

### 2. 민감한 정보 마스킹

```java
@Component
public class SensitiveDataMasker {

  public String maskEmail(String email) {
    // user@example.com → u***@example.com
    return email.replaceAll("(?<=.{1}).(?=.*@)", "*");
  }

  public String maskPhoneNumber(String phone) {
    // 010-1234-5678 → 010-****-5678
    return phone.replaceAll("(?<=\\d{3})-(?=\\d{4})", "----");
  }

  public String maskAccountNumber(String accountNumber) {
    // 1234567890 → 1234-****-90
    return accountNumber.replaceAll("(?<=\\d{4}).(?=\\d{2})", "*");
  }
}
```

---

## API 보안

### 1. Rate Limiting

```java
@Configuration
public class RateLimitingConfig {

  @Bean
  public RateLimiter rateLimiter() {
    return RateLimiter.create(100.0); // 초당 100 요청
  }
}

@Component
@RequiredArgsConstructor
public class RateLimitingInterceptor implements HandlerInterceptor {

  private final RateLimiter rateLimiter;

  @Override
  public boolean preHandle(
      HttpServletRequest request,
      HttpServletResponse response,
      Object handler
  ) throws Exception {
    if (!rateLimiter.tryAcquire()) {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.getWriter().write("Rate limit exceeded");
      return false;
    }
    return true;
  }
}
```

### 2. CSRF 보호

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http
        .csrf()
          .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
        .and()
        // ... 나머지 설정
  }
}
```

### 3. SQL Injection 방지

```java
@Repository
public class TransactionRepository extends JpaRepository<Transaction, Long> {

  // ❌ 위험: String 연결 사용
  // public List<Transaction> findBySenderAccount(String sender) {
  //     return entityManager.createQuery(
  //         "SELECT t FROM Transaction t WHERE t.sender = '" + sender + "'"
  //     ).getResultList();
  // }

  // ✅ 안전: PreparedStatement 사용
  public List<Transaction> findBySenderAccount(String sender) {
    return entityManager.createQuery(
        "SELECT t FROM Transaction t WHERE t.senderAccount.accountNumber = :sender",
        Transaction.class
    )
    .setParameter("sender", sender)
    .getResultList();
  }
}
```

---

## WebSocket 보안

### 1. WebSocket 인증

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new ChannelInterceptor() {
      @Override
      public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
          String token = accessor.getFirstNativeHeader("Authorization");
          
          if (token == null || !jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid token");
          }
          
          String userId = jwtTokenProvider.getUserIdFromToken(token);
          accessor.setUser(new UsernamePasswordAuthenticationToken(
              userId, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
          ));
        }
        
        return message;
      }
    });
  }
}
```

### 2. WebSocket 메시지 검증

```java
@Component
public class WebSocketMessageValidator {

  public void validateMessage(Map<String, Object> message) throws SecurityException {
    String action = (String) message.get("action");
    
    if (action == null || action.trim().isEmpty()) {
      throw new SecurityException("Invalid action");
    }

    // XSS 방지: 메시지에서 스크립트 제거
    sanitizeMessage(message);
  }

  private void sanitizeMessage(Map<String, Object> message) {
    message.keySet().forEach(key -> {
      Object value = message.get(key);
      if (value instanceof String) {
        String sanitized = HtmlUtils.htmlEscape((String) value);
        message.put(key, sanitized);
      }
    });
  }
}
```

---

## 모니터링 및 감시

### 1. 보안 로깅

```java
@Component
public class SecurityEventLogger {

  private static final Logger logger = LoggerFactory.getLogger(SecurityEventLogger.class);

  public void logAuthenticationSuccess(String userId) {
    logger.info("Authentication success: user={}", userId);
  }

  public void logAuthenticationFailure(String username, String reason) {
    logger.warn("Authentication failure: username={}, reason={}", username, reason);
  }

  public void logUnauthorizedAccess(String userId, String resource) {
    logger.error("Unauthorized access attempt: user={}, resource={}", userId, resource);
  }

  public void logRiskTransactionApproval(String approver, String transactionId) {
    logger.info("Risk transaction approved: approver={}, transaction={}", 
        approver, transactionId);
  }
}
```

### 2. 이상 탐지

```java
@Component
@RequiredArgsConstructor
public class AnomalyDetector {

  private final SecurityEventLogger eventLogger;
  
  public void checkMultipleFailedAttempts(String username) {
    // 실패한 로그인 시도 5회 이상 시 계정 잠금
    int attempts = getFailedLoginAttempts(username);
    
    if (attempts >= 5) {
      lockUser(username);
      eventLogger.logUnauthorizedAccess(username, "Multiple failed login attempts");
    }
  }

  public void checkUnusualAccess(String userId, String resource) {
    // 비정상적인 접근 패턴 감지
    if (isUnusualAccessPattern(userId, resource)) {
      eventLogger.logUnauthorizedAccess(userId, resource);
      // 관리자 알림 발송
    }
  }
}
```

---

## 체크리스트

### 배포 전 보안 검사

- [ ] 모든 민감한 설정이 환경 변수에 저장되었는가?
- [ ] 기본 비밀번호가 변경되었는가?
- [ ] HTTPS가 활성화되었는가?
- [ ] CORS 설정이 필요한 도메인만으로 제한되었는가?
- [ ] 로깅에서 민감한 정보가 노출되지 않는가?
- [ ] 정기적인 보안 업데이트가 적용되었는가?
- [ ] 의존성의 알려진 취약점이 없는가?

---

**마지막 업데이트:** 2026-06-28
