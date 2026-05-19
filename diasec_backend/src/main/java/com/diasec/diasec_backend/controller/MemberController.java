package com.diasec.diasec_backend.controller;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

import com.diasec.diasec_backend.security.CustomUserDetails;
import com.diasec.diasec_backend.service.CreditService;
import com.diasec.diasec_backend.service.MemberService;
import com.diasec.diasec_backend.vo.CreditVo;
import com.diasec.diasec_backend.vo.MemberVo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequestMapping("/api/member")
public class MemberController {

    @Autowired
    private MemberService memberService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired 
    private CreditService creditService;

    @GetMapping("/check-id")
    public boolean checkDuplicatedId(@RequestParam String id) {
        return memberService.isDuplicatedId(id); // 중복이면 true
    }

    // 이메일 중복
    @GetMapping("/check-email")
    public boolean checkDuplicatedEamil(@RequestParam String email) {
        return memberService.isDuplicatedEmail(email);
    }

    // 휴대폰번호 중복
    @GetMapping("/check-phone")
    public boolean checkDuplicatedPhone(@RequestParam String phone) {
        return memberService.isDuplicatedPhone(phone);
    }

    @PostMapping("/check-password")
    public ResponseEntity<?> checkPassword(@RequestBody MemberVo member) {
        MemberVo foundMember = validateMemberExistence(member.getId());

        validatePassword(member.getPassword(), foundMember.getPassword());
        return ResponseEntity.ok().body("비밀번호 일치");
    }

    @PostMapping("/modify-password")
    public ResponseEntity<?> modifyPassword(@RequestBody MemberVo member) {
        MemberVo foundMember = validateMemberExistence(member.getId());

        validatePassword(member.getCurrentPassword(), foundMember.getPassword());

        String encodedNewPassword = passwordEncoder.encode(member.getNewPassword());
        memberService.modifyPassword(member.getId(), encodedNewPassword);
        return ResponseEntity.ok("비밀번호 수정 완료");
    }

    @PostMapping("/register")
    public String registerMember(@RequestBody MemberVo member) {
        // 아이디 중복확인
        if (memberService.isDuplicatedId(member.getId())) {
            return "중복된 아이디입니다.";
        }

        member.setPassword(passwordEncoder.encode(member.getPassword()));
        
        memberService.registerMember(member);

        // [검색]회원가입 크레딧 지급
        CreditVo creditVo = new CreditVo();
        creditVo.setId(member.getId());
        creditVo.setType("적립");
        creditVo.setAmount(5000); // 회원가입 지원금
        creditVo.setDescription("회원가입 축하 적립");
        creditService.insertCreditHistory(creditVo);
        return "회원가입이 완료되었습니다.";
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentMember() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
            authentication.getPrincipal().equals("anonymousUser")) {
            // 여기서 401 말고 200 + "비로그인 상태" 메시지 리턴
            return ResponseEntity.ok().body(Map.of("loggedIn", false, "message", "로그인 안됨"));
        }

        Object principal = authentication.getPrincipal();
        MemberVo member;
        String nickname = null;

