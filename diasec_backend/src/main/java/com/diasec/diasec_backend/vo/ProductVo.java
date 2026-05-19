package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class ProductVo {
    private int pid;
    private String title;
    private int price;
    private String category;
    private String author;
    private String imageUrl;
    private String hoverImageUrl;
    private String createdAt;
    private Long sales;
    private int sortOrder;

    private String oldName;
}
