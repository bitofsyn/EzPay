package com.example.ezpay.modules.auth.internal.service;

import com.example.ezpay.model.user.Notification;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.auth.api.dto.LoginResponse;
import com.example.ezpay.modules.auth.api.dto.OAuthLoginRequest;
import com.example.ezpay.modules.auth.internal.oauth.OAuthClient;
import com.example.ezpay.modules.auth.internal.oauth.OAuthUserInfo;
import com.example.ezpay.modules.systemlog.service.SystemLogger;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.repository.user.NotificationRepository;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.shared.common.enums.AuthProvider;
import com.example.ezpay.shared.common.enums.NotificationType;
import com.example.ezpay.shared.common.enums.Status;
import com.example.ezpay.shared.exception.OAuthAuthenticationException;
import com.example.ezpay.shared.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 소셜 로그인 오케스트레이션.
 *
 * 회원 식별/생성 정책 (안전 우선):
 *  1) (provider + socialId)로 기존 소셜 회원이 있으면 그대로 로그인 (재로그인).
 *  2) 없으면 이메일로 기존 회원 조회:
 *     - 있으면 해당 계정에 소셜 식별자를 연결(link)해 로그인.
 *       (카카오/네이버는 이메일을 검증해 제공하므로 이메일 기반 자동 연결을 신뢰한다.
 *        기존 일반 로그인은 email+password 로만 동작하므로 연결 후에도 그대로 유지된다.)
 *     - 없으면 신규 소셜 회원 생성.
 *  3) 이메일 미제공(카카오 선택 동의 거부 등) 시: 이메일 기반 연결이 불가하므로
 *     합성 이메일({provider}_{socialId}@social.ezpay.local)로 신규 회원을 생성한다.
 *  4) 상태가 ACTIVE 가 아니면(탈퇴/비활성/잠금) 로그인 거부.
 */
@Service
@RequiredArgsConstructor
public class OAuthServiceImpl implements OAuthService {

    private final UserRepository userRepository;
    private final TransferLimitRepository transferLimitRepository;
    private final NotificationRepository notificationRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserFacade userFacade;
    private final SystemLogger systemLogger;
    private final List<OAuthClient> oauthClients;

    private static final String LOG_SERVICE = "AuthService";

    // 신규 회원 기본 정책값 (AuthenticationServiceImpl.register 와 동일하게 유지)
    private static final BigDecimal DEFAULT_DAILY_LIMIT = new BigDecimal("1000000.00");
    private static final BigDecimal DEFAULT_PER_TX_LIMIT = new BigDecimal("100000.00");

    // provider → client 매핑 (지연 초기화)
    private Map<AuthProvider, OAuthClient> clientMap;

    private OAuthClient clientFor(AuthProvider provider) {
        if (clientMap == null) {
            clientMap = oauthClients.stream()
                    .collect(Collectors.toMap(OAuthClient::getProvider, Function.identity()));
        }
        OAuthClient client = clientMap.get(provider);
        if (client == null) {
            throw new OAuthAuthenticationException("지원하지 않는 소셜 로그인 제공자입니다: " + provider);
        }
        return client;
    }

