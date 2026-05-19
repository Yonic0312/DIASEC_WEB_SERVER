package com.diasec.diasec_backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HexFormat;
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
