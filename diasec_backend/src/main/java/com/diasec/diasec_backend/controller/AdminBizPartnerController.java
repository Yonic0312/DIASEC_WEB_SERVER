package com.diasec.diasec_backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.BizPartnerService;
import com.diasec.diasec_backend.vo.BizPartnerApplicationVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/biz-partner")
public class AdminBizPartnerController {

    private final BizPartnerService bizPartnerService;

    private static final String DEFAULT_APPROVE_REPLY =
        "업무제휴가 승인되었습니다. 신청 시 동의하신 계약 내용에 따라 업무가 진행됩니다.";

    private static final String DEFAULT_REJECT_REPLY =
        "제휴 신청에 감사드립니다.\n"
        + "내부 검토 결과,\n"
        + "현재 협업 방향성과 부합하지 않아 이번 제휴는 진행이 어렵습니다.\n"
        + "향후 여건이 맞는 경우 협의할 수 있기를 바랍니다.";

    // 신청 목록
    @GetMapping("/list")
    public ResponseEntity<List<BizPartnerApplicationVo>> list() {
        return ResponseEntity.ok(bizPartnerService.getApplicationList());
    }

    // 신청 상세
    @GetMapping("/view/{id}")
    public ResponseEntity<?> view(@PathVariable Long id) {
        BizPartnerApplicationVo vo = bizPartnerService.getApplicationDetail(id);
        return vo == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(vo);
    }

    // 대기 건수 (사이드바 배지용)
    @GetMapping("/count")
    public ResponseEntity<Integer> count() {
        return ResponseEntity.ok(bizPartnerService.countPending());
    }

    // 승인
    @PostMapping("/approve")
    public ResponseEntity<?> approve(@RequestBody Map<String, Object> payload) {
        try {
            Long id = Long.valueOf(payload.get("id").toString());

            String adminReply = payload.get("adminReply") != null
                ? payload.get("adminReply").toString().trim()
                : "";
            if (adminReply.isEmpty()) {
                adminReply = DEFAULT_APPROVE_REPLY;
            }

            bizPartnerService.approve(id, adminReply);
            return ResponseEntity.ok("승인 처리되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("승인 처리 실패");
        }
    }

    // 미승인
    @PostMapping("/reject")
    public ResponseEntity<?> reject(@RequestBody Map<String, Object> payload) {
        try {
            Long id = Long.valueOf(payload.get("id").toString());

            String adminReply = payload.get("adminReply") != null
                ? payload.get("adminReply").toString().trim()
                : "";
            if (adminReply.isEmpty()) {
                adminReply = DEFAULT_REJECT_REPLY;
            }

            bizPartnerService.reject(id, adminReply);
            return ResponseEntity.ok("미승인 처리되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("미승인 처리 실패");
        }
    }
}
