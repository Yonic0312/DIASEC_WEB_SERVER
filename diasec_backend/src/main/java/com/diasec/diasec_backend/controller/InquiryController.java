package com.diasec.diasec_backend.controller;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.service.InquiryService;
import com.diasec.diasec_backend.service.SolapiService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.InquiryVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/inquiry")
public class InquiryController {
    
    @Autowired
    private InquiryService inquiryService;
    private final ImageUtil imageUtil;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    @Value("${notify.admin.phones}")
    private String adminNotifyPhone;

    private final SolapiService solapiService;

    @PostMapping("/insert")
    public ResponseEntity<?> insertInquiry(
        @RequestParam Long pid,
        @RequestParam String id,
        @RequestParam String title,
        @RequestParam String content,
        @RequestParam String category,
        @RequestParam String isPrivate,
        @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            InquiryVo inquiry = new InquiryVo();
            inquiry.setPid(pid);
            inquiry.setId(id);
            inquiry.setTitle(title);
            inquiry.setContent(content);
            inquiry.setCategory(category);
            inquiry.setIsPrivate(isPrivate);
            inquiry.setStatus("답변대기");

            // 문의 등록
            inquiryService.insertInquiry(inquiry);
            Long iid = inquiry.getIid();

            String inquiryType = 
                (pid != null && pid > 0) ? "상품문의" : "1:1 문의";

            String msg = 
                "[DIASEC KOREA]\n"
                +"새 문의가 등록되었습니다.\n"
                + "카테고리=" + inquiryType + "\n"
                + "제목=" + title + "\n"
                + "작성자=" + id;
                

            try {
                for (String to : adminNotifyPhone.split(",")) {
                    String phone = to.trim();
                    if (!phone.isEmpty()) {
                        solapiService.send(phone, msg);
                    }
                }
                solapiService.send(adminNotifyPhone, msg);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            

            // 이미지 저장
            if (images != null) {
                for (MultipartFile img : images) {
                    String url = imageUtil.saveImage(img, "Inquiry");
                    inquiryService.insertInquiryImage(iid, url);
                }
            }

            return ResponseEntity.ok("문의 등록 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("문의 등록 실패: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<InquiryVo>> getInquiryList(@RequestParam Long pid) {
        List<InquiryVo> list = inquiryService.getInquiriesByProduct(pid);
        return ResponseEntity.ok(list);
    }

    // 상품에서 답변 (어드민)
    @PatchMapping("/answer")
    public ResponseEntity<String> registerAnswer(@RequestBody Map<String, String> payload) {
        System.out.println("answer@@@@@@");
        Long iid = Long.parseLong(payload.get("iid"));
        String content = payload.get("answer");
        String adminId = payload.get("adminId");

        inquiryService.registerAnswer(iid, adminId, content);
        return ResponseEntity.ok("답변 등록 완료");
    }

    // 상품에서 답변 수정
    @PatchMapping("/answer/{rid}")
    public ResponseEntity<String> updateReply(@PathVariable Long rid, @RequestBody Map<String, String> payload) {
        inquiryService.updateReply(rid, payload.get("content"));
        return ResponseEntity.ok("답변이 수정되었습니다.");
    }

    // 상품에서 답변 삭제
    @DeleteMapping("/answer/{rid}")
    public ResponseEntity<String> deleteReply(@PathVariable Long rid) {
        System.out.println("@DeleteMapping(\"/answer/{rid}\")");
        inquiryService.deleteReply(rid);
        return ResponseEntity.ok("답변이 삭제되었습니다.");
    }

    // 고객 마이페이지 문의사항 가져오기
    @GetMapping("/myList")
    public ResponseEntity<List<InquiryVo>> getInquiryById(@RequestParam String id) {
        List<InquiryVo> list = inquiryService.getInquiryById(id);
        System.out.println(list);
        return ResponseEntity.ok(list);
    }

    // 관리자 전용 전체 문의 목록 가져오기
    @GetMapping("/admin/list")
    public ResponseEntity<List<InquiryVo>> getAllInquiries() {
        List<InquiryVo> list = inquiryService.getAllInquiries();
        System.out.println("list : " + list);
        return ResponseEntity.ok(list);
    }

    // 관리자 페이지 문의 삭제
    @DeleteMapping("/delete/{iid}")
    public ResponseEntity<?> deleteInquiry(@PathVariable Long iid) {
        inquiryService.deleteInquiry(iid);
        return ResponseEntity.ok().build();
    }

    // 관리자 페이지 미답변 개수 가져오기
    @GetMapping("/unanswered")
    public ResponseEntity<Long> selectUnanswered () {
        System.out.println("selectUnanswered : " + inquiryService.selectUnanswered());
        return ResponseEntity.ok(inquiryService.selectUnanswered());
    }

    // 마이페이지 고객 문의 삭제
    @DeleteMapping("/my/{iid}")
    public ResponseEntity<?> deleteMyInquiry(@PathVariable Long iid, Principal principal) {
        String loginId = principal.getName();
        inquiryService.deleteMyInquiry(iid, loginId);
        return ResponseEntity.ok("삭제 완료");
    }
    
    // 마이페이지 고객 문의 수정
    @PatchMapping(value = "/my/{iid}/with-images", consumes = "multipart/form-data")
    public ResponseEntity<?> updateMyInquiryWithImages(
        @PathVariable Long iid,
        @RequestParam String title,
        @RequestParam String content,
        @RequestParam String category,
        @RequestParam String isPrivate,
        @RequestParam(required = false) List<String> keepUrls,
        @RequestParam(value = "images", required = false) List<MultipartFile> images,
        Principal principal
    ) {
        String loginId = principal.getName();

        if (keepUrls == null) keepUrls = Collections.emptyList();

        inquiryService.updateMyInquiryWithImages(
            iid, loginId, title, content, category, isPrivate, keepUrls, images
        );
        return ResponseEntity.ok("수정 완료");
    }
}
