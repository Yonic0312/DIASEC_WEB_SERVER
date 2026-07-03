package com.diasec.diasec_backend.util;

public class PartnerGradeUtil {
    public static String resolveGrade(long amount) {
        if (amount >= 500_000_000L) return "블랙";
        if (amount >= 300_000_000L) return "다이아";
        if (amount >= 100_000_000L) return "플래티넘";
        if (amount >= 50_000_000L) return "골드";
        if (amount >= 10_000_000L) return "실버";
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
}
