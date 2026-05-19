package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import com.diasec.diasec_backend.vo.WishlistVo;

@Mapper
public interface WishlistMapper {

    void insertWishlist(WishlistVo wishlistVo);

    List<WishlistVo> getWishlistByUserId(String id);

    void deleteByWid (List<Integer> widList);

    void deleteByUserId (String id);

    int existsWishlist(WishlistVo vo);
}
