package com.diasec.diasec_backend.service;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.CartMapper;
import com.diasec.diasec_backend.vo.CartVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartMapper cartMapper;

    public void insertCartItems(@Param("list") List<CartVo> cartList) {
        cartMapper.insertCartItems(cartList);
    }

    public List<CartVo> getCartByUserId(String id) {
        return cartMapper.getCartByUserId(id);
    }

    public void updateQuantity(CartVo cartVo) {
        cartMapper.updateQuantity(cartVo);
    }

    // 단일 삭제
    public void deleteItemByCid(int cid) {
        cartMapper.deleteItemByCid(cid);
    }
    
    // 복수 삭제
    public void deleteCartItems(@Param("id") String id, @Param("pidList") List<Integer> pidList) {
        cartMapper.deleteCartItems(id, pidList);
    }
}
