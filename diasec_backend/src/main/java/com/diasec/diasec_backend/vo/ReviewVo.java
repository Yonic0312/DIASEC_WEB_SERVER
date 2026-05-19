package com.diasec.diasec_backend.vo;

import java.util.List;

import lombok.Data;

@Data
public class ReviewVo {
    private Long rid;
    private Long pid;
    private String id;
    private int rating;
    private String content;
    private List<String> images;
    private String createdAt;

    private String title;
    private String size;
    private int item_id;
    private String thumbnail;

}
