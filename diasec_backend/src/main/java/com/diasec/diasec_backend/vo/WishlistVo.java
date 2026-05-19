package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class WishlistVo {
    private int wid;
    private String id;
    private int pid;
    private String author;
    private String category;
    private String createdAt;

    // 조인용 필드
    private String title;
    private int price;
    private String thumbnail;
}
