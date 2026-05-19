package com.diasec.diasec_backend.controller;

import java.util.List;
import java.util.Map;

import org.apache.catalina.connector.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.service.AuthorService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.AuthorVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/author")
public class AuthorController {
    
    private final AuthorService authorService;
    private final ImageUtil imageUtil;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) // consumes : 받을 수 있는 콘텐트 타입 제한
    public ResponseEntity<?> registerAuthor(
        @ModelAttribute AuthorVo vo,
        @RequestPart("profileImg") MultipartFile profileImg
    ) {
        try {
            if (profileImg == null || profileImg.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "이미지 파일이 비어 있습니다."));
            }

            // 이전 이미지가 있는지 확인
            Map<String,Object> avo = authorService.selectById(vo.getMemberId()); // 유저의 id?
            System.out.println("avo.id = " + String.valueOf(avo.get("id")));
            String beforeImage = String.valueOf(avo.get("author_profile_image"));

            if (beforeImage.length() != 0) {
                System.out.println("이전에 이미지가 있습니다. 삭제하겠습니다.");
                imageUtil.deleteImage(beforeImage);
            }

            // 업로드
            String imageUrl = imageUtil.saveImage(profileImg, "author");

            // 트랜잭션 처리
            authorService.registerAuthor(vo, imageUrl);

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 목록 (status, keyword 필터)
    @GetMapping("/authors")
    public List<Map<String, Object>> list(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String keyword
    ) {
        if ("ALL".equalsIgnoreCase(status)) status = null;
        return authorService.selectAuthors(status, keyword);
    }

    // 심사중인 사람의 수
    @GetMapping("/pending-count")
    public int getPendingAuthorCount() {
        System.out.println("authorService.countPendingAuthors() ::: " + authorService.countPendingAuthors());
        return authorService.countPendingAuthors();
    }

    // 심사중
    @PostMapping("/noUnderReview")
    public ResponseEntity<?> noUnderReview(@RequestBody Map<String, String> body) {
        try {
            authorService.noUnderReview(body.get("id"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 심사중
    @PostMapping("/underReview")
    public ResponseEntity<?> underReview(@RequestBody Map<String, String> body) {
        try {
            authorService.underReview(body.get("id"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 승인
    @PostMapping("/approve")
    public ResponseEntity<?> approve(@RequestBody Map<String, String> body) {
        try { 
        
            // 승인
            System.out.println("승인 : " + body.get("author_profile_image"));
            authorService.approve(body.get("id"), body.get("author_name"), body.get("author_profile_image"));

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 반려
    @PostMapping("/reject")
    public ResponseEntity<?> reject(@RequestBody Map<String, String> body) {
        try {
            authorService.reject(body.get("id"), body.get("note"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(@RequestParam String memberId) {
        Map<String, Object> row = authorService.selectById(memberId);
        if (row == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(row);
    }

    // 작가 마이페이지 프로필 수정
    @GetMapping("/profile")
    public ResponseEntity<?> getAuthorProfile(@RequestParam String memberId) {
        Map<String, Object> row = authorService.getAuthorProfile(memberId);
        System.out.println("row : "+row);
        if (row == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(row);
    }

    // 프로필 부분 업데이트 (입력값만 수정)
    @PostMapping(value= "/profile/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateAuthorProfile(
        @RequestParam String memberId,
        @RequestParam(required = false) String nickname, // 수정할 닉네임
        @RequestParam(required = false) String authorName, // 이전 닉네임
        @RequestParam(required = false) String authorIntro,
        @RequestParam(required = false) MultipartFile author_profile_image
    ) {
        try {
            String imageUrl = null;

            // 만약 이미지가 수정에 포함된다면
            if (author_profile_image != null && !author_profile_image.isEmpty()) {

                // 기존 이미지 삭제 로직
                Map<String, Object> currentProfile = authorService.getAuthorProfile(memberId);
                String currentImageUrl = (String) currentProfile.get("author_profile_image");

                if (currentImageUrl != null && !currentImageUrl.isBlank()) {
                    imageUtil.deleteImage(currentImageUrl);
                }

                // 새 이미지 저장
                imageUrl = imageUtil.saveImage(author_profile_image, "author");
            }

            // 만약 닉네임이 수정에 포함된다면
            if (nickname != null && nickname.length() != 0) {
                // 라벨과 멤버 아이디가 같으면 라벨을 수정해라
            }

            authorService.updateAuthorProfile(memberId, nickname, authorName, authorIntro, imageUrl);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 작품 목록 (상태 + 페이징)
    @GetMapping("/images")
    public ResponseEntity<?> listImages(
        @RequestParam String memberId,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "12") int size        
    ) {
        Map<String, Object> result = authorService.listAuthorImages(memberId, status, page, size);
        return ResponseEntity.ok(result);
    }

    // 작품 업로드 (status=PENDING 기본)
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
        @RequestParam String memberId,
        @RequestParam(required = false) String title,
        @RequestParam MultipartFile file
    ) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "파일이 비어 있습니다."));
            }
            String imageUrl = imageUtil.saveImage(file, "author");
            authorService.insertAuthorImage(memberId, title, imageUrl);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping(value = "/images/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateImage (@RequestParam Long imgId, @RequestParam(required = false) String title, @RequestParam(required = false) MultipartFile file) {
        
        try {
            // 1) 기존 정보 조회
            Map<String, Object> row = authorService.findAuthorImage(imgId);
            if (row == null) return ResponseEntity.notFound().build();

            String oldUrl = (String) row.get("image_url");
            String newUrl = null;

            // 2) 파일이 올라왔다면 기존 파일 삭제 후 새로 저장
            if (file != null && !file.isEmpty()) {
                if (oldUrl != null && !oldUrl.isBlank()) {
                    imageUtil.deleteImage(oldUrl);
                }
                newUrl = imageUtil.saveImage(file, "author");
            }

            // 3) 제목/이미지 URL 업데이트
            authorService.updateAuthorImage(imgId, title, newUrl);

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/images/{imgId}")
    public ResponseEntity<?> deleteImage(@PathVariable Long imgId) {
        try {
            // 1) 기존 정보 조회
            Map<String, Object> row = authorService.findAuthorImage(imgId);
            if (row == null) return ResponseEntity.notFound().build();

            // 2) 실제 파일 삭제
            String url = (String) row.get("image_url");
            if (url != null && !url.isBlank()) {
                imageUtil.deleteImage(url);
            }

            // 3) DB 삭제
            authorService.deleteAuthorImage(imgId);

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 작품 심사중
    @PostMapping("/images/{imgId}/pending")
    public ResponseEntity<?> noneWork(@PathVariable Long imgId) {
        try {
            authorService.updateAuthorImageStatus(imgId, "PENDING", null);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 작품 승인
    @PostMapping("/images/{imgId}/approve")
    public ResponseEntity<?> approveWork(@PathVariable Long imgId) {
        try {
            authorService.updateAuthorImageStatus(imgId, "APPROVED", null);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 작품 반려
    @PostMapping("/images/{imgId}/reject")
    public ResponseEntity<?> rejectWork(@PathVariable Long imgId, @RequestBody Map<String, String> body) {
        try {
            String note = body.getOrDefault("note", "");
            authorService.updateAuthorImageStatus(imgId, "REJECTED", note);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 작가의 정산 목록 가져오기
    @GetMapping("/settlements")
    public List<Map<String, Object>> getAuthorSettlements(@RequestParam String author) {
        return authorService.selectSettlementList(author);
    }

    // 정산처리
    @PostMapping("/settle")
    public ResponseEntity<?> settleOrderItem(@RequestBody Map<String, Long> payload) {
        Long itemId = payload.get("itemId");
        authorService.settleOrderItem(itemId);
        return ResponseEntity.ok().body(Map.of("message", "정산 완료"));
    }

    // 정산 취소
    @PostMapping("/settle/cancel")
    public ResponseEntity<?> cancelSettlement(@RequestBody Map<String, Long> request) {
        try {
            Long itemId = request.get("itemId");
            authorService.cancelSettlement(itemId);
            return ResponseEntity.ok("정산이 취소되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("정산 취소 실패: " + e.getMessage());
        }
    } 
}
