package com.diasec.diasec_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.NoticeMapper;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.NoticeVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeService {
    
    private final NoticeMapper noticeMapper;
    private final ImageUtil imageUtil;

    // 모든 공지사항 가져오기
    public List<NoticeVo> getAllNotices() {
        return noticeMapper.getAllNotices();
    }
    
    // 공지사항 추가
    public void insertNotice(NoticeVo notice) {
        noticeMapper.insertNotice(notice);
    }

    // 공지사항 상세보기
    public NoticeVo getNoticeById(Long id) {
        return noticeMapper.getNoticeById(id);
    }

    // 공지사항 업데이트
    public void updateNotice(NoticeVo notice) {
        noticeMapper.updateNotice(notice);
    }

    // 공지사항 삭제
    public void deleteNotice(Long id) {
        // 1. 삭제 전 image_url 불러오기
        String imageUrlString = noticeMapper.getImageUrlByNoticeId(id);

        // 2. 실제 이미지 삭제
        if (imageUrlString != null && !imageUrlString.isBlank()) {
            String[] urls = imageUrlString.split(",");
            for (String url : urls) {
                imageUtil.deleteImage(url.trim());
            }
        }

        // 3. 공지사항 삭제
        noticeMapper.deleteNotice(id);
    }

    public String getImageUrlByNoticeId(Long id) {
        return noticeMapper.getImageUrlByNoticeId(id);
    }

    // 고객센터 홈에서 불러올 공지사항
    public List<NoticeVo> getLatestNotices(int limit) {
        return noticeMapper.getLatestNotices(limit);
    }
}
