package com.diasec.diasec_backend.dao;

import java.time.LocalDate;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.data.repository.query.Param;

@Mapper
public interface VisitMapper {
        int insertTodayVisit(@Param("visitDate") LocalDate visitDate,
                             @Param("visitorKey") String visitorKey,
                             @Param("ip") String ip,
                             @Param("userAgent") String userAgent);
        
        int countToday(@Param("visitDate") LocalDate visitDate);
        int countTotal();
}
