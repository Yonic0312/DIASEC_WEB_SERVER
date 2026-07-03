package com.diasec.diasec_backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.BizPartnerMapper;
import com.diasec.diasec_backend.util.PartnerGradeUtil;
import com.diasec.diasec_backend.vo.BizPartnerApplicationVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BizPartnerService {
    private final BizPartnerMapper bizPartnerMapper;

    public void apply(BizPartnerApplicationVo vo) {
        if (!vo.isContractAgreed()) throw new IllegalArgumentException("계약 동의 필수");
        if (bizPartnerMapper.countPendingByMember(vo.getMemberId()) > 0)
            throw new IllegalStateException("이미 검토 중인 신청이 있습니다.");

        var info = bizPartnerMapper.getMemberPartnerInfo(vo.getMemberId());
        if (info != null && "승인".equals(info.getStatus()))
            throw new IllegalStateException("이미 승인된 파트너입니다.");

        bizPartnerMapper.insertApplication(vo);
    }

    public Map<String, Object> getMyStatus(String memberId) {
        long cumulative = bizPartnerMapper.getCumulativeAmount(memberId);
        var info = bizPartnerMapper.getMemberPartnerInfo(memberId);
        boolean hasPending = bizPartnerMapper.countPendingByMember(memberId) > 0;

        String memberStatus = info != null ? info.getStatus() : null;
        String displayStatus;
        if ("승인".equals(memberStatus)) {
            displayStatus = "승인";
        } else if (hasPending) {
            displayStatus = "대기";
        } else if ("미승인".equals(memberStatus)) {
            displayStatus = "미승인";
        } else {
            displayStatus = "없음";
        }

        String grade = "승인".equals(displayStatus)
            ? PartnerGradeUtil.resolveGrade(cumulative)
            : null;
        int discount = grade != null ? PartnerGradeUtil.resolveDiscountPercent(grade) : 0;

        // 승인 파트너는 등급 실시간 반영
        if ("승인".equals(displayStatus) && grade != null && info != null
                && !grade.equals(info.getPartnerGrade())){
            bizPartnerMapper.updateMemberPartnerGrade(memberId, grade);
        }

        var latestApp = bizPartnerMapper.getLatestApplicationByMember(memberId);
        String adminReply = latestApp != null && latestApp.getAdminReply() != null
            ? latestApp.getAdminReply() : "";
        
        Map<String, Object> result = new HashMap<>();
        result.put("partnerStatus", displayStatus);
        result.put("partnerGrade", grade != null ? grade : "-");
        result.put("cumulativeAmount", cumulative);
        result.put("hasPendingApplication", hasPending);
        result.put("adminReply", adminReply);
        result.put("reviewedAt", latestApp != null ? latestApp.getReviewedAt() : null);
        result.put("discountPercent", discount);
        return result;
    }

    public void approve(Long id, String adminReply) {
        var app = bizPartnerMapper.getApplicationDetail(id);
        long cumulative = bizPartnerMapper.getCumulativeAmount(app.getMemberId());
        String grade = PartnerGradeUtil.resolveGrade(cumulative);
        bizPartnerMapper.approveApplication(id, adminReply);
        bizPartnerMapper.updateMemberPartner(app.getMemberId(), "승인", grade);
    }

    public void reject(Long id, String adminReply) {
        var app = bizPartnerMapper.getApplicationDetail(id);
        bizPartnerMapper.rejectApplication(id, adminReply);
        bizPartnerMapper.updateMemberPartner(app.getMemberId(), "미승인", null);
    }

    public List<BizPartnerApplicationVo> getApplicationList() {
        return bizPartnerMapper.getApplicationList();
    }

    public BizPartnerApplicationVo getApplicationDetail(Long id) {
        BizPartnerApplicationVo vo = bizPartnerMapper.getApplicationDetail(id);
        if (vo == null) return null;
        long cumulative = bizPartnerMapper.getCumulativeAmount(vo.getMemberId());
        String grade = PartnerGradeUtil.resolveGrade(cumulative);
        vo.setCumulativeAmount(cumulative);
        vo.setPartnerGrade(grade);
        vo.setDiscountPercent(PartnerGradeUtil.resolveDiscountPercent(grade));
        return vo;
    }

    public int countPending() {
        return bizPartnerMapper.countPending();
    }
}
