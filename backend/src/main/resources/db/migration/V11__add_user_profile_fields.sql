-- ==============================================================================
-- V11__add_user_profile_fields.sql
-- Add user profile attributes (full_name, avatar_url, bio, updated_at) to users table
-- ==============================================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Seed default display name for initial accounts if present
UPDATE users SET full_name = 'Demo Administrator' WHERE email = 'admin@historypodcast.com' AND full_name IS NULL;
UPDATE users SET full_name = 'Demo Creator' WHERE email = 'creator@example.com' AND full_name IS NULL;
