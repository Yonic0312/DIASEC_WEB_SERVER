package com.diasec.diasec_backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.CreditService;
import com.diasec.diasec_backend.vo.CreditVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequestMapping("/api/credit")
@RequiredArgsConstructor
public class CreditController {
    
    private final CreditService creditService;

    // 적립금 내역 추가
    @PostMapping("/add")
    public void insertCreditHistory(@RequestBody CreditVo creditVo) {
        creditService.insertCreditHistory(creditVo);
    }

    // 적립금 내역 가져오기
    @GetMapping("/history/{id}")
    public List<CreditVo> getCreditHistory(@PathVariable String id) {
        return creditService.getCreditHistoryByMemberId(id);
    }

    @PostMapping("/manual")
    public ResponseEntity<?> manualCredit(@RequestBody CreditVo creditVo) {
        try {
            creditService.insertCreditHistory(creditVo);
            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "처리 실패"));
        }
    }

    @DeleteMapping("/delete/{cid}")
    public ResponseEntity<?> deleteCredit(@PathVariable int cid) {
        try {
            creditService.deleteCreditByCid(cid);
            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "삭제 실패"));
        }
    }
}
