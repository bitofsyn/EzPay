package com.example.ezpay.controller.user;

import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserControllerAuthorizationTest {

    @Test
    void rejectsAccessToAnotherUsersProfile() {
        UserFacade userFacade = mock(UserFacade.class);
        UserController controller = new UserController(userFacade);
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("user@example.com", null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER")));
        when(userFacade.getUserByEmail("user@example.com"))
                .thenReturn(UserInfo.builder().userId(1L).email("user@example.com").build());

        assertThatThrownBy(() -> controller.getUserById(2L, authentication))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("다른 사용자의 정보에 접근할 수 없습니다.");
    }
}
