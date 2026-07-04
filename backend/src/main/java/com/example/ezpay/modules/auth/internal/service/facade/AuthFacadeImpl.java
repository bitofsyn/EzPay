package com.example.ezpay.modules.auth.internal.service.facade;

import com.example.ezpay.modules.auth.api.dto.*;
import com.example.ezpay.modules.auth.api.facade.AuthFacade;
import com.example.ezpay.modules.auth.internal.service.AuthenticationService;
import com.example.ezpay.modules.auth.internal.service.OAuthService;
import com.example.ezpay.modules.auth.internal.service.PasswordResetService;
import com.example.ezpay.shared.common.enums.AuthProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthFacadeImpl implements AuthFacade {

    private final PasswordResetService passwordResetService;
    private final AuthenticationService authenticationService;
    private final OAuthService oauthService;

    @Override
    public RegisterResponse register(RegisterRequest request) {
        return authenticationService.register(request);
    }

    @Override
    public LoginResponse login(LoginRequest request, String ipAddress, String deviceInfo) {
        return authenticationService.login(request, ipAddress, deviceInfo);
    }

    @Override
    public LoginResponse oauthLogin(AuthProvider provider, OAuthLoginRequest request, String ipAddress, String deviceInfo) {
        return oauthService.login(provider, request, ipAddress, deviceInfo);
    }

    @Override
    public void initiatePasswordReset(String email) {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail(email);
        passwordResetService.createPasswordResetRequest(request);
    }

    @Override
    public boolean verifyResetToken(String token) {
        return passwordResetService.validatePasswordResetToken(token);
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        passwordResetService.resetPassword(token, newPassword);
    }

    @Override
    public FindEmailResponse findEmailByPhoneAndName(FindEmailRequest request) {
        return authenticationService.findEmail(request);
    }
}
