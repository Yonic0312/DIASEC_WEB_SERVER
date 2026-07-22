package com.diasec.diasec_backend.util;

public class PartnerGradeUtil {
    private static final long THRESHOLD_SILVER = 10_000_000L;
    private static final long THRESHOLD_GOLD = 50_000_000L;
    private static final long THRESHOLD_PLATINUM = 100_000_000L;
    private static final long THRESHOLD_DIAMOND = 300_000_000L;
    private static final long THRESHOLD_BLACK = 500_000_000L;

    public static String resolveGrade(long amount) {
        if (amount >= THRESHOLD_BLACK) return "블랙";
        if (amount >= THRESHOLD_DIAMOND) return "다이아";
        if (amount >= THRESHOLD_PLATINUM) return "플래티넘";
        if (amount >= THRESHOLD_GOLD) return "골드";
        if (amount >= THRESHOLD_SILVER) return "실버";
        return "신규";
    }

    public static int resolveDiscountPercent(String grade) {
        return switch (grade) {
            case "블랙" -> 30;
            case "다이아" -> 25;
            case "플래티넘" -> 20;
            case "골드" -> 15;
            case "실버" -> 10;
            default -> 5;
        };
    }

    // 다음 등급명. 최고 등급이면 null
    public static String resolveNextGrade(long amount) {
        if (amount >= THRESHOLD_BLACK) return null;
        if (amount >= THRESHOLD_DIAMOND) return "블랙";
        if (amount >= THRESHOLD_PLATINUM) return "다이아";
        if (amount >= THRESHOLD_GOLD) return "플래티넘";
        if (amount >= THRESHOLD_SILVER) return "골드";
        return "실버";
    }

    // 다음 등급까지 필요한 누적 금액. 최고 등급이면 null
    public static Long resolveNextTierThreshold(long amount) {
        if (amount >= THRESHOLD_BLACK) return null;
        if (amount >= THRESHOLD_DIAMOND) return THRESHOLD_BLACK;
        if (amount >= THRESHOLD_PLATINUM) return THRESHOLD_DIAMOND;
        if (amount >= THRESHOLD_GOLD) return THRESHOLD_PLATINUM;
        if (amount >= THRESHOLD_SILVER) return THRESHOLD_GOLD;
        return THRESHOLD_SILVER;
    }

    // 다음 등급까지 남은 금액. 최고 등급이면 0
    public static long resolveAmountToNextTier(long amount) {
        Long threshold = resolveNextTierThreshold(amount);
        return threshold == null ? 0L : Math.max(0L, threshold - amount);
    }
}
