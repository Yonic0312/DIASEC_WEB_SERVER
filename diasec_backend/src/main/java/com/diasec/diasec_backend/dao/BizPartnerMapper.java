package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.BizPartnerApplicationVo;

public interface BizPartnerMapper {
    void insertApplication(BizPartnerApplicationVo vo);
    int countPendingByMember(@Param("memberId") String memberId);
    long getCumulativeAmount(@Param("memberId") String memberId);
    List<BizPartnerApplicationVo> getApplicationList();
    BizPartnerApplicationVo getApplicationDetail(@Param("id") Long id);
    void approveApplication(@Param("id") Long id, @Param("adminReply") String adminReply);
    void rejectApplication(@Param("id") Long id, @Param("adminReply") String adminReply);
    void updateMemberPartner(@Param("memberId") String memberId,
                             @Param("status") String status,
                             @Param("grade") String grade);
    void updateMemberPartnerGrade(@Param("memberId") String memberId, @Param("grade") String grade);
    int countPending();
    BizPartnerApplicationVo getMemberPartnerInfo(@Param("memberId") String memberId);
    BizPartnerApplicationVo getLatestApplicationByMember(@Param("memberId") String memberId);
}
