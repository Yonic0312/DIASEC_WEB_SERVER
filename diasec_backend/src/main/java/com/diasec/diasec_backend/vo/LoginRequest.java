package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class LoginRequest {
    private String id;
    private String password;
}
