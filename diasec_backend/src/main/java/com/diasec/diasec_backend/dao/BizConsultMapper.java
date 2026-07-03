package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.BizConsultFileVo;
import com.diasec.diasec_backend.vo.BizConsultVo;

@Mapper
public interface BizConsultMapper {
    void registerConsult(BizConsultVo vo);
    void insertConsultFile(@Param("consultId") Long consultId,
                           @Param("filePath") String filePath,
                           @Param("originalName") String originalName);
    List<BizConsultVo> getConsultList();
    BizConsultVo getConsultDetail(Long id);
    List<BizConsultFileVo> getConsultFiles(Long id);
    BizConsultVo getPostById(int id);
    int countConsult();
    void deleteConsultFiles(Long consultId);
    void deleteConsult(Long id);
    BizConsultFileVo getConsultFileByOid(Long oid);
    void deleteConsultFileByOid(Long oid);
    void updateConsultStatus(@Param("id") Long id, @Param("status") String status);
}
