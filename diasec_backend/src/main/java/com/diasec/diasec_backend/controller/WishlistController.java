package com.diasec.diasec_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.WishlistService;
import com.diasec.diasec_backend.vo.WishlistVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;
    
    // @PostMapping("/add")
    // public ResponseEntity<?> insertWishlist(@RequestBody WishlistVo vo) {
    //     wishlistService.insertWishlist(vo);
    //     return ResponseEntity.ok("관심상품에 추가되었습니다.");
    // }

    @GetMapping("/list")
    public List<WishlistVo> getwishlist(@RequestParam String id) {
        return wishlistService.getWishlistByUserId(id);
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteSelected(@RequestBody List<Integer> widList) {
        wishlistService.deleteByWid(widList);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/delete/all")
    public ResponseEntity<?> deleteAll(@RequestParam String id) {
        wishlistService.deleteAllByUserId(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/add-if-not-exists")
    public ResponseEntity<?> addIfNotExists(@RequestBody WishlistVo vo) {
        boolean added = wishlistService.addIfNotExists(vo);

        if (added) {
            return ResponseEntity.ok().body("관심상품에 추가되었습니다.");
        } else {
            return ResponseEntity.status(409).body("이미 관심상품에 등록된 상품입니다.");
        }
    }
}
