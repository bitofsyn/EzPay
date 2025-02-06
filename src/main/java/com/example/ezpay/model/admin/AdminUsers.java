package com.example.ezpay.model.admin;

import com.example.ezpay.model.enums.Status;
import jakarta.persistence.*;

import java.sql.Timestamp;

@Entity
public class AdminUsers {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long userId;
    private String name;
    private String email;
    private String passwordHash;
    @Enumerated(EnumType.STRING) // ENUM값 문자열로 저장
    private Status status;
    private Timestamp createdAt;
    private Timestamp updatedAt;
}
