package com.diasec.diasec_backend.dao;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface VisitMapper {
        int insertTodayVisit(@Param("visitDate") LocalDate visitDate,
                             @Param("visitorKey") String visitorKey,
                             @Param("ip") String ip,
                             @Param("userAgent") String userAgent);
        
        int countToday(@Param("visitDate") LocalDate visitDate);
        int countTotal();

        List<Map<String, Object>> countByDateRange(@Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);

        LocalDate selectMinVisitDate();
}
