package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.web.bind.annotation.PathVariable;

import com.diasec.diasec_backend.vo.FaqVo;

@Mapper
public interface FaqMapper {
    
    // 전체 목록 가져오기
    List<FaqVo> getAllFaqs();

    // 검색어로 필터
    List<FaqVo> getFilteredFaqs(@Param("category") String category, @Param("keyword") String keyword);

    // 조회수 올리기
    void updateViewCount(Long id);

    // TOP5 조회
    List<FaqVo> getTopFaqs(int limit);

    // 관리자 - 등록
    void insertFaq(FaqVo faqVo);
    
    // 관리자 - 수정
    void updateFaq(FaqVo faqVo);

    // 관리자 - 삭제
    void deleteFaq(@PathVariable Long id);

}
