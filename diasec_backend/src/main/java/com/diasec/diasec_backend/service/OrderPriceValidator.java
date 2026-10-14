package com.diasec.diasec_backend.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.diasec.diasec_backend.vo.OrderItemsVo;
import com.diasec.diasec_backend.vo.OrderVo;

import lombok.RequiredArgsConstructor;

@Component 
@RequiredArgsConstructor
public class OrderPriceValidator {

    // Must stay in sync with frontend utils/customFramePrice.js
    private static final int MIN_FRAME_PRICE = 25000;
    private static final double[][] PRICE_TIERS = {
        { 993.4, 38.3 },
        { 1327.9, 37.2 },
        { 2064.5, 33.6 },
        { 2477.4, 32.0 },
        { 3096.7, 30.2 },
        { 4967.2, 33.1 },
        { 6451.6, 25.9 },
        { 7741.9, 27.0 },
        { 8535.4, 22.1 },
        { 12133.0, 24.1 },
        { 18393.3, 28.4 },
        { 20503.4, 24.5 },
        { Double.POSITIVE_INFINITY, 27.4 },
    };

    private final SiteSettingService siteSettingService;
    private final BizPartnerService bizPartnerService;

    public void validate(OrderVo order) {
        List<OrderItemsVo> items = order.getItems();
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("주문 상품이 없습니다.");
        }

        int[] originalUnits = new int[items.size()];
        long originalSubtotal = 0;
        for (int i = 0; i < items.size(); i++) {
            OrderItemsVo item = items.get(i);
            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("주문 수량이 올바르지 않습니다.");
            }
            originalUnits[i] = calculateOriginalPrice(item.getSize());
            originalSubtotal += (long) originalUnits[i] * item.getQuantity();
        }

        int sitePct = Math.min(100, siteSettingService.getSiteDiscountPercent());
        int extraPct = Math.max(resolvePartnerPercent(order.getId()), bulkPercent(originalSubtotal));
        int totalPct = Math.min(50, sitePct + extraPct);

        long expectedTotal = 0;
        for (int i = 0; i < items.size(); i++) {
            OrderItemsVo item = items.get(i);
            int expectedUnit = totalPct <= 0
                ? originalUnits[i]
                : (int) Math.round(originalUnits[i] * (1 - totalPct / 100.0));
            if (item.getPrice() != expectedUnit) {
                throw new IllegalArgumentException("상품 금액이 올바르지 않습니다.");
            }
            expectedTotal += (long) expectedUnit * item.getQuantity();
        }

        if (order.getDeliveryFee() != 0) {
            throw new IllegalArgumentException("배송비가 올바르지 않습니다.");
        }
        if (order.getTotalPrice() != expectedTotal) {
            throw new IllegalArgumentException("주문 금액이 올바르지 않습니다.");
        }
        if (order.getUsedCredit() < 0 || order.getUsedCredit() > expectedTotal) {
            throw new IllegalArgumentException("적립금 사용 금액이 올바르지 않습니다.");
        }
        if (order.getFinalPrice() != expectedTotal - order.getUsedCredit()) {
            throw new IllegalArgumentException("최종 결제 금액이 올바르지 않습니다.");
        }
    }

    // size format: "12.0 X 16.0" (inch, converted from integer cm on the frontend
    private int calculateOriginalPrice(String size) {
        if (size == null) {
            throw new IllegalArgumentException("상품 사이즈 정보가 없습니다.");
        }
        String[] parts = size.toUpperCase().split("X");
        if (parts.length != 2) {
            throw new IllegalArgumentException("상품 사이즈 형식이 올바르지 않습니다.");
        }
        try {
            long w = Math.round(Double.parseDouble(parts[0].trim()) * 2.54);
            long h = Math.round(Double.parseDouble(parts[1].trim()) * 2.54);
            if (w <= 0 || h <= 0) {
                throw new IllegalArgumentException("상품 사이즈가 올바르지 않습니다.");
            }
            return calculateCumulativePrice(w * h);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("상품 사이즈 형식이 올바르지 않습니다.");
        }
    }

    private int calculateCumulativePrice(double area) {
        double remaining = area;
        double lastMax = 0;
        double total = 0;
        for (double[] tier : PRICE_TIERS) {
            double tierArea = Math.min(tier[0] - lastMax, remaining);
            if (tierArea <= 0) break;
            total += tierArea * tier[1];
            remaining -= tierArea;
            lastMax = tier[0];
        }
        int rounded = (int) (Math.floor(Math.round(total) / 1000.0) * 1000);
        return Math.max(MIN_FRAME_PRICE, rounded);
    }

    private int bulkPercent(long originalTotal) {
        if (originalTotal >= 50_000_000L) return 30;
        if (originalTotal >= 20_000_000L) return 25;
        if (originalTotal >= 10_000_000L) return 20;
        if (originalTotal >= 3_000_000L) return 10;
        if (originalTotal >= 1_000_000L) return 5;
        return 0;
    }

    private int resolvePartnerPercent(String memberId) {
        if (memberId == null || memberId.isBlank()) return 0;
        Map<String, Object> status = bizPartnerService.getMyStatus(memberId);
        Object pct = status.get("discountPercent");
        return pct instanceof Number n ? n.intValue() : 0;
    }
    
}
