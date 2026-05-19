package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class CartVo {
    private  int cid;
    private String id;
    private int pid;
    private String title;
    private String category;
    private int price;
    private String thumbnail;
    private String size;
    private int quantity;
    private String finishType;
    private String createdAt;
}
