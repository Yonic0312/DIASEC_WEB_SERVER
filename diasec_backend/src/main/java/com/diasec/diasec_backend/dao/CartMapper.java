package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.CartVo;

@Mapper
public interface CartMapper {
    void insertCartItems(@Param("list") List<CartVo> cartList);

    List<CartVo> getCartByUserId(String id);

    void updateQuantity(CartVo cartvo);

    void deleteItemByCid(int cid);

    void deleteCartItems(String id, List<Integer> pidList);

    // 카트 전부 삭제 (회원탈퇴시 사용)
    void deleteCartItemsById(String id);
}
