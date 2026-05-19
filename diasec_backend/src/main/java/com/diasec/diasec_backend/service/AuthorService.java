package com.diasec.diasec_backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.AuthorMapper;
import com.diasec.diasec_backend.dao.CollectionMapper;
import com.diasec.diasec_backend.vo.AuthorVo;
import com.diasec.diasec_backend.vo.CollectionItemVo;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthorService {
    private final AuthorMapper authorMapper;
    private final CollectionMapper collectionMapper;

    @Transactional
    public void registerAuthor(AuthorVo vo, String imageUrl) {
        // 1) member 테이블 업데이트
        authorMapper.updateMemberAuthorInfo(
            vo.getMemberId(),
            vo.getNickname(),
            vo.getDescription(),
            vo.getPortfolio(),
            vo.getAccountHolder(),
            vo.getBank(),
            vo.getAccountNumber(),
            vo.getName(),
            vo.getEmail(),
            vo.getPhone(),
            imageUrl
        );

        // 2) 상태 PENDING으로 세팅
        authorMapper.markAuthorPending(vo.getMemberId());
    }

    // 대기중
    @Transactional
    public void noUnderReview(String id) {
        authorMapper.updateAuthorStatus(id, "NONE", null);
    }

    // 대기중
    @Transactional
    public void underReview(String id) {
        authorMapper.updateAuthorStatus(id, "PENDING", null);
    }

    // 승인
    @Transactional
    public void approve(String id, String author_name, String author_profile_image) {
        CollectionItemVo vo = new CollectionItemVo();
        // collectionId: selectedCollectionId,
        // label: newLabel.trimEnd(),
        vo.setCollectionId(3);
        vo.setLabel(author_name);
        vo.setImageUrl(author_profile_image);
        vo.setMember_id(id);

        authorMapper.updateAuthorStatus(id, "APPROVED", null);
        collectionMapper.insertItem(vo);
    }

    // 반려
    @Transactional
    public void reject(String id, String note) {
        authorMapper.updateAuthorStatus(id, "REJECTED", note);
    }

    // 목록 조회
    public List<Map<String, Object>> selectAuthors(String status, String keyword) {
        return authorMapper.selectAuthors(status, keyword);
    }

    // 심사 대기중인 사람수
    public int countPendingAuthors() {
        return authorMapper.countPendingAuthors();
    }

    // 이미지 조회
    public List<Map<String,Object>> selectAuthorImages(String memberId) {
        return authorMapper.selectAuthorImages(memberId);
    }

    // 유저 상세정보 가져오기
    public Map<String, Object> selectById (@Param("memberId") String memberId) {
        return authorMapper.selectById(memberId);
    }

    // 작가 프로필 정보 가져오기
    public Map<String, Object> getAuthorProfile(String memberId) {
        return authorMapper.getAuthorProfile(memberId);
    }

    // 작가 프로필 업데이트
    public void updateAuthorProfile(@Param("memberId") String memberId, @Param("nickname") String nickname,
                            @Param("authorName") String authorName, @Param("authorIntro") String authorIntro,
                            @Param("imageUrl") String imageUrl) {
        CollectionItemVo cvo = new CollectionItemVo();
        cvo.setImageUrl(imageUrl);
        cvo.setMember_id(memberId);
        cvo.setAuthor_name(authorName);
        cvo.setNickname(nickname);

        collectionMapper.updateCollectionItemsEditLabel(cvo);
        authorMapper.updateAuthorProfile(memberId, nickname, authorName, authorIntro, imageUrl);
    }

    // 작가 이미지 업로드
    public int insertAuthorImage(String memberId, String title, String imageUrl) {
        return authorMapper.insertAuthorImage(memberId, title, imageUrl);
    }

    public Map<String, Object> listAuthorImages(String memberId, String status, int page, int size) {
        int limit = size;
        int offset = (Math.max(1, page) - 1) * size;

        List<Map<String, Object>> items = authorMapper.listAuthorImages(memberId, status, limit, offset);
        int total = authorMapper.countAuthorImages(memberId, status);

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("total",total);
        result.put("page", page);
        result.put("size", size);
        return result;
    }

    public Map<String, Object> findAuthorImage(Long imgId) {
        return authorMapper.findAuthorImage(imgId);
    }

    @Transactional
    public void updateAuthorImage(Long imgId, String title, String imageUrl) {
        
        authorMapper.updateAuthorImage(imgId, title, imageUrl);
    }

    @Transactional
    public void deleteAuthorImage(Long imgId) {
        authorMapper.deleteAuthorImage(imgId);
    }

    // 관리자 작품 승인/반려
    public void updateAuthorImageStatus(Long imgId, String status, String rejectReason) {
        Map<String, Object> param = new HashMap<>();
        param.put("imgId", imgId);
        param.put("status", status);
        param.put("rejectReason", rejectReason);
        authorMapper.setAuthorImageStatus(param);
    }

    public List<Map<String, Object>> selectSettlementList(String author) {
        return authorMapper.selectSettlementList(author);
    }

    // 정산 처리
    @Transactional
    public void settleOrderItem(Long itemId) {
        int updated = authorMapper.settleOrderItem(itemId);
        if (updated == 0) {
            throw new IllegalArgumentException("해당 주문 항목을 찾을 수 없습니다.");
        }
    }

    @Transactional
    public void cancelSettlement(Long itemId) {
        int updated = authorMapper.cancelSettlement(itemId);
        if (updated == 0) {
            throw new IllegalArgumentException("해당 주문 항목을 찾을 수 없습니다.");
        }
    }
}
