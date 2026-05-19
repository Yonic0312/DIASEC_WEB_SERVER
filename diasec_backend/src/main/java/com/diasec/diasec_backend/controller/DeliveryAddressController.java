package com.diasec.diasec_backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.DeliveryAddressService;
import com.diasec.diasec_backend.vo.DeliveryAddressVo;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/address")
public class DeliveryAddressController {
    
    private final DeliveryAddressService deliveryAddressService;

    // 1. 회원의 배송지 목록 조회
    @GetMapping("/{id}")
    public List<DeliveryAddressVo> getAddressList(@PathVariable String id) {
        return deliveryAddressService.getAddressList(id);
    }

    // 1-1. 단일 배송지 조회
    @GetMapping("/one/{cno}")
    public DeliveryAddressVo getOneAddress(@PathVariable Long cno) {
        return deliveryAddressService.getOneAddress(cno);
    }

    // 2. 배송지 추가
    @PostMapping("/add")
    public void addAddress(@RequestBody DeliveryAddressVo address) {
        deliveryAddressService.addAddress(address);
    }

    // 3. 배송지 수정
    @PostMapping("/update")
    public void updateAddress(@RequestBody DeliveryAddressVo address) {
        deliveryAddressService.updateAddress(address);
    }

    // 4. 배송지 삭제
    @DeleteMapping("/{cno}")
    public void deleteAddress(@PathVariable Long cno) {
        deliveryAddressService.deleteAddress(cno);
    }

}
