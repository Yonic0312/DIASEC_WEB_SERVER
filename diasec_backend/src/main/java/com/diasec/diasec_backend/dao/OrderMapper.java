package com.diasec.diasec_backend.dao;

/**
 * [배포·동기화 주의] 나이스페이 관련 메서드(selectOidByNicepayOrderId 등)가 있습니다. OrderMapper.xml 상단 주석과 쌍으로 복붙 금지.
 */

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.transaction.annotation.Transactional;

import com.diasec.diasec_backend.vo.OrderItemClaimFileVo;
import com.diasec.diasec_backend.vo.OrderItemFileVo;
import com.diasec.diasec_backend.vo.OrderItemsVo;
import com.diasec.diasec_backend.vo.OrderVo;

@Mapper
public interface OrderMapper {
    
    // orders 테이블에 주문 저장
    void insertOrder(OrderVo orderVo);

    // order_items 테이블에 주문 아이템 목록 저장
    void insertOrderItem(@Param("oid") Long oid, @Param("item") OrderItemsVo item);

    // @유저 사용한 적립금 적립@
    void increaseCredit(@Param("id") String memberId, @Param("credit") int credit);

    // @유저 사용한 적립금 차감@
    void decreaseCredit(@Param("id") String memberId, @Param("credit") int credit);

    // 날짜, 타입 필터로 값 가져오기
    List<OrderVo> selectOrderListWithFilter(@Param("id") String id, @Param("startDate") String startDate, @Param("endDate") String endDate, @Param("status") String status);

    // itemId로 oid 조회
    Long selectOidByItemId(@Param("itemId") Long itemId);
    
    // 관리자: orders 배송/주문자 정보 수정
    int updateOrderShippingInfo(OrderVo vo);

    // oid로 주문정보 + 주문상품 목록 조회
    OrderVo selectOrderByOid(@Param("oid") Long oid);

    // 나이스페이 orderId로 oid 조회 (U112 중복 호출 시 완료 페이지 리다이렉트용)
    Long selectOidByNicepayOrderId(@Param("nicepayOrderId") String nicepayOrderId);

    // 3. 상세페이지로 들어갈 itemId 개별 주문 상품 조회
    OrderItemsVo selectOrderItemById(@Param("itemId") Long itemId);

    // order_items 아이템 목록 가져오기 (orders에 들어갈)
    List<OrderItemsVo> selectOrderItems(Long oid);
 
    // 주문 취소
    void cancelAllOrderItems(@Param("oid") Long oid);

    // 주문 취소 요청 ( 결제 후 )
    void updateOrderItemsStatus(Long oid, String status);

    // 주문 반품 신청
    boolean updateClaimInfo(OrderItemsVo vo);

    void updateRefundAccountByOid(
        @Param("oid") Long oid,
        @Param("bankName") String bankName,
        @Param("accountNumber") String accountNumber,
        @Param("accountHolder") String accountHolder
    );

    // 주문 삭제
    // void deleteOrderItemsByOid(Long oid);
    void deleteOrderByOid(Long oid);

    void deleteOrdersById(String id);

    // 비회원 주문 비밀번호 재설정
    void updateGuestPassword(@Param("oid") Long oid, @Param("encodedPw") String encodedPw);

    int updateRetouchInfo(Long itemId, int retouchEnabled, String retouchTypes, String retouchNote);

    // 사이드바 상태 검색
    List<Map<String, Object>> selectOrderItemCountsByStatus();

    // 클레임 이미지 정보 저장
    int insertOrderItemClaimFile(OrderItemClaimFileVo vo);
    List<OrderItemClaimFileVo> selectOrderItemClaimFiles(long itemId);
    int deleteOrderItemClaimFiles(long itemId);

    // 고객 보정 이미지 관련
    int insertOrderItemFile(OrderItemFileVo vo);
    
    Integer selectMaxVersion(@Param("itemId") Long itemId, @Param("role") String role);

    OrderItemFileVo selectLatestFile(@Param("itemId") Long itemId, @Param("role") String role)    ;
    
    int updateFileStatusLatest(@Param("itemId") Long itemId,
                        @Param("role") String role,
                        @Param("status") String status,
                        @Param("customerFeedback") String customerFeedback);

    List<OrderItemFileVo> selectFilesByItem(@Param("itemId") Long itemId);

    int updateRetouchStatus(@Param("itemId") Long itemId,
                            @Param("retouchStatus") String retouchStatus,
                            @Param("retouchVersion") Integer retouchVersion);

    int upsertOrderItemFile(OrderItemFileVo vo);

    List<Map<String, Object>> selectMyRetouchList(@Param("id") String id);

    List<Map<String, Object>> selectAdminRetouchList(
        @Param("startDate") String startDate,
        @Param("endDate") String endDate,
        @Param("keyword") String keyword,
        @Param("status") String status
    );

    void softDeleteLatestFile(Long itemId, String role);

    int scheduleRetouchPreviewDelete(@Param("itemId") long itemId);

    List<OrderItemFileVo> selectRetouchPreviewToDelete();
    int markRetouchPreviewDeleted(@Param("fileId") Long fileId);

    // 배송완료 후 30일 지난 맞춤액자 썸네일 정리 대상
    List<OrderItemsVo> selectCustomFrameStalePreviewItems();

    int clearThumbnailPreview(@Param("itemId") Long itemId);
}
