package com.diasec.diasec_backend.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.service.NoticeService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.NoticeVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notice")
public class NoticeController {
    
    private final NoticeService noticeService;
    private final ImageUtil imageUtil;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    @GetMapping("/list")
    public ResponseEntity<List<NoticeVo>> getNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PostMapping("/insert")
    public ResponseEntity<Void> addNotice(@ModelAttribute NoticeVo notice) {
        try {
            System.out.println("notice : "+notice);
            handleImages(notice);
            noticeService.insertNotice(notice);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoticeVo> getNotice(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.getNoticeById(id));
    }

    @PostMapping("/update/{id}")
    public ResponseEntity<Void> updateNotice(@PathVariable Long id, @ModelAttribute NoticeVo notice) {
        try {
            System.out.println(notice);
            notice.setNoticeId(id);
            handleImages(notice);
            noticeService.updateNotice(notice);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // 이미지 처리
    private void handleImages(NoticeVo notice) throws Exception {
        List<String> finalUrls = new ArrayList<>();

        // 기존 이미지 유지
        List<String> existingUrls = notice.getExistingUrls();
        if (existingUrls != null) {
            finalUrls.addAll(existingUrls);
        }

        // 1. 삭제된 이미지 -> 실제 파일 삭제
        String dbUrlStr = noticeService.getImageUrlByNoticeId(notice.getNoticeId());
        if (dbUrlStr != null && !dbUrlStr.isBlank()) {
            String[] dbUrls = dbUrlStr.split(",");
            for (String dbUrl : dbUrls) {
                String trimmed = dbUrl.trim();
                if (existingUrls == null || !existingUrls.contains(trimmed)) {
                    imageUtil.deleteImage(trimmed);
                }
            }
        }
        

        // 2. 새 이미지 업로드
        if (notice.getNewImages() != null) {
            for (MultipartFile file : notice.getNewImages()) {
                if (!file.isEmpty()) {
                    String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    File dest = new File(uploadDir + "/" + fileName);
                    file.transferTo(dest);
                    String imageUrl = accessUrl + "/" + fileName;
                    finalUrls.add(imageUrl);
                }
            }
        }

        // 이미지가 하나라도 있을 때만 저장
        if (!finalUrls.isEmpty()) {
            notice.setImageUrl(String.join(",", finalUrls));
        } else {
            notice.setImageUrl(null);
        }
        
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok().build();
    }

    // 고객센터 홈에서 불러올 공지사항
    @GetMapping("/latest")
    public ResponseEntity<List<NoticeVo>> getLatestNotices() {
        List<NoticeVo> latestNotices = noticeService.getLatestNotices(5); // 예 : 최근 5개
        return ResponseEntity.ok(latestNotices);
    }

}
