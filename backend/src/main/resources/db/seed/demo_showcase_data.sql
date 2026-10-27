-- ==============================================================================
-- V23__seed_demo_showcase_data.sql
-- Comprehensive showcase demo data for PRM History Podcast Platform:
-- Multi-Role Users, KYC Profiles, Freelancers, Channels, Plans, Memberships,
-- Wallets, Podcasts/Videos, Transcripts, AI Moderation, Series & Playlists,
-- Booking Posts, Contracts, Milestones, Deliverables, Reviews, Livestreams & Chats.
-- ==============================================================================

DO $$
DECLARE
    role_admin_id BIGINT;
    role_creator_id BIGINT;
    role_freelancer_id BIGINT;
    role_viewer_id BIGINT;

    u_creator1_id BIGINT;
    u_creator2_id BIGINT;
    u_freelancer1_id BIGINT;
    u_freelancer2_id BIGINT;
    u_viewer1_id BIGINT;
    u_viewer2_id BIGINT;
    u_admin_id BIGINT;

    chan1_id BIGINT;
    chan2_id BIGINT;

    plan1_id BIGINT;
    plan2_id BIGINT;

    mem1_id BIGINT;
    mem2_id BIGINT;
    mem3_id BIGINT;

    w_creator1_id BIGINT;
    w_creator2_id BIGINT;
    w_freelancer1_id BIGINT;
    w_freelancer2_id BIGINT;
    w_viewer1_id BIGINT;
    w_viewer2_id BIGINT;

    c6_id BIGINT;
    c7_id BIGINT;
    c8_id BIGINT;
    c9_id BIGINT;
    c10_id BIGINT;
    c11_id BIGINT;
    c12_id BIGINT;

    art6_id BIGINT;
    art7_id BIGINT;
    art8_id BIGINT;
    art9_id BIGINT;
    art10_id BIGINT;
    art11_id BIGINT;
    art12_id BIGINT;

    s1_id BIGINT;
    s2_id BIGINT;
    s3_id BIGINT;

    post1_id BIGINT;
    post2_id BIGINT;
    post3_id BIGINT;

    contract1_id BIGINT;
    m1_id BIGINT;
    m2_id BIGINT;
    m3_id BIGINT;

    live1_id BIGINT;
    live2_id BIGINT;
    live3_id BIGINT;
