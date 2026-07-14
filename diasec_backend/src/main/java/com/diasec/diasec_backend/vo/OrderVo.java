package com.diasec.diasec_backend.vo;

import java.util.List;

import lombok.Data;

/**
 * [배포·동기화 주의] nicepayTid·nicepayOrderId 등 PG 필드 포함. DB 스키마·OrderMapper와 불일치하면 주문 저장이 실패합니다.
 */
@Data
public class OrderVo {
    private Long oid;
    private String id;
    private String ordererName;
    private String ordererPhone;
    private String email;
    private String recipient;
    private String postcode;
    private String address;
    private String detailAddress;
    private int usedCredit;
    private String paymentMethod;
    private String receiptType; // 현금영수증 [개인, 사업자]
    private int totalPrice;
    private int totalDeposit;
    private int deliveryFee;
    private int finalPrice;
    private String buyerRequest;
    private String deliveryMessage;
    private String recipientPhone;

    private String createdAt;

    private String depositor; // 입금자명 
    private String bankAccount; // 계좌
    private String receiptInfo;
    private String receiptMethod; // [휴대폰번호, 현금영수증카드]

    private String guestPassword;

    // 나이스페이 결제 정보 (실제 결제)
    private String orderId;
    private String nicepayTid; // 나이스 거래 번호
    private String nicepayOrderId; // 나이스 주문번호
    private String payMethodCode;
    private String cardName;

    // 가상계좌 정보
    private String vbankCode;
    private String vbankName;
    private String vbankAccount;
    private String vbankHolder;
    private String vbankDueDate;
        
    // 결제 완료 정보
    private String paidAt;
    private String webhookLastStatus;
    


    private List<OrderItemsVo> items;
}
