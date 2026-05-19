package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class MemberVo {
    private String id;
    private String password;
    private String name;
    private String phone;
    private String email;
    private String gender;
    private String birth;
    private String region;
    private boolean smsAgree;
    private boolean emailAgree;
    private String currentPassword;  // ✅ 현재 비밀번호 (회원 수정)
    private String newPassword;      // ✅ 새 비밀번호 (회원 수정)
    private String role;
    private int credit;
    private String createdAt;

    // 카카오 로그인
    private String nickname;   // 카카오 닉네임 저장용
    private String provider;   // 소셜 로그인 제공자 (예: "kakao")

    // 소셜 로그인
    private String kakao_uid;
    private String naver_uid;

}
