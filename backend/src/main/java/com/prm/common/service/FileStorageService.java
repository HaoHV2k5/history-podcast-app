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
     * Delete an asset by its public ID or filename.
     *
     * @param publicId asset identifier
     */
    void deleteFile(String publicId);
}
