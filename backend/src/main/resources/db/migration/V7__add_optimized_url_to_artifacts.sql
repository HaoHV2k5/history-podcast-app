-- V7: Add optimized_url column to artifacts table
-- optimized_url = Cloudinary URL với f_auto,q_auto (dùng khi video đã PUBLISHED)
-- file_url     = Raw Cloudinary URL gốc (dùng khi video còn DRAFT/COMPLETED, để preview ngay sau render)
ALTER TABLE artifacts
    ADD COLUMN IF NOT EXISTS optimized_url VARCHAR(512);
