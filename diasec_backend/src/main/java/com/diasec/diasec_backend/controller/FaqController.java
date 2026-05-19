package com.diasec.diasec_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.FaqService;
import com.diasec.diasec_backend.vo.FaqVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/faq")
public class FaqController {
    
    private final FaqService faqService;

    // 전체 목록 가져오기
    @GetMapping("/list")
    public ResponseEntity<List<FaqVo>> getFaqList(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String keyword) {
            
        List<FaqVo> list = faqService.getFilteredFaqs(category, keyword);
        return ResponseEntity.ok(list);
    }

    // 조회수 올리기
    @PatchMapping("/view/{id}")
    public void updateViewCount(@PathVariable Long id) {
        faqService.updateViewCount(id);
    }

    // TOP5 조회
    @GetMapping("/top5")
    public List<FaqVo> getTop5Faqs() {
        List<FaqVo> list = faqService.getTopFaqs(5);
        return list;
    }

    // 관리자 - 등록
    @PostMapping("/add")
    public ResponseEntity<String> addFaq(@RequestBody FaqVo faqVo) {
        faqService.insertFaq(faqVo);
        return ResponseEntity.ok("등록 완료");
    }

    // 관리자 - 수정
    @PatchMapping("/update/{id}")
    public ResponseEntity<String> updateFaq(@PathVariable Long id, @RequestBody FaqVo faqVo) {
        faqVo.setFaqId(id);
        faqService.updateFaq(faqVo);
        return ResponseEntity.ok("수정 완료");
    }

    // 관리자 - 삭제
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteFaq(@PathVariable Long id) {
        faqService.deleteFaq(id);
        return ResponseEntity.ok("삭제 완료");
    }
}
