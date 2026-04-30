package com.nearnow.nearnow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NearnowApplication {
    public static void main(String[] args) {
        SpringApplication.run(NearnowApplication.class, args);
    }
}