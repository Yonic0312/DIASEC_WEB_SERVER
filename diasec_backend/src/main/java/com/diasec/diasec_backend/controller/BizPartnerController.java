package com.diasec.diasec_backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.security.CustomUserDetails;
import com.diasec.diasec_backend.service.BizPartnerService;
import com.diasec.diasec_backend.service.MemberService;
import com.diasec.diasec_backend.vo.BizPartnerApplicationVo;
import com.diasec.diasec_backend.vo.MemberVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/biz-partner")
public class BizPartnerController {

    private final BizPartnerService bizPartnerService;
    private final MemberService memberService;
    
    // 업무제휴 신청
    // 프론트에서 memberId는 보내지 않음 -> 서버에서 로그인 회원 id로 설정
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody BizPartnerApplicationVo vo) {
        try {
            String memberId = resolveLoginMemberId();
            if (memberId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            vo.setMemberId(memberId);
            bizPartnerService.apply(vo);
            return ResponseEntity.ok("신청이접수되었습니다.");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("신청 처리 중 오류가 발생했습니다.");
        }
    }

    // 마이페이지용 - 파트너 상태, 등급, 누적금액, 할인율 조회
    @GetMapping("/my-status")
    public ResponseEntity<?> myStatus() {
        try {
            String memberId = resolveLoginMemberId();
            if (memberId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            Map<String, Object> status = bizPartnerService.getMyStatus(memberId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("조회 중 오류가 발생했습니다.");
        }
    }

    // 로그인 회원 id 추출 (일반 로그인 + 소셜 로그인)
    // MemberController /me 와 동일한 방식
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
            if (member == null) {
                member = memberService.findWebMemberByEmail(email);
            }
            return member != null ? member.getId() : null;
        }

        return null;
    }
}
