-- ==============================================================================
-- V20__add_contract_platform_fee_fields.sql
-- Thêm các trường hoa hồng nền tảng cấp Hợp đồng (Contract-level platform fee)
-- ==============================================================================

ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5, 2) DEFAULT 5.0,
    ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15, 2) DEFAULT 0;

-- Đồng bộ dữ liệu cũ (nếu có)
UPDATE contracts
SET platform_fee_percent = 5.0,
    platform_fee = ROUND(COALESCE(total_amount, 0) * 0.05, 2),
    net_amount = COALESCE(total_amount, 0) - ROUND(COALESCE(total_amount, 0) * 0.05, 2)
WHERE total_amount IS NOT NULL;
