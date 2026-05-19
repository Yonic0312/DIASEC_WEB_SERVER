package com.diasec.diasec_backend.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.diasec.diasec_backend.dao.ProductMapper;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.ProductVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductMapper productMapper;
    private final ImageUtil imageUtil;

    public void insertProduct(ProductVo product) {
        productMapper.insertProduct(product);
    }

    // 메인 상품 리스트에 이미지 가져오기
    public List<ProductVo> getProductsByCategory(String category) {
        return productMapper.selectProductsWithThumbnailByCategory(category);
    }

    // 메인 상품 리스트에 이미지 가져오기
    public List<ProductVo> getProductsByCategoryPaged(String category, int size, int offset) {
        return productMapper.selectProductsWithThumbnailByCategoryPaged(category, size, offset);
    }

    // 메인 상품 리스트 라벨 필터용
    public List<ProductVo> selectProductsByCategoryAndAuthor(String category, String author) {
        return productMapper.selectProductsByCategoryAndAuthor(category, author);
    }

    // 메인 상품 리스트 라벨 필터용
    public List<ProductVo> selectProductsByCategoryAndAuthorPaged(String category, String author, int size, int offset) {
        return productMapper.selectProductsByCategoryAndAuthorPaged(category, author, size, offset);
    }

    // 메인 BEST 상품 가져오기
    public List<ProductVo> getBestProducts (String category) {
        return productMapper.getBestProducts(category);
    }

    // 메인 New 상품 가져오기
    public List<ProductVo> getNewProducts (String category) {
        return productMapper.getNewProducts(category);
    }

    // 상품 상세 페이지 상단 이미지들 가져오기
    public List<String> selectTopImagesByPid(int pid) {
        return productMapper.selectTopImagesByPid(pid);
    }

    public ProductVo getProductById(int pid) {
        return productMapper.getProductById(pid);
    }

    // 상단 이미지 등록
    public void insertProductTopImage(int pid, String url, int order) {
        productMapper.insertTopImage(pid, url, order);
    }

    // 상세정보 하단 이미지 등록
    public void insertProductDetailImage(int pid, String url, int order) {
        productMapper.insertDetailImage(pid, url, order);
    }

    // 상품 하단 상세정보 이미지 가져오기
    public List<String> selectImageUrlsByPid(int pid) {
        return productMapper.selectImageUrlsByPid(pid);
    }

    // 상품 정보 수정
    public void updateProduct(ProductVo vo) {
        productMapper.updateProduct(vo);
    }

    public void updateProductAuthor(ProductVo vo) {
        productMapper.updateProductAuthor(vo);
    }

    // 상품 삭제
    @Transactional
    public void deleteProduct(int pid) {
        // 1️⃣ 상품에 연결된 이미지 URL 모두 조회
        List<String> topUrls = productMapper.selectTopImagesByPid(pid);
        List<String> detailUrls = productMapper.selectImageUrlsByPid(pid);

        // 2️⃣ 실제 파일 삭제
        for (String url : topUrls) {
            imageUtil.deleteImage(url);
        }
        for (String url : detailUrls) {
            imageUtil.deleteImage(url);
        }

        // 3️⃣ 이미지 DB 데이터 삭제
        productMapper.deleteAllTopImagesByPid(pid);
        productMapper.deleteAllDetailImagesByPid(pid);

        // 4️⃣ 상품 자체 삭제
        productMapper.deleteProduct(pid);
    }

    // 상품 URL 주소 삭제
    public void deleteProductImageByUrl(int pid, String url, boolean isTop) {
        if (isTop) {
            productMapper.deleteTopImageByUrl(pid, url);
        } else {
            productMapper.deleteDetailImageByUrl(pid, url);
        }
    }

    // 이미지 순서 업데이트
    public void updateImageOrder(int pid, String url, int order, boolean isTop) {
        if (isTop) {
            productMapper.updateTopImageOrder(pid, url, order);
        } else {
            productMapper.updateDetailImageOrder(pid, url, order);
        }
    }

    // 상품 판매량 없데이트
    public void updateProductSales(Long pid) {
        productMapper.updateProductSales(pid);
    }

    // 컬렉션 목록 조회
    public List<Map<String, Object>> getCollections() {
        return productMapper.selectCollections();
    }

    // 특정 컬렉션의 아이템 목록 조회
    public List<String> getCollectionItems(@Param("collectionId") int collectionId) {
        return productMapper.selectCollectionItemsByCollectionId(collectionId);
    };

    // 상품 개수 가져오기
    public int countProductsByCategoryAndAuthor(String category, String author) {
        return productMapper.countProductByCategoryAndAuthor(category, author, null);
    }

    public int countProductsByCategoryAndAuthor(String category, String author, String titleKeyword) {
        String kw = titleKeyword;
        if (kw != null) {
            kw = kw.trim();
            if (kw.isEmpty()) {
                kw = null;
            }
        }
        return productMapper.countProductByCategoryAndAuthor(category, author, kw);
    }

    public Map<String, List<ProductVo>> searchAllByTitle(String q) {

        Map<String, List<ProductVo>> result = new LinkedHashMap<>();
        result.put("masterPiece", productMapper.searchByCategoryAndTitle("masterPiece", q));
        result.put("koreanPainting", productMapper.searchByCategoryAndTitle("koreanPainting", q));
        result.put("photoIllustration", productMapper.searchByCategoryAndTitle("photoIllustration", q));
        result.put("fengShui", productMapper.searchByCategoryAndTitle("fengShui", q));

        return result;
    }
}
