package com.diasec.diasec_backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.security.CustomUserDetails;
import com.diasec.diasec_backend.service.CreditService;
import com.diasec.diasec_backend.service.MemberService;
import com.diasec.diasec_backend.vo.CreditVo;
import com.diasec.diasec_backend.vo.MemberVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequestMapping("/api/credit")
@RequiredArgsConstructor
public class CreditController {
    
    private final CreditService creditService;
    private final MemberService memberService;

    // 적립금 내역 추가
    @PostMapping("/add")
    public void insertCreditHistory(@RequestBody CreditVo creditVo) {
        creditService.insertCreditHistory(creditVo);
    }

    // 적립금 내역 가져오기
    @GetMapping("/history/{id}")
    public ResponseEntity<?> getCreditHistory(@PathVariable String id) {
        String loginId = resolveLoginMemberId();
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
            .getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (!isAdmin && !loginId.equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("본인 적립금 내역만 조회할 수 있습니다.");
        }

        return ResponseEntity.ok(creditService.getCreditHistoryByMemberId(id));
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
        if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User oAuth2User) {
            MemberVo member = memberService.findByProviderUid(
                oAuth2User.getAttribute("provider"),
                oAuth2User.getAttribute("providerUid")
            );
            if (member == null) {
                member = memberService.findWebMemberByEmail(oAuth2User.getAttribute("email"));
            }
            return member != null ? member.getId() : null;
        }
        return null;
    }

    @PostMapping("/manual")
    public ResponseEntity<?> manualCredit(@RequestBody CreditVo creditVo) {
        try {
            creditService.insertCreditHistory(creditVo);
            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "처리 실패"));
        }
    }

    @DeleteMapping("/delete/{cid}")
    public ResponseEntity<?> deleteCredit(@PathVariable int cid) {
        try {
            creditService.deleteCreditByCid(cid);
            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "삭제 실패"));
        }
    }
}
