package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.diasec.diasec_backend.vo.NoticeVo;

@Mapper
public interface NoticeMapper {
    // 모든 공지사항 가져오기
    List<NoticeVo> getAllNotices();
    
    // 공지사항 추가
    void insertNotice(NoticeVo notice);

    // 공지사항 상세보기
     NoticeVo getNoticeById(Long id);

    // 공지사항 업데이트
    void updateNotice(NoticeVo notice);

    // 공지사항 삭제
    void deleteNotice(Long id);

    // 삭제 전 image_url 불러오기
    String getImageUrlByNoticeId(Long id);

    // 고객센터 홈에서 불러올 공지사항
    List<NoticeVo> getLatestNotices(int limit);
    
}
