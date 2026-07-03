package com.diasec.diasec_backend.service;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.dao.InquiryMapper;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.InquiryVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InquiryService {
    
    private final InquiryMapper inquiryMapper;
    private final ImageUtil imageUtil;

    // 문의사항 등록 ( 상품별 문의 )
    public void insertInquiry (InquiryVo vo) {
        inquiryMapper.insertInquiry(vo);
    }

    // 문의사항 이미지 등록
    public void insertInquiryImage (Long iid, String url) {
        InquiryVo vo = new InquiryVo();
        vo.setIid(iid);
        vo.setImageUrl(url);
        inquiryMapper.insertInquiryImage(vo);
    }

    // 문의사항 리스트 가져오기
    public List<InquiryVo> getInquiriesByProduct(Long pid) {
        return inquiryMapper.selectInquiriesByPid(pid);
    }

    public void registerAnswer(Long iid, String adminId, String content) {

        // 답변 등록 (inquiry_replies 테이블)
        inquiryMapper.insertInquiryReply(iid, adminId, content);

        // 문의 상태만 업데이트
        inquiryMapper.updateInquiryStatus(iid, "답변완료");

    }

    // 문의 답변 수정
    public void updateReply(Long rid, String content) {
        inquiryMapper.updateInquiryReply(rid, content);
    }

    // 문의 답변 삭제
    public void deleteReply(Long rid) {
        Long iid = inquiryMapper.getIidByRid(rid);
        inquiryMapper.deleteInquiryReply(rid);
        inquiryMapper.updateInquiryStatus(iid, "답변대기");
    }

    // 고객 마이페이지 문의사항 가져오기
    public List<InquiryVo> getInquiryById (String id) {
        return inquiryMapper.getInquiryById(id);
    }

    // 관리자 전용 전체 문의 목록 가져오기
    public List<InquiryVo> getAllInquiries () {
        return inquiryMapper.getAllInquiries();
    }

    // 관리자 페이지 문의 삭제
    @Transactional
    public void deleteInquiry(Long iid) {
        // 1. 이미지 URL들 먼저 조회
        List<String> imageUrls = inquiryMapper.selectInquiryImageUrls(iid);

        // 3. DB에서 이미지 레코드 삭제
        inquiryMapper.deleteInquiryImages(iid);

        // 4. 답변 먼저 삭제 (FK 제약 방지용)
        inquiryMapper.deleteReplyByIid(iid);

        // 5. 문의글 삭제
        inquiryMapper.deleteInquiry(iid);
        
        // 2. 실제 이미지 파일 삭제
        for (String url : imageUrls) {
            imageUtil.deleteImage(url);
        }
    }

    // 미답변 개수 가져오기
    public Long selectUnanswered() {
        return inquiryMapper.selectUnanswered();
    }

    // 마이페이지 고객 문의 삭제
    @Transactional
    public void deleteMyInquiry(Long iid, String loginId) {
        
        InquiryVo target = inquiryMapper.selectInquiryOwnerAndStatus(iid);
        if (target == null) throw new RuntimeException("문의가 없습니다.");

        if (!loginId.equals(target.getId())) throw new RuntimeException("권한이 없습니다.");

        // 정책: 답변완료면 삭제 불가
        // if ("답변완료".equals(target.getStatus())) {
        //     throw new RuntimeException("답변완료된 문의는 삭제할 수 없습니다.");
        // }

        List<String> imageUrls = inquiryMapper.selectInquiryImageUrls(iid);

        inquiryMapper.deleteInquiryImages(iid);
        inquiryMapper.deleteReplyByIid(iid);
        inquiryMapper.deleteInquiry(iid);

        for (String url : imageUrls) imageUtil.deleteImage(url);
    }

    // 마이페이지 상담내용 수정
    public void updateMyInquiryWithImages(
        Long iid, 
        String loginId, 
        String title, 
        String content, 
        String category, 
        String isPrivate,
        List<String> keepUrls,
        List<MultipartFile> newImages
    ) {

        InquiryVo target = inquiryMapper.selectInquiryOwnerAndStatus(iid);
        if (target == null) throw new RuntimeException("문의가 없습니다.");
        
        // 작성자 체크
        if (!loginId.equals(target.getId())) throw new RuntimeException("권한이 없습니다.");

        // 상태 체크
        if ("답변완료".equals(target.getStatus())) {
            throw new RuntimeException("답변완료된 문의는 수정할 수 없습니다.");
        }

        if (keepUrls == null) keepUrls = Collections.emptyList();

        // 1) 기존 이미지 URL 전부
        List<String> oldUrls = inquiryMapper.selectInquiryImageUrls(iid);

        // 2) keepUrls에 없는 것 삭제 (DB + 파일)
        for (String url : oldUrls) {
            if (!keepUrls.contains(url)) {
                inquiryMapper.deleteInquiryImageByUrl(iid, url);
                imageUtil.deleteImage(url);
            }
        }

        // 3) 새 이미지 추가
        if (newImages != null) {
            for (MultipartFile img : newImages) {
                try {
                    String url = imageUtil.saveImage(img, "Inquiry");
                    inquiryMapper.insertInquiryImageByParams(iid, url);
                } catch (IOException e) {
                    throw new RuntimeException("이미지 저장 실패", e);
                }
            }
        }

        // 4) 글 업데이트
        inquiryMapper.updateInquiryByCustomer(iid, title, content, category, isPrivate);
    }
}
