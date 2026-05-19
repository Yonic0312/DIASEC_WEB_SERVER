package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class DeliveryAddressVo {
    private Long cno;
    private String id;
    private String label;
    private String recipient;
    private String phone;
    private String postcode;
    private String address;
    private String detailAddress;
    private Boolean isDefault;
    private String createdAt;
    private String updatedAt;

    // Join
    private int credit;
}
