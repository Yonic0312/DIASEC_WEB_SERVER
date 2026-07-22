package com.diasec.diasec_backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.AdminMemberSalesMapper;
import com.diasec.diasec_backend.util.PartnerGradeUtil;
import com.diasec.diasec_backend.vo.MemberSalesRankingVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminMemberSalesService {
    
    private final AdminMemberSalesMapper adminMemberSalesMapper;

    public List<MemberSalesRankingVo> getSalesRanking(String keyword) {
        List<Map<String, Object>> rows = adminMemberSalesMapper.selectMemberSalesRanking(
            keyword == null ? "" : keyword.trim()
        );

        List<MemberSalesRankingVo> result = new ArrayList<>();
        int rank = 1;

        for (Map<String, Object> row : rows) {
            long totalSales = toLong(mapVal(row, "totalSales"));
            MemberSalesRankingVo vo = new MemberSalesRankingVo();
            vo.setRank(rank++);
            vo.setMemberId(stringVal(mapVal(row, "memberId")));
            vo.setMemberName(stringVal(mapVal(row, "memberName")));
            vo.setEmail(stringVal(mapVal(row, "email")));
            vo.setPartnerStatus(stringVal(mapVal(row, "partnerStatus")));
            vo.setTotalSales(totalSales);
            vo.setCompletedItemCount(toInt(mapVal(row, "completedItemCount")));
            vo.setGrade(PartnerGradeUtil.resolveGrade(totalSales));
            vo.setNextGrade(PartnerGradeUtil.resolveNextGrade(totalSales));
            vo.setNextTierThreshold(PartnerGradeUtil.resolveNextTierThreshold(totalSales));
            vo.setAmountToNextTier(PartnerGradeUtil.resolveAmountToNextTier(totalSales));
            result.add(vo);
        }
        
        return result;
    }

    private static Object mapVal(Map<String, Object> row, String key) {
        if (row.containsKey(key)) {
            return row.get(key);
        }
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(key)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private static String stringVal(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private static long toLong(Object v) {
        if (v == null) return 0L;
        if (v instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(v));
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private static int toInt(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(v));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
