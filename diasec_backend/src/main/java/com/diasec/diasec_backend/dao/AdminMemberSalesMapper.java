package com.diasec.diasec_backend.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminMemberSalesMapper {
    List<Map<String, Object>> selectMemberSalesRanking(@Param("keyword") String keyword);
}
