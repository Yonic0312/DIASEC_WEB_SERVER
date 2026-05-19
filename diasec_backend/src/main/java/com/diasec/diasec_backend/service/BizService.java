package com.diasec.diasec_backend.service;

import java.util.List;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.BizMapper;
import com.diasec.diasec_backend.vo.BizReplyVo;
import com.diasec.diasec_backend.vo.BizVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BizService {
    
    private final BizMapper bizMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    public void registerOrder(BizVo vo) {
        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(vo.getPassword());
        vo.setPassword(encodedPassword);
        bizMapper.registerOrder(vo);
    }

    public void insertOrderFile(int id, String imageUrl, String originalName) {
        bizMapper.insertOrderFile(id, imageUrl, originalName);
    }

    // 리스트 가져오기
    public List<BizVo> getOrderList() {
        return bizMapper.getOrderList();
    }

    public BizVo getBizDetail(Long id) {
        BizVo vo = bizMapper.getBizDetail(id);
        if (vo != null) {
            vo.setFileList(bizMapper.getBizFiles(id));
            vo.setReply(bizMapper.getBizReply(id));
        }
        return vo;
    }

    public void deleteBiz(Long id) {
        bizMapper.deleteBiz(id);
    }

    public void insertReply(BizReplyVo vo) {
        bizMapper.insertReply(vo);
    }

    public void updateReply(BizReplyVo vo) {
        bizMapper.updateReply(vo);
    }

    public void deleteReply(Long replyId) {
        bizMapper.deleteReply(replyId);
    }

    public BizVo getPostById(int id) {
        return bizMapper.getPostById(id);
    }
}
