package com.diasec.diasec_backend.config;

import com.diasec.diasec_backend.service.MemberService;
import com.diasec.diasec_backend.vo.MemberVo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberService memberService;

    @Override
public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

    System.out.println("\n================== [OAUTH] loadUser START ==================");
    System.out.println("[OAUTH] client=" + userRequest.getClientRegistration().getRegistrationId());
    System.out.println("[OAUTH] redirectUri=" + userRequest.getClientRegistration().getRedirectUri());
    System.out.println("[OAUTH] scopes=" + userRequest.getClientRegistration().getScopes());
    System.out.println("[OAUTH] accessToken=" + (userRequest.getAccessToken() != null ? "YES" : "NO"));

    OAuth2User user = super.loadUser(userRequest);
    System.out.println("[OAUTH] super.loadUser OK");

    String provider = userRequest.getClientRegistration().getRegistrationId();
    Map<String, Object> attributes = user.getAttributes();

    System.out.println("[OAUTH] attributes keys=" + (attributes != null ? attributes.keySet() : null));
    // ⚠️ 너무 길면 주석 처리
    // System.out.println("[OAUTH] attributes=" + attributes);

    String email;
    String nickname;
    String providerUid;
    Map<String, Object> userAttributes;

    try {
        if ("kakao".equals(provider)) {
            providerUid = String.valueOf(attributes.get("id"));

            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = kakaoAccount != null ? (Map<String, Object>) kakaoAccount.get("profile") : null;

            email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
            nickname = profile != null ? (String) profile.get("nickname") : null;

            System.out.println("[OAUTH][KAKAO] uid=" + providerUid);
            System.out.println("[OAUTH][KAKAO] email=" + email);
            System.out.println("[OAUTH][KAKAO] nickname=" + nickname);

            kakaoAccount.put("email", email);
            kakaoAccount.put("nickname", nickname);
            kakaoAccount.put("provider", provider);
            kakaoAccount.put("providerUid", providerUid);

            userAttributes = kakaoAccount;

        } else if ("naver".equals(provider)) {
            Map<String, Object> response = (Map<String, Object>) attributes.get("response");

            providerUid = response != null ? String.valueOf(response.get("id")) : null;
            email = response != null ? (String) response.get("email") : null;
            nickname = response != null ? (String) response.get("name") : null;

            System.out.println("[OAUTH][NAVER] uid=" + providerUid);
            System.out.println("[OAUTH][NAVER] email=" + email);
            System.out.println("[OAUTH][NAVER] nickname=" + nickname);
            System.out.println("[OAUTH][NAVER] response keys=" + (response != null ? response.keySet() : null));

            response.put("nickname", nickname);
            response.put("email", email);
            response.put("provider", provider);
            response.put("providerUid", providerUid);

            userAttributes = response;

        } else {
            System.out.println("[OAUTH] UNSUPPORTED provider=" + provider);
            throw new OAuth2AuthenticationException("UNSUPPORTED_PROVIDER");
        }
    } catch (Exception ex) {
        System.out.println("[OAUTH] ERROR while parsing attributes: " + ex.getClass().getName() + " / " + ex.getMessage());
        ex.printStackTrace();
        throw ex;
    }

    // ===== DB 조회 분기 추적 =====
    System.out.println("[OAUTH] DB check: findByProviderUid(" + provider + ", " + providerUid + ")");

    MemberVo linked;
    try {
        linked = memberService.findByProviderUid(provider, providerUid);
        System.out.println("[OAUTH] linked=" + (linked != null ? ("YES id=" + linked.getId() + " role=" + linked.getRole()) : "NO"));
    } catch (Exception ex) {
        System.out.println("[OAUTH] DB ERROR on findByProviderUid: " + ex.getClass().getName() + " / " + ex.getMessage());
        ex.printStackTrace();
        throw ex;
    }

    if (linked != null) {
        System.out.println("[OAUTH] => RETURN linked user (no linking needed)");
        System.out.println("================== [OAUTH] loadUser END ==================\n");
        return new DefaultOAuth2User(
            Collections.singleton(new SimpleGrantedAuthority("ROLE_" + linked.getRole())),
            userAttributes,
            "nickname"
        );
    }

    System.out.println("[OAUTH] DB check: findWebMemberByEmail(" + email + ")");
    MemberVo webMember;
    try {
        webMember = memberService.findWebMemberByEmail(email);
        System.out.println("[OAUTH] webMember=" + (webMember != null ? ("YES id=" + webMember.getId() + " provider=" + webMember.getProvider()) : "NO"));
    } catch (Exception ex) {
        System.out.println("[OAUTH] DB ERROR on findWebMemberByEmail: " + ex.getClass().getName() + " / " + ex.getMessage());
        ex.printStackTrace();
        throw ex;
    }

    if (webMember != null) {
        System.out.println("[OAUTH] => LINK_REQUIRED (set session PENDING_SOCIAL)");

        ServletRequestAttributes attrs =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        System.out.println("[OAUTH] RequestContextHolder attrs=" + (attrs != null ? "YES" : "NO"));

        if (attrs != null) {
            HttpServletRequest req = attrs.getRequest();
            HttpSession session = req.getSession(true);
            System.out.println("[OAUTH] sessionId=" + session.getId());

            Map<String, Object> pending = new java.util.HashMap<>();
            pending.put("email", email);
            pending.put("provider", provider);
            pending.put("providerUid", providerUid);
            pending.put("nickname", nickname);

            session.setAttribute("PENDING_SOCIAL", pending);
            System.out.println("[OAUTH] PENDING_SOCIAL set OK");
        } else {
            System.out.println("[OAUTH] WARNING: attrs null -> cannot store PENDING_SOCIAL");
        }

        System.out.println("================== [OAUTH] loadUser END (THROW LINK_REQUIRED) ==================\n");
        throw new OAuth2AuthenticationException(new OAuth2Error("LINK_REQUIRED"), "LINK_REQUIRED");
    }

    System.out.println("[OAUTH] => NEW SOCIAL MEMBER createSocialMember(email=" + email + ", provider=" + provider + ", uid=" + providerUid + ")");
    try {
        memberService.createSocialMember(email, nickname, provider, providerUid);
        System.out.println("[OAUTH] createSocialMember OK");
    } catch (Exception ex) {
        System.out.println("[OAUTH] DB ERROR on createSocialMember: " + ex.getClass().getName() + " / " + ex.getMessage());
        ex.printStackTrace();
        throw ex;
    }

    MemberVo created = memberService.findByProviderUid(provider, providerUid);
    System.out.println("[OAUTH] created=" + (created != null ? ("YES id=" + created.getId() + " role=" + created.getRole()) : "NO"));

    String role = (created != null && created.getRole() != null) ? created.getRole() : "USER";

    System.out.println("[OAUTH] => RETURN new social user role=" + role);
    System.out.println("================== [OAUTH] loadUser END ==================\n");

    return new DefaultOAuth2User(
        Collections.singleton(new SimpleGrantedAuthority("ROLE_" + role)),
        userAttributes,
        "nickname"
    );
}

}
