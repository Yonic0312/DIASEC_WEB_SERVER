package com.diasec.diasec_backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.CreditMapper;
import com.diasec.diasec_backend.dao.MemberMapper;
import com.diasec.diasec_backend.dao.OrderMapper;
import com.diasec.diasec_backend.vo.CreditVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CreditService {
    
    private final CreditMapper creditMapper;
    private final OrderMapper orderMapper;

    // 크레딧 등록 작업
    public void insertCreditHistory(CreditVo creditVo) {

        if (creditVo.getAmount() <= 0) return;
        if (creditVo.getId() == null || creditVo.getType() == null) return;

        // 적립금 내역 넣기
        creditMapper.insertCreditHistory(creditVo);

        // 적립금 if문 ()
        if (creditVo.getType().equals("적립")) {
            // 적립
            orderMapper.increaseCredit(creditVo.getId(), creditVo.getAmount());
        } else {
            orderMapper.decreaseCredit(creditVo.getId(), creditVo.getAmount());
        }
    
    }

    // 크레딧 기록 가져오기
    public List<CreditVo> getCreditHistoryByMemberId(String id) {
        return creditMapper.getCreditHistoryByMemberId(id);
    }

    // 크레딧 기록 삭제하기
    public void deleteCreditByCid(int cid) {
        creditMapper.deleteCreditByCid(cid);
    }

}
