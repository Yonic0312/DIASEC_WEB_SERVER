package com.diasec.diasec_backend.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.service.EventService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.EventVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/event")
public class EventController {
    
    
    private final EventService eventService;

    private final ImageUtil imageUtil;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    @GetMapping("")
    public List<EventVo> getEventsByStatus(@RequestParam String status) {
        return eventService.getEventsByStatus(status);
    }

    @GetMapping("/{id}")
    public EventVo getEventById(@PathVariable int id) {
        return eventService.getEventById(id);
    }

    @PostMapping("/insert")
    public void insertEvent(
        @RequestPart EventVo event, 
        @RequestPart("thumbnail") MultipartFile thumbnail,
        @RequestPart("detail") MultipartFile detail
    ) throws IOException {
        String thumbUrl = imageUtil.saveImage(thumbnail, "event");
        String detailUrl = imageUtil.saveImage(detail, "event");

        event.setThumbnailUrl(thumbUrl);
        event.setDetailImageUrl(detailUrl);
        eventService.insertEvent(event);
    }

    @PostMapping("/update")
    public void updateEvent(
        @RequestPart("event") EventVo event,
        @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
        @RequestPart(value = "detail", required = false) MultipartFile detail
        ) throws IOException {

        // 기존 이벤트 정보 가져오기
        EventVo existingEvent = eventService.getEventById(event.getEventId());

        // 썸네일 변경이 있으면 기존 이미지 삭제 후 새로 저장
        if (thumbnail != null && !thumbnail.isEmpty()) {
            imageUtil.deleteImage(existingEvent.getThumbnailUrl()); // 기존 이미지 삭제
            String newThumbUrl = imageUtil.saveImage(thumbnail, "event");
            event.setThumbnailUrl(newThumbUrl);
        } else {
            event.setThumbnailUrl(existingEvent.getThumbnailUrl()); // 기존 이미지 유지
        }

        // 상세 이미지 변경이 있으면 기존 이미지 삭제 후 새로 저장
        if (detail != null && !detail.isEmpty()) {
            imageUtil.deleteImage(existingEvent.getDetailImageUrl());
            String newDetailUrl = imageUtil.saveImage(detail, "event");
            event.setDetailImageUrl(newDetailUrl);
        } else {
            event.setDetailImageUrl(existingEvent.getDetailImageUrl());
        }

        eventService.updateEvent(event);

    }

    @DeleteMapping("/delete/{id}")
    public void deleteEvent(@PathVariable("id") int eventId) {
        EventVo existingEvent = eventService.getEventById(eventId);

        imageUtil.deleteImage(existingEvent.getThumbnailUrl());
        imageUtil.deleteImage(existingEvent.getDetailImageUrl());
        eventService.deleteEvent(eventId);
    }
}