package com.diasec.diasec_backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.VisitService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VisitController {
    private final VisitService visitService;
@PostMapping("/visit/track")
    public ResponseEntity<Void> track(HttpServletRequest req) {
        String ip = VisitService.clientIp(req.getHeader("X-Forwarded-For"), req.getRemoteAddr());
        String ua = req.getHeader("User-Agent");
        visitService.trackVisit(ip, ua);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/visit/stats")
    public ResponseEntity<Map<String, Integer>> stats(HttpServletRequest req) {
        String adminIp = VisitService.clientIp(req.getHeader("X-Forwarded-For"), req.getRemoteAddr());
        return ResponseEntity.ok(visitService.getStats(adminIp));
    }

    // 실시간 접속 중(최근 허트비트 기준). 조회하는 관리자 IP는 제외
    @GetMapping("/admin/visit/online")
    public ResponseEntity<Map<String, Integer>> online(HttpServletRequest req) {
        String adminIp = VisitService.clientIp(req.getHeader("X-Forwarded-For"), req.getRemoteAddr());
        return ResponseEntity.ok(Map.of("online", visitService.countOnline(adminIp)));
    }

    // 최근 N일 일별 방문자 (기본30, days=0 이면 전체)
    @GetMapping("/admin/visit/daily")
    public ResponseEntity<List<Map<String, Object>>> daily(
        @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(visitService.getDailyStats(days));
    }
}
