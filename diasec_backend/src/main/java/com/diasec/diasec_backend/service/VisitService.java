package com.diasec.diasec_backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.VisitMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VisitService {
    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
    private final VisitMapper visitMapper;
    
    public void trackVisit(String ip, String userAgent) {
        LocalDate today = LocalDate.now(KOREA);
        String raw = (ip == null ? "" : ip) + "|" + (userAgent == null ? "" : userAgent);
        String visitorKey = sha256(raw);
        visitMapper.insertTodayVisit(today, visitorKey, ip, userAgent);
    }

    public Map<String, Integer> getStats() {
        LocalDate today = LocalDate.now(KOREA);
        return Map.of(
            "today", visitMapper.countToday(today),
            "total", visitMapper.countTotal()
        );
    }

    // 최근 N일(오늘 포함) 일별 방문자 수. 방문 없는 날은 0으로 채움
    public List<Map<String, Object>> getDailyStats(int days) {
        
        LocalDate end = LocalDate.now(KOREA);
        LocalDate start;

        if (days <= 0) {
            LocalDate minDate = visitMapper.selectMinVisitDate();
            if (minDate == null) return List.of();
            start = minDate;
        } else {
            int safeDays = Math.min(365, Math.max(1, days));
            start = end.minusDays(safeDays - 1L);
        }

        Map<String, Integer> counted = new HashMap<>();
        for (Map<String, Object> row : visitMapper.countByDateRange(start, end)) {
            Object dateVal = row.get("visitDate");
            if (dateVal == null) dateVal = row.get("visitdate");
            Object cntVal = row.get("cnt");
            if (dateVal == null || cntVal == null) continue;
            String dateKey = String.valueOf(dateVal);
            if (dateKey.length() >= 10) dateKey = dateKey.substring(0, 10);
            counted.put(dateKey, ((Number) cntVal).intValue());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("date", d.toString());
            item.put("count", counted.getOrDefault(d.toString(), 0));
            result.add(item);
        }
        return result;
    }

    private String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not supported", e);
        }
    }
}
