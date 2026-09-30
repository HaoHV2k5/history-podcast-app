-- ==============================================================================
-- V6__seed_demo_creator_account.sql
-- Seed default demo Creator account (creator@example.com / Creator@123)
-- ==============================================================================

DO $$
DECLARE
    creator_role_id BIGINT;
BEGIN
    SELECT id INTO creator_role_id FROM roles WHERE name = 'CREATOR' LIMIT 1;

    IF creator_role_id IS NOT NULL THEN
        -- Insert if not exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'creator@example.com') THEN
            INSERT INTO users (email, password_hash, phone, status, role_id, created_at)
            VALUES (
                'creator@example.com',
                '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y',
                '0987654321',
                'ACTIVE',
                creator_role_id,
                CURRENT_TIMESTAMP
            );
        ELSE
            -- Ensure role and password are set to CREATOR / Creator@123
            UPDATE users
            SET role_id = creator_role_id,
                password_hash = '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y',
                status = 'ACTIVE'
            WHERE email = 'creator@example.com';
        END IF;
    END IF;
END $$;
