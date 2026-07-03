package com.diasec.diasec_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.CartService;
import com.diasec.diasec_backend.vo.CartVo;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    @PostMapping("/insert")
    public ResponseEntity<?> insertCartItems(@RequestBody List<CartVo> cartList) {
        cartService.insertCartItems(cartList);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/list")
    public List<CartVo> getCart(@RequestParam String id) {
        return cartService.getCartByUserId(id);
    }
    
    @PutMapping("/update")
    public ResponseEntity<?> updateQuantity(@RequestBody CartVo cartVo) {
        cartService.updateQuantity(cartVo);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteCartItem(@RequestParam int cid) {
        cartService.deleteItemByCid(cid);
        return ResponseEntity.ok("삭제 완료");
    }
}
