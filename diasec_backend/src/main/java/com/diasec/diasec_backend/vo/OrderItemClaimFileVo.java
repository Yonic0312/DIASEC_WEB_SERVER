package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class OrderItemClaimFileVo {
    private Long fileId;
    private Long itemId;
    private String fileUrl;
    private String originalName;
    private Long fileSize;
    private Integer imgOrder;
    private String createdAt;
}
