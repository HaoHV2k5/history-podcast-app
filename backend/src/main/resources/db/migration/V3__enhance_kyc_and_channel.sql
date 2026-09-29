-- ==============================================================================
-- V3__enhance_kyc_and_channel.sql
-- Enhance KYC Profiles with creator details & enforce Channel constraints
-- ==============================================================================

-- 1. Enhance kyc_profiles table
ALTER TABLE kyc_profiles
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255),
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20) DEFAULT 'EMAIL',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 2. Enhance channels table with updated_at and widen media URL columns
ALTER TABLE channels
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE channels
    ALTER COLUMN avatar_url TYPE VARCHAR(1000),
    ALTER COLUMN cover_url TYPE VARCHAR(1000);

-- 3. Enforce Unique Constraints on channels
-- Each creator is allowed to create at most ONE channel
CREATE UNIQUE INDEX IF NOT EXISTS uq_channels_creator_id ON channels(creator_id);

-- Channel names must be unique case-insensitively
CREATE UNIQUE INDEX IF NOT EXISTS uq_channels_name_lower ON channels(LOWER(name));
