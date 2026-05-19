package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.diasec.diasec_backend.vo.BizFileVo;
import com.diasec.diasec_backend.vo.BizReplyVo;
import com.diasec.diasec_backend.vo.BizVo;

@Mapper
public interface BizMapper {
    
    void registerOrder(BizVo vo);

    void insertOrderFile(int id, String imageUrl, String originalName);

    public List<BizVo> getOrderList();

    List<BizFileVo> getBizFiles(Long id);

    BizReplyVo getBizReply(Long id);

    public BizVo getBizDetail(Long id);

    public void deleteBiz(Long id);

    public void insertReply(BizReplyVo vo);

    public void updateReply(BizReplyVo vo);

    public void deleteReply(Long replyId);

    public BizVo getPostById(int id);

}
