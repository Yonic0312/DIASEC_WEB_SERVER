package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class CreditVo {
    private int cid;
    private String id;
    private String type;
    private int amount;
    private String description;
    private String createdAt;
    private Long oid;

    // 조인
    private int credit;
    private String totalCount;
    private String title;
}