BEGIN
    -- 1. Fetch Role IDs
    SELECT id INTO role_admin_id FROM roles WHERE name = 'ADMIN' LIMIT 1;
    SELECT id INTO role_creator_id FROM roles WHERE name = 'CREATOR' LIMIT 1;
    SELECT id INTO role_freelancer_id FROM roles WHERE name = 'FREELANCER' LIMIT 1;
    SELECT id INTO role_viewer_id FROM roles WHERE name = 'VIEWER' LIMIT 1;

    -- 2. Update existing demo accounts with realistic metadata
    UPDATE users 
    SET full_name = 'Hoàng Việt Hào (Sử Ký Hào Hùng)',
        avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        bio = 'Nhà nghiên cứu sử học và nhà sáng tạo nội dung văn hóa Đại Việt. Kênh chính thức Sử Ký Hào Hùng.'
    WHERE email = 'creator@example.com';

    UPDATE users 
    SET full_name = 'Ban Quản Trị Hệ Thống',
        avatar_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
    WHERE email = 'admin@historypodcast.com';

    UPDATE users 
    SET full_name = 'Võ Văn An (Voice Talent)',
        avatar_url = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
        bio = 'Voice talent chuyên nghiệp 5 năm kinh nghiệm, giọng trầm ấm hào hùng, chuyên thuyết minh phim tài liệu và podcast lịch sử.'
    WHERE email = 'an_freelance@historypodcast.com';

    UPDATE users 
    SET full_name = 'Phạm Hoàng Long',
        avatar_url = 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
        bio = 'Hội viên yêu thích tìm hiểu dã sử và văn hóa thời kỳ phong kiến Việt Nam.'
    WHERE email = 'viewer@example.com';

    -- Insert additional demo users if not present
    -- Creator 2: huyen_su_viet@historypodcast.com
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'huyen_su_viet@historypodcast.com') THEN
        INSERT INTO users (email, password_hash, phone, status, role_id, full_name, avatar_url, bio, created_at)
        VALUES (
            'huyen_su_viet@historypodcast.com',
            '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y',
            '0912345678',
            'ACTIVE',
            role_creator_id,
            'Nguyễn Hải Đăng (Huyền Sử Việt)',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
            'Tác giả chuỗi bài viết giải mã thành Cổ Loa, thời kỳ Hùng Vương và các di tích khảo cổ học Đông Sơn.',
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Freelancer 2: minh_writer@historypodcast.com
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'minh_writer@historypodcast.com') THEN
        INSERT INTO users (email, password_hash, phone, status, role_id, full_name, avatar_url, bio, created_at)
        VALUES (
            'minh_writer@historypodcast.com',
            '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y',
            '0933221100',
            'ACTIVE',
            role_freelancer_id,
            'Trần Nhật Minh (Biên Kịch & Whiteboard Artist)',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
            'Biên kịch dã sử, chuyên phục dựng tư liệu lịch sử Việt Nam với AI và dựng video Whiteboard hoạt họa.',
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Viewer 2 (VIP): quoc_viewer@historypodcast.com
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'quoc_viewer@historypodcast.com') THEN
        INSERT INTO users (email, password_hash, phone, status, role_id, full_name, avatar_url, bio, created_at)
        VALUES (
            'quoc_viewer@historypodcast.com',
            '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y',
            '0909988776',
            'ACTIVE',
            role_viewer_id,
            'Lê Anh Quốc (Hội Viên VIP)',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
            'Đam mê lịch sử quân sự Đại Việt và sưu tầm tài liệu cổ sử.',
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Retrieve User IDs
    SELECT id INTO u_creator1_id FROM users WHERE email = 'creator@example.com';
    SELECT id INTO u_creator2_id FROM users WHERE email = 'huyen_su_viet@historypodcast.com';
    SELECT id INTO u_freelancer1_id FROM users WHERE email = 'an_freelance@historypodcast.com';
    SELECT id INTO u_freelancer2_id FROM users WHERE email = 'minh_writer@historypodcast.com';
    SELECT id INTO u_viewer1_id FROM users WHERE email = 'viewer@example.com';
    SELECT id INTO u_viewer2_id FROM users WHERE email = 'quoc_viewer@historypodcast.com';
    SELECT id INTO u_admin_id FROM users WHERE email = 'admin@historypodcast.com';

    -- Sync user_roles table
    INSERT INTO user_roles (user_id, role_id)
    SELECT u_creator2_id, role_creator_id WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u_creator2_id AND role_id = role_creator_id);

    INSERT INTO user_roles (user_id, role_id)
    SELECT u_freelancer2_id, role_freelancer_id WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u_freelancer2_id AND role_id = role_freelancer_id);
    INSERT INTO user_roles (user_id, role_id)
    SELECT u_freelancer2_id, role_viewer_id WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u_freelancer2_id AND role_id = role_viewer_id);

    INSERT INTO user_roles (user_id, role_id)
    SELECT u_viewer2_id, role_viewer_id WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u_viewer2_id AND role_id = role_viewer_id);

    -- 3. KYC Profiles (Approved for Creators & Freelancers)
    IF NOT EXISTS (SELECT 1 FROM kyc_profiles WHERE user_id = u_creator1_id) THEN
        INSERT INTO kyc_profiles (user_id, phone, status, full_name, contact_email, bank_name, bank_account_number, bank_account_holder, bio, verification_method, otp_verified_at, created_at, updated_at)
        VALUES (
            u_creator1_id, '0987654321', 'APPROVED', 'Hoàng Việt Hào', 'creator@example.com',
            'Vietcombank', '9988776655', 'HOANG VIET HAO', 'Nhà sáng tạo nội dung lịch sử chuyên nghiệp',
            'SMS_OTP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM kyc_profiles WHERE user_id = u_creator2_id) THEN
        INSERT INTO kyc_profiles (user_id, phone, status, full_name, contact_email, bank_name, bank_account_number, bank_account_holder, bio, verification_method, otp_verified_at, created_at, updated_at)
        VALUES (
            u_creator2_id, '0912345678', 'APPROVED', 'Nguyễn Hải Đăng', 'huyen_su_viet@historypodcast.com',
            'MBBank', '0123456789', 'NGUYEN HAI DANG', 'Nghiên cứu cổ sử và khảo cổ học',
            'SMS_OTP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM kyc_profiles WHERE user_id = u_freelancer1_id) THEN
        INSERT INTO kyc_profiles (user_id, phone, status, full_name, contact_email, bank_name, bank_account_number, bank_account_holder, bio, verification_method, otp_verified_at, created_at, updated_at)
        VALUES (
            u_freelancer1_id, '0901234567', 'APPROVED', 'Võ Văn An', 'an_freelance@historypodcast.com',
            'Techcombank', '1903882711', 'VO VAN AN', 'Voice talent thuyết minh podcast',
            'SMS_OTP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM kyc_profiles WHERE user_id = u_freelancer2_id) THEN
        INSERT INTO kyc_profiles (user_id, phone, status, full_name, contact_email, bank_name, bank_account_number, bank_account_holder, bio, verification_method, otp_verified_at, created_at, updated_at)
        VALUES (
            u_freelancer2_id, '0933221100', 'APPROVED', 'Trần Nhật Minh', 'minh_writer@historypodcast.com',
            'ACB', '8877665544', 'TRAN NHAT MINH', 'Biên kịch & Dựng video hoạt họa',
            'SMS_OTP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

    -- 4. Freelancer Profiles
    UPDATE freelancer_profiles
    SET headline = 'Voice Talent Chuyên Nghiệp | Giọng Đọc Hào Hùng & Truyền Cảm',
        bio = 'Hơn 5 năm kinh nghiệm thu âm sách nói, tài liệu dã sử và lồng tiếng video hoạt họa bảng trắng.',
        skills = 'Voice-over, Thuyết minh lịch sử, Lồng tiếng, Audio Master, Lọc tạp âm',
        service_types = 'VOICE_OVER',
        reference_price = 350000,
        voice_demo_url = 'https://res.cloudinary.com/history-podcast/video/upload/demo_voice_an.mp3',
        status = 'ACTIVE'
    WHERE user_id = u_freelancer1_id;

    IF NOT EXISTS (SELECT 1 FROM freelancer_profiles WHERE user_id = u_freelancer2_id) THEN
        INSERT INTO freelancer_profiles (user_id, headline, bio, skills, service_types, reference_price, portfolio_url, status, created_at, updated_at)
        VALUES (
            u_freelancer2_id,
            'Biên Kịch Lịch Sử & Video Whiteboard Creator',
            'Chuyên nghiên cứu chính sử Đại Việt Sử Ký Toàn Thư, soạn kịch bản video/podcast hấp dẫn và dựng hoạt họa bảng trắng sống động.',
            'Biên kịch dã sử, Whiteboard Animation, Lịch sử Việt Nam, RAG Research, Video Editing',
            'SCRIPT_WRITING,VIDEO_EDITING',
            500000,
            'https://portfolio.historypodcast.com/minh-writer',
            'ACTIVE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 5. Channels
    -- Channel 1 update
    UPDATE channels
    SET name = 'Sử Ký Hào Hùng - Hào Khí Đại Việt',
        description = 'Kênh Podcast & Video Lịch Sử Việt Nam chuyên sâu, tái hiện các triều đại hào hùng Đinh - Lê - Lý - Trần - Hậu Lê với góc nhìn đa chiều và âm thanh chân thực.',
        avatar_url = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400',
        cover_url = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200',
        status = 'ACTIVE'
    WHERE creator_id = u_creator1_id;

    SELECT id INTO chan1_id FROM channels WHERE creator_id = u_creator1_id LIMIT 1;

    -- Channel 2 insert
    IF NOT EXISTS (SELECT 1 FROM channels WHERE creator_id = u_creator2_id) THEN
        INSERT INTO channels (creator_id, name, description, avatar_url, cover_url, status, created_at)
        VALUES (
            u_creator2_id,
            'Huyền Sử Việt & Cổ Loa Ký',
            'Khám phá huyền tích dựng nước thời Hùng Vương - An Dương Vương, truyền thuyết nỏ thần và các di tích thành quách cổ đại.',
            'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
            'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200',
            'ACTIVE',
            CURRENT_TIMESTAMP
        );
    END IF;

    SELECT id INTO chan2_id FROM channels WHERE creator_id = u_creator2_id LIMIT 1;

    -- 6. Channel Membership Plans (1 plan per channel constraint)
    IF NOT EXISTS (SELECT 1 FROM channel_membership_plans WHERE channel_id = chan1_id) THEN
        INSERT INTO channel_membership_plans (channel_id, name, description, monthly_price, perks, status, created_at, updated_at)
        VALUES (
            chan1_id,
            'Gói Hội Viên Hào Khí Đông A',
            'Đặc quyền xem trước podcast/video 48h, tham gia phòng Livestream VIP, nhận kịch bản độc quyền và huy hiệu fan cứng.',
            49000,
            '["EARLY_ACCESS_48H", "VIP_LIVESTREAM_ACCESS", "EXCLUSIVE_BADGE", "LOSSLESS_AUDIO"]'::jsonb,
            'ACTIVE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    SELECT id INTO plan1_id FROM channel_membership_plans WHERE channel_id = chan1_id LIMIT 1;

    IF NOT EXISTS (SELECT 1 FROM channel_membership_plans WHERE channel_id = chan2_id) THEN
        INSERT INTO channel_membership_plans (channel_id, name, description, monthly_price, perks, status, created_at, updated_at)
        VALUES (
            chan2_id,
            'Gói Hội Viên Tri Kỷ Cổ Sử',
            'Nhận bản tin nghiên cứu khảo cổ định kỳ, tham gia Q&A livestream cùng tác giả và tải file audio chất lượng cao.',
            39000,
            '["VIP_LIVESTREAM_ACCESS", "EXCLUSIVE_BADGE", "HD_AUDIO_DOWNLOAD"]'::jsonb,
            'ACTIVE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    SELECT id INTO plan2_id FROM channel_membership_plans WHERE channel_id = chan2_id LIMIT 1;

    -- 7. Memberships & Payments
    IF NOT EXISTS (SELECT 1 FROM memberships WHERE viewer_id = u_viewer1_id AND channel_id = chan1_id) THEN
        INSERT INTO memberships (viewer_id, channel_id, plan_id, status, started_at, ended_at, updated_at)
        VALUES (
            u_viewer1_id, chan1_id, plan1_id, 'ACTIVE',
            CURRENT_TIMESTAMP - INTERVAL '15 days',
            CURRENT_TIMESTAMP + INTERVAL '15 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO mem1_id;

        INSERT INTO membership_payments (membership_id, amount, commission_amount, creator_earning, status, paid_at)
        VALUES (mem1_id, 49000, 4900, 44100, 'PAID', CURRENT_TIMESTAMP - INTERVAL '15 days');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM memberships WHERE viewer_id = u_viewer2_id AND channel_id = chan1_id) THEN
        INSERT INTO memberships (viewer_id, channel_id, plan_id, status, started_at, ended_at, updated_at)
        VALUES (
            u_viewer2_id, chan1_id, plan1_id, 'ACTIVE',
            CURRENT_TIMESTAMP - INTERVAL '10 days',
            CURRENT_TIMESTAMP + INTERVAL '20 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO mem2_id;

        INSERT INTO membership_payments (membership_id, amount, commission_amount, creator_earning, status, paid_at)
        VALUES (mem2_id, 49000, 4900, 44100, 'PAID', CURRENT_TIMESTAMP - INTERVAL '10 days');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM memberships WHERE viewer_id = u_viewer2_id AND channel_id = chan2_id) THEN
        INSERT INTO memberships (viewer_id, channel_id, plan_id, status, started_at, ended_at, updated_at)
        VALUES (
            u_viewer2_id, chan2_id, plan2_id, 'ACTIVE',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP + INTERVAL '25 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO mem3_id;

        INSERT INTO membership_payments (membership_id, amount, commission_amount, creator_earning, status, paid_at)
        VALUES (mem3_id, 39000, 3900, 35100, 'PAID', CURRENT_TIMESTAMP - INTERVAL '5 days');
    END IF;

    -- 8. Wallets & Transactions
    -- Creator 1 Wallet
    IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = u_creator1_id) THEN
        INSERT INTO wallets (user_id, available_balance, pending_balance, currency, updated_at)
        VALUES (u_creator1_id, 3450000, 1000000, 'VND', CURRENT_TIMESTAMP)
        RETURNING id INTO w_creator1_id;
    ELSE
        SELECT id INTO w_creator1_id FROM wallets WHERE user_id = u_creator1_id;
        UPDATE wallets SET available_balance = 3450000, pending_balance = 1000000 WHERE id = w_creator1_id;
    END IF;

    -- Creator 2 Wallet
    IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = u_creator2_id) THEN
        INSERT INTO wallets (user_id, available_balance, pending_balance, currency, updated_at)
        VALUES (u_creator2_id, 1250000, 0, 'VND', CURRENT_TIMESTAMP)
        RETURNING id INTO w_creator2_id;
    ELSE
        SELECT id INTO w_creator2_id FROM wallets WHERE user_id = u_creator2_id;
    END IF;

    -- Freelancer 1 Wallet
    IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = u_freelancer1_id) THEN
        INSERT INTO wallets (user_id, available_balance, pending_balance, currency, updated_at)
        VALUES (u_freelancer1_id, 1425000, 950000, 'VND', CURRENT_TIMESTAMP)
        RETURNING id INTO w_freelancer1_id;
    ELSE
        SELECT id INTO w_freelancer1_id FROM wallets WHERE user_id = u_freelancer1_id;
        UPDATE wallets SET available_balance = 1425000, pending_balance = 950000 WHERE id = w_freelancer1_id;
    END IF;

    -- Freelancer 2 Wallet
    IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = u_freelancer2_id) THEN
        INSERT INTO wallets (user_id, available_balance, pending_balance, currency, updated_at)
        VALUES (u_freelancer2_id, 800000, 0, 'VND', CURRENT_TIMESTAMP)
        RETURNING id INTO w_freelancer2_id;
    ELSE
        SELECT id INTO w_freelancer2_id FROM wallets WHERE user_id = u_freelancer2_id;
    END IF;

    -- Seed sample wallet transactions if empty
    IF NOT EXISTS (SELECT 1 FROM wallet_transactions WHERE wallet_id = w_creator1_id) THEN
        INSERT INTO wallet_transactions (wallet_id, amount, type, status, related_type, merchant_txn_ref, gateway_provider, description, created_at)
        VALUES 
        (w_creator1_id, 5000000, 'DEPOSIT', 'SUCCESS', 'VNPAY', 'VNPTOPUP_20261001_001', 'VNPAY', 'Nạp tiền vào ví qua cổng VNPay Sandbox', CURRENT_TIMESTAMP - INTERVAL '20 days'),
        (w_creator1_id, 88200, 'MEMBERSHIP_PAYMENT', 'SUCCESS', 'MEMBERSHIP', 'MEMPAY_20261010_001', 'INTERNAL', 'Doanh thu từ phí gia nhập hội viên gói Hào Khí Đông A', CURRENT_TIMESTAMP - INTERVAL '10 days'),
        (w_creator1_id, -1500000, 'ESCROW_HOLD', 'SUCCESS', 'CONTRACT', 'ESCROW_HOLD_001', 'INTERNAL', 'Ký quỹ Escrow hợp đồng thu âm podcast Nguyên Mông', CURRENT_TIMESTAMP - INTERVAL '5 days');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM wallet_transactions WHERE wallet_id = w_freelancer1_id) THEN
        INSERT INTO wallet_transactions (wallet_id, amount, type, status, related_type, merchant_txn_ref, gateway_provider, description, created_at)
        VALUES 
        (w_freelancer1_id, 475000, 'ESCROW_RELEASE', 'SUCCESS', 'MILESTONE', 'MILESTONE_REL_001', 'INTERNAL', 'Thanh toán hoàn thành Milestone 1: Thu âm 2 tập đầu kháng chiến 1258', CURRENT_TIMESTAMP - INTERVAL '2 days');
    END IF;

    -- 9. Rich Contents & Artifacts
    -- Content 6: Đại Phá Quân Thanh 1789 (Channel 1)
    IF NOT EXISTS (SELECT 1 FROM contents WHERE channel_id = chan1_id AND title = 'Chiến Dịch Đại Phá Quân Thanh - Mùa Xuân Kỷ Dậu 1789') THEN
        INSERT INTO contents (channel_id, title, text_body, source_type, status, is_exclusive, created_at, updated_at)
        VALUES (
            chan1_id,
            'Chiến Dịch Đại Phá Quân Thanh - Mùa Xuân Kỷ Dậu 1789',
            'Tái hiện hành quân thần tốc của Hoàng đế Quang Trung - Nguyễn Huệ từ Phú Xuân ra Thăng Long, đánh tan 29 vạn quân Mãn Thanh chỉ trong 5 ngày tết Kỷ Dậu.',
            'STUDIO_AI',
            'PUBLISHED',
            FALSE,
            CURRENT_TIMESTAMP - INTERVAL '12 days',
            CURRENT_TIMESTAMP - INTERVAL '12 days'
        ) RETURNING id INTO c6_id;

        INSERT INTO artifacts (content_id, type, file_url, source_type, duration_seconds, status, created_at)
        VALUES (
            c6_id, 'VIDEO_WHITEBOARD',
            'https://res.cloudinary.com/dns0wbaea/video/upload/v1790914502/history-podcast/whiteboard/videos/job_1790914443_0ab648.mp4',
            'WHITEBOARD_RENDERER', 55, 'APPROVED', CURRENT_TIMESTAMP - INTERVAL '12 days'
        ) RETURNING id INTO art6_id;

        INSERT INTO transcripts (artifact_id, text_body, created_at)
        VALUES (art6_id, 'Mùa xuân năm Kỷ Dậu 1789, một trong những chiến công chói lọi nhất trong lịch sử chống ngoại xâm của dân tộc Việt Nam đã diễn ra...', CURRENT_TIMESTAMP - INTERVAL '12 days');

        INSERT INTO ai_filter_logs (artifact_id, result, score, reason, checked_at)
        VALUES (art6_id, 'SAFE', 98.50, 'Nội dung chuẩn xác theo chính sử Khâm Định Việt Sử Thông Giám Cương Mục, hình ảnh hoạt họa phù hợp thuần phong mỹ tục.', CURRENT_TIMESTAMP - INTERVAL '12 days');
    ELSE
        SELECT id INTO c6_id FROM contents WHERE channel_id = chan1_id AND title = 'Chiến Dịch Đại Phá Quân Thanh - Mùa Xuân Kỷ Dậu 1789' LIMIT 1;
    END IF;

    -- Content 7: Hào Khí Đông A Ba Lần Kháng Chiến Chống Nguyên Mông (Channel 1)
    IF NOT EXISTS (SELECT 1 FROM contents WHERE channel_id = chan1_id AND title = 'Hào Khí Đông A: Ba Lần Đại Thắng Quân Nguyên Mông') THEN
        INSERT INTO contents (channel_id, title, text_body, source_type, status, is_exclusive, created_at, updated_at)
        VALUES (
            chan1_id,
            'Hào Khí Đông A: Ba Lần Đại Thắng Quân Nguyên Mông',
            'Nghệ thuật quân sự vườn không nhà trống và tinh thần đoàn kết toàn dân thời nhà Trần, đập tan đế chế bách chiến bách thắng Nguyên Mông.',
            'STUDIO_AI',
            'PUBLISHED',
            FALSE,
            CURRENT_TIMESTAMP - INTERVAL '8 days',
            CURRENT_TIMESTAMP - INTERVAL '8 days'
        ) RETURNING id INTO c7_id;

        INSERT INTO artifacts (content_id, type, file_url, source_type, duration_seconds, status, created_at)
        VALUES (
            c7_id, 'VIDEO_WHITEBOARD',
            'https://res.cloudinary.com/dns0wbaea/video/upload/v1790768620/history-podcast/whiteboard/videos/job_1790767775_8433a2.mp4',
            'AUDIO_STUDIO', 45, 'APPROVED', CURRENT_TIMESTAMP - INTERVAL '8 days'
        ) RETURNING id INTO art7_id;

        INSERT INTO transcripts (artifact_id, text_body, created_at)
        VALUES (art7_id, 'Trong suốt thế kỷ 13, vó ngựa quân Mông Cổ đi đến đâu cỏ không mọc được đến đấy. Nhưng tại Đại Việt, ngọn cờ Đông A đã kiên cường đứng vững...', CURRENT_TIMESTAMP - INTERVAL '8 days');

        INSERT INTO ai_filter_logs (artifact_id, result, score, reason, checked_at)
        VALUES (art7_id, 'SAFE', 97.00, 'Tư liệu đối chiếu Đại Việt Sử Ký Toàn Thư và Nguyên Sử đạt độ tin cậy cao.', CURRENT_TIMESTAMP - INTERVAL '8 days');
    ELSE
        SELECT id INTO c7_id FROM contents WHERE channel_id = chan1_id AND title = 'Hào Khí Đông A: Ba Lần Đại Thắng Quân Nguyên Mông' LIMIT 1;
    END IF;

    -- Content 8: Bí Mật Cọc Gỗ Bạch Đằng (VIP Exclusive - Channel 1)
    IF NOT EXISTS (SELECT 1 FROM contents WHERE channel_id = chan1_id AND title = 'Bí Mật Đằng Sau Kế Sách Cọc Gỗ Bạch Đằng Giang') THEN
        INSERT INTO contents (channel_id, title, text_body, source_type, status, is_exclusive, created_at, updated_at)
        VALUES (
            chan1_id,
            'Bí Mật Đằng Sau Kế Sách Cọc Gỗ Bạch Đằng Giang',
            'Chuyên đề độc quyền VIP: Khảo sát thủy văn sông Bạch Đằng, cấu tạo cọc gỗ bọc sắt và nghệ thuật dụ địch khi nước thủy triều rút.',
            'STUDIO_AI',
            'PUBLISHED',
            TRUE,
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP - INTERVAL '5 days'
        ) RETURNING id INTO c8_id;

        INSERT INTO artifacts (content_id, type, file_url, source_type, duration_seconds, status, created_at)
        VALUES (
            c8_id, 'VIDEO_WHITEBOARD',
            'https://res.cloudinary.com/dns0wbaea/video/upload/v1790915873/history-podcast/whiteboard/videos/job_1790915793_341813.mp4',
            'WHITEBOARD_RENDERER', 112, 'APPROVED', CURRENT_TIMESTAMP - INTERVAL '5 days'
        ) RETURNING id INTO art8_id;

        INSERT INTO transcripts (artifact_id, text_body, created_at)
        VALUES (art8_id, 'Năm 1288, trận thủy chiến Bạch Đằng đã khép lại vĩnh viễn tham vọng bành trướng xuống phương Nam của Hốt Tất Liệt...', CURRENT_TIMESTAMP - INTERVAL '5 days');

        INSERT INTO ai_filter_logs (artifact_id, result, score, reason, checked_at)
        VALUES (art8_id, 'SAFE', 99.20, 'Nội dung chuyên sâu, phân tích sơ đồ chiến thuật chi tiết, không phát hiện vi phạm bản quyền hay ngôn từ tiêu cực.', CURRENT_TIMESTAMP - INTERVAL '5 days');
    ELSE
        SELECT id INTO c8_id FROM contents WHERE channel_id = chan1_id AND title = 'Bí Mật Đằng Sau Kế Sách Cọc Gỗ Bạch Đằng Giang' LIMIT 1;
    END IF;

    -- Content 9: Bình Ngô Đại Cáo (Channel 1)
    IF NOT EXISTS (SELECT 1 FROM contents WHERE channel_id = chan1_id AND title = 'Bình Ngô Đại Cáo: Bản Thiên Cổ Hùng Văn Của Dân Tộc') THEN
        INSERT INTO contents (channel_id, title, text_body, source_type, status, is_exclusive, created_at, updated_at)
        VALUES (
            chan1_id,
            'Bình Ngô Đại Cáo: Bản Thiên Cổ Hùng Văn Của Dân Tộc',
            'Phân tích áng thiên cổ hùng văn của Nguyễn Trãi tuyên bố kết thúc 20 năm đô hộ tàn bạo của giặc Minh, mở ra vương triều Hậu Lê huy hoàng.',
            'STUDIO_AI',
            'PUBLISHED',
            FALSE,
            CURRENT_TIMESTAMP - INTERVAL '3 days',
            CURRENT_TIMESTAMP - INTERVAL '3 days'
        ) RETURNING id INTO c9_id;

        INSERT INTO artifacts (content_id, type, file_url, source_type, duration_seconds, status, created_at)
        VALUES (
            c9_id, 'VIDEO_WHITEBOARD',
            'https://res.cloudinary.com/dns0wbaea/video/upload/v1790775574/history-podcast/whiteboard/videos/job_1790775460_4f3a67.mp4',
            'AUDIO_STUDIO', 51, 'APPROVED', CURRENT_TIMESTAMP - INTERVAL '3 days'
        ) RETURNING id INTO art9_id;
    ELSE
        SELECT id INTO c9_id FROM contents WHERE channel_id = chan1_id AND title = 'Bình Ngô Đại Cáo: Bản Thiên Cổ Hùng Văn Của Dân Tộc' LIMIT 1;
    END IF;

    -- Content 10: Cổ Loa Thành (Channel 2)
    IF NOT EXISTS (SELECT 1 FROM contents WHERE channel_id = chan2_id AND title = 'Cổ Loa Thành: Kỳ Quan Phòng Thủ Xoắn Ốc Thời Kỳ Âu Lạc') THEN
        INSERT INTO contents (channel_id, title, text_body, source_type, status, is_exclusive, created_at, updated_at)
        VALUES (
            chan2_id,
            'Cổ Loa Thành: Kỳ Quan Phòng Thủ Xoắn Ốc Thời Kỳ Âu Lạc',
            'Khám phá kỹ thuật đắp thành chín vòng hình trôn ốc thời vua An Dương Vương, kết hợp hào sâu và nỏ thần bảo vệ bờ cõi.',
            'STUDIO_AI',
            'PUBLISHED',
            FALSE,
            CURRENT_TIMESTAMP - INTERVAL '10 days',
            CURRENT_TIMESTAMP - INTERVAL '10 days'
        ) RETURNING id INTO c10_id;

        INSERT INTO artifacts (content_id, type, file_url, source_type, duration_seconds, status, created_at)
        VALUES (
            c10_id, 'VIDEO_WHITEBOARD',
            'https://res.cloudinary.com/dns0wbaea/video/upload/v1790915873/history-podcast/whiteboard/videos/job_1790915793_341813.mp4',
            'WHITEBOARD_RENDERER', 112, 'APPROVED', CURRENT_TIMESTAMP - INTERVAL '10 days'
        ) RETURNING id INTO art10_id;
    ELSE
        SELECT id INTO c10_id FROM contents WHERE channel_id = chan2_id AND title = 'Cổ Loa Thành: Kỳ Quan Phòng Thủ Xoắn Ốc Thời Kỳ Âu Lạc' LIMIT 1;
    END IF;

    -- Content 11: Nỏ Thần và Mỵ Châu - Trọng Thủy (Channel 2)
    IF NOT EXISTS (SELECT 1 FROM contents WHERE channel_id = chan2_id AND title = 'Truyền Thuyết Nỏ Thần và Bi Kịch Mỵ Châu - Trọng Thủy') THEN
        INSERT INTO contents (channel_id, title, text_body, source_type, status, is_exclusive, created_at, updated_at)
        VALUES (
            chan2_id,
            'Truyền Thuyết Nỏ Thần và Bi Kịch Mỵ Châu - Trọng Thủy',
            'Phân tích dưới góc nhìn khảo cổ học: Phát hiện hàng vạn mũi tên đồng Cầu Vực và công trình nghiên cứu về nỏ Liên Châu bắn một phát nhiều mũi tên của tướng Cao Lỗ.',
            'STUDIO_AI',
            'PUBLISHED',
            FALSE,
            CURRENT_TIMESTAMP - INTERVAL '6 days',
            CURRENT_TIMESTAMP - INTERVAL '6 days'
        ) RETURNING id INTO c11_id;

        INSERT INTO artifacts (content_id, type, file_url, source_type, duration_seconds, status, created_at)
        VALUES (
            c11_id, 'VIDEO_WHITEBOARD',
            'https://res.cloudinary.com/dns0wbaea/video/upload/v1790768620/history-podcast/whiteboard/videos/job_1790767775_8433a2.mp4',
            'AUDIO_STUDIO', 45, 'APPROVED', CURRENT_TIMESTAMP - INTERVAL '6 days'
        ) RETURNING id INTO art11_id;
    ELSE
        SELECT id INTO c11_id FROM contents WHERE channel_id = chan2_id AND title = 'Truyền Thuyết Nỏ Thần và Bi Kịch Mỵ Châu - Trọng Thủy' LIMIT 1;
    END IF;

    -- Content 12: Bí Ẩn 18 Đời Vua Hùng (VIP Exclusive - Channel 2)
    IF NOT EXISTS (SELECT 1 FROM contents WHERE channel_id = chan2_id AND title = 'Bí Ẩn 18 Đời Vua Hùng và Nền Văn Minh Đông Sơn') THEN
        INSERT INTO contents (channel_id, title, text_body, source_type, status, is_exclusive, created_at, updated_at)
        VALUES (
            chan2_id,
            'Bí Ẩn 18 Đời Vua Hùng và Nền Văn Minh Đông Sơn',
            'Chuyên đề VIP: Giải mã con số 18 đời vua Hùng qua lăng kính niên đại học và các phát hiện trống đồng cổ tại Phú Thọ, Thanh Hóa.',
            'STUDIO_AI',
            'PUBLISHED',
            TRUE,
            CURRENT_TIMESTAMP - INTERVAL '2 days',
            CURRENT_TIMESTAMP - INTERVAL '2 days'
        ) RETURNING id INTO c12_id;

        INSERT INTO artifacts (content_id, type, file_url, source_type, duration_seconds, status, created_at)
        VALUES (
            c12_id, 'VIDEO_WHITEBOARD',
            'https://res.cloudinary.com/dns0wbaea/video/upload/v1790775574/history-podcast/whiteboard/videos/job_1790775460_4f3a67.mp4',
            'WHITEBOARD_RENDERER', 51, 'APPROVED', CURRENT_TIMESTAMP - INTERVAL '2 days'
        ) RETURNING id INTO art12_id;
    ELSE
        SELECT id INTO c12_id FROM contents WHERE channel_id = chan2_id AND title = 'Bí Ẩn 18 Đời Vua Hùng và Nền Văn Minh Đông Sơn' LIMIT 1;
    END IF;

    -- 10. Series & Playlists
    -- Series 1 (Channel 1)
    IF NOT EXISTS (SELECT 1 FROM series WHERE channel_id = chan1_id AND title = 'Vương Triều Trần & Ba Lần Kháng Chiến Chống Nguyên Mông') THEN
        INSERT INTO series (channel_id, title, description, cover_url, status, created_at, updated_at)
        VALUES (
            chan1_id,
            'Vương Triều Trần & Ba Lần Kháng Chiến Chống Nguyên Mông',
            'Tuyển tập các tập podcast đặc sắc về nghệ thuật quân sự đỉnh cao của vương triều nhà Trần, từ Đông Bộ Đầu, Chương Dương - Hàm Tử đến Bạch Đằng 1288.',
            'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
            'PUBLISHED',
            CURRENT_TIMESTAMP - INTERVAL '15 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO s1_id;

        -- Attach series items (c7, c8, c6)
        INSERT INTO series_items (series_id, content_id, order_no, created_at)
        VALUES 
        (s1_id, c7_id, 1, CURRENT_TIMESTAMP - INTERVAL '15 days'),
        (s1_id, c8_id, 2, CURRENT_TIMESTAMP - INTERVAL '14 days'),
        (s1_id, c6_id, 3, CURRENT_TIMESTAMP - INTERVAL '13 days');
    END IF;

    -- Series 2 (Channel 1)
    IF NOT EXISTS (SELECT 1 FROM series WHERE channel_id = chan1_id AND title = 'Đại Việt Chống Bắc Thuộc & Khởi Nghĩa Lam Sơn') THEN
        INSERT INTO series (channel_id, title, description, cover_url, status, created_at, updated_at)
        VALUES (
            chan1_id,
            'Đại Việt Chống Bắc Thuộc & Khởi Nghĩa Lam Sơn',
            'Hành trình 10 năm nếm mật nằm gai của nghĩa quân Lam Sơn dưới sự lãnh đạo của Lê Lợi và quân sư Nguyễn Trãi.',
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
            'PUBLISHED',
            CURRENT_TIMESTAMP - INTERVAL '10 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO s2_id;

        INSERT INTO series_items (series_id, content_id, order_no, created_at)
        VALUES 
        (s2_id, c9_id, 1, CURRENT_TIMESTAMP - INTERVAL '10 days');
    END IF;

    -- Series 3 (Channel 2)
    IF NOT EXISTS (SELECT 1 FROM series WHERE channel_id = chan2_id AND title = 'Cổ Sử Đại Việt: Thời Kỳ Văn Lang & Âu Lạc') THEN
        INSERT INTO series (channel_id, title, description, cover_url, status, created_at, updated_at)
        VALUES (
            chan2_id,
            'Cổ Sử Đại Việt: Thời Kỳ Văn Lang & Âu Lạc',
            'Giải mã huyền sử, di chỉ khảo cổ học Đông Sơn và thành lũy Cổ Loa thời kỳ An Dương Vương dựng nước.',
            'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
            'PUBLISHED',
            CURRENT_TIMESTAMP - INTERVAL '8 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO s3_id;

        INSERT INTO series_items (series_id, content_id, order_no, created_at)
        VALUES 
        (s3_id, c10_id, 1, CURRENT_TIMESTAMP - INTERVAL '8 days'),
        (s3_id, c11_id, 2, CURRENT_TIMESTAMP - INTERVAL '7 days'),
        (s3_id, c12_id, 3, CURRENT_TIMESTAMP - INTERVAL '6 days');
    END IF;

    -- 11. Recruitment Posts, Contracts & Escrow Milestones
    -- Post 1
    IF NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u_creator1_id AND title LIKE '%Tuyển giọng đọc%') THEN
        INSERT INTO posts (user_id, type, service_type, title, description, reference_price, status, expires_at, created_at, updated_at)
        VALUES (
            u_creator1_id, 'RECRUITMENT', 'VOICE_OVER',
            'Tuyển giọng đọc truyền cảm cho Series Ba Lần Kháng Chiến Chống Nguyên Mông',
            'Cần giọng đọc nam miền Bắc truyền cảm, hùng tráng để đọc 5 tập podcast lịch sử (mỗi tập khoảng 2500 - 3000 từ). Yêu cầu có phòng thu lọc âm tốt và bàn giao đúng hạn.',
            1500000,
            'IN_PROGRESS',
            CURRENT_TIMESTAMP + INTERVAL '30 days',
            CURRENT_TIMESTAMP - INTERVAL '7 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO post1_id;
    ELSE
        SELECT id INTO post1_id FROM posts WHERE user_id = u_creator1_id AND title LIKE '%Tuyển giọng đọc%' LIMIT 1;
    END IF;

    -- Post 2
    IF NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u_creator1_id AND title LIKE '%Cần biên kịch%') THEN
        INSERT INTO posts (user_id, type, service_type, title, description, reference_price, status, expires_at, created_at, updated_at)
        VALUES (
            u_creator1_id, 'RECRUITMENT', 'SCRIPT_WRITING',
            'Cần biên kịch dã sử hỗ trợ nghiên cứu tài liệu về khởi nghĩa Lam Sơn',
            'Nhiệm vụ: Tổng hợp tài liệu từ Đại Việt Sử Ký Toàn Thư và Lam Sơn Thực Lục, viết kịch bản 3 tập podcast với góc nhìn hấp dẫn, giàu cảm xúc.',
            1200000,
            'OPEN',
            CURRENT_TIMESTAMP + INTERVAL '20 days',
            CURRENT_TIMESTAMP - INTERVAL '3 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO post2_id;
    END IF;

    -- Post 3
    IF NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u_creator2_id AND title LIKE '%Tìm video editor%') THEN
        INSERT INTO posts (user_id, type, service_type, title, description, reference_price, status, expires_at, created_at, updated_at)
        VALUES (
            u_creator2_id, 'RECRUITMENT', 'VIDEO_EDITING',
            'Tìm video editor dựng hoạt họa Whiteboard cho series Cổ Loa Thành',
            'Dựng video hoạt họa bảng trắng kết hợp bản đồ cổ và hình minh họa nỏ Liên Châu theo kịch bản có sẵn.',
            2000000,
            'OPEN',
            CURRENT_TIMESTAMP + INTERVAL '25 days',
            CURRENT_TIMESTAMP - INTERVAL '2 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO post3_id;
    END IF;

    -- Contract 1 (Creator 1 & Freelancer 1)
    IF NOT EXISTS (SELECT 1 FROM contracts WHERE creator_id = u_creator1_id AND freelancer_id = u_freelancer1_id) THEN
        INSERT INTO contracts (
            post_id, creator_id, freelancer_id, service_type, title, description,
            total_amount, platform_fee_percent, platform_fee, net_amount,
            status, deadline, creator_signed_at, narrator_signed_at, accepted_at, accept_due_at,
            created_at, updated_at
        )
        VALUES (
            post1_id, u_creator1_id, u_freelancer1_id, 'VOICE_OVER',
            'Hợp đồng thu âm Series Ba Lần Kháng Chiến Chống Nguyên Mông',
            'Thực hiện thu âm hoàn chỉnh các tập podcast chất lượng cao 320kbps WAV/MP3, xử lý tiếng ồn và lồng nhạc nền không gian chiến trận hào sảng.',
            1500000, 5.0, 75000, 1425000,
            'IN_PROGRESS',
            CURRENT_DATE + INTERVAL '14 days',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP - INTERVAL '3 days',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO contract1_id;

        -- Milestone 1 (Completed & Released)
        INSERT INTO milestones (
            contract_id, order_no, title, requirement, amount, platform_fee, net_amount,
            duration_days, max_revisions, revisions_used, revision_days, status, escrow_status,
            funded_at, released_at, created_at, updated_at
        )
        VALUES (
            contract1_id, 1,
            'Thu âm kịch bản 2 tập đầu (Kháng chiến lần 1 - 1258 Đông Bộ Đầu)',
            'Bàn giao file audio MP3/WAV hoàn chỉnh không tạp âm, giọng điệu hào tráng.',
            500000, 25000, 475000,
            3, 2, 1, 2, 'COMPLETED', 'RELEASED',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP - INTERVAL '2 days',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP - INTERVAL '2 days'
        ) RETURNING id INTO m1_id;

        -- Deliverable for Milestone 1
        INSERT INTO milestone_deliverables (
            milestone_id, post_id, uploaded_by, title, description, file_name, file_path, file_size, content_type, version_no, created_at
        )
        VALUES (
            m1_id, post1_id, u_freelancer1_id,
            'Bản thu âm Master Tập 1 & Tập 2 - Đại Phá Quân Mông Cổ 1258.mp3',
            'File master đã cân chỉnh EQ, nén vocal chuẩn phát thanh podcast và lọc tạp âm 100%.',
            'tap1_tap2_voice_master.mp3',
            'https://res.cloudinary.com/history-podcast/audio/tap1_tap2_voice_master.mp3',
            24500000, 'audio/mpeg', 1,
            CURRENT_TIMESTAMP - INTERVAL '3 days'
        );

        -- Milestone Review for Milestone 1
        INSERT INTO milestone_reviews (
            milestone_id, contract_id, reviewer_id, reviewee_id, rating, comment, created_at
        )
        VALUES (
            m1_id, contract1_id, u_creator1_id, u_freelancer1_id, 5,
            'Chất giọng của bạn An rất trầm ấm, truyền tải được trọn vẹn sự hào hùng của chiến thắng Đông Bộ Đầu. Bàn giao đúng hẹn, xử lý tạp âm rất sạch. Rất hài lòng!',
            CURRENT_TIMESTAMP - INTERVAL '2 days'
        );

        -- Milestone 2 (In Progress & Funded)
        INSERT INTO milestones (
            contract_id, order_no, title, requirement, amount, platform_fee, net_amount,
            duration_days, max_revisions, revisions_used, revision_days, status, escrow_status,
            funded_at, due_at, created_at, updated_at
        )
        VALUES (
            contract1_id, 2,
            'Thu âm 2 tập cao trào (Chương Dương - Hàm Tử & Vạn Kiếp 1285)',
            'Thể hiện giọng điệu hào sảng, kịch tính, bàn giao file audio master 320kbps.',
            500000, 25000, 475000,
            4, 2, 0, 2, 'IN_PROGRESS', 'FUNDED',
            CURRENT_TIMESTAMP - INTERVAL '2 days',
            CURRENT_TIMESTAMP + INTERVAL '3 days',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO m2_id;

        -- Milestone 3 (Pending & Unfunded)
        INSERT INTO milestones (
            contract_id, order_no, title, requirement, amount, platform_fee, net_amount,
            duration_days, max_revisions, revisions_used, revision_days, status, escrow_status,
            created_at, updated_at
        )
        VALUES (
            contract1_id, 3,
            'Thu âm tập kết Bạch Đằng Giang 1288 & Tổng kết hào khí Đông A',
            'Thu âm tập cuối cùng và hoàn tất gói âm thanh cho toàn bộ series podcast.',
            500000, 25000, 475000,
            3, 2, 0, 2, 'PENDING', 'UNFUNDED',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO m3_id;
    END IF;

    -- 12. Livestream Sessions
    -- Session 1: Đang phát (LIVE)
    IF NOT EXISTS (SELECT 1 FROM livestream_sessions WHERE agora_channel_name = 'prm_live_bachdang_1288_demo') THEN
        INSERT INTO livestream_sessions (
            channel_id, creator_id, title, description, thumbnail_url,
            agora_channel_name, is_exclusive, status, viewer_count, started_at, created_at
        )
        VALUES (
            chan1_id, u_creator1_id,
            '🔴 TRỰC TIẾP: Giải Mã Trận Thủy Chiến Bạch Đằng 1288 - Tướng Giặc Ô Mã Nhi Bị Bắt Như Thế Nào?',
            'Cùng thảo luận trực tiếp với Creator về sơ đồ cọc gỗ, chiến thuật phục kích theo con nước triều và sự phối hợp giữa thủy bộ quân Trần.',
            'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
            'prm_live_bachdang_1288_demo',
            FALSE, 'LIVE', 68,
            CURRENT_TIMESTAMP - INTERVAL '35 minutes',
            CURRENT_TIMESTAMP - INTERVAL '35 minutes'
        );
    END IF;

    -- Session 2: Đang phát VIP (LIVE)
    IF NOT EXISTS (SELECT 1 FROM livestream_sessions WHERE agora_channel_name = 'prm_live_lythuongkiet_vip_demo') THEN
        INSERT INTO livestream_sessions (
            channel_id, creator_id, title, description, thumbnail_url,
            agora_channel_name, is_exclusive, status, viewer_count, started_at, created_at
        )
        VALUES (
            chan1_id, u_creator1_id,
            '⭐ LIVESTREAM ĐỘC QUYỀN HỘI VIÊN: Bàn Về Chiến Lược Tiên Phát Chế Nhân Của Lý Thường Kiệt',
            'Buổi chia sẻ và trả lời câu hỏi chuyên sâu chỉ dành cho hội viên gói Hào Khí Đông A.',
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
            'prm_live_lythuongkiet_vip_demo',
            TRUE, 'LIVE', 29,
            CURRENT_TIMESTAMP - INTERVAL '15 minutes',
            CURRENT_TIMESTAMP - INTERVAL '15 minutes'
        );
    END IF;

    -- Session 3: Đã kết thúc (ENDED)
    IF NOT EXISTS (SELECT 1 FROM livestream_sessions WHERE agora_channel_name = 'prm_live_dongson_ancient') THEN
        INSERT INTO livestream_sessions (
            channel_id, creator_id, title, description, thumbnail_url,
            agora_channel_name, is_exclusive, status, viewer_count, started_at, ended_at, created_at
        )
        VALUES (
            chan2_id, u_creator2_id,
            'Tọa Đàm Cổ Sử: Giải Mã Kỹ Thuật Đúc Trống Đồng Đông Sơn Thời Kỳ Văn Lang',
            'Phân tích hoa văn chim lạc, mặt trời và nhà sàn trên trống đồng Ngọc Lũ.',
            'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
            'prm_live_dongson_ancient',
            FALSE, 'ENDED', 450,
            CURRENT_TIMESTAMP - INTERVAL '2 days',
            CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '90 minutes',
            CURRENT_TIMESTAMP - INTERVAL '2 days'
        );
    END IF;

    -- 13. Comments & Reactions
    IF c7_id IS NOT NULL THEN
        SELECT id INTO art7_id FROM artifacts WHERE content_id = c7_id LIMIT 1;
        IF art7_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM comments WHERE artifact_id = art7_id) THEN
            INSERT INTO comments (artifact_id, user_id, text_body, status, created_at)
            VALUES 
            (art7_id, u_viewer1_id, 'Tập podcast hào tráng quá! Giọng đọc bạn An phối cùng nhạc nền trống trận nghe rất xúc động và tự hào.', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '7 days'),
            (art7_id, u_viewer2_id, 'Phân tích về chiến thuật cọc gỗ rất logic. Mong kênh ra thêm nhiều tập về danh tướng Trần Khánh Dư!', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '6 days');

            INSERT INTO reactions (artifact_id, user_id, type, created_at)
            VALUES 
            (art7_id, u_viewer1_id, 'LIKE', CURRENT_TIMESTAMP - INTERVAL '7 days'),
            (art7_id, u_viewer2_id, 'LOVE', CURRENT_TIMESTAMP - INTERVAL '6 days');
        END IF;
    END IF;

    RAISE NOTICE 'Showcase Demo Data Seeding Completed Successfully!';
END $$;
