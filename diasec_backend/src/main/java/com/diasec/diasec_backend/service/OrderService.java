package com.diasec.diasec_backend.service;

/**
 * [배포·동기화 주의] 운영 서버는 나이스페이(PG) 연동·주문 조회 로직이 포함되어 로컬과 다를 수 있습니다.
 * 로컬 파일로 서버를 덮어쓰지 마세요. OrderMapper.xml 등과 함께 검토 후 병합하세요.
 */

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.dao.OrderMapper;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.CreditVo;
import com.diasec.diasec_backend.vo.OrderItemClaimFileVo;
import com.diasec.diasec_backend.vo.OrderItemFileVo;
import com.diasec.diasec_backend.vo.OrderItemsVo;
import com.diasec.diasec_backend.vo.OrderVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderMapper orderMapper;
    private final CreditService creditService;
    private final ProductService productService;
    private final ImageUtil imageUtil;
    private final SolapiService solapiService;

    @Value("${notify.admin.enabled:false}")
    private boolean adminNotifyEnabled;

    @Value("${notify.admin.phones:}")
    private String adminPhonesRaw;

    private static final int MAX_FILES = 5;
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    /**
     * 맞춤액자 thumbnail이 data:image(base64)인 경우 서버에 파일로 저장하고 짧은 URL로 치환.
     * 나이스페이 등 OrderController.insertOrder를 거치지 않는 경로에서도 DB/패킷 크기 문제를 막음.
     */
    private void normalizeCustomFrameThumbnails(OrderVo orderVo) {
        if (orderVo.getItems() == null) {
            return;
        }
        for (OrderItemsVo item : orderVo.getItems()) {
            if (!"customFrames".equals(item.getCategory())) {
                continue;
            }
            item.setThumbnail(normalizeBase64ImageUrlIfNeeded(item.getThumbnail()));
            item.setThumbnailPreview(normalizeBase64ImageUrlIfNeeded(item.getThumbnailPreview()));
        }
    }

    private String normalizeBase64ImageUrlIfNeeded(String maybeBase64DataUrl) {
        if (maybeBase64DataUrl == null || !maybeBase64DataUrl.startsWith("data:image")) {
            return maybeBase64DataUrl;
        }
        int comma = maybeBase64DataUrl.indexOf(',');
        if (comma < 0) {
            return maybeBase64DataUrl;
        }
        String metadata = maybeBase64DataUrl.substring(0, comma);
        String base64Data = maybeBase64DataUrl.substring(comma + 1);
        String extension = "jpg";
        if (metadata.contains("png")) {
            extension = "png";
        } else if (metadata.contains("jpeg") || metadata.contains("jpg")) {
            extension = "jpg";
        } else if (metadata.contains("webp")) {
            extension = "webp";
        }
        try {
            return imageUtil.saveBase64Image(base64Data, extension, "customFrames");
        } catch (IOException e) {
            throw new IllegalStateException("맞춤액자 이미지 저장 실패", e);
        }
    }

    // OrderForm 주문 저장
    @Transactional
    public void insertOrder(OrderVo orderVo, List<MultipartFile> customFrameFiles, List<MultipartFile> customFramePreviewFiles) {
        applyCustomFrameFiles(orderVo, customFrameFiles, customFramePreviewFiles);
        insertOrder(orderVo);
    }

    @Transactional
    public void insertOrder(OrderVo orderVo) {
        normalizeCustomFrameThumbnails(orderVo);

        if ("적립금".equals(orderVo.getPaymentMethod())) {
            if (orderVo.getFinalPrice() != 0) {
                throw new IllegalArgumentException("적립금 결제는 최종 결제금액이 0원이어야 합니다.");
            }
            if (orderVo.getUsedCredit() <= 0 || orderVo.getId() == null || orderVo.getId().isBlank()) {
                throw new IllegalArgumentException("적립금 결제 정보가 올바르지 않습니다.");
            }
        }

        // 1. orders 테이블에 주문 저장 (oid 생성)
        orderMapper.insertOrder(orderVo);

        // 2. order_items 테이블에 주문 아이템 리스트 저장
        List<OrderItemsVo> items = orderVo.getItems();
        for (OrderItemsVo item : items) {
            orderMapper.insertOrderItem(orderVo.getOid(), item);
        }

        // 2-1. 판매량 증가 (주문아이템 1줄당 +1)
        if (items != null && !items.isEmpty()) {
            for (OrderItemsVo item : items) {
                productService.updateProductSales(item.getPid());
            }
        }

        // 3. 적립금 차감
        if (orderVo.getUsedCredit() > 0) {
            // 사용 내역 기록 추가 (주문)
            CreditVo usedCredit = new CreditVo();
            usedCredit.setId(orderVo.getId());
            usedCredit.setType("사용");
            usedCredit.setAmount(orderVo.getUsedCredit());
            usedCredit.setDescription("주문 결제 사용");
            usedCredit.setOid(orderVo.getOid());

            creditService.insertCreditHistory(usedCredit);
        }
    }

    private void applyCustomFrameFiles(OrderVo orderVo, List<MultipartFile> customFrameFiles, List<MultipartFile> customFramePreviewFiles) {
        if (orderVo == null || orderVo.getItems() == null || orderVo.getItems().isEmpty()) return;

        int fileIndex = 0;
        int previewFileIndex = 0;
        for (OrderItemsVo item : orderVo.getItems()) {
            if (!"customFrames".equals(item.getCategory())) continue;

            MultipartFile file = null;
            if (customFrameFiles != null && fileIndex < customFrameFiles.size()) {
                file = customFrameFiles.get(fileIndex++);
            }
            MultipartFile previewFile = null;
            if (customFramePreviewFiles != null && previewFileIndex < customFramePreviewFiles.size()) {
                previewFile = customFramePreviewFiles.get(previewFileIndex++);
            }

            if (file != null && !file.isEmpty()) {
                try {
                    String imageUrl = imageUtil.saveImage(file, "customFrames");
                    String previewUrl = (previewFile != null && !previewFile.isEmpty())
                        ? imageUtil.saveImage(previewFile, "customFrames")
                        : imageUrl;
                    // 주문 확정 시 저장된 URL 반영 (원본/미니 썸네일 분리)
                    item.setThumbnail(imageUrl);
                    item.setThumbnailPreview(previewUrl);
                } catch (IOException e) {
                    throw new IllegalStateException("맞춤액자 이미지 저장 실패", e);
                }
            }
        }
    }

    // 주문내역 조회 리스트 가져오기 (주문 목록 날짜, 타입)
    public List<OrderVo> selectOrderListWithFilter(String id, String startDate, String endDate, String status) {
        List<OrderVo> orders = orderMapper.selectOrderListWithFilter(id, startDate, endDate, status);
        
        for (OrderVo order : orders) {
            List<OrderItemsVo> items = orderMapper.selectOrderItems(order.getOid());
            order.setItems(items);
        }
        
        return orders;
    }

    // 주문목록 상세페이지
    public Long getOidByItemId(Long itemId) {
        return orderMapper.selectOidByItemId(itemId);
    }

    /** 나이스페이 orderId로 이미 저장된 주문의 oid 조회 (U112 중복 승인 시 리다이렉트용) */
    public Long getOidByNicepayOrderId(String nicepayOrderId) {
        if (nicepayOrderId == null || nicepayOrderId.isBlank()) return null;
        return orderMapper.selectOidByNicepayOrderId(nicepayOrderId);
    }

    public OrderVo selectOrderByOid(Long oid) {
        OrderVo order = orderMapper.selectOrderByOid(oid);
        List<OrderItemsVo> items = orderMapper.selectOrderItems(oid);

        for (OrderItemsVo item : items) {
            item.setClaimFiles(orderMapper.selectOrderItemClaimFiles(item.getItemId()));
        }

        order.setItems(items);
        return order;
    }

    public List<OrderVo> selectGuestOrdersByOrdererPhone(String ordererPhone) {
        String phoneDigits = normalizePhoneDigits(ordererPhone);
        if (phoneDigits.isBlank()) {
            return List.of();
        }

        List<OrderVo> orders = orderMapper.selectGuestOrdersByOrdererPhoneDigits(phoneDigits);
        List<OrderVo> loaded = new ArrayList<>();

        for (OrderVo order : orders) {
            List<OrderItemsVo> items = orderMapper.selectOrderItems(order.getOid());
            for (OrderItemsVo item : items) {
                item.setClaimFiles(orderMapper.selectOrderItemClaimFiles(item.getItemId()));
            }
            order.setItems(items);
            loaded.add(order);
        }

        return loaded;
    }

    private static String normalizePhoneDigits(String phone) {
        if (phone == null) {
            return "";
        }
        return phone.replaceAll("[^0-9]", "");
    }

    // 주문목록 상세페이지 (order_items 하나씩 불러오기)
    public OrderVo selectOrderInfoByItemId(Long itemId) {
        // 1. itemId로 oid 조회
        Long oid = orderMapper.selectOidByItemId(itemId);
        if (oid == null) return null;

        // 2. oid로 주문정보 + 주문상품 목록 조회
        OrderVo order = orderMapper.selectOrderByOid(oid);

        // 3. 상세페이지로 들어갈 itemId 개별 주문 상품 조회
        OrderItemsVo singleitem = orderMapper.selectOrderItemById(itemId);

        // 3.1 주문 상품에 클레임 이미지 정보 조회
        List<OrderItemClaimFileVo> files = orderMapper.selectOrderItemClaimFiles(itemId);
        singleitem.setClaimFiles(files);

        // 4. 주문내역 items 리스트에 order_items 테이블 매핑
        order.setItems(List.of(singleitem));
        return order;
    }

    // 관리자: 주문 건(orders) 배송/연락처 정보 수정 - itemId로 oid 조회 후 반영
    @Transactional
    public boolean updateOrderShippingByItemId(Long itemId, OrderVo patch) {
        Long oid = orderMapper.selectOidByItemId(itemId);
        if (oid == null) {
            return false;
        }
        patch.setOid(oid);
        return orderMapper.updateOrderShippingInfo(patch) > 0;
    }

    // 주문 취소
    @Transactional
    public void cancelAllOrderItems(Long oid) {
        orderMapper.cancelAllOrderItems(oid);
    }

    // 주문 취소 요청 — 가상계좌 입금완료 시 환불계좌 저장 후 취소요청
    public Map<String, Object> requestCancelOrder(
            Long oid, String bankName, String accountNumber, String accountHolder) {
        OrderVo order = selectOrderByOid(oid);
        if (order == null || order.getItems() == null || order.getItems().isEmpty()) {
            return Map.of("success", false, "message", "주문 정보를 찾을 수 없습니다.");
        }
        OrderItemsVo line = order.getItems().get(0);
        boolean paidVbank = "가상계좌".equals(order.getPaymentMethod())
                && "결제완료".equals(line.getOrderStatus());

        if (paidVbank) {
            boolean hasInput = bankName != null && !bankName.isBlank()
                    && accountNumber != null && !accountNumber.isBlank()
                    && accountHolder != null && !accountHolder.isBlank();
            boolean hasSaved = line.getBankName() != null && !line.getBankName().isBlank()
                    && line.getAccountNumber() != null && !line.getAccountNumber().isBlank()
                    && line.getAccountHolder() != null && !line.getAccountHolder().isBlank();
            if (!hasInput && !hasSaved) {
                return Map.of("success", false, "message", "가상계좌 취소 요청에는 환불 계좌가 필요합니다.");
            }
            if (hasInput) {
                orderMapper.updateRefundAccountByOid(oid,
                        bankName.trim(),
                        accountNumber.replaceAll("\\D", "").trim(),
                        accountHolder.trim());
            }
        }

        orderMapper.updateOrderItemsStatus(oid, "취소요청");
        return null;
    }

    // 주문 반품 신청
    public boolean processClaim(OrderItemsVo vo) {
        return orderMapper.updateClaimInfo(vo);
    }

    // 주문 삭제
    public void deleteOrder(Long oid) {
        // orderMapper.deleteOrderItemsByOid(oid);
        orderMapper.deleteOrderByOid(oid);
    }

    // 비회원 주문 비밀번호 재설정
    public void updateGuestPassword(Long oid, String encodedPw) {
        orderMapper.updateGuestPassword(oid, encodedPw);
    }

    public boolean updateRetouchInfo(Long itemId, int retouchEnabled, String retouchTypes, String retouchNote) {
        return orderMapper.updateRetouchInfo(itemId, retouchEnabled, retouchTypes, retouchNote) > 0;
    }

    public List<Map<String, Object>> selectOrderItemCountsByStatus() {
        return orderMapper.selectOrderItemCountsByStatus();
    }

    public void saveClaimImages(long itemId, List<MultipartFile> images) throws IOException {
        
        if (images == null || images.isEmpty()) {
            return;
        }

        if (images.size() > MAX_FILES) {
            throw new IllegalArgumentException("이미지는 최대" + MAX_FILES + "장까지 가능합니다.");
        }

        int order = 0;
        for (MultipartFile f : images) {
            if (f == null || f.isEmpty()) continue;

            if (f.getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("파일은 5MB 이하만 가능합니다: " + f.getOriginalFilename());
            }

            String url = imageUtil.saveImage(f, "orderClaim");

            OrderItemClaimFileVo vo = new OrderItemClaimFileVo();
            vo.setItemId(itemId);
            vo.setFileUrl(url);
            vo.setOriginalName(f.getOriginalFilename());
            vo.setFileSize(f.getSize());
            vo.setImgOrder(order++);

            orderMapper.insertOrderItemClaimFile(vo);
        }
    }

    @Transactional
    public int deleteClaimFiles(Long itemId) {
        // 1) DB에서 파일 목록 조회
        List<OrderItemClaimFileVo> files = orderMapper.selectOrderItemClaimFiles(itemId);

        // 2) 실제 파일 삭제
        if (files != null) {
            for (OrderItemClaimFileVo f : files) {
                if (f.getFileUrl() != null && !f.getFileUrl().isBlank()) {
                    imageUtil.deleteImage(f.getFileUrl());
                }
            }
        }

        // 3) DB 레코드 삭제
        return orderMapper.deleteOrderItemClaimFiles(itemId);
    }

    // 보정서비스 관련
    // 관리자 사진 업로드
    @Transactional
    public String uploadRetouchPreview(Long itemId, MultipartFile file) throws Exception {

        // 1) 기존 파일 url 조회 (없을 수도 있음)
        OrderItemFileVo prev = orderMapper.selectLatestFile(itemId, "RETOUCH_PREVIEW");
        String prevUrl = (prev == null) ? null : prev.getFileUrl();

        // 2) 새 파일 저장
        String fileUrl = imageUtil.saveImage(file, "customFrames/retouchPreview");

        // 3) DB는 1개만 유지 (업서트)
        OrderItemFileVo vo = new OrderItemFileVo();
        vo.setItemId(itemId);
        vo.setRole("RETOUCH_PREVIEW");
        vo.setStatus("WAITING_CUSTOMER");
        vo.setFileUrl(fileUrl);
        vo.setOriginalName(file.getOriginalFilename());
        vo.setFileSize(file.getSize());
        vo.setMimeType(file.getContentType());
        vo.setUploadedBy("ADMIN");
        vo.setCustomerFeedback(null);
        orderMapper.upsertOrderItemFile(vo);

        // 4) 이전 파일 실제 삭제 (새 저장 성공 + DB 업데이트 성공 후)
        if (prevUrl != null && !prevUrl.isBlank()) {
            imageUtil.deleteImage(prevUrl);
        }

        return fileUrl;
    }

    // 고객 승인
    @Transactional
    public void approveRetouch(Long itemId) {
        OrderItemFileVo latest = orderMapper.selectLatestFile(itemId, "RETOUCH_PREVIEW");
        if (latest == null) throw new RuntimeException("보정 프리뷰가 없습니다.");

        orderMapper.updateFileStatusLatest(itemId, "RETOUCH_PREVIEW", "APPROVED", null);

        // 30일 뒤에 자동 삭제
        orderMapper.scheduleRetouchPreviewDelete(itemId);
    }

    // 고객 반려
    @Transactional
    public void rejectRetouch(Long itemId, String feedback) {
        OrderItemFileVo latest = orderMapper.selectLatestFile(itemId, "RETOUCH_PREVIEW");
        if (latest == null) throw new RuntimeException("보정 프리뷰가 없습니다.");

        orderMapper.updateFileStatusLatest(itemId, "RETOUCH_PREVIEW", "REJECTED", feedback);
    }

    // 관리자: 프리뷰 유무와 관계없이 보정 승인 처리
    @Transactional
    public void adminApproveRetouch(Long itemId) {
        OrderItemFileVo latest = orderMapper.selectLatestFile(itemId, "RETOUCH_PREVIEW");

        if (latest != null && "APPROVED".equals(latest.getStatus())) {
            throw new IllegalStateException("이미 승인 완료된 보정입니다.");
        }
        
        if (latest != null) {
            orderMapper.updateFileStatusLatest(itemId, "RETOUCH_PREVIEW", "APPROVED", null);
            if (latest.getFileUrl() != null && !latest.getFileUrl().isBlank()) {
                orderMapper.scheduleRetouchPreviewDelete(itemId);
            }
            return;
        }
        OrderItemFileVo vo = new OrderItemFileVo();
        vo.setItemId(itemId);
        vo.setRole("RETOUCH_PREVIEW");
        vo.setStatus("APPROVED");
        vo.setUploadedBy("ADMIN");
        vo.setFileUrl("");
        orderMapper.upsertOrderItemFile(vo);
    }

    // 관리자: 보정 요청 글(유형·메모) 삭제
    @Transactional
    public void clearRetouchRequest(Long itemId) {
        int updated = orderMapper.updateRetouchInfo(itemId, 0, null, null);
        if (updated <= 0) throw new RuntimeException("보정 요청을 찾을 수 없습니다.");
    }


    public OrderItemFileVo getLatestRetouchPreview(Long itemId) {
        return orderMapper.selectLatestFile(itemId, "RETOUCH_PREVIEW");
    }

    @Transactional
    public void deleteRetouchPreview(Long itemId) {
        OrderItemFileVo latest = orderMapper.selectLatestFile(itemId, "RETOUCH_PREVIEW");
        if (latest == null) throw new RuntimeException("삭제할 프리뷰가 없습니다.");

        // 1) 실제 파일 삭제
        if (latest.getFileUrl() != null && !latest.getFileUrl().isBlank()) {
            imageUtil.deleteImage(latest.getFileUrl());
        }

        // 2) DB 삭제 처리 (deleted_at 세탕)
        orderMapper.softDeleteLatestFile(itemId, "RETOUCH_PREVIEW");
    }

    // 30일 지나면 보정 이미지 자동 삭제
    @Scheduled(fixedDelay = 60_000)
    // @Scheduled(cron = "0 0 3 * * *") // 매일 새벽 3시
    public void cleanupApprovedRetouchPreviews() {
        List<OrderItemFileVo> targets = orderMapper.selectRetouchPreviewToDelete();

        for (OrderItemFileVo f : targets) {
            try {
                // 1) 실제 파일 삭제
                imageUtil.deleteImage(f.getFileUrl());

                // 2) DB에서 삭제 완료 처리(소프트 삭제)
                orderMapper.markRetouchPreviewDeleted(f.getFileId());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // 맞춤액자: 배송완료 후 30일 경과한 150px 썸네일 자동 삭제
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void cleanupCustomFramePreviewThumbnails() {
        List<OrderItemsVo> rows = orderMapper.selectCustomFrameStalePreviewItems();
        if (rows == null || rows.isEmpty()) {
            return;
        }
        for (OrderItemsVo row : rows) {
            try {
                if (row.getThumbnailPreview() != null && !row.getThumbnailPreview().isBlank()) {
                    imageUtil.deleteImage(row.getThumbnailPreview());
                }
                orderMapper.clearThumbnailPreview(row.getItemId());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // 주문 완료시 문자 발송
    public void sendAdminOrderPaidSms(Long oid, String triggerLabel) {
        if (!adminNotifyEnabled || oid == null) return;

        Set<String> phones = parseAdminPhones(adminPhonesRaw);
        if (phones.isEmpty()) return;

        OrderVo order = selectOrderByOid(oid);
        if (order == null) return;

        String msg = String.format(
            "[DIASEC KOREA] 주문 결제 완료 알림%n" +
            "주문번호: %s%n" +
            "주문자: %s%n" +
            "결제수단: %s%n" +
            "결제금액 %,d원%n" +
            "구분: %s",
            order.getOid(),
            nvl(order.getOrdererName(), "미확인"),
            nvl(order.getPaymentMethod(), "미확인"),
            order.getFinalPrice(),
            nvl(triggerLabel, "결제완료")
        );

        for (String to : phones) {
            try {
                solapiService.send(to, msg);
            } catch (Exception e) {
                // SMS 발송 실패 시 주문 처리는 유지
            }
        }
    }

    private Set<String> parseAdminPhones(String raw) {
        Set<String> out = new LinkedHashSet<>();
        if (raw == null || raw.isBlank()) return out;

        Arrays.stream(raw.split(","))
            .map(v -> v == null ? "" : v.replaceAll("[^0-9]", "").trim())
            .filter(v -> !v.isBlank())
            .forEach(out::add);
        
        return out;
    }

    private String nvl(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    public void markOrderPaid(Long oid) {
        orderMapper.updateOrderItemsStatus(oid, "결제완료");
    }
}