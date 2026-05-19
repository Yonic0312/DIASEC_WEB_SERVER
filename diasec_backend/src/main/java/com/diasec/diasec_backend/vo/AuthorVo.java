package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class AuthorVo {
    private String memberId;

    // 작가정보
    private String nickname;
    private String description;
    private String tagline;
    private String portfolio;

    // 정산
    private String accountHolder;
    private String bank;
    private String accountNumber;

    // 대표 이미지
    private String title;

    // 기본정보(회원에 없을 때만 넘어옴)
    private String name;
    private String email;
    private String phone;

    private String author_profile_image;
    private String author_status;
    private String author_reject_reason;

    private String imageUrl;
}