        if (principal instanceof CustomUserDetails userDetails) {
            member = userDetails.getMember();
        } else if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User oAuth2User) {
            String provider = oAuth2User.getAttribute("provider");
            String providerUid = oAuth2User.getAttribute("providerUid");
            String email = oAuth2User.getAttribute("email");
            nickname = oAuth2User.getAttribute("nickname");

            member = memberService.findByProviderUid(provider, providerUid);

            if (member == null) {
                member = memberService.findWebMemberByEmail(email);
            }

            if (member == null) {
                return ResponseEntity.ok().body(Map.of("loggedIn", false, "message", "회원 정보를 찾을 수 없습니다."));
            }

        } else {
            return ResponseEntity.ok().body(Map.of("loggedIn", false, "message", "알 수 없는 사용자"));
        }

        return ResponseEntity.ok(
            member
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext(); // 시큐리티 컨텍스트도 비움
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    @PostMapping("/findId")
    public ResponseEntity<?> findId(@RequestBody MemberVo member) {
        MemberVo result = findMemberByContactInfo(member);

        if (result == null) {
            return ResponseEntity.status(404).body("회원 정보를 찾을 수 없습니다.");
        } 
        return ResponseEntity.ok().body(result);
    }

    @PostMapping("/findPwd")
    public ResponseEntity<?> findPwd(@RequestBody MemberVo member) {
        MemberVo result = memberService.resetPasswordWithTempPassword(member);

       if (!result.getId().isEmpty()) {
        return ResponseEntity.ok().body(result);
       } else {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("일치하는 회원 정보가 없습니다.");
       }
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateMember(@RequestBody MemberVo member, HttpServletRequest request) {
        MemberVo foundMember = validateMemberExistence(member.getId());

        if ("web".equals(foundMember.getProvider())) {
            // 현재 비밀번호가 일치하는지 확인
            validatePassword(member.getCurrentPassword(), foundMember.getPassword());
        }

        // 새 비밀번호가 있으면 인코딩, 없으면 기존 유지
        String passwordUpdate = ("web".equals(foundMember.getProvider()) && member.getNewPassword() != null && !member.getNewPassword().isEmpty())
            ? passwordEncoder.encode(member.getNewPassword())
            : foundMember.getPassword();

            copyMemberProperties(member, foundMember);
            member.setPassword(passwordUpdate);
            member.setProvider(foundMember.getProvider());

            // 현재 로그인 사용자 Authentication 갱신
            Authentication newAuth = new UsernamePasswordAuthenticationToken(
                // new CustomUserDetails(member),
                // null,
                // List.of(new SimpleGrantedAuthority("ROLE_USER"))

                new CustomUserDetails(foundMember),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + foundMember.getRole()))
            );
            SecurityContextHolder.getContext().setAuthentication(newAuth);

            // 세션에도 수동으로 저장
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    SecurityContextHolder.getContext());
            }

        memberService.updateMember(member);

        return ResponseEntity.ok("회원정보 수정 완료");
    }

    // 회원 탈퇴
    @PostMapping("/delete")
    public ResponseEntity<?> deleteMember(@RequestBody MemberVo member, HttpServletRequest request) {
        String targetId = member.getId();
        if (targetId == null || targetId.isBlank()) {
            return ResponseEntity.badRequest().body("id 누락");
        }

        memberService.deleteMember(member.getId());

        // 본인 탈퇴인 경우에만 로그아웃 처리
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String loginId = null;

        if (auth != null && auth.isAuthenticated() && !"anonymouseUser".equals(auth.getPrincipal())) {
            Object principal = auth.getPrincipal();

            if (principal instanceof CustomUserDetails userDetails) {
                loginId = userDetails.getMember().getId();
            }
        }

        if (loginId != null && loginId.equals(targetId)) {
            HttpSession session = request.getSession(false);
            if (session != null) session.invalidate();
            SecurityContextHolder.clearContext();
        }
        
        return ResponseEntity.ok("회원 탈퇴 완료");
    }

    // 모든 회원 목록 가져오기
    @GetMapping("/list")
    public ResponseEntity<List<MemberVo>> getAllMembers() {
        return ResponseEntity.ok(memberService.getAllMembers());
    }

    // 회원 역할 변경
    @PostMapping("/change-role")
    public ResponseEntity<?> changeRole(@RequestBody MemberVo member) {
        memberService.updateRole(member.getId(), member.getRole());
        return ResponseEntity.ok("역할이 변경되었습니다.");
    }

    @PostMapping("/link-social")
    public ResponseEntity<?> linkSocialAccount(
        @RequestBody Map<String, String> payload,
        HttpServletRequest request
    ) {
        String password = payload.get("password");
        if (password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password 누락");
        }

        HttpSession session = request.getSession(false);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "세션이 없습니다. 소셜 로그인을 다시 시도해주세요.");
        }

        Object pendingObj = session.getAttribute("PENDING_SOCIAL");
        if (!(pendingObj instanceof Map)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연동 정보가 없습니다. 소셜 로그인을 다시 시도해주세요.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> pending = (Map<String, Object>) pendingObj;

        String email = (String) pending.get("email");
        String provider = (String) pending.get("provider");
        String providerUid = (String) pending.get("providerUid");

        if (email == null || provider == null || providerUid == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연동 정보가 불완전합니다. 소셜 로그인을 다시 시도해주세요.");
        }

        // 1. 기존 회원 조회 (id로)
        MemberVo member = memberService.findWebMemberByEmail(email);
        if (member == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "연동할 기존 계정을 찾을 수 없습니다.");
        }

        // // 2. 소셜이 던진 email이 이 web 계정 email이랑 같은지 확인(보안)
        // if (member.getEmail() == null || !member.getEmail().equals(email)) {
        //     throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일이 일치하지 않아 연동할 수 없습니다.");
        // }

        // 3. 비밀번호 검증 (web 계정만)
        if (!"web".equals(member.getProvider())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "web 계정만 연동할 수 있습니다.");
        }

        // 4. 비밀번호 검증
        if (!passwordEncoder.matches(password, member.getPassword())) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "비밀번호가 일치하지 않습니다."));
        }

        // 5. 소셜 UID 연결
        if ("kakao".equals(provider)) {
            memberService.linkKakao(member.getId(), providerUid);
        } else if ("naver".equals(provider)) {
            memberService.linkNaver(member.getId(), providerUid);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 provider");
        }

        member = memberService.selectMemberById(member.getId());

        // 연동 끝났으니 pending 제거
        session.removeAttribute("PENDING_SOCIAL");

        // 6. SecurityContext 로그인 처리
        Authentication auth = new UsernamePasswordAuthenticationToken(
            new CustomUserDetails(member),
            null,
            List.of(new SimpleGrantedAuthority("ROLE_" + member.getRole()))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
        session.setAttribute(
            HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
            SecurityContextHolder.getContext());

        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/link-social/pending")
    public ResponseEntity<?> getLinkSocialPending(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "세션이 없습니다. 소셜 로그인을 다시 시도해주세요."));
        }

        Object pendingObj = session.getAttribute("PENDING_SOCIAL");
        if (!(pendingObj instanceof Map)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "연동 정보가 없습니다. 소셜 로그인을 다시 시도해주세요."));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> pending = (Map<String,Object>) pendingObj;

        String email = (String) pending.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "연동 정보가 없습니다. 소셜 로그인을 다시 시도해주세요."));
        }

        MemberVo webMember = memberService.findWebMemberByEmail(email);
        if (webMember == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "연동할 기존 계정을 찾을 수 없습니다."));
        }

        String maskedId = maskId(webMember.getId());

        return ResponseEntity.ok(Map.of(
            "maskedId", maskedId
        ));
    }

    private String maskId(String id) {
        if (id == null || id.isBlank()) return "";
        if (id.length() <= 2) return id.charAt(0) + "*";
        if (id.length() <= 4) return id.substring(0, 2) + "**";
        return id.substring(0, 3) + "***";
    }

    // [공통 함수]
    // 회원 존재 체크
    private MemberVo validateMemberExistence(String id) {
        MemberVo foundMember = memberService.selectMemberById(id);
        if (foundMember == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회원이 존재하지 않습니다");
        }
        return foundMember;
    }

    // 비밀번호 검증
    private void validatePassword(String rawPassword, String encodedPassword) {
        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다.");
        }
    }

    // member의 set 부분 세팅
    private void copyMemberProperties(MemberVo source, MemberVo target) {
        target.setName(source.getName());
        target.setEmail(source.getEmail());
        target.setPhone(source.getPhone());
        target.setGender(normalizeGender(source.getGender()));
        target.setBirth(source.getBirth());
        target.setRegion(source.getRegion());
        target.setSmsAgree(source.isSmsAgree());
        target.setEmailAgree(source.isEmailAgree());
        target.setRole(source.getRole());
        target.setCredit(source.getCredit());
    }

    /**
     * DB gender 컬럼과 맞게 값 정규화 (M/F 또는 NULL).
     */
    private String normalizeGender(String raw) {
        if (raw == null) return null;

        String v = raw.trim();
        if (v.isEmpty()) return null;

        if ("M".equalsIgnoreCase(v)
            || "male".equalsIgnoreCase(v)
            || "man".equalsIgnoreCase(v)
            || "남".equals(v)
            || "남자".equals(v)) {
            return "M";
        }

        if ("F".equalsIgnoreCase(v)
            || "female".equalsIgnoreCase(v)
            || "woman".equalsIgnoreCase(v)
            || "여".equals(v)
            || "여자".equals(v)) {
            return "F";
        }

        return null;
    }

    // email & phone 찾기
    private MemberVo findMemberByContactInfo(MemberVo member) {
        if (member.getEmail() != null && !member.getEmail().isEmpty()) {
            return memberService.selectMemberByNameAndEmail(member);
        } else if (member.getPhone() != null && !member.getPhone().isEmpty()) {
            return memberService.selectMemberByNameAndPhone(member);
        }
        return null;
    }

    // 현재 유저 정보 가져오기 (헤더)
    private Map<String, Object> extractMemberInfo(MemberVo member, String nickname) {
        Map<String, Object> result = new HashMap<>();
            result.put("id", member.getId());
            result.put("name", member.getName());
            result.put("phone", member.getPhone());
            result.put("gender", member.getGender());
            result.put("birth", member.getBirth());
            result.put("region", member.getRegion());
            result.put("email", member.getEmail());
            result.put("smsAgree", member.isSmsAgree());
            result.put("emailAgree", member.isEmailAgree());
            result.put("provider", member.getProvider());
            result.put("role", member.getRole()); 
            result.put("credit", member.getCredit()); 
            if (nickname != null) {
                result.put("nickname", nickname);
         }
         return result;
    }

    // 관리자 - 유저 업데이트
    @PostMapping("/update-member")
    public ResponseEntity<?> updateMemberByAdmin(@RequestBody MemberVo member) {
        memberService.updateMember(member);
        return ResponseEntity.ok("회원 정보가 수정되었습니다.");
    }

    // 유저 비밀번호 초기화
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPasswordAdmin(@RequestBody Map<String, String> payload) {
        String id = payload.get("id");
        String tempPassword = payload.get("tempPassword");

        if (id == null || tempPassword == null) {
            return ResponseEntity.badRequest().body("id 또는 임시 비밀번호가 누락되었습니다.");
        }

        String encodedPassword = passwordEncoder.encode(tempPassword);
        memberService.modifyPassword(id, encodedPassword);

        return ResponseEntity.ok("비밀번호가 초기화되었습니다.");
    }

    @GetMapping("/credit")
    public ResponseEntity<?> selectCreditById(@RequestParam String id) {
        int credit = memberService.selectCreditById(id);
        return ResponseEntity.ok(Map.of("credit", credit));
    }
}