-- ==============================================================================
-- V21__add_milestone_revision_days.sql
-- Thêm trường revision_days cho bảng milestones (số ngày hoàn thành mỗi lần chỉnh sửa)
-- ==============================================================================

ALTER TABLE milestones
    ADD COLUMN IF NOT EXISTS revision_days INT NOT NULL DEFAULT 2;
