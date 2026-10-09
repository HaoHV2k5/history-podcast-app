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
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
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
        if (!isConfigured) {
            log.warn("Cloudinary not configured, returning simulated deliverable URL for file {}", file.getOriginalFilename());
            return "https://storage.local/deliverables/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        }

        String targetFolder = buildTargetFolder(folder);
        try {
            Map<String, Object> params = new java.util.HashMap<>();
            params.put("folder", targetFolder);
            params.put("resource_type", "auto");
            params.put("use_filename", true);
            params.put("unique_filename", true);

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = (String) uploadResult.get("secure_url");
            if (!StringUtils.hasText(secureUrl)) {
                throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Không nhận được URL từ dịch vụ lưu trữ");
            }
            log.info("Uploaded raw deliverable file '{}' to Cloudinary path '{}': {}", file.getOriginalFilename(), targetFolder, secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("Failed to upload deliverable file to cloud storage", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Lỗi khi truyền dữ liệu tệp sản phẩm: " + e.getMessage());
        }
    }
}
