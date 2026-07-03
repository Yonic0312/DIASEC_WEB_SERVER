package com.diasec.diasec_backend.controller;

import java.util.List;
import java.util.Map;

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

import com.diasec.diasec_backend.service.BizConsultService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.BizConsultVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/biz-consult")
public class BizConsultController {

    private final BizConsultService bizConsultService;
    private final ImageUtil imageUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@ModelAttribute BizConsultVo vo) {
        try {
            List<MultipartFile> files = vo.getFiles();
            if (files != null && files.size() > 20) {
                return ResponseEntity.badRequest().body("파일은 최대 20개까지 가능합니다.");
            }

            bizConsultService.registerConsult(vo);
            Long consultId = vo.getId();

            if (files != null) {
                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;
                    String ct = file.getContentType();
                    if (ct == null || (!ct.equals("image/jpeg") && !ct.equals("image/png"))) continue;
                    if (file.getSize() > 5 * 1024 * 1024) continue;

                    String imageUrl = imageUtil.saveImage(file, "BizConsult");
                    bizConsultService.insertConsultFile(consultId, imageUrl, file.getOriginalFilename());
                }
            }
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error");
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<BizConsultVo>> list() {
        return ResponseEntity.ok(bizConsultService.getConsultList());
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<?> view(@PathVariable Long id) {
        BizConsultVo vo = bizConsultService.getConsultDetail(id);
        return vo == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(vo);
    }

    @PostMapping("/check-password")
    public ResponseEntity<Boolean> checkPassword(@RequestBody Map<String, Object> payload) {
        try {
            String inputPw = payload.get("password").toString();
            int postId = Integer.parseInt(payload.get("id").toString());
            BizConsultVo post = bizConsultService.getPostById(postId);
            if (post != null && BCrypt.checkpw(inputPw, post.getPassword())) {
                return ResponseEntity.ok(true);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(false);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
        }
    }

    @PostMapping("/delete")
    public ResponseEntity<?> delete(@RequestBody Map<String, Object> payload) {
        try {
            String inputPw = payload.get("password").toString();
            Long id = Long.parseLong(payload.get("id").toString());

            BizConsultVo post = bizConsultService.getPostById(id.intValue());
            if (post == null || !BCrypt.checkpw(inputPw, post.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비밀번호가 일치하지 않습니다.");
            }

            bizConsultService.deleteConsult(id);
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error");
        }
    }
}
