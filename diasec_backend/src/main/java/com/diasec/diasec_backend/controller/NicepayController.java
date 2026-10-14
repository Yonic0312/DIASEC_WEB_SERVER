package com.diasec.diasec_backend.controller;

/**
 * [배포·동기화 주의] 나이스페이 PG 준비·리턴 URL 처리 API입니다. 운영 서버와 로컬이 다를 수 있습니다.
 * 로컬 파일로 통째 덮어쓰기 금지 — NicepayService·SecurityConfig permit 목록과 함께 관리하세요.
 */

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.security.CustomUserDetails;
import com.diasec.diasec_backend.service.MemberService;
import com.diasec.diasec_backend.service.NicepayService;
import com.diasec.diasec_backend.service.OrderPriceValidator;
import com.diasec.diasec_backend.vo.MemberVo;
import com.diasec.diasec_backend.vo.OrderVo;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment/nicepay")
public class NicepayController {
    
    private final NicepayService nicepayService;
    private final MemberService memberService;
    private final OrderPriceValidator orderPriceValidator;

    // 가상계좌 발급 요청
    @PostMapping("/vbank")
    public ResponseEntity<?> requestVBank(@RequestBody OrderVo orderVo) {
        try {
            Map<String, Object> result = nicepayService.requestVBank(orderVo);
            System.out.println("nicepay result = " + result);

            return ResponseEntity.ok(Map.of("success", true, "result", result));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 가상계좌 결제 준비: 주문 데이터 임시 저장 후 orderId 반환
    @PostMapping("/vbank/prepare")
    public ResponseEntity<?> prepareVBank(@RequestBody OrderVo orderVo) {
        try {
            String loginId = resolveLoginMemberId();
            if (loginId != null) {
                orderVo.setId(loginId);
            } else {
                orderVo.setId("");
                orderVo.setUsedCredit(0);
            }
            orderPriceValidator.validate(orderVo);
            String orderId = nicepayService.saveDraft(orderVo);
            return ResponseEntity.ok(Map.of("success", true, "orderId", orderId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    // 가상계좌 return (결제창 인증 후)
    @GetMapping("/vbank/return")
    public void vbankReturnGet(@RequestParam Map<String, String> params, HttpServletResponse response) throws Exception {
        String redirectUrl = nicepayService.handleVBankReturn(params);
        response.sendRedirect(redirectUrl);
    }
    @PostMapping("/vbank/return")
    public void vbankReturnPost(@RequestParam Map<String, String> params, HttpServletResponse response) throws Exception {
        String redirectUrl = nicepayService.handleVBankReturn(params);
        response.sendRedirect(redirectUrl);
    }

    // 카드 결제 준비: 주문 데이터 임시 저장 후 orderId 반환 (결제창 orderId로 사용)
    @PostMapping("/prepare")
    public ResponseEntity<?> prepareCard(@RequestBody OrderVo orderVo) {
        try {
            String loginId = resolveLoginMemberId();
            if (loginId != null) {
                orderVo.setId(loginId);
            } else {
                orderVo.setId("");
                orderVo.setUsedCredit(0);
            }
            orderPriceValidator.validate(orderVo);
            String orderId = nicepayService.saveDraft(orderVo);
            return ResponseEntity.ok(Map.of("success", true, "orderId", orderId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private String resolveLoginMemberId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
            || "anonymousUser".equals(authentication.getPrincipal())) {
        return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getMember().getId();
        }
        if (principal instanceof OAuth2User oAuth2User) {
            String provider = oAuth2User.getAttribute("provider");
            String providerUid = oAuth2User.getAttribute("providerUid");
            String email = oAuth2User.getAttribute("email");
            MemberVo member = memberService.findByProviderUid(provider, providerUid);
            if (member == null) member = memberService.findWebMemberByEmail(email);
            return member != null ? member.getId() : null;
        }
        return null;
    }


    @GetMapping("/return")
    public void cardReturnGet(@RequestParam Map<String, String> params, HttpServletResponse response) throws Exception {
        String redirectUrl = nicepayService.handleCardReturn(params);
        response.sendRedirect(redirectUrl);
    }

    @PostMapping("/return")
    public void cardReturnPost(@RequestParam Map<String, String> params, HttpServletResponse response) throws Exception {
        String redirectUrl = nicepayService.handleCardReturn(params);
        System.out.println("nicepay auth result = " + params);
        response.sendRedirect(redirectUrl);
    }
}
