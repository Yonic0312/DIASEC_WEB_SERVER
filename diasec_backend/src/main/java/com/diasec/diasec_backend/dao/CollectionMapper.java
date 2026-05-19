package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.CollectionItemVo;
import com.diasec.diasec_backend.vo.CollectionVo;

@Mapper
public interface CollectionMapper {
    List<CollectionVo> getAllCollections();
    void insertCollection(CollectionVo vo);
    void updateCollection(CollectionVo vo);
    void updateCollectionItems(CollectionItemVo vo);
    void updateCollectionItemsByProfile(CollectionItemVo vo); // 작가 프로필 이미지 동시 업데이트
    void updateCollectionItemsEditLabel(CollectionItemVo vo); // 작가 프로필 변경시 컬렉션명 수정

    void deleteCollection(int id);
    void deleteItemsByCollectionId(int collectionId);

    List<CollectionItemVo> getItemsByCollectionId(int collectionId);
    List<CollectionItemVo> getAllItems();
    List<CollectionItemVo> getAllItemsPaged(String type, int size, int offset);
    void insertItem(CollectionItemVo vo);
    void deleteItem(int id);

    CollectionItemVo selectItemById(int id);

    List<CollectionItemVo> selectLabelWithCount(String type, int size, int offset);
    
    CollectionVo selectCollectionById(@Param("id") int id);
}
