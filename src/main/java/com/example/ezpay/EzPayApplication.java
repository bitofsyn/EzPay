package com.example.ezpay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication
public class EzPayApplication {

    public static void main(String[] args) {
        SpringApplication.run(EzPayApplication.class, args);
    }

}
