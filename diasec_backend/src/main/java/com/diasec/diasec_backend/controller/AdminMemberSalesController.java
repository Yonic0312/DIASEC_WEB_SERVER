package com.diasec.diasec_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.AdminMemberSalesService;
import com.diasec.diasec_backend.vo.MemberSalesRankingVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/member")
public class AdminMemberSalesController {
    
    private final AdminMemberSalesService adminMemberSalesService;

    // 회원별 매출 순위 (배송완료 / 교환완료만 집계)
    @GetMapping("/sales-ranking")
    public ResponseEntity<List<MemberSalesRankingVo>> salesRanking(
        @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(adminMemberSalesService.getSalesRanking(keyword));
    }
}
