-- Migration: Chuyển dữ liệu ký quỹ từ bảng escrow_payments sang các trường trực tiếp trên bảng milestones

-- 1. Thêm các trường lưu trữ thông tin ký quỹ & hoa hồng vào bảng milestones
ALTER TABLE milestones
    ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(50) DEFAULT 'UNFUNDED',
    ADD COLUMN IF NOT EXISTS funded_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS released_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- 2. Đồng bộ dữ liệu cũ từ bảng escrow_payments sang milestones (nếu có)
UPDATE milestones m
SET 
    platform_fee = COALESCE(ep.platform_fee, 0),
    net_amount = COALESCE(ep.net_amount, 0),
    escrow_status = COALESCE(ep.status, 'UNFUNDED'),
    funded_at = ep.funded_at,
    released_at = ep.released_at,
    refunded_at = ep.refunded_at
FROM escrow_payments ep
WHERE m.id = ep.milestone_id;

-- 3. Xóa bảng escrow_payments
DROP TABLE IF EXISTS escrow_payments CASCADE;
