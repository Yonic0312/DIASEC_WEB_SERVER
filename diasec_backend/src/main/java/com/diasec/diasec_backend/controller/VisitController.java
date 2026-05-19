package com.diasec.diasec_backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
        String xff = req.getHeader("X-Forwarded-For");
        String ip = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
        String ua = req.getHeader("User-Agent");
        visitService.trackVisit(ip, ua);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/visit/stats")
    public ResponseEntity<Map<String, Integer>> stats() {
        return ResponseEntity.ok(visitService.getStats());
    }
}