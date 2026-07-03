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

import com.diasec.diasec_backend.service.BizConsultService;
import com.diasec.diasec_backend.vo.BizConsultVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/biz-consult")
public class AdminBizConsultController {
    
    private final BizConsultService bizConsultService;


    @GetMapping("/list")
    public ResponseEntity<List<BizConsultVo>> list() {
        return ResponseEntity.ok(bizConsultService.getConsultList());
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<?> view(@PathVariable Long id) {
        BizConsultVo vo = bizConsultService.getConsultDetail(id);
        return vo == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(vo);
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> count() {
        return ResponseEntity.ok(bizConsultService.countConsult());
    }

    @PostMapping("/delete")
    public ResponseEntity<?> delete(@RequestBody Map<String, Object> payload) {
        try {
            Long id = Long.valueOf(payload.get("id").toString());
            bizConsultService.deleteConsult(id);
            return ResponseEntity.ok("삭제 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
        }
    }

    @PostMapping("/complete")
    public ResponseEntity<?> complete(@RequestBody Map<String, Object> payload) {
        try {
            Long id = Long.valueOf(payload.get("id").toString());
            bizConsultService.completeConsult(id);
            return ResponseEntity.ok("완료 처리되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("완료 처리 실패");
        }
    }
    
    @PostMapping("/reopen")
    public ResponseEntity<?> reopen(@RequestBody Map<String, Object> payload) {
        try {
            Long id = Long.valueOf(payload.get("id").toString());
            bizConsultService.reopenConsult(id);
            return ResponseEntity.ok("미완료로 변경되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("미완료 변경 실패");
        }
    }
    
    @PostMapping("/delete-file")
    public ResponseEntity<?> deleteFile(@RequestBody Map<String, Object> payload) {
        try {
            Long oid = Long.valueOf(payload.get("oid").toString());
            if (!bizConsultService.deleteConsultFile(oid)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("파일을 찾을 수 없습니다.");
            }
            return ResponseEntity.ok("삭제 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
        }
    }
}