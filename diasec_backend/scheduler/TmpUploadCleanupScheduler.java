package com.diasec.diasec_backend.scheduler;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TmpUploadCleanupScheduler {
    private static final Logger log = LoggerFactory.getLogger(TmpUploadCleanupScheduler.class);

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${uploads.tmp.customframes.ttl-hours:24}")
    private long ttlHours;

    @Scheduled(cron = "${uploads.tmp.cleanup.cron:0 0 * * * *}")
    public void cleanupCustomFramesTmp() {
        Path dir = Paths.get(uploadDir, "tmp", "customFrames");
        if (!Files.exists(dir)) return;

        Instant cutoff = Instant.now().minus(Duration.ofHours(ttlHours));

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path p : stream) {
                try {
                    if (!Files.isRegularFile(p)) continue;

                    BasicFileAttributes attr = Files.readAttributes(p, BasicFileAttributes.class);
                    Instant lastModified = attr.lastModifiedTime().toInstant();

                    if (lastModified.isBefore(cutoff)) {
                        Files.deleteIfExists(p);
                    }
                } catch (Exception e) {
                    log.warn("tmp cleanup skip failed file={}", p, e);
                }
            }
        } catch (IOException e) {
            log.warn("tmp cleanup failed dir={}", dir, e);
        }
    }
}