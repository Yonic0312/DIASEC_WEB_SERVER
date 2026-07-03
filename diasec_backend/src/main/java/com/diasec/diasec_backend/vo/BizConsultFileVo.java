package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class BizConsultFileVo {
    private Long oid;
    private Long consultId;
    private String filePath;
    private String originalName;
    private String createdAt;
}