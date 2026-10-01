-- ==============================================================================
-- V10__seed_demo_admin_account.sql
-- Seed default demo Administrator account (admin@historypodcast.com / Admin@123)
-- ==============================================================================

DO $$
DECLARE
    admin_role_id BIGINT;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN' LIMIT 1;

    IF admin_role_id IS NOT NULL THEN
        -- Insert if not exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@historypodcast.com') THEN
            INSERT INTO users (email, password_hash, phone, status, role_id, created_at)
            VALUES (
                'admin@historypodcast.com',
                '$2b$12$Tm899ADavYqvDvtu9keFcuzXW.cEqNUGHXJF/4SQSnfeU.YWFZ8mi',
                '0900000001',
                'ACTIVE',
                admin_role_id,
                CURRENT_TIMESTAMP
            );
        ELSE
            -- Ensure role and password are set to ADMIN / Admin@123
            UPDATE users
            SET role_id = admin_role_id,
                password_hash = '$2b$12$Tm899ADavYqvDvtu9keFcuzXW.cEqNUGHXJF/4SQSnfeU.YWFZ8mi',
                status = 'ACTIVE'
            WHERE email = 'admin@historypodcast.com';
        END IF;
    END IF;
END $$;
