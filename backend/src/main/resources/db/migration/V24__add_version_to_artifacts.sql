-- V24: Thêm trường version vào bảng artifacts để quản lý lịch sử phiên bản video sau mỗi lần vá kịch bản
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
UPDATE artifacts SET version = 1 WHERE version IS NULL;
CREATE INDEX IF NOT EXISTS idx_artifacts_content_version ON artifacts(content_id, version);
CREATE INDEX IF NOT EXISTS idx_artifacts_content_status ON artifacts(content_id, status);
