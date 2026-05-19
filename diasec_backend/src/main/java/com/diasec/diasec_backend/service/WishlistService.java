package com.diasec.diasec_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.WishlistMapper;
import com.diasec.diasec_backend.vo.WishlistVo;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistMapper wishlistMapper;

    // public void insertWishlist(WishlistVo wishlistVo) {
    //     wishlistMapper.insertWishlist(wishlistVo);
    // }

    public List<WishlistVo> getWishlistByUserId (String id) {
        return wishlistMapper.getWishlistByUserId(id);
    }

    public void deleteByWid(List<Integer> widList) {
        wishlistMapper.deleteByWid(widList);
    }

    public void deleteAllByUserId(String id) {
        wishlistMapper.deleteByUserId(id);
    }

    @Transactional
    public boolean addIfNotExists(WishlistVo vo) {
        int exists = wishlistMapper.existsWishlist(vo);
        if (exists > 0) return false;

        wishlistMapper.insertWishlist(vo);
        return true;
    }
}
