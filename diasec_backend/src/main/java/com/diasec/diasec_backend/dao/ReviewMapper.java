package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.ReviewVo;

public interface ReviewMapper {

    // 리뷰 작성 부분 목록 가져오기
    List<ReviewVo> getEligibleReviews(String id);

    // 비회원 리뷰 작성 가능한 아이템 목록 가져오기
    List<ReviewVo> getEligibleReviewsByGuestOid(@Param("oid") Long oid);

    // 비회원 리뷰 작성 가능한 아이템 개수 조회
    int countGuestReviewableItem(@Param("oid") Long oid, @Param("itemId") int itemId, @Param("pid") Long pid);

    // 리뷰 작성
    void insertReview(ReviewVo review);
    int countReviewByItemId(@Param("itemId") int itemId);
    void insertReviewImage(@Param("rid") Long rid, @Param("url") String url);

    // 리뷰 불러오기
    List<ReviewVo> getReviewsByPid(@Param("pid") int pid);

    // 리뷰 전체 가져오기
    List<ReviewVo> getAllReviews();

    // 리뷰 한 페이지씩 불러오기
    List<ReviewVo> getRecentReviews(int limit);

    // rid로 이미지 url들 가져오기
    List<String> getImageUrlsByRid(Long rid);

    // 이미지 레코드 삭제
    void deleteReviewImages(Long rid);

    // 리뷰 레코드 삭제
    void deleteReview(Long rid);
}
