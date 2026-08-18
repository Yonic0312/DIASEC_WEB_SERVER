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
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.VisitMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VisitService {
    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
    // 마지막 허트비트 이후 이 시간(ms)이 지나면 오프라인으로 간주
    private static final long ONLINE_TTL_MS = 60_000L;
    // 관리자 IP로 기억한 뒤 이 시간 동안 페이지 접속 집계에서 제외 (마지막 접속 기준 갱신)
    private static final long ADMIN_IP_TTL_MS = 14 * 24 * 60 * 60 * 1000L;

    private final VisitMapper visitMapper;
    // visitorKey ->  presence (ip + lastSeen)
    private final ConcurrentHashMap<String, Presence> activeVisitors = new ConcurrentHashMap<>();
    // 관리자 페이지를 사용한 IP -> 마지막 시각
    private final ConcurrentHashMap<String, Long> adminIps = new ConcurrentHashMap<>();

    private record Presence(String ip, long lastSeen) {}
    
    public void trackVisit(String ip, String userAgent) {
        LocalDate today = LocalDate.now(KOREA);
        String normalizedIp = normalizeIp(ip);
        String raw = normalizedIp + "|" + (userAgent == null ? "" : userAgent);
        String visitorKey = sha256(raw);
        visitMapper.insertTodayVisit(today, visitorKey, normalizedIp, userAgent);
        activeVisitors.put(visitorKey, new Presence(normalizedIp, System.currentTimeMillis()));
    }

    public Map<String, Integer> getStats(String excludeIp) {
        LocalDate today = LocalDate.now(KOREA);
        return Map.of(
            "today", visitMapper.countToday(today),
            "total", visitMapper.countTotal(),
            "online", countOnline(excludeIp)
        );
    }

    // 최근 ONLINE_TTL_MS 이내 허트비트. excludeIp 제외
    public int countOnline(String excludeIp) {
        long cutoff = System.currentTimeMillis() - ONLINE_TTL_MS;
        String exclude = normalizeIp(excludeIp);
        activeVisitors.entrySet().removeIf(e -> e.getValue().lastSeen() < cutoff);

        int count = 0;
        for (Presence p : activeVisitors.values()) {
            if (exclude != null && !exclude.isBlank() && sameClientIp(exclude, p.ip())) {
                continue;
            }
            count++;
        }
        return count;
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

    public void rememberAdminIp(String ip) {
        String n = normalizeIp(ip);
        if (n.isBlank()) return;
        adminIps.put(n, System.currentTimeMillis());
    }

    public void trackPageView(String path, String ip) {
        String normalized = normalizePath(path);
        if (normalized == null) return;

        String normalizedIp = normalizeIp(ip);
        if (isCurrentUserAdmin()) {
            rememberAdminIp(normalizedIp);
            return;
        }
        if (isExcludeAdminIp(normalizedIp)) return;

        visitMapper.upsertPageView(LocalDate.now(KOREA), normalized);
    }

    public Map<String, Object> getPageViews(Integer days, String startDateStr, String endDateStr) {
        LocalDate today = LocalDate.now(KOREA);
        LocalDate start = parseIsoDate(startDateStr);
        LocalDate end = parseIsoDate(endDateStr);

        if (start != null && end != null) {
            if (start.isAfter(end)) {
                LocalDate tmp = start;
                start = end;
                end = tmp;
            }
        } else if (days != null && days > 0) {
            int safeDays = Math.min(365, Math.max(1, days));
            end = today;
            start = end.minusDays(safeDays - 1L);
        } else {
            end = today;
            LocalDate minDate = visitMapper.selectMinPageViewDate();
            if (minDate == null) {
                Map<String, Object> empty = new LinkedHashMap<>();
                empty.put("startDate", today.toString());
                empty.put("endDate", today.toString());
                empty.put("total", 0);
                empty.put("pages", List.of());
                empty.put("daily", List.of());
                return empty;
            }
            start = minDate;
        }

        String startS = start.toString();
        String endS = end.toString();
        List<Map<String, Object>> rows = visitMapper.selectPageViewsByDateRange(startS, endS);
        int total = visitMapper.selectPageViewTotalByDateRange(startS, endS);
        List<Map<String, Object>> daily = visitMapper.selectPageViewDailyByDateRange(startS, endS);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("startDate", startS);
        result.put("endDate", endS);
        result.put("total", total);
        result.put("pages", rows);
        result.put("daily", rows);
        result.put("daily", daily);
        return result;
    }

    private static LocalDate parseIsoDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value.trim().substring(0, Math.min(10, value.trim().length())));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static String normalizePath(String path) {
        if (path == null) return null;
        String v = path.trim();
        if (v.isEmpty()) return null;

        try {
            if (v.startsWith("http://") || v.startsWith("https://")) {
                java.net.URI uri = java.net.URI.create(v);
                String query = uri.getRawQuery();
                v = uri.getPath() + (query != null ? "?" + query : "");
            }
        } catch (Exception ignored) {
            return null;
        }

        if (!v.startsWith("/")) v = "/" + v;
        if (v.startsWith("/admin")) return null;
        if (v.length() > 255) v = v.substring(0, 255);
        return v;
    }

    public static String clientIp(String xff, String remoteAddr) {
        if (xff != null && !xff.isBlank()) {
            return normalizeIp(xff.split(",")[0].trim());
        }
        return normalizeIp(remoteAddr);
    }

    private static String normalizeIp(String ip) {
        if (ip == null) return "";
        String v = ip.trim();
        if (v.startsWith("[") && v.contains("]")) {
            v = v.substring(1, v.indexOf(']'));
        }
        // Ipv4-mapped Ipv6 (::ffff:127.0.0.1)
        if (v.startsWith("::ffff:")) {
            v = v.substring(7);
        }
        if ("::1".equals(v)) {
            return "127.0.0.1";
        }
        return v;
    }

    private boolean isExcludeAdminIp(String ip) {
        long cutoff = System.currentTimeMillis() - ADMIN_IP_TTL_MS;
        adminIps.entrySet().removeIf(e -> e.getValue() < cutoff) ;
        String n = normalizeIp(ip);
        return !n.isBlank() && adminIps.containsKey(n);
    }

    private static boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private static boolean sameClientIp(String a, String b) {
        return Objects.equals(normalizeIp(a), normalizeIp(b));
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
