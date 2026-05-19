package com.diasec.diasec_backend.service;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.ReviewMapper;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.ReviewVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {
    @Autowired
    private final ReviewMapper reviewMapper;
    private final ImageUtil imageUtil;

    // 리뷰 작성 부분 목록 가져오기
    public List<ReviewVo> getEligibleReviews(String id) {
        return reviewMapper.getEligibleReviews(id);
    }

    public List<ReviewVo> getEligibleReviewsByGuestOid(Long oid) {
        return reviewMapper.getEligibleReviewsByGuestOid(oid);
    }

    public boolean isGuestItemReviewable(Long oid, int itemId, Long pid) {
        return reviewMapper.countGuestReviewableItem(oid, itemId, pid) > 0;
    }

    // 리뷰 작성
    public void insertReview(ReviewVo review){
        reviewMapper.insertReview(review);
    }

    public boolean existsReviewByItemId(int itemId) {
        return reviewMapper.countReviewByItemId(itemId) > 0;
    }

    public void insertReviewImage(@Param("rid") Long rid, @Param("url") String url) {
        reviewMapper.insertReviewImage(rid, url);
    }

    // 리뷰 가져오기
    public List<ReviewVo> getReviewsByPid(int pid) {
        return reviewMapper.getReviewsByPid(pid);
    }

    // 리뷰 전체 가져오기
    public List<ReviewVo> getAllReviews() {
        return reviewMapper.getAllReviews();
    }

    // 최근 리뷰 20개 불러오기
    public List<ReviewVo> getRecentReviews(int limit) {
        return reviewMapper.getRecentReviews(limit);
    }

    public void deleteReview(Long rid) {
        List<String> urls = reviewMapper.getImageUrlsByRid(rid);

        if (urls != null) {
            for (String url : urls) {
                imageUtil.deleteImage(url);
            }
        }

        reviewMapper.deleteReviewImages(rid);
        reviewMapper.deleteReview(rid);
    }
}
