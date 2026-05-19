package com.diasec.diasec_backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.util.ImageUtil;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/uploads")
public class UploadController {
    
    private final ImageUtil imageUtil;

    @PostMapping(value="/customFrames/tmp", consumes="multipart/form-data")
    public ResponseEntity<?> uploadCustomFrameTmp(@RequestPart("file") MultipartFile file) {
        try {
            // tmp/customFrames 폴더에 저장되도록 subDir를 이렇게 사용
            String url = imageUtil.saveImage(file, "tmp/customFrames");
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
