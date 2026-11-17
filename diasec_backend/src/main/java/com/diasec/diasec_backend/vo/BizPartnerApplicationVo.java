package com.diasec.diasec_backend.vo;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

@Data
public class BizPartnerApplicationVo {
    private Long id;
    private String memberId;
    private String companyName;
    private String managerNameTitle;
    private String phone;
    private String email;
    private String industry;
    private String etcRequest;
    private boolean contractAgreed;
    private String businessLicensePath;
    private String businessLicenseName;

    @JsonIgnore 
    private MultipartFile license;
    private String status;
    private String adminReply;
    private String createdAt;
    private String reviewedAt;
    private String partnerStatus;

    // 조회용
    private String memberName;
    private Long cumulativeAmount;
    private String partnerGrade;
    private Integer discountPercent;
}
