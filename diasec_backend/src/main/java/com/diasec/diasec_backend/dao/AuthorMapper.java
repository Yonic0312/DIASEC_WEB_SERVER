package com.diasec.diasec_backend.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.AuthorVo;

@Mapper
public interface AuthorMapper {
    // 작가 등록
    int updateMemberAuthorInfo(
        @Param("memberId") String memberId,
        @Param("authorName") String authorName,
        @Param("authorIntro") String authorIntro,
        @Param("portfolioUrl") String portfolioUrl,
        @Param("accountHolder") String accountHolder,
        @Param("bankName") String bankName,
        @Param("accountNumber") String accountNumber,
        @Param("name") String name,
        @Param("email") String email,
        @Param("phone") String phone,
        @Param("author_profile_image") String author_profile_image
    );

    // 작가 이미지 등록
    int insertAuthorImage(
        @Param("memberId") String memberId,
        @Param("title") String title,
        @Param("imageUrl") String imageUrl
    );
    // 신청 후 대기중인 작가
    int markAuthorPending(@Param("memberId") String memberId); // 상태: PENDING

    // 어드민 : 목록/상세/승인/반려
    List<Map<String, Object>> selectAuthors(
        @Param("status") String status, @Param("keyword") String keyword
    );

    // 심사중인 사람 수
    int countPendingAuthors();

    List<Map<String,Object>> selectAuthorImages(@Param("memberId") String memberId);

    int updateAuthorStatus(
        @Param("id") String id,
        @Param("status") String status,
        @Param("note") String note
    );

    // 유저 상세정보 가져오기
    Map<String, Object> selectById (@Param("memberId") String memberId);

    // 작가 프로필 정보 가져오기
    Map<String, Object> getAuthorProfile(String memberId);

    // 작가 프로필 업데이트
    void updateAuthorProfile(@Param("memberId") String memberId,
                            @Param("nickname") String nickname,
                            @Param("authorName") String authorName,
                            @Param("authorIntro") String authorIntro,
                            @Param("imageUrl") String imageUrl);

    List<Map<String, Object>> listAuthorImages(
        @Param("memberId") String memberId,
        @Param("status") String status,
        @Param("limit") int limit, 
        @Param("offset") int offset
    );

    int countAuthorImages(
        @Param("memberId") String memberId,
        @Param("status") String status
    );

    Map<String, Object> findAuthorImage(@Param("imgId") Long imgId);

    void updateAuthorImage(@Param("imgId") Long imgId,
                            @Param("title") String title,
                            @Param("imageUrl") String iamgeUrl);

    void deleteAuthorImage(@Param("imgId") Long imgId);

    // 관리자 작품 승인 / 반려
    void setAuthorImageStatus(Map<String, Object> param);

    // 작가 정산 목록 가져오기
    List<Map<String, Object>> selectSettlementList (String author);

    // 정산 처리
    int settleOrderItem(Long itemId);

    // 정산 취소 처리
    int cancelSettlement(Long itemId);

    // 전체 이미지 삭제
    void deleteAuthorById(String id);
}
