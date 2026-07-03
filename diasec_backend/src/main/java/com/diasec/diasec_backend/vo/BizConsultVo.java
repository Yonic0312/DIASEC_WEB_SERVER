package com.diasec.diasec_backend.vo;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class BizConsultVo {
    private Long id;
    private String companyName;
    private String deptManagerTitle;
    private String email;
    private String phone;
    private String quantity;
    private String budget;
    private String sizes;
    private String artworkTypes;
    private String themes;
    private String atmostpheres;
    private String installPlace;
    private String etcInquiry;
    private String password;
    private Integer privacyAgreed;
    private String createdAt;
    private String status;
    
    private List<MultipartFile> files;
    private List<BizConsultFileVo> fileList;
}
