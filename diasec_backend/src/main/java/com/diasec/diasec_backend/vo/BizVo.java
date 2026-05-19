package com.diasec.diasec_backend.vo;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class BizVo {
    private int id;
    private String title;
    private String companyName;
    private String managerName;
    private String phone;
    private String email;
    private String businessNumber;
    private String dueDate;
    private int quantity;
    private String size;
    private String message;
    private String postcode;
    private String address;
    private String detailAddress;
    private String password;
    private String replyExists;
    private Integer isSecret;
    private Integer requestEstimate;
    private String createdAt;
    private Long unansweredCount;

    private List<MultipartFile> files;
    private List<BizFileVo> fileList;
    private BizReplyVo reply;
}
