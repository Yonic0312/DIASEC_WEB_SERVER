package com.diasec.diasec_backend.vo;

import java.util.List;

import lombok.Data;

@Data
public class InquiryVo {
    private Long imgId;
    private Long iid;
    private Long rid;
    private Long pid;
    private String id;
    private String title;
    private String category;
    private String content;
    private String isPrivate;
    private String status;
    private String imageUrl;
    private List<String> imageUrls;
    private String timestamp;
    private String createdAt;
    private String rcreatedAt;

    private String productName;
    private Long unanswered;
    private String productImg;

    // 답변
    private String answer;
}