    @Override
    @Transactional
    public LoginResponse login(AuthProvider provider, OAuthLoginRequest request, String ipAddress, String deviceInfo) {
        // 1) 제공자에서 사용자 정보 조회 (실패 시 OAuthAuthenticationException)
        OAuthUserInfo info = clientFor(provider)
                .fetchUserInfo(request.getCode(), request.getRedirectUri(), request.getState());

        // 2) 회원 식별 또는 생성
        User user = resolveUser(provider, info);

        // 3) 상태 확인 (탈퇴/비활성/잠금 계정 차단)
        if (user.getStatus() != Status.ACTIVE) {
            systemLogger.warn(LOG_SERVICE, String.format(
                    "소셜 로그인 거부: %s (%s) - 비활성 상태(%s)", user.getEmail(), provider, user.getStatus()));
            throw new IllegalArgumentException("이용이 제한된 계정입니다. 고객센터에 문의해주세요.");
        }

        // 4) 로그인 이력 + JWT 발급 (일반 로그인과 동일 흐름)
        userFacade.recordLogin(user.getUserId(), ipAddress, deviceInfo);
        String token = jwtUtil.generateToken(user);

        systemLogger.info(LOG_SERVICE, String.format(
                "소셜 로그인 성공: %s (%s, %s, %s)", user.getEmail(), provider, ipAddress, deviceInfo));

        return new LoginResponse(
                token,
                user.getUserId(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );
    }

    /**
     * (provider+socialId) → 이메일 순으로 기존 회원을 찾고, 없으면 신규 생성한다.
     */
    private User resolveUser(AuthProvider provider, OAuthUserInfo info) {
        // (1) 이미 연결된 소셜 회원
        Optional<User> bySocial = userRepository.findByAuthProviderAndSocialId(provider, info.socialId());
        if (bySocial.isPresent()) {
            return bySocial.get();
        }

        // (2) 이메일이 있으면 기존 회원에 연결 시도
        if (info.hasEmail()) {
            Optional<User> byEmail = userRepository.findByEmail(info.email());
            if (byEmail.isPresent()) {
                User existing = byEmail.get();
                // 소셜 식별자 연결 (기존 password 로그인 흐름은 email+password 기반이라 영향 없음)
                existing.setAuthProvider(provider);
                existing.setSocialId(info.socialId());
                systemLogger.info(LOG_SERVICE, String.format(
                        "소셜 계정 연결: %s → %s", existing.getEmail(), provider));
                return userRepository.save(existing);
            }
        }

        // (3) 신규 소셜 회원 생성
        return createSocialUser(provider, info);
    }

    private User createSocialUser(AuthProvider provider, OAuthUserInfo info) {
        // 이메일 미제공 시 합성 이메일 부여 (JWT subject/조회 키로 email 을 사용하므로 반드시 채운다)
        String email = info.hasEmail()
                ? info.email()
                : provider.name().toLowerCase() + "_" + info.socialId() + "@social.ezpay.local";

        String name = (info.nickname() != null && !info.nickname().isBlank())
                ? info.nickname()
                : provider.name() + " 사용자";

        // 소셜 회원은 비밀번호 로그인을 사용하지 않지만, 컬럼 NPE 방지를 위해 임의값을 인코딩해 저장한다.
        String randomEncodedPassword = passwordEncoder.encode(UUID.randomUUID().toString());

        User user = User.builder()
                .email(email)
                .password(randomEncodedPassword)
                .name(name)
                .status(Status.ACTIVE)
                .authProvider(provider)
                .socialId(info.socialId())
                .build();

        User savedUser = userRepository.save(user);
        provisionDefaults(savedUser);

        systemLogger.info(LOG_SERVICE, String.format(
                "소셜 신규 회원 가입: %s (%s)", savedUser.getEmail(), provider));

        return savedUser;
    }

    /**
     * 신규 회원 기본 설정(송금 한도 + 알림) 생성.
     * AuthenticationServiceImpl.register 의 기본 설정과 동일하게 유지한다.
     */
    private void provisionDefaults(User user) {
        TransferLimit transferLimit = TransferLimit.builder()
                .user(user)
                .dailyLimit(DEFAULT_DAILY_LIMIT)
                .perTransactionLimit(DEFAULT_PER_TX_LIMIT)
                .build();
        transferLimitRepository.save(transferLimit);

        Notification emailNotification = Notification.builder()
                .user(user)
                .notificationType(NotificationType.EMAIL)
                .isEnabled(true)
                .build();
        Notification pushNotification = Notification.builder()
                .user(user)
                .notificationType(NotificationType.PUSH)
                .isEnabled(true)
                .build();
        notificationRepository.saveAll(Arrays.asList(emailNotification, pushNotification));
    }
}
