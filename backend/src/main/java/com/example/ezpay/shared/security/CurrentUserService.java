package com.example.ezpay.shared.security;

import com.example.ezpay.modules.user.api.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserFacade userFacade;

    public Long getUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("인증이 필요합니다.");
        }
        return userFacade.getUserByEmail(authentication.getName()).getUserId();
    }

    public Long requireUserId(Authentication authentication, Long requestedUserId) {
        Long currentUserId = getUserId(authentication);
        if (!currentUserId.equals(requestedUserId)) {
            throw new AccessDeniedException("다른 사용자의 리소스에 접근할 수 없습니다.");
        }
        return currentUserId;
    }
}
