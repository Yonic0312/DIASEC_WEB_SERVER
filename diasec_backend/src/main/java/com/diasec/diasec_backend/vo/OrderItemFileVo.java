package com.diasec.diasec_backend.vo;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class OrderItemFileVo {
    private Long fileId;
    private Long itemId;

    private String role;
    private Integer version;
    private String status;

    private String fileUrl;
    private String originalName;
    private Long fileSize;
    private String mimeType;

    private String uploadedBy;
    private String customerFeedback;

    private LocalDateTime createdAt;
    private LocalDateTime deleteScheduledAt;
    private LocalDateTime deletedAt;
}
