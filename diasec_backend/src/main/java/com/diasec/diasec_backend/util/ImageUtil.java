package com.diasec.diasec_backend.util;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class ImageUtil {

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    public String saveImage(MultipartFile file, String subDir) throws IOException {
    // 파일 이름 유효성 확인
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IOException("파일 이름이 비어 있습니다.");
        }

        // 파일명 안전하게 처리 (공백 => 언더스코어, 특수문자 제거)
        String safeFilename = originalFilename
            .replaceAll(" ", "_")
            .replaceAll("[^a-zA-Z0-9가-힣._-]","");
        
        // UUID 추가
        String finalFilename = UUID.randomUUID() + "_" + safeFilename;

        // 서브 디렉토리 포함 저장 경로
        File folder = new File(uploadDir + "/" + subDir);
        if (!folder.exists()) folder.mkdirs();

        // 저장 경로 구성
        File saveFile = new File(folder, finalFilename);
        file.transferTo(saveFile);

        // 접근 가능한 URL 반환
        return accessUrl + "/" + subDir + "/" + finalFilename;
    }

    // base64 전용 메서드 ( png 이미지 / 맞춤 액자 )
    public String saveBase64Image(String base64Data, String extension, String subDir) throws IOException {
        // 파일명 생성
        String finalFilename = UUID.randomUUID() + "." + extension;

        // 폴더 경로 준비
        File folder = new File(uploadDir + "/" + subDir);
        if (!folder.exists()) folder.mkdirs();

        // 저장 경로 구성
        File saveFile = new File(folder, finalFilename);

        base64Data = base64Data.replaceAll("\\s", "");

        // base -> byte[]
        byte[] imageBytes = Base64.getDecoder().decode(base64Data);
        try (OutputStream os = new FileOutputStream(saveFile)) {
            os.write(imageBytes);
        }

        // 접근 가능한 URL 반환
        return accessUrl + "/" + subDir + "/" + finalFilename;
    }

    public String saveMultipartFile(MultipartFile file, String extension, String folder) throws IOException {
        String fileName = UUID.randomUUID() + "." + extension;
        Path savePath = Paths.get(uploadDir, folder, fileName);
        Files.createDirectories(savePath.getParent());
        file.transferTo(savePath.toFile());
        return "/uploads/" + folder + "/" + fileName;
    }

    // 실제 이미지 삭제
    public void deleteImage(String url) {
        try {
            // URL에서 실제 파일 경로 추출
            String relativePath = url.replace(accessUrl, "");
            String fullPath = uploadDir + relativePath;

            File file = new File(fullPath);
            if (file.exists()) {
                file.delete();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 맞춤액자 이미지 임시 생성 -> 영구 저장 이동
    public String commitTmpCustomFrameUrl(String tmpUrl) throws IOException {
        if (tmpUrl == null || tmpUrl.isBlank()) return null;

        // 이미 final이면 그대로
        if (tmpUrl.contains("/uploads/customFrames/")) return tmpUrl;

        // tmp URL만 허용
        String tmpPrefix = accessUrl + "/tmp/customFrames/";
        if (!tmpUrl.startsWith(tmpPrefix)) {
            return tmpUrl;
        }

        String filename = tmpUrl.substring(tmpPrefix.length());
        Path src = Paths.get(uploadDir, "tmp", "customFrames", filename);
        Path dstDir = Paths.get(uploadDir, "customFrames");
        Files.createDirectories(dstDir);
        Path dst = dstDir.resolve(filename);

        // move (같은 디스크면 빠름). 이미 있으면 덮어씀(정책 선택)
        Files.move(src, dst, StandardCopyOption.REPLACE_EXISTING);

        return accessUrl + "/customFrames/" + filename;
    }
}
