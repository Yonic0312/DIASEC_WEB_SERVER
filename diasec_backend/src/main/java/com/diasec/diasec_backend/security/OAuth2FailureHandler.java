package com.diasec.diasec_backend.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {
    
    @Override
    public void onAuthenticationFailure(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthenticationException exception
    ) throws IOException, ServletException {

        // 🔴🔴🔴 여기부터 로그 추가 🔴🔴🔴
        System.out.println("========== [OAUTH-FAILURE-HANDLER] ==========");
        System.out.println("[FAIL] requestURI = " + request.getRequestURI());
        System.out.println("[FAIL] exception class = " + exception.getClass().getName());
        System.out.println("[FAIL] exception message = " + exception.getMessage());

        if (exception instanceof OAuth2AuthenticationException oae) {
            System.out.println("[FAIL] OAuth2 errorCode = " +
                (oae.getError() != null ? oae.getError().getErrorCode() : "null"));
        }
        System.out.println("============================================");
        // 🔴🔴🔴 여기까지 🔴🔴🔴
        
        if (exception instanceof OAuth2AuthenticationException oae) {
            String errorCode = oae.getError() != null ? oae.getError().getErrorCode() : null;

            if ("LINK_REQUIRED".equals(errorCode)) {
                response.sendRedirect("https://diasec.co.kr/popupClose.html?status=LINK_REQUIRED");
                return;
            }

            String encoded = URLEncoder.encode(
                errorCode == null ? "OAUTH_FAIL" : errorCode,
                StandardCharsets.UTF_8
            );
            response.sendRedirect("https://diasec.co.kr/popupClose.html?status=FAIL&message=" + encoded);
            return;
        }

        String msg = exception.getMessage();
        String encoded = URLEncoder.encode(msg == null ? "OAUTH_FAIL" : msg, StandardCharsets.UTF_8);
        response.sendRedirect("https://diasec.co.kr/popupClose.html?status=FAIL&message=" + encoded);
    }
}
