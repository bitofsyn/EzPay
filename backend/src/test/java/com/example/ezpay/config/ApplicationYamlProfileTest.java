package com.example.ezpay.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.EnumerablePropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * application.yml 의 local 프로파일 문서가 의도한 키로 바인딩되는지 검증한다.
 * 과거에 management 블록이 spring 블록 중간에 끼어들어 jpa·sql 설정이 management.* 아래로 들어가
 * local 프로파일의 ddl-auto·show-sql·data.sql 초기화가 조용히 무시된 적이 있다.
 */
class ApplicationYamlProfileTest {

    @Test
    void localProfileSettingsBindUnderSpring() throws IOException {
        EnumerablePropertySource<?> local = profileDocument("local");

        assertThat(local.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(local.getProperty("spring.jpa.show-sql")).isEqualTo(true);
        assertThat(local.getProperty("spring.sql.init.mode")).isEqualTo("always");
        assertThat(Arrays.stream(local.getPropertyNames()))
                .noneMatch(name -> name.startsWith("management.jpa") || name.startsWith("management.sql"));
    }

    private EnumerablePropertySource<?> profileDocument(String profile) throws IOException {
        List<PropertySource<?>> documents = new YamlPropertySourceLoader()
                .load("application.yml", new ClassPathResource("application.yml"));
        return documents.stream()
                .filter(doc -> profile.equals(String.valueOf(doc.getProperty("spring.config.activate.on-profile"))))
                .map(doc -> (EnumerablePropertySource<?>) doc)
                .findFirst()
                .orElseThrow(() -> new AssertionError("프로파일 문서를 찾을 수 없습니다: " + profile));
    }
}
