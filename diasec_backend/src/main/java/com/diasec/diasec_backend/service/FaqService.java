package com.diasec.diasec_backend.service;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.diasec.diasec_backend.dao.FaqMapper;
import com.diasec.diasec_backend.vo.FaqVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FaqService {
    private final FaqMapper faqMapper;

    // 전체 목록 가져오기
    public List<FaqVo> getAllFaqs() {
        return faqMapper.getAllFaqs();
    }

    // 검색어로 필터
    public List<FaqVo> getFilteredFaqs(String category, String keyword) {
        return faqMapper.getFilteredFaqs(category, keyword);
    }

    // 조회수 올리기
    public void updateViewCount(Long id) {
        faqMapper.updateViewCount(id);
    }

    // TOP5 조회
    public List<FaqVo> getTopFaqs(int limit) {
        return faqMapper.getTopFaqs(limit);
    }

    // 관리자 - 등록
    public void insertFaq(FaqVo faqVo) {
        faqMapper.insertFaq(faqVo);
    }

    // 관리자 - 수정
    public void updateFaq(FaqVo faqVo) {
        faqMapper.updateFaq(faqVo);
    }

    // 관리자 - 삭제
    public void deleteFaq(@PathVariable Long id) {
        faqMapper.deleteFaq(id);
    }
}
