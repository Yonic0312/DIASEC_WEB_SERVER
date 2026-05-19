package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class BizFileVo {
    private Long fileId;
    private Long id;
    private String filePath;
    private String savedName;
    private String originalName;
    private String url;
}
