package com.example.ezpay.model.user;

import com.example.ezpay.model.enums.Status;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;

@Entity
@Table(name = "users")
@Getter
@Setter
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String email;

    @JsonProperty("password_hash") // JSON 필드명 매핑
    private String passwordHash;

    private String name;

    @Enumerated(EnumType.STRING)
    @JsonProperty("status")
    private Status status;

    private Timestamp createdAt;
    private Timestamp updatedAt;
}
