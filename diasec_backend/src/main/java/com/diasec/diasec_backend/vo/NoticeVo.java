package com.diasec.diasec_backend.vo;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class NoticeVo {
    private Long noticeId;
    private String title;
    private String content;
    private Boolean pinned;
    private String createdAt;
    private String imageUrl;

    // 이미지 파일들
    private List<MultipartFile> newImages;
    private List<String> existingUrls;
}
