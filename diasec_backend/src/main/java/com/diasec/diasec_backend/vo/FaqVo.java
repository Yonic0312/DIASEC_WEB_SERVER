package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class FaqVo {
    private Long faqId;
    private String category;
    private String question;
    private String answer;
    private String createdAt;
}
