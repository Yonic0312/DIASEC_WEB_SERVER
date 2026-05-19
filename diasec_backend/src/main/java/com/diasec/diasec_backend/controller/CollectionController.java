package com.diasec.diasec_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.dao.CollectionMapper;
import com.diasec.diasec_backend.service.CollectionService;
import com.diasec.diasec_backend.service.ProductService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.CollectionItemVo;
import com.diasec.diasec_backend.vo.CollectionVo;
import com.diasec.diasec_backend.vo.ProductVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionService service;
    private final ImageUtil imageUtil;
    private final ProductService productService;
    private final CollectionMapper collectionMapper;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    @GetMapping
    public List<CollectionVo> getCollections() {
        return service.getAllCollections();
    }

    // 메인 상단 미니 컬렉션
    @GetMapping("/labels")
    public List<CollectionItemVo> labels(
        @RequestParam String type,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "0") int offset
    ) {
        return service.getLabelsWithCount(type, size, offset);
    }

    @PostMapping("/add")
    public ResponseEntity<?> insertCollection(@RequestBody CollectionVo vo) {
        service.insertCollection(vo);
        return ResponseEntity.ok().build();
    }

    // 컬렉션 삭제
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteCollection(@RequestParam int id) {
        // 컬렉션에 속한 아이템 조회
        List<CollectionItemVo> items = collectionMapper.getItemsByCollectionId(id);

        // 각 아이템의 이미지 삭제
        for (CollectionItemVo item : items) {
            if (item.getImageUrl() != null && item.getImageUrl().contains("/uploads/CollectionLabel")) {
                imageUtil.deleteImage(item.getImageUrl());
            }
        }

        // 아이템 테이블에서 해당 컬렉션 아이템들 삭제
        collectionMapper.deleteItemsByCollectionId(id);

        service.deleteCollection(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/items")
    public List<CollectionItemVo> getItems(@RequestParam int collectionId) {
        return service.getItemsByCollectionId(collectionId);
    }

    // @GetMapping("/allItems")
    // public List<CollectionItemVo> getAllItems() {
    //     return service.getAllItems();
    // }

    // 헤더 드롭다운 무한스크롤
    @GetMapping("/allItems/paged")
    public List<CollectionItemVo> getAllItemsPaged(
        @RequestParam(required = false) String type,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "0") int offset
    ) {
        return service.getAllItemsPaged(type, size, offset);
    }

    @PostMapping("/items/add")
    public ResponseEntity<?> insertItem(@RequestBody CollectionItemVo vo) {
        service.insertItem(vo);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/items/delete")
    public ResponseEntity<?> deleteItem(@RequestParam int id) {
        boolean deleted = service.deleteItem(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateCollection(@RequestBody CollectionVo vo) {
        service.updateCollection(vo);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/update/items")
    public ResponseEntity<?> updateCollectionItems(@RequestBody CollectionItemVo vo) {
        CollectionItemVo existing = service.getItemById(vo.getId());
        
        // 라벨명이 변경되었을 경우 product.author 업데이트
        if (existing != null && !existing.getLabel().equals(vo.getLabel())) {
            ProductVo pvo = new ProductVo();
            pvo.setOldName(vo.getOldLabel());
            pvo.setAuthor(vo.getLabel());
            productService.updateProductAuthor(pvo);
        }

        // 이미지 URL이 변경되었을 경우 기존 이미지 삭제
        if (existing != null && 
            existing.getImageUrl() != null &&
            vo.getImageUrl() != null &&
            !existing.getImageUrl().trim().equals(vo.getImageUrl().trim()) &&
            existing.getImageUrl().contains("/uploads/CollectionLabel")) {
                imageUtil.deleteImage(existing.getImageUrl());
            }
            
        service.updateCollectionItems(vo);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/uploadImage")
    public ResponseEntity<String> uploadCollectionImage(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "existingUrl", required = false) String existingUrl) {

        try {
            // 기존 이미지가 존재하면 삭제
            if (existingUrl != null && !existingUrl.trim().isEmpty()) {
                imageUtil.deleteImage(existingUrl);
            }
            
            // 새 이미지 저장
            String url = imageUtil.saveImage(file, "CollectionLabel");
            return ResponseEntity.ok(url);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("이미지 업로드 실패");
        }
    }
}
