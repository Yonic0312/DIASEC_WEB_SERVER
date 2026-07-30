package com.diasec.diasec_backend.controller;

import java.io.File;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminDiskController {
    
    @GetMapping("/disk")
    public ResponseEntity<Map<String, Object>> disk() {
        File root = new File("/");
        long total = Math.max(0L, root.getTotalSpace());
        long usable = Math.max(0L, root.getUsableSpace());
        long used = Math.max(0L, total - usable);

        double usedPercent = total > 0 ? (used * 100.0 / total) : 0;
        double freePercent = total > 0 ? (usable * 100.0 / total) : 0;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("path", "/");
        body.put("totalBytes", total);
        body.put("usedBytes", used);
        body.put("freeBytes", usable);
        body.put("usedPercent", Math.round(usedPercent * 10) / 10.0);
        body.put("freePercent", Math.round(freePercent * 10) / 10.0);
        body.put("totalHuman", human(total));
        body.put("usedHuman", human(used));
        body.put("freeHuman", human(usable));
        return ResponseEntity.ok(body);
    }

    private static String human(long bytes) {
        if (bytes < 1024) return bytes + "B";
        String[] u = {"K", "M", "G", "T"};
        double v = bytes;
        int i = -1;
        do { v /= 1024; i++; } while (v >= 1024 && i < u.length -1);
        return String.format(java.util.Locale.US, "%.1f%s", v, u[i]);
    }
}
