package com.prm.common.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    /**
     * Upload an image file to a designated folder on the cloud storage provider.
     *
     * @param file   the image MultipartFile
     * @param folder destination folder on storage (e.g., "channels/avatars", "channels/covers")
     * @return secure HTTPS URL of the uploaded image
     */
    String uploadImage(MultipartFile file, String folder);

    /**
     * Check whether cloud storage credentials (Cloudinary) are properly configured.
     */
    boolean isConfigured();

    /**
     * Upload raw video bytes to a designated folder on Cloudinary.
     *
     * @param videoBytes raw video file bytes
     * @param folder     destination folder on storage (e.g., "whiteboard/videos")
     * @param publicId   optional custom public ID
     * @return secure HTTPS URL of the uploaded video
     */
    String uploadVideo(byte[] videoBytes, String folder, String publicId);

    /**
     * Delete an asset by its public ID or filename.
     *
     * @param publicId asset identifier
     */
    void deleteFile(String publicId);

    /**
     * Inject Cloudinary delivery transformations (f_auto,q_auto) into an existing raw video URL.
     * Should only be called after the video has been fully processed and published.
     *
     * @param rawUrl the original secure_url returned by Cloudinary upload
     * @return optimized URL with f_auto,q_auto transformations applied, or rawUrl if injection is not possible
     */
    String buildOptimizedVideoUrl(String rawUrl);

    /**
     * Upload deliverable document, archive, or code file (PDF, ZIP, DOCX, etc.) to storage.
     *
     * @param file   the deliverable MultipartFile
     * @param folder destination folder on storage
     * @return secure HTTPS URL or file path of the uploaded file
     */
    String uploadRawFile(MultipartFile file, String folder);
}
