-- ==============================================================================
-- V25__reverse_commission_flow_and_update_policy.sql
-- 1. Upgrade hire_requests table for Listener-to-Creator Custom Content Commission
-- 2. Update booking_escrow_configs (MAX_MILESTONES = 20, role descriptions, dynamic terms)
-- 3. Seed unified platform policy configs in system_configs (10% Membership, 2-day Withdrawal SLA)
-- Safe & Idempotent for Supabase Production Database (ddl-auto: validate)
-- ==============================================================================

-- 1. Add new columns to hire_requests (Nullable first to protect existing rows on Supabase)
ALTER TABLE hire_requests
    ADD COLUMN IF NOT EXISTS channel_id BIGINT REFERENCES channels(id),
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'SINGLE_VIDEO',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Close legacy pre-V25 non-terminal hire_requests (where title IS NULL before backfill)
-- so old Narrator-hire rows do not falsely lock users under the 1 Active Commission Rule
UPDATE hire_requests
SET status = 'CANCELLED',
    rejection_reason = COALESCE(rejection_reason, 'Đóng tự động yêu cầu luồng cũ khi nâng cấp hệ thống Đặt làm nội dung theo Kênh (V25)'),
    updated_at = CURRENT_TIMESTAMP
WHERE title IS NULL
  AND UPPER(COALESCE(status, '')) IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'SIGNED', 'DRAFT');

-- Backfill channel_id from creator's channel for existing rows
UPDATE hire_requests hr
SET channel_id = c.id
FROM channels c
WHERE hr.creator_id = c.creator_id
  AND hr.channel_id IS NULL;

-- Backfill existing rows on Supabase so no NULL values break business logic
UPDATE hire_requests
SET content_type = 'SINGLE_VIDEO'
WHERE content_type IS NULL OR BTRIM(content_type) = '' OR UPPER(BTRIM(content_type)) NOT IN ('SINGLE_VIDEO', 'SERIES');

UPDATE hire_requests
SET title = LEFT(COALESCE(NULLIF(BTRIM(description), ''), 'Yêu cầu đặt làm nội dung theo chủ đề'), 120)
WHERE title IS NULL OR BTRIM(title) = '';

UPDATE hire_requests
SET status = 'CANCELLED'
WHERE status IS NULL OR BTRIM(status) = '' OR UPPER(BTRIM(status)) NOT IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CONTRACT_SENT', 'COMPLETED', 'CANCELLED');

UPDATE hire_requests
SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hire_requests_narrator_status
    ON hire_requests(narrator_id, status);

CREATE INDEX IF NOT EXISTS idx_hire_requests_creator_status
    ON hire_requests(creator_id, status);

-- 1b. Sanitize legacy enum values on contracts and milestones (prevents Hibernate EnumType.STRING HTTP 500 on Supabase)
-- Backfill creator_id and freelancer_id on legacy V1 contracts from hire_requests if missing
UPDATE contracts c
SET creator_id = COALESCE(c.creator_id, hr.creator_id),
    freelancer_id = COALESCE(c.freelancer_id, hr.narrator_id)
FROM hire_requests hr
WHERE c.hire_request_id = hr.id
  AND (c.creator_id IS NULL OR c.freelancer_id IS NULL);

UPDATE contracts
SET service_type = CASE
    WHEN service_type IN ('VOICE', 'VOICE_OVER') THEN 'VOICE'
    ELSE 'CONTENT'
END
WHERE service_type IS NULL OR service_type NOT IN ('CONTENT', 'VOICE');

UPDATE contracts
SET status = CASE
    WHEN status IN ('IN_PROGRESS', 'SIGNED') THEN 'ACTIVE'
    WHEN status = 'DRAFT' THEN 'PENDING'
    ELSE 'CANCELLED'
