package com.diasec.diasec_backend.util;

import java.util.HashMap;
import java.util.Map;

/**
 * [배포·동기화 주의] NicePay 가상계좌 환불 API의 refundBankCode(3자리)와 동일한 매핑입니다. 프론트 refundBanks.js와 맞춰 관리하세요.
 * 고객/관리자가 입력한 은행명을 PG 코드로 변환합니다.
 */
public class NicepayBankCodeResolver {

    private static final Map<String, String> BY_NORMALIZED_NAME = new HashMap<>();

    static {
        put("KB국민은행", "004");
        put("국민은행", "004");
        put("국민", "004");
        put("KB", "004");
        put("신한은행", "088");
        put("신한", "088");
        put("우리은행", "020");
        put("우리", "020");
        put("하나은행", "081");
        put("하나", "081");
        put("NH농협은행", "011");
        put("NH농협", "011");
        put("농협은행", "011");
        put("농협", "011");
        put("NH", "011");
        put("IBK기업은행", "003");
        put("기업은행", "003");
        put("기업", "003");
        put("SC제일은행", "023");
        put("SC제일", "023");
        put("제일은행", "023");
        put("한국씨티은행", "027");
        put("씨티은행", "027");
        put("씨티", "027");
        put("카카오뱅크", "090");
        put("카카오", "090");
        put("토스뱅크", "092");
        put("토스", "092");
        put("케이뱅크", "089");
        put("경남은행", "039");
        put("광주은행", "034");
        put("제주은행", "035");
        put("새마을금고", "045");
        put("우체국", "071");
        put("KDB산업은행", "002");
        put("산업은행", "002");
        put("수협은행", "007");
        put("대구은행", "031");
        put("부산은행", "032");
        put("전북은행", "037");
    }

    private static void put(String key, String code) {
        BY_NORMALIZED_NAME.put(normalize(key), code);
    }

    private static String normalize(String s) {
        if (s == null) return "";
        return s.replaceAll("\\s+", "").toLowerCase();
    }

    public static String toCode(String bankNameOrCode) {
        if (bankNameOrCode == null) return null;
        String raw = bankNameOrCode.trim();
        if (raw.isEmpty()) return null;
        if (raw.matches("\\d{3}")) return raw;
        return BY_NORMALIZED_NAME.get(normalize(raw));
    }

    private NicepayBankCodeResolver() {}
}
