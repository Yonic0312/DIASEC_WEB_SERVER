package com.diasec.diasec_backend.controller;

import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.security.CustomUserDetails;
import com.diasec.diasec_backend.service.BizPartnerService;
import com.diasec.diasec_backend.service.MemberService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.BizPartnerApplicationVo;
import com.diasec.diasec_backend.vo.MemberVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/biz-partner")
public class BizPartnerController {

    private static final long LICENSE_MAX_BYTES = 10L * 1024 * 1024;
    private static final Set<String> LICENSE_EXT = Set.of("pdf", "jpg", "jpeg", "png");

    private final BizPartnerService bizPartnerService;
    private final MemberService memberService;
    private final ImageUtil imageUtil;
    
    // 업무제휴 신청
    // 프론트에서 memberId는 보내지 않음 -> 서버에서 로그인 회원 id로 설정
    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> apply(@ModelAttribute BizPartnerApplicationVo vo) {
        String savedUrl = null;
        try {
            String memberId = resolveLoginMemberId();
            if (memberId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            MultipartFile license = vo.getLicense();
            String licenseError = validateLicense(license);
            if (licenseError != null) {
                return ResponseEntity.badRequest().body(licenseError);
            }

            savedUrl = imageUtil.saveImage(license, "BizPartner");
            vo.setMemberId(memberId);
            vo.setBusinessLicensePath(savedUrl);
            vo.setBusinessLicenseName(fileNameOnly(license.getOriginalFilename()));
            bizPartnerService.apply(vo);
            return ResponseEntity.ok("신청이 접수되었습니다.");
        } catch (IllegalArgumentException | IllegalStateException e) {
            if (savedUrl != null) imageUtil.deleteImage(savedUrl);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            if (savedUrl != null) imageUtil.deleteImage(savedUrl);
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("신청 처리 중 오류가 발생했습니다.");
        }
    }

    private String validateLicense(MultipartFile license) {
        if (license == null || license.isEmpty()) {
            return "사업자 등록증을 첨부해주세요.";
        }
        if (license.getSize() > LICENSE_MAX_BYTES) {
            return "사업자 등록증은 10MB 이하만 가능합니다.";
        }
        String name = fileNameOnly(license.getOriginalFilename());
        int dot = name.lastIndexOf('.');
        String ext = dot >= 0 ? name.substring(dot + 1).toLowerCase() : "";
        if (!LICENSE_EXT.contains(ext)) {
            return "사업자 등록증은 PDF, JPG, PNG만 가능합니다.";
        }
        return null;
    }

    private String fileNameOnly(String original) {
        if (original == null || original.isBlank()) return "license";
        String name = original.replace("\\", "/");
        int slash = name.lastIndexOf('/');
        return slash >= 0 ? name.substring(slash + 1) : name;
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
