package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class SmsVo {
    private String to;
    private String code;
    private String type;
}
