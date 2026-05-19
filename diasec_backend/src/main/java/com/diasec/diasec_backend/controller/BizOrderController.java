package com.diasec.diasec_backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.service.BizService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.BizReplyVo;
import com.diasec.diasec_backend.vo.BizVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/biz")
public class BizOrderController {
    
    private final BizService bizService;
    private final ImageUtil imageUtil;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    @PostMapping("/register")
    public ResponseEntity<?> registerOrder(@ModelAttribute BizVo vo) {
        System.out.println("register!!!!!!!!!");
        try {
            bizService.registerOrder(vo);

            int orderId = vo.getId();

            // 이미지 저장
            List<MultipartFile> files = vo.getFiles();
            if (files != null && !files.isEmpty()) {
                for (MultipartFile file : files) {
                    if (!file.isEmpty()) {
                        String contentType = file.getContentType();
                        if (contentType == null || 
                            (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                            continue;
                        }

                        // 이미지 저장
                        String imageUrl = imageUtil.saveImage(file, "Biz");
                        String originalName = file.getOriginalFilename();

                        // DB에 파일 저장
                        bizService.insertOrderFile(orderId, imageUrl, originalName);
                    }
                }
            }
            
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error");
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<BizVo>> getOrderList() {
        try {
            List<BizVo> list = bizService.getOrderList();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Long id) {
        try {
            BizVo vo = bizService.getBizDetail(id);
            if (vo == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(vo);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("조회 실패");
        }
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteOrder(@RequestBody Map<String, Object> payload) {
        try {
            Long id = Long.valueOf(payload.get("id").toString());

            // 1. 이미지 삭제
            BizVo vo = bizService.getBizDetail(id);
            if (vo != null && vo.getFileList() != null) {
                vo.getFileList().forEach(file -> {
                    String path = file.getFilePath(); // 예: http://localhost:8081/uploads/Biz/abc123.png
                    if (path != null) {
                        imageUtil.deleteImage(path);
                    }
                });
            }
            bizService.deleteBiz(id);
            
            return ResponseEntity.ok("삭제 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
        }
    }

    @PostMapping("/insert-reply")
    public ResponseEntity<?> insertReply(@RequestBody BizReplyVo vo) {
        try {
            bizService.insertReply(vo);
            return ResponseEntity.ok("등록 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("등록 실패");
        }
    }

    @PostMapping("/update-reply")
    public ResponseEntity<?> updateReply(@RequestBody BizReplyVo vo) {
        try {
            bizService.updateReply(vo);
            return ResponseEntity.ok("수정 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("수정 실패");
        }
    }

    @PostMapping("/delete-reply")
    public ResponseEntity<?> deleteReply(@RequestBody Map<String, Object> payload) {
        try {
            Long bizId = Long.valueOf(payload.get("bizId").toString());
            BizReplyVo reply = bizService.getBizDetail(bizId).getReply();
            if (reply != null) {
                bizService.deleteReply(reply.getReplyId());
            }
            return ResponseEntity.ok("삭제 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
        }
    }

    // 비밀글 비밀번호 일치 확인
    @PostMapping("/check-password")
    public ResponseEntity<Boolean> checkPassword(@RequestBody Map<String, Object> payload) {
        System.out.println(payload.get("password").toString());
        try {
            String inputPw = payload.get("password").toString();
            int postId = Integer.parseInt(payload.get("id").toString());

            BizVo post = bizService.getPostById(postId);
            if (post != null && BCrypt.checkpw(inputPw, post.getPassword())) {
                return ResponseEntity.ok(true);
            }
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
