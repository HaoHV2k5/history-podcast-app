package com.prm.common.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final Cloudinary cloudinary;
    private final boolean isConfigured;
    private final String rootFolder;

    public FileStorageServiceImpl(
            @Value("${app.cloudinary.cloud-name:}") String cloudName,
            @Value("${app.cloudinary.api-key:}") String apiKey,
            @Value("${app.cloudinary.api-secret:}") String apiSecret,
            @Value("${app.cloudinary.root-folder:history-podcast}") String rootFolder
    ) {
        this.rootFolder = rootFolder;
        if (StringUtils.hasText(cloudName) && StringUtils.hasText(apiKey) && StringUtils.hasText(apiSecret)) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
            this.isConfigured = true;
            log.info("File storage service initialized successfully. Root folder: '{}'", rootFolder);
        } else {
            this.cloudinary = null;
            this.isConfigured = false;
            log.warn("Cloudinary credentials are not configured. Please supply CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
        }
    }

    @Override
    public String uploadImage(MultipartFile file, String folder) {
        validateImageFile(file);

        if (!isConfigured) {
            throw new AppException(
                    ErrorCode.FILE_UPLOAD_FAILED,
                    "Hệ thống lưu trữ ảnh chưa được cấu hình khóa API (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
            );
        }

        // Build target folder path under project root folder
        String targetFolder = buildTargetFolder(folder);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", targetFolder,
                            "resource_type", "image"
                    )
            );

            String secureUrl = (String) uploadResult.get("secure_url");
            if (!StringUtils.hasText(secureUrl)) {
                throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Không nhận được URL từ dịch vụ lưu trữ");
            }

            log.info("Uploaded image successfully to path '{}': {}", targetFolder, secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("Failed to upload image to cloud storage", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Lỗi khi truyền dữ liệu ảnh lên dịch vụ lưu trữ: " + e.getMessage());
        }
    }

    @Override
    public boolean isConfigured() {
        return isConfigured;
    }

    @Override
    public String uploadVideo(byte[] videoBytes, String folder, String publicId) {
        if (!isConfigured) {
            throw new AppException(
                    ErrorCode.FILE_UPLOAD_FAILED,
                    "Hệ thống lưu trữ ảnh/video chưa được cấu hình khóa API (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
            );
        }

        if (videoBytes == null || videoBytes.length == 0) {
            throw new AppException(ErrorCode.FILE_EMPTY, "Dữ liệu video kết xuất bị rỗng");
        }

        String targetFolder = buildTargetFolder(folder);
        try {
            Map<String, Object> params = new java.util.HashMap<>();
            params.put("folder", targetFolder);
            params.put("resource_type", "video");
            params.put("overwrite", true);
            if (StringUtils.hasText(publicId)) {
                params.put("public_id", publicId);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(videoBytes, params);

            String secureUrl = (String) uploadResult.get("secure_url");
            if (!StringUtils.hasText(secureUrl)) {
                throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Không nhận được URL video từ dịch vụ Cloudinary");
            }

            // Giữ nguyên secure_url gốc của Cloudinary để video phát đúng 100% thời lượng (tránh on-the-fly transcode làm cụt video)
            log.info("Uploaded video successfully to Cloudinary path '{}': {}", targetFolder, secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("Failed to upload video to Cloudinary", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Lỗi khi truyền dữ liệu video lên Cloudinary: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String publicId) {
        if (!isConfigured || !StringUtils.hasText(publicId)) {
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted cloud storage asset: {}", publicId);
        } catch (IOException e) {
            log.warn("Failed to delete asset from cloud storage: {}", publicId, e);
        }
    }

    @Override
    public String buildOptimizedVideoUrl(String rawUrl) {
        if (!StringUtils.hasText(rawUrl) || !rawUrl.contains("cloudinary.com")) {
            return rawUrl;
        }
        // Cloudinary raw URL pattern: .../upload/<public-id-path>
        // Optimized URL pattern:      .../upload/f_auto,q_auto/<public-id-path>
        String uploadMarker = "/upload/";
        int idx = rawUrl.indexOf(uploadMarker);
        if (idx == -1) {
            return rawUrl;
        }
        String prefix = rawUrl.substring(0, idx + uploadMarker.length());
        String suffix = rawUrl.substring(idx + uploadMarker.length());
        // Avoid double-injecting if already optimized
        if (suffix.startsWith("f_auto") || suffix.startsWith("q_auto")) {
            return rawUrl;
        }
        String optimized = prefix + "f_auto,q_auto/" + suffix;
        log.debug("Built optimized video URL: {}", optimized);
        return optimized;
    }

    private String buildTargetFolder(String subFolder) {
        if (!StringUtils.hasText(rootFolder)) {
            return StringUtils.hasText(subFolder) ? subFolder : "";
        }
        String cleanRoot = rootFolder.replaceAll("/+$", "");
        if (!StringUtils.hasText(subFolder)) {
            return cleanRoot;
        }
        String cleanSub = subFolder.replaceAll("^/+", "").replaceAll("/+$", "");
        return cleanRoot + "/" + cleanSub;
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY, "Tệp tải lên không được để trống");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE, "Dung lượng tệp không được vượt quá 10MB");
        }

        String contentType = file.getContentType();
        boolean validContentType = contentType != null && ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase());

        // Fallback: check original filename extension if content type was generic or octet-stream
        if (!validContentType && StringUtils.hasText(file.getOriginalFilename())) {
            String lowerName = file.getOriginalFilename().toLowerCase();
            validContentType = lowerName.endsWith(".png") || lowerName.endsWith(".jpg")
                    || lowerName.endsWith(".jpeg") || lowerName.endsWith(".webp");
        }

        if (!validContentType) {
            throw new AppException(
                    ErrorCode.FILE_INVALID_FORMAT,
                    "Định dạng tệp không hợp lệ. Chỉ chấp nhận các định dạng ảnh: JPG, JPEG, PNG, WEBP"
            );
        }
    }

    @Override
    public String uploadRawFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY, "Tệp sản phẩm không được để trống");
        }
        if (file.getSize() > 25 * 1024 * 1024) { // 25MB
            throw new AppException(ErrorCode.FILE_TOO_LARGE, "Dung lượng tệp không được vượt quá 25MB");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "deliverable.bin";
        String safeFileName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        java.nio.file.Path localDir = java.nio.file.Paths.get("uploads", "deliverables");
        java.nio.file.Path localBackupPath = null;
        try {
            java.nio.file.Files.createDirectories(localDir);
            localBackupPath = localDir.resolve(System.currentTimeMillis() + "_" + safeFileName);
            java.nio.file.Files.write(localBackupPath, file.getBytes());
        } catch (Exception ex) {
            log.warn("Could not write local deliverable cache for {}: {}", originalFilename, ex.getMessage());
        }

        if (!isConfigured) {
            log.warn("Cloudinary not configured, using local deliverable path for file {}", originalFilename);
            return localBackupPath != null ? localBackupPath.toAbsolutePath().toString() : ("uploads/deliverables/" + safeFileName);
        }

        String targetFolder = buildTargetFolder(folder);
        String lowerName = originalFilename.toLowerCase();
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        boolean isDocumentOrArchive = lowerName.endsWith(".pdf") || lowerName.endsWith(".doc") || lowerName.endsWith(".docx")
                || lowerName.endsWith(".zip") || lowerName.endsWith(".rar") || lowerName.endsWith(".txt")
                || contentType.contains("pdf") || contentType.contains("msword")
                || contentType.contains("officedocument") || contentType.contains("zip");

        try {
            Map<String, Object> params = new java.util.HashMap<>();
            params.put("folder", targetFolder);
            // Dùng resource_type = "raw" cho PDF/DOCX/ZIP để tránh chính sách chặn tải PDF qua nhánh image của Cloudinary
            params.put("resource_type", isDocumentOrArchive ? "raw" : "auto");
            params.put("use_filename", true);
            params.put("unique_filename", true);

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = (String) uploadResult.get("secure_url");
            if (!StringUtils.hasText(secureUrl)) {
                throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Không nhận được URL từ dịch vụ lưu trữ");
            }

            // Lưu thêm bản cache theo tên basename của secureUrl để khi stream qua /view hoặc /download đọc trực tiếp cực nhanh
            try {
                String urlBaseName = secureUrl.substring(secureUrl.lastIndexOf('/') + 1);
                String cleanBaseName = urlBaseName.replaceAll("[^a-zA-Z0-9._-]", "_");
                if (!cleanBaseName.isBlank()) {
                    java.nio.file.Files.write(localDir.resolve(cleanBaseName), file.getBytes());
                }
            } catch (Exception ignore) {
            }

            log.info("Uploaded deliverable file '{}' (resource_type={}) to Cloudinary path '{}': {}",
                    originalFilename, isDocumentOrArchive ? "raw" : "auto", targetFolder, secureUrl);
            return secureUrl;
        } catch (IOException e) {
            if (localBackupPath != null && java.nio.file.Files.exists(localBackupPath)) {
                log.warn("Cloudinary upload failed, falling back to local file path: {}", localBackupPath);
                return localBackupPath.toAbsolutePath().toString();
            }
            log.error("Failed to upload deliverable file to cloud storage", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Lỗi khi truyền dữ liệu tệp sản phẩm: " + e.getMessage());
        }
    }
}