END
WHERE status IS NULL OR status NOT IN ('PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- Drop invalid default 'UNFUNDED' on milestones.escrow_status (added in V17) since EscrowStatus only allows HELD/RELEASED/REFUNDED/FROZEN
ALTER TABLE milestones
    ALTER COLUMN escrow_status DROP DEFAULT;

UPDATE milestones
SET status = CASE
    WHEN status = 'COMPLETED' THEN 'RELEASED'
    WHEN status = 'PENDING' THEN 'WAITING'
    ELSE 'CANCELLED'
END
WHERE status IS NULL OR status NOT IN ('WAITING', 'UNFUNDED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'RELEASED', 'DISPUTED', 'CANCELLED');

UPDATE milestones
SET escrow_status = CASE
    WHEN escrow_status = 'FUNDED' THEN 'HELD'
    WHEN escrow_status = 'UNFUNDED' THEN NULL
    ELSE NULL
END
WHERE escrow_status IS NOT NULL AND escrow_status NOT IN ('HELD', 'RELEASED', 'REFUNDED', 'FROZEN');

-- Finalize legacy Post-based contracts (created under old Freelancer flow where Buyer/Seller roles were inverted)
-- so they do not falsely block users under the 1 Active Commission Rule or trigger inverted wallet settlements
UPDATE milestones m
SET status = CASE
        WHEN m.escrow_status = 'HELD' THEN 'RELEASED'
        ELSE 'CANCELLED'
    END,
    escrow_status = CASE
        WHEN m.escrow_status = 'HELD' THEN 'RELEASED'
        ELSE m.escrow_status
    END,
    released_at = CASE
        WHEN m.escrow_status = 'HELD' THEN COALESCE(m.released_at, CURRENT_TIMESTAMP)
        ELSE m.released_at
    END,
    updated_at = CURRENT_TIMESTAMP
FROM contracts c
WHERE m.contract_id = c.id
  AND c.hire_request_id IS NULL
  AND m.status NOT IN ('RELEASED', 'CANCELLED');

UPDATE contracts c
SET status = CASE
        WHEN EXISTS (SELECT 1 FROM milestones m WHERE m.contract_id = c.id AND m.status = 'RELEASED') THEN 'COMPLETED'
        ELSE 'CANCELLED'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE c.hire_request_id IS NULL
  AND c.status IN ('PENDING', 'ACTIVE');

-- 1c. Drop legacy foreign key columns and unused legacy tables (V1/V13/V14) from Supabase schema
ALTER TABLE contracts
    DROP COLUMN IF EXISTS post_id CASCADE;

ALTER TABLE milestone_deliverables
    DROP COLUMN IF EXISTS post_id CASCADE;

DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS freelancer_profiles CASCADE;
DROP TABLE IF EXISTS narrator_demos CASCADE;
DROP TABLE IF EXISTS narrator_profiles CASCADE;
DROP TABLE IF EXISTS deliverables CASCADE;
DROP TABLE IF EXISTS escrow_transactions CASCADE;

-- 2. Update booking_escrow_configs for Listener-to-Creator Commission & Series support (up to 20 milestones)
UPDATE booking_escrow_configs
SET config_value = '20',
    description = 'Số giai đoạn (Milestone) tối đa trong 1 hợp đồng đặt làm nội dung (1 - 20 mốc, hỗ trợ cả Video lẻ và Series nhiều tập)',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'MAX_MILESTONES' AND config_value = '5';

UPDATE booking_escrow_configs
SET description = 'Thời hạn Người đặt hàng xem xét và phản hồi bảng báo giá Milestone của Creator (giờ)',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'CONTRACT_ACCEPT_HOURS';

UPDATE booking_escrow_configs
SET description = 'Thời hạn Người đặt hàng nạp tiền ký quỹ (Escrow) cho từng Milestone sau khi mở khóa (giờ)',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'FUND_HOURS';

UPDATE booking_escrow_configs
SET description = 'Thời gian ân hạn tối đa chờ Người đặt hàng nạp tiền cho các Milestone tiếp theo trước khi hủy hợp đồng (ngày)',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'FUND_PAUSE_MAX_DAYS';

UPDATE booking_escrow_configs
SET description = 'Thời hạn Người đặt hàng nghiệm thu sản phẩm sau khi Creator nộp bài; quá hạn hệ thống tự động duyệt (ngày)',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'REVIEW_DAYS';

UPDATE booking_escrow_configs
SET description = 'Thời gian giữ tiền an toàn sau khi nghiệm thu trước khi giải ngân 95% về ví Creator (ngày)',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'RELEASE_HOLD_DAYS';

UPDATE booking_escrow_configs
SET description = 'Thời gian cộng thêm cho Creator hoàn thành mỗi lần chỉnh sửa sản phẩm theo yêu cầu của khách (ngày)',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'REVISION_DAYS';

UPDATE booking_escrow_configs
SET description = 'Số lần tối đa Người đặt hàng được yêu cầu Creator chỉnh sửa trên mỗi Milestone',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'MAX_REVISIONS_DEFAULT';

UPDATE booking_escrow_configs
SET description = 'Tỉ lệ phí dịch vụ nền tảng khấu trừ khi giải ngân hợp đồng đặt làm nội dung (%, mặc định 5% sàn - 95% Creator)',
    updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'PLATFORM_FEE_PERCENT';

-- Remove static legacy TERMS_TEMPLATE from DB so dynamic template interpolation is always up to date
DELETE FROM booking_escrow_configs
WHERE config_key = 'TERMS_TEMPLATE';

-- 3. Seed unified platform configs into system_configs (Idempotent without requiring UNIQUE constraint on key)
UPDATE system_configs
SET value = '10.0', updated_at = CURRENT_TIMESTAMP
WHERE key = 'MEMBERSHIP_FEE_PERCENT';

INSERT INTO system_configs (key, value, updated_at)
SELECT 'MEMBERSHIP_FEE_PERCENT', '10.0', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'MEMBERSHIP_FEE_PERCENT');

UPDATE system_configs
SET value = '30', updated_at = CURRENT_TIMESTAMP
WHERE key = 'MEMBERSHIP_DURATION_DAYS';

INSERT INTO system_configs (key, value, updated_at)
SELECT 'MEMBERSHIP_DURATION_DAYS', '30', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'MEMBERSHIP_DURATION_DAYS');

UPDATE system_configs
SET value = '2', updated_at = CURRENT_TIMESTAMP
WHERE key = 'WITHDRAWAL_SLA_DAYS';

INSERT INTO system_configs (key, value, updated_at)
SELECT 'WITHDRAWAL_SLA_DAYS', '2', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'WITHDRAWAL_SLA_DAYS');

UPDATE system_configs
SET value = '50000', updated_at = CURRENT_TIMESTAMP
WHERE key = 'WITHDRAWAL_MIN_AMOUNT';

INSERT INTO system_configs (key, value, updated_at)
SELECT 'WITHDRAWAL_MIN_AMOUNT', '50000', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'WITHDRAWAL_MIN_AMOUNT');

UPDATE system_configs
SET value = '10000', updated_at = CURRENT_TIMESTAMP
WHERE key = 'DEPOSIT_MIN_AMOUNT';

INSERT INTO system_configs (key, value, updated_at)
SELECT 'DEPOSIT_MIN_AMOUNT', '10000', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE key = 'DEPOSIT_MIN_AMOUNT');
