package com.diasec.diasec_backend.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.ProductVo;

@Mapper
public interface ProductMapper {
    void insertProduct(ProductVo product);

    List<ProductVo> selectByCategory(@Param("category") String category);

    // 메인 상품 리스트에 이미지 가져오기
    List<ProductVo> selectProductsWithThumbnailByCategory(
        @Param("category") String category
    );

    // 메인 상품 리스트에 이미지 가져오기
    List<ProductVo> selectProductsWithThumbnailByCategoryPaged(
        @Param("category") String category,
        @Param("size") int size,
        @Param("offset") int offset
    );

    // 메인 상품 리스트 라벨 필터용
    List<ProductVo> selectProductsByCategoryAndAuthor(
        @Param("category") String category, 
        @Param("author") String author
    );

    // 메인 상품 리스트 라벨 필터용
    List<ProductVo> selectProductsByCategoryAndAuthorPaged(
        @Param("category") String category, 
        @Param("author") String author,
        @Param("size") int size,
        @Param("offset") int offset
    );

    // 메인 BEST 상품 가져오기
    List<ProductVo> getBestProducts(@Param("category") String category);

    // 메인 New 상품 가져오기
    List<ProductVo> getNewProducts(@Param("category") String category);

    // 상품 상세 페이지 상단 이미지들 가져오기
    List<String> selectTopImagesByPid(@Param("pid") int pid);

    ProductVo getProductById (int pid);

    // 상단 이미지 삽입
    void insertTopImage(@Param("pid") int pid, @Param("imageUrl") String imageUrl, @Param("imgOrder") int imgOrder);

    // 하단 상세 이미지 삽입
    void insertDetailImage(@Param("pid") int pid, @Param("imageUrl") String imageUrl, @Param("imgOrder") int imgOrder);

    // 상품 하단 상세정보 이미지 가져오기
    List<String> selectImageUrlsByPid(@Param("pid") int pid);

    // 상품 정보 수정
    void updateProduct(ProductVo vo);

    // 작가명 수정
    void updateProductAuthor(ProductVo vo);

    // 상품 삭제
    void deleteProduct(int pid);

    void deleteTopImageByUrl(int pid, String url);
        
    void deleteDetailImageByUrl(int pid, String url);

    void deleteAllTopImagesByPid(@Param("pid") int pid);
    void deleteAllDetailImagesByPid(@Param("pid") int pid);

    // 이미지 순서 업데이트
    void updateTopImageOrder(int pid, String url, int order);

    void updateDetailImageOrder(int pid, String url, int order);

    // 상품 판매량 업데이트
    void updateProductSales(Long pid);
    
    // 컬렉션 목록 조회
    List<Map<String, Object>> selectCollections();

    // 특정 컬렉션의 아이템 목록 조회
    List<String> selectCollectionItemsByCollectionId(@Param("collectionId") int collectionId);

    // 상품 개수 가져오기 (titleKeyword 생략 시 기존과 동일)
    int countProductByCategoryAndAuthor(
        @Param("category") String category,
        @Param("author") String author,
        @Param("titleKeyword") String titleKeyword
    );

    void updateProductsByLabel(
        @Param("newCategory") String newCategory, 
        @Param("oldLabel") String oldLabel
    );

    // 검색창에 가져오기
    List<ProductVo> searchByCategoryAndTitle(
        @Param("category") String category,
        @Param("q") String q
    );
}
