package com.diasec.diasec_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.config.NicepayProperties;

import lombok.RequiredArgsConstructor;

// 나이스페이 테스트용 컨트롤러
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/test")
public class TestController {
    
    private final NicepayProperties nicepayProperties;

    @GetMapping("/nicepay")
    public String testNicepay() {
        return "clientKey=" + nicepayProperties.getClientKey()
            + ", apiUrl=" + nicepayProperties.getApiUrl();
    }
}
