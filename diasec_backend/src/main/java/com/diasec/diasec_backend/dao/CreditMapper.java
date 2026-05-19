package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.diasec.diasec_backend.vo.CreditVo;

@Mapper
public interface CreditMapper {
    void insertCreditHistory(CreditVo creditVo);

    List<CreditVo> getCreditHistoryByMemberId(String id);

    // 크레딧 기록 삭제하기
    void deleteCreditByCid(int cid);

    // 모든 크레딧 기록 삭제하기 : id
    void deleteCreditById(String id);
}
