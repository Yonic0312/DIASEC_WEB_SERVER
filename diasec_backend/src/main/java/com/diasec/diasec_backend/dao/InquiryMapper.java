package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.InquiryVo;

@Mapper
public interface InquiryMapper {
    // 문의사항 등록 ( 상품별 문의 )
    void insertInquiry (InquiryVo vo);

    // 문의사항 이미지 등록
    void insertInquiryImage (InquiryVo vo);

    // 문의사항 리스트 가져오기
    List<InquiryVo> selectInquiriesByPid(Long pid);

    // 테이블의 상태만 업데이트 (inquiries 테이블)
    void updateInquiryStatus(@Param("iid") Long iid, @Param("status") String status);

    // 답변 등록 (inquiry_replies 테이블)
    void insertInquiryReply(@Param("iid") Long iid, @Param("adminId") String adminId, @Param("content") String content);

    // 답변 수정
    void updateInquiryReply(@Param("rid") Long rid, @Param("content") String content);

    // 답변 삭제
    void deleteInquiryReply(@Param("rid") Long rid);

    // 삭제 후 iid 가져오기 (status 변경 위함)
    Long getIidByRid(@Param("rid") Long rid);

    // 고객 마이페이지 문의사항 가져오기
    List<InquiryVo> getInquiryById(@Param("id") String id);

    // 관리자 전용 전체 문의 목록 가져오기
    List<InquiryVo> getAllInquiries();

    // 관리자 페이지 문의 삭제
    void deleteInquiry(Long iid);

    // 이미지 URL들 먼저 조회
    List<String> selectInquiryImageUrls(Long iid);

    // DB에서 이미지 레코드 삭제
    void deleteInquiryImages(Long iid);

    // 답변 먼저 삭제 (FK 제약 방지용)
    void deleteReplyByIid(Long iid);

    Long selectUnanswered ();

    InquiryVo selectInquiryOwnerAndStatus(Long iid);

    void updateInquiryByCustomer(@Param("iid") Long iid,
                                 @Param("title") String title,
                                 @Param("content") String content,
                                 @Param("category") String category,
                                 @Param("isPrivate") String isPrivate
    );

    void deleteInquiryImageByUrl(@Param("iid") Long iid, @Param("url") String url);
    void insertInquiryImageByParams(@Param("iid") Long iid, @Param("url") String url);
}
