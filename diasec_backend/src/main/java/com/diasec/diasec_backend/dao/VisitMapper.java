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

        int upsertPageView(@Param("viewDate") LocalDate viewDate,
                           @Param("path") String path);

        List<Map<String, Object>> selectPageViewsByDate(@Param("viewDate") LocalDate viewDate);

        int selectPageViewTotalByDate(@Param("viewDate") LocalDate viewDate);

        List<Map<String, Object>> selectPageViewsByDateRange(@Param("startDate") String startDate,
                                                             @Param("endDate") String endDate);

        int selectPageViewTotalByDateRange(@Param("startDate") String startDate,
                                           @Param("endDate") String endDate);
        
        List<Map<String, Object>> selectPageViewDailyByDateRange(@Param("startDate") String startDate,
                                                                 @Param("endDate") String endDate);

        LocalDate selectMinPageViewDate();
}
