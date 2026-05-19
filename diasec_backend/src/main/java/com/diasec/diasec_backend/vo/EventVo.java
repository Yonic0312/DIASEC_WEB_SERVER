package com.diasec.diasec_backend.vo;

import java.sql.Timestamp;
import lombok.Data;

@Data
public class EventVo {
    private int eventId;
    private String title;
    private String thumbnailUrl;
    private String detailImageUrl;
    private String period;
    private String status;
    private String content;
    private Timestamp createdAt;
}
