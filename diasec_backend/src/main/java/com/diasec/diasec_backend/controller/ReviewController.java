package com.diasec.diasec_backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.service.CreditService;
import com.diasec.diasec_backend.service.OrderService;
import com.diasec.diasec_backend.service.ReviewService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.CreditVo;
import com.diasec.diasec_backend.vo.OrderVo;
import com.diasec.diasec_backend.vo.ReviewVo;


@RestController
@RequestMapping("/api/review")
@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private CreditService creditService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ImageUtil imageUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    // 리뷰 작성 부분 목록 가져오기
    @GetMapping("/eligible")
    public List<ReviewVo> getEligible(@RequestParam String id) {
        return reviewService.getEligibleReviews(id);
    }

    // 비회원: 주문번호 + 주문조회 비밀번호로 작성 가능한 배송완료 상품 목록 가져오기
    @PostMapping("/guest-eligible")
    public ResponseEntity<?> getGuestEligible(@RequestBody Map<String, String> req) {
        try {
            Long oid = Long.valueOf(req.get("oid"));
            String guestPassword = req.get("guestPassword");

            OrderVo order = orderService.selectOrderByOid(oid);
            if (order == null || order.getGuestPassword() == null || order.getGuestPassword().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "주문을 찾을 수 없습니다."));
            }
            if (guestPassword == null || !passwordEncoder.matches(guestPassword, order.getGuestPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "비민번호가 일치하지 않습니다."));
            }

            return ResponseEntity.ok(reviewService.getEligibleReviewsByGuestOid(oid));
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", "올바른 주문번호가 아닙니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "조회에 실패했습니다."));
        }
    }
    
    // 리뷰 작성
    @PostMapping("/write")
    @Transactional
    public ResponseEntity<?> writeReview(
        @RequestParam("pid") Long pid,
        @RequestParam("id") String id,
        @RequestParam("itemId") int itemId,
        @RequestParam("rating") int rating,
        @RequestParam("title") String title,
        @RequestParam("content") String content,
        @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            // 중복 리뷰/중복 적립 방지
            if (reviewService.existsReviewByItemId(itemId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("success", false, "message", "이미 작성된 리뷰입니다."));
            }

            // 1. 후기 저장
            ReviewVo review = new ReviewVo();
            review.setPid(pid);
            review.setId(id);
            review.setRating(rating);
            review.setTitle(title);
            review.setContent(content);
            review.setItem_id(itemId);
            reviewService.insertReview(review);
            
            // 2. 이미지 저장
            if (images != null) {
                for (MultipartFile file : images) {
                    if (!file.isEmpty()) {
                        // 이미지 저장 및 URL 반환
                        String imageUrl = imageUtil.saveImage(file, "review");
                        reviewService.insertReviewImage(review.getRid(), imageUrl);
                    }
                }
            }

            // 3. 리뷰 작성 이벤트 적립금 지급
            final int rewardAmount = 5000;
            CreditVo rewardCredit = new CreditVo();
            rewardCredit.setId(id);
            rewardCredit.setType("적립");
            rewardCredit.setAmount(rewardAmount);
            rewardCredit.setDescription("리뷰 작성 이벤트");
            rewardCredit.setOid(orderService.getOidByItemId((long) itemId));
            creditService.insertCreditHistory(rewardCredit);

            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "rewardAmount", rewardAmount
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false));
        }
    }

    // 비회원 리뷰 등록 (적립금 없음, 주문번호 + 비밀번호로 검증)
    @PostMapping("/guest-write")
    @Transactional
    public ResponseEntity<?> writeGuestReview(
        @RequestParam("oid") Long oid,
        @RequestParam("guestPassword") String guestPassword,
        @RequestParam("pid") Long pid,
        @RequestParam("itemId") int itemId,
        @RequestParam("rating") int rating,
        @RequestParam("title") String title,
        @RequestParam("content") String content,
        @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            OrderVo order = orderService.selectOrderByOid(oid);
            if (order == null || order.getGuestPassword() == null || order.getGuestPassword().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "주문을 찾을 수 없습니다."));
            }
            if (guestPassword == null || !passwordEncoder.matches(guestPassword, order.getGuestPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "비밀번호가 일치하지 않습니다."));
            }

            if (!reviewService.isGuestItemReviewable(oid, itemId, pid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "리뷰를 작성할 수 있는 주문 상태가 아닙니다."));
            }

            if (reviewService.existsReviewByItemId(itemId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("success", false, "message", "이미 작성된 리뷰입니다."));
            }

             ReviewVo review = new ReviewVo();
             review.setPid(pid);
             review.setId("");
             review.setRating(rating);
             review.setTitle(title);
             review.setContent(content);
             review.setItem_id(itemId);
             reviewService.insertReview(review);

             if (images != null) {
                for (MultipartFile file : images) {
                    if (!file.isEmpty()) {
                        String imageUrl = imageUtil.saveImage(file, "review");
                        reviewService.insertReviewImage(review.getRid(), imageUrl);
                    }
                }
             }

             return ResponseEntity.ok().body(Map.of(
                "success", true,
                "rewardAmount", 0
             ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false));
        }
    }

    // 리뷰 리스트 가져오기
    @GetMapping("/list")
    public ResponseEntity<List<ReviewVo>> getReviews(@RequestParam int pid) {
        return ResponseEntity.ok(reviewService.getReviewsByPid(pid));
    }

    // 리뷰 리스트 전체 가져오기
    @GetMapping("/all")
    public ResponseEntity<List<ReviewVo>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    // 리뷰 한 페이지씩 불러오기
    @GetMapping("/recent")
    public ResponseEntity<List<ReviewVo>> getRecentReviews(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(reviewService.getRecentReviews(limit));
    }

    // 리뷰 삭제 & 실제 이미지 삭제
    @DeleteMapping("/delete/{rid}")
    public ResponseEntity<?> deleteReview(@PathVariable Long rid) {
        try {
            reviewService.deleteReview(rid);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false));
        }
    }
}
