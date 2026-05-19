package com.diasec.diasec_backend.controller;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;

import com.diasec.diasec_backend.service.ProductService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.ProductVo;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/product")
public class ProductController {
    
    private final ProductService productService;
    private final ImageUtil imageUtil;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    @PostMapping("/insert")
    public ResponseEntity<?> insertProduct(
        @RequestParam("title") String title,
        // @RequestParam("price") int price,
        @RequestParam("category") String category,
        @RequestParam("author") String author,
        @RequestParam("sort_order") int sort_order,
        @RequestPart(value="topImages", required=false) List<MultipartFile> topImages,
        @RequestPart(value="detailImages", required=false) List<MultipartFile> detailImages
    ) {
        try {
            ProductVo product = new ProductVo();
            product.setTitle(title);
            // product.setPrice(price);
            product.setCategory(category);
            product.setAuthor(author);
            product.setSortOrder(sort_order);
            productService.insertProduct(product);

            int pid = product.getPid();

            // 상품 상단 이미지 저장
            if (topImages != null) {
                int order = 1;
                for (MultipartFile img : topImages) {
                    String url = imageUtil.saveImage(img, "MainImage");
                    System.out.println("상단 이미지 저장: " + url);
                    productService.insertProductTopImage(pid, url, order++);
                }
            }

            // 상세정보 하단 이미지 저장
            if (detailImages != null) {
                int order = 1;
                for (MultipartFile img : detailImages) {
                    String url = imageUtil.saveImage(img, "DetailImage");
                    productService.insertProductDetailImage(pid, url, order++);
                }
            }

            return ResponseEntity.ok("상품 등록 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("상품 등록 실패: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<ProductVo>> getProductList(
            @RequestParam(value = "category", required = false) String category

    ) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
    }

    @GetMapping("/list/paged")
    public ResponseEntity<List<ProductVo>> getProductListPaged(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "offset", defaultValue = "0") int offset

    ) {
        return ResponseEntity.ok(productService.getProductsByCategoryPaged(category, size, offset));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<ProductVo>> getFilteredProducts(
            @RequestParam(required = false) String category, 
            @RequestParam(required = false) String author
        ) {
            return ResponseEntity.ok(productService.selectProductsByCategoryAndAuthor(category, author));
    }

    @GetMapping("/filter/paged")
    public ResponseEntity<List<ProductVo>> getFilteredProductsPaged(
            @RequestParam(required = false) String category, 
            @RequestParam(required = false) String author,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "offset", defaultValue = "0") int offset
        ) {
            return ResponseEntity.ok(productService.selectProductsByCategoryAndAuthorPaged(category, author, size, offset));
    }

    @GetMapping("/best")
    public ResponseEntity<List<ProductVo>> getBestProducts(@RequestParam String category) {
        return ResponseEntity.ok(productService.getBestProducts(category));
    }

    @GetMapping("/new")
    public ResponseEntity<List<ProductVo>> getNewProducts(@RequestParam String category) {
        return ResponseEntity.ok(productService.getNewProducts(category));
    }

    @GetMapping("/detail")
    public ResponseEntity<ProductVo> getProductDetail(@RequestParam int pid) {
        ProductVo product = productService.getProductById(pid);
        return ResponseEntity.ok(product);
    }

    // 상단 상품 리스트 가져오기
    @GetMapping("/top-images")
    public ResponseEntity<List<String>> getTopImages(@RequestParam int pid) {
        List<String> urls = productService.selectTopImagesByPid(pid);
        return ResponseEntity.ok(urls);
    }

    // 상품 하단 상세정보 이미지 가져오기
    @GetMapping("/images")
    public ResponseEntity<List<String>> getProductImages(@RequestParam int pid) {
        List<String> imageUrls = productService.selectImageUrlsByPid(pid);
        System.out.println("imageUrls : " + imageUrls);
        return ResponseEntity.ok(imageUrls);
    }

    // 상품 정보 수정
    @PostMapping("/update")
    public ResponseEntity<?> updateProduct(
        @RequestParam("pid") int pid,
        @RequestParam("title") String title,
        @RequestParam("price") int price,
        @RequestParam("category") String category,
        @RequestParam("author") String author,
        @RequestParam(value = "existingTopUrls", required = false) List<String> existingTopUrls,
        @RequestParam(value = "newTopImages", required= false) List<MultipartFile> newTopImages,
        @RequestParam(value = "existingDetailUrls", required = false) List<String> existingDetailUrls,
        @RequestParam(value = "newDetailImages", required = false) List<MultipartFile> newDetailImages,
        @RequestParam("topImageOrders") String topOrderJson,
        @RequestParam("detailImageOrders") String detailOrderJson,
        @RequestParam("sortOrder") int sortOrder,
        @RequestParam("sales") Long sales
    ) {
        try {
            // 1. 상품 메타 정보 업데이트
            ProductVo vo = new ProductVo();
            vo.setPid(pid);
            vo.setTitle(title);
            vo.setPrice(price);
            vo.setCategory(category);
            vo.setAuthor(author);
            vo.setSortOrder(sortOrder);
            vo.setSales((sales));
            productService.updateProduct(vo);

            // +) Null 방지용 안전한 리스트로 변환
            List<String> safeTopUrls = (existingTopUrls == null ? List.of() :
                existingTopUrls.stream().filter(s -> s != null && !s.trim().isEmpty()).collect(Collectors.toList()));
            List<String> safeDetailUrls = (existingDetailUrls == null ? List.of() :
                existingDetailUrls.stream().filter(s -> s != null && !s.trim().isEmpty()).collect(Collectors.toList()));

            // 2. 기존 이미지 목록 불러오기 (DB)
            List<String> dbTopUrls = productService.selectTopImagesByPid(pid);
            List<String> dbDetailUrls = productService.selectImageUrlsByPid(pid);

            // 3. 삭제된 이미지 처리 (폴더 + DB)
            for (String url : dbTopUrls) {
                if (!safeTopUrls.contains(url)) {
                    imageUtil.deleteImage(url);
                    productService.deleteProductImageByUrl(pid, url, true);
                }
            }

            for (String url : dbDetailUrls) {
                if (!safeDetailUrls.contains(url)) {
                    imageUtil.deleteImage(url);
                    productService.deleteProductImageByUrl(pid, url, false);
                }
            }

            // 프론트에서 넘긴 순서대로 이미지 정렬 처리
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> topImageList = mapper.readValue(topOrderJson, List.class);
            List<Map<String, Object>> detailImageList = mapper.readValue(detailOrderJson, List.class);

            // 4. 이미지 순서 재정렬
            int topOrder = 1;
            int topNewIndex = 0;

            for (Map<String, Object> item : topImageList) {
                String type = (String) item.get("type");
                if ("existing".equals(type)) {
                    String url = (String) item.get("value");
                    productService.updateImageOrder(pid, url, topOrder++, true);
                } else {
                    if (newTopImages != null && topNewIndex < newTopImages.size()) {
                        MultipartFile img = newTopImages.get(topNewIndex++);
                        String url =imageUtil.saveImage(img, "MainImage");
                        productService.insertProductTopImage(pid, url, topOrder++);
                    }
                }
            }

            int detailOrder = 1;
            int detailNewIndex = 0;
            for (Map<String, Object> item : detailImageList) {
                String type = (String) item.get("type");
                if ("existing".equals(type)) {
                    String url = (String) item.get("value");
                    productService.updateImageOrder(pid, url, detailOrder++, false);
                } else {
                    if (newDetailImages != null && detailNewIndex < newDetailImages.size()) {
                        MultipartFile img = newDetailImages.get(detailNewIndex++);
                        String url = imageUtil.saveImage(img, "DetailImage");
                        productService.insertProductDetailImage(pid, url, detailOrder++);
                    }
                }
            }

            return ResponseEntity.ok("상품 수정 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("상품 수정 실패: " + e.getMessage());
        }
    }

    // 상품 삭제
    @PostMapping("/delete")
    public ResponseEntity<String> deleteProduct(@RequestParam int pid) {
        try {
            productService.deleteProduct(pid);
            return ResponseEntity.ok("삭제 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패: " + e.getMessage());
        }
    }

    @GetMapping("/collections")
    public ResponseEntity<List<Map<String, Object>>> getCollections() {
        return ResponseEntity.ok(productService.getCollections());
    }

    @GetMapping("/collection-items")
    public ResponseEntity<List<String>> getCollectionItems(@RequestParam int collectionId) {
        return ResponseEntity.ok(productService.getCollectionItems(collectionId));
    }

    // 상품 개수 가져오기 (선택: title - 상품명 부분 검색 시 DB 기준 총 개수)
    @GetMapping("/count/author")
    public ResponseEntity<Integer> countByCategoryAndAuthor(
        @RequestParam String category,
        @RequestParam(required = false) String author,
        @RequestParam(required = false) String title
    ) {
        return ResponseEntity.ok(productService.countProductsByCategoryAndAuthor(category, author, title));
    }

    @GetMapping("/search/all")
    public ResponseEntity<Map<String, List<ProductVo>>> searchAll(@RequestParam("q") String q) {
        String keyword = (q == null ? "" : q.trim());
        if (keyword.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "masterPiece", List.of(),
                "koreanPainting", List.of(),
                "photoIllustration", List.of(),
                "fengShui", List.of()
            ));
        }
        return ResponseEntity.ok(productService.searchAllByTitle(keyword));
    }
}
