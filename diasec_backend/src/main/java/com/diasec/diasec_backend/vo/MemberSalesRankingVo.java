package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class MemberSalesRankingVo {
    private int rank;
    private String memberId;
    private String memberName;
    private String email;
    private String partnerStatus;
    private long totalSales;
    private int completedItemCount;
    private String grade;
    private String nextGrade;
    private Long nextTierThreshold;
    private long amountToNextTier;
}
