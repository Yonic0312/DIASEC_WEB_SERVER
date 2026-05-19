package com.diasec.diasec_backend.vo;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BizReplyVo {
    private Long replyId;
    private Long id;
    private String content;
    private LocalDateTime createdAt;
}
