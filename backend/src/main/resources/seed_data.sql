-- Seed Data Script for Sử Ký Podcast Database (prm_db)

-- 1. Insert Additional Users
INSERT INTO users (id, role_id, email, phone, password_hash, status, full_name, avatar_url, bio, created_at, updated_at)
VALUES 
  (3, 2, 'test1tr@example.com', '0901234567', '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y', 'ACTIVE', 'Trần Đại Việt', 'assets/mock/images/van-mieu.jpg', 'Tác giả kênh Hồ Sơ Lịch Sử', NOW(), NOW()),
  (4, 2, 'history_expert@example.com', '0912345678', '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y', 'ACTIVE', 'Lê Văn Sử', 'assets/mock/images/hoi-an.jpg', 'Nhà nghiên cứu văn hóa cổ phong Việt Nam', NOW(), NOW()),
  (5, 2, 'trankim@example.com', '0923456789', '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y', 'ACTIVE', 'Kim Lịch Sử', 'assets/mock/images/ha-noi.jpg', 'Chuyên gia nghiên cứu quân sự Triều Trần', NOW(), NOW()),
  (6, 1, 'viewer@example.com', '0934567890', '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y', 'ACTIVE', 'Người nghe Sử Ký', 'assets/images/hue-citadel.jpg', 'Khán thính giả yêu mến sử Việt', NOW(), NOW()),
  (7, 1, 'nguyenquangtung@gmail.com', '0945678901', '$2b$12$p7viIODxKzCX9xp7wSav3Ove.HG8Ko08ioG/LOq/T8mVGBaE3Bu6y', 'ACTIVE', 'Nguyễn Quang Tùng', 'assets/images/hue-citadel.jpg', 'Người nghe trung thành Sử Ký', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  status = EXCLUDED.status;

-- Reset sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. Insert User Roles
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES 
  (3, 2, NOW()),
  (4, 2, NOW()),
  (5, 2, NOW()),
  (6, 1, NOW()),
  (7, 1, NOW())
ON CONFLICT DO NOTHING;

-- 3. Insert Wallets
INSERT INTO wallets (id, user_id, available_balance, pending_balance, currency, updated_at)
VALUES 
  (1, 1, 500000.00, 0.00, 'VND', NOW()),
  (2, 2, 0.00, 0.00, 'VND', NOW()),
  (3, 3, 1000000.00, 0.00, 'VND', NOW()),
  (4, 4, 300000.00, 0.00, 'VND', NOW()),
  (5, 5, 200000.00, 0.00, 'VND', NOW()),
  (6, 6, 150000.00, 0.00, 'VND', NOW()),
  (7, 7, 500000.00, 0.00, 'VND', NOW())
ON CONFLICT (id) DO UPDATE SET 
  available_balance = EXCLUDED.available_balance,
  pending_balance = EXCLUDED.pending_balance;

SELECT setval('wallets_id_seq', (SELECT MAX(id) FROM wallets));

-- 4. Insert Channels
INSERT INTO channels (id, creator_id, name, description, avatar_url, cover_url, status, created_at, updated_at)
VALUES 
  (1, 1, 'Sử Việt Hào Hùng', 'Kênh podcast chuyên sâu về các trang sử oanh liệt, triều đại và danh nhân hào kiệt Việt Nam qua các thời kỳ.', 'assets/images/hue-citadel.jpg', 'assets/images/hue-citadel.jpg', 'ACTIVE', NOW(), NOW()),
  (2, 3, 'Hồ Sơ Lịch Sử', 'Giải mã những bí ẩn chưa có lời giải và góc nhìn đa chiều về những sự kiện lịch sử thế giới và Việt Nam.', 'assets/mock/images/van-mieu.jpg', 'assets/mock/images/van-mieu.jpg', 'ACTIVE', NOW(), NOW()),
  (3, 4, 'Đại Việt Cổ Phong', 'Khám phá văn hóa, trang phục, kiến trúc và phong tục cổ xưa của người Việt qua các triều đại Lý, Trần, Lê, Nguyễn.', 'assets/mock/images/hoi-an.jpg', 'assets/mock/images/hoi-an.jpg', 'ACTIVE', NOW(), NOW()),
  (4, 5, 'Sử Ký Triều Trần', 'Hào khí Đông A và ba lần đại thắng quân Nguyên Mông - mốc son rực rỡ nhất trong lịch sử dựng nước và giữ nước.', 'assets/mock/images/ha-noi.jpg', 'assets/mock/images/ha-noi.jpg', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

SELECT setval('channels_id_seq', (SELECT MAX(id) FROM channels));

-- 5. Insert Channel Membership Plans
INSERT INTO channel_membership_plans (id, channel_id, name, description, monthly_price, perks, status, created_at, updated_at)
VALUES 
  (1, 1, 'Gói Đồng Hào Hào Hùng', 'Đặc quyền nghe sớm podcast 7 ngày, biểu tượng huy hiệu hào khí và tham gia phòng bình luận kín.', 29000.00, '["Nghe sớm podcast 7 ngày", "Huy hiệu hội viên độc quyền", "Tham gia cộng đồng Sử Ký VIP"]'::jsonb, 'ACTIVE', NOW(), NOW()),
  (2, 2, 'Hồ Sơ Bí Ẩn VIP', 'Xem trọn bộ tư liệu độc quyền và các tập phân tích chuyên sâu không cắt ghép.', 49000.00, '["Toàn bộ video tư liệu VIP", "Tải kịch bản gốc PDF", "Quyền đặt câu hỏi cho tác giả"]'::jsonb, 'ACTIVE', NOW(), NOW()),
  (3, 4, 'Hội Viên Đông A', 'Gói hội viên ủng hộ kênh nghiên cứu chuyên đề triều đại nhà Trần và chiến trận cổ.', 39000.00, '["Nghe không giới hạn", "Huy hiệu Triều Trần", "Tham gia buổi tọa đàm trực tiếp"]'::jsonb, 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  status = EXCLUDED.status;

SELECT setval('channel_membership_plans_id_seq', (SELECT MAX(id) FROM channel_membership_plans));

-- 6. Insert Series
INSERT INTO series (id, channel_id, title, description, cover_url, status, created_at, updated_at)
VALUES 
  (1, 4, 'Hào Khí Đông A: Ba Lần Đại Phá Nguyên Mông', 'Trọn bộ biên niên sử tái hiện sinh động cuộc kháng chiến chống quân Mông Cổ xâm lược của quân dân nhà Trần.', 'assets/mock/images/ha-noi.jpg', 'PUBLISHED', NOW(), NOW()),
  (2, 1, 'Những Trận Thủy Chiến Vang Dội Sông Bạch Đằng', 'Từ Ngô Quyền năm 938, Lê Hoàn năm 981 đến Trần Hưng Đạo năm 1288.', 'assets/images/hue-citadel.jpg', 'PUBLISHED', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

SELECT setval('series_id_seq', (SELECT MAX(id) FROM series));

-- 7. Insert Contents
INSERT INTO contents (id, channel_id, title, text_body, source_type, status, is_exclusive, created_at, updated_at)
VALUES 
  (1, 4, 'Đại thắng Bạch Đằng 1288: Mưu lược đóng cọc và hào khí Đông A', 'Mùa xuân năm 1288, dưới sự chỉ huy tài ba của Quốc công Tiết chế Hưng Đạo Đại vương Trần Quốc Tuấn, quân dân Đại Việt đã làm nên chiến thắng Bạch Đằng lẫy lừng, chôn vùi đạo thủy binh hùng hậu của Ô Mã Nhi và Phàn Tiếp.', 'ORIGINAL', 'PUBLISHED', false, NOW() - INTERVAL '7 days', NOW()),
  (2, 1, 'Chiến dịch Điện Biên Phủ: 56 ngày đêm lừng lẫy năm châu', 'Toàn cảnh chiến dịch Điện Biên Phủ 1954 từ quyết định chuyển từ đánh nhanh thắng nhanh sang đánh chắc tiến chắc của Đại tướng Võ Nguyên Giáp, mở ra khúc ca khải hoàn chấn động địa cầu.', 'ORIGINAL', 'PUBLISHED', false, NOW() - INTERVAL '6 days', NOW()),
  (3, 4, 'Hội nghị Diên Hồng và lời hô Sát Thát vang trời', 'Năm 1284, Thượng hoàng Trần Thánh Tông triệu họp các bô lão trong cả nước về điện Diên Hồng để hỏi kế đánh giặc: Nên hòa hay nên đánh? Muôn người cùng cất tiếng hô Đánh rung chuyển sơn hà.', 'ORIGINAL', 'PUBLISHED', true, NOW() - INTERVAL '5 days', NOW()),
  (4, 2, 'Quang Trung đại phá 29 vạn quân Thanh mùa xuân Kỷ Dậu 1789', 'Cuộc hành quân thần tốc vô tiền khoáng hậu của Hoàng đế Quang Trung Nguyễn Huệ đánh tan các cứ điểm Ngọc Hồi - Khương Thượng, tiến vào giải phóng thành Thăng Long mùng 5 Tết Kỷ Dậu.', 'ORIGINAL', 'PUBLISHED', false, NOW() - INTERVAL '4 days', NOW()),
  (5, 1, 'Khởi nghĩa Hai Bà Trưng: Khí phách nữ vương dựng nền độc lập', 'Mùa xuân năm 40 sau Công nguyên, Trưng Trắc cùng em gái là Trưng Nhị phất cờ khởi nghĩa tại cửa sông Hát, đánh đuổi thái thú Tô Định, giành lại độc lập tự chủ cho non sông Đại Việt.', 'ORIGINAL', 'PUBLISHED', false, NOW() - INTERVAL '3 days', NOW()),
  (6, 3, 'Chiếu dời đô 1010: Tầm nhìn ngàn năm của vua Lý Thái Tổ', 'Mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ quyết định thiên đô từ vùng núi Hoa Lư hiểm trở về thành Đại La trù phú và đổi tên là Thăng Long - nơi thế rồng cuộn hổ ngồi.', 'ORIGINAL', 'PUBLISHED', false, NOW() - INTERVAL '2 days', NOW()),
  (7, 2, 'Bí ẩn trận chiến Rạch Gầm - Xoài Mút chôn vùi 5 vạn quân Xiêm', 'Đầu năm 1785, phong trào Tây Sơn dưới sự thống lĩnh thiên tài của anh hùng áo vải Nguyễn Huệ đã giăng bẫy tiêu diệt gọn toàn bộ thủy lục quân xâm lược Xiêm La trên dòng sông Tiền.', 'ORIGINAL', 'PUBLISHED', true, NOW() - INTERVAL '1 day', NOW()),
  (8, 3, 'Cổ phục triều Lê sơ và triều Nguyễn: Tinh hoa văn hiến Đại Việt', 'Hành trình phục dựng các bộ áo Giao Lĩnh, Viên Lĩnh, Nhật Bình và áo Tấc qua các tư liệu lịch sử, văn bia và hiện vật khảo cổ học phản ánh nền mỹ thuật rực rỡ.', 'ORIGINAL', 'PUBLISHED', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  text_body = EXCLUDED.text_body,
  status = EXCLUDED.status,
  is_exclusive = EXCLUDED.is_exclusive;

SELECT setval('contents_id_seq', (SELECT MAX(id) FROM contents));

-- 8. Insert Artifacts
INSERT INTO artifacts (id, content_id, type, file_url, source_type, duration_seconds, status, created_at, optimized_url)
VALUES 
  (1, 1, 'AUDIO', 'assets/mock/audio/vietnam-history-sample.mp3', 'AUDIO', 1420, 'READY', NOW() - INTERVAL '7 days', 'assets/mock/audio/vietnam-history-sample.mp3'),
  (2, 2, 'AUDIO', 'assets/mock/audio/vietnam-history-sample.mp3', 'AUDIO', 2150, 'READY', NOW() - INTERVAL '6 days', 'assets/mock/audio/vietnam-history-sample.mp3'),
  (3, 3, 'AUDIO', 'assets/mock/audio/vietnam-history-sample.mp3', 'AUDIO', 1180, 'READY', NOW() - INTERVAL '5 days', 'assets/mock/audio/vietnam-history-sample.mp3'),
  (4, 4, 'VIDEO', 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4', 'VIDEO', 1840, 'READY', NOW() - INTERVAL '4 days', 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4'),
  (5, 5, 'AUDIO', 'assets/mock/audio/vietnam-history-sample.mp3', 'AUDIO', 960, 'READY', NOW() - INTERVAL '3 days', 'assets/mock/audio/vietnam-history-sample.mp3'),
  (6, 6, 'AUDIO', 'assets/mock/audio/vietnam-history-sample.mp3', 'AUDIO', 1350, 'READY', NOW() - INTERVAL '2 days', 'assets/mock/audio/vietnam-history-sample.mp3'),
  (7, 7, 'VIDEO', 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4', 'VIDEO', 1620, 'READY', NOW() - INTERVAL '1 day', 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4'),
  (8, 8, 'AUDIO', 'assets/mock/audio/vietnam-history-sample.mp3', 'AUDIO', 1540, 'READY', NOW(), 'assets/mock/audio/vietnam-history-sample.mp3')
ON CONFLICT (id) DO UPDATE SET 
  type = EXCLUDED.type,
  file_url = EXCLUDED.file_url,
  optimized_url = EXCLUDED.optimized_url,
  duration_seconds = EXCLUDED.duration_seconds,
  status = EXCLUDED.status;

SELECT setval('artifacts_id_seq', (SELECT MAX(id) FROM artifacts));

-- 9. Insert Series Items
INSERT INTO series_items (id, series_id, content_id, order_no, created_at)
VALUES 
  (1, 1, 1, 1, NOW()),
  (2, 1, 3, 2, NOW()),
  (3, 2, 1, 1, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('series_items_id_seq', (SELECT MAX(id) FROM series_items));

-- 10. Insert Comments
INSERT INTO comments (id, artifact_id, user_id, text_body, status, created_at)
VALUES 
  (1, 1, 6, 'Tập podcast hào hùng quá, nghe mà rùng mình xúc động trước hào khí dân tộc!', 'APPROVED', NOW() - INTERVAL '2 days'),
  (2, 1, 7, 'Mưu lược đóng cọc trên sông Bạch Đằng của Hưng Đạo Vương thật sự là đỉnh cao nghệ thuật quân sự.', 'APPROVED', NOW() - INTERVAL '1 day'),
  (3, 2, 6, 'Âm thanh sống động, giọng đọc truyền cảm, mong kênh ra thêm nhiều tập về chiến dịch lịch sử!', 'APPROVED', NOW() - INTERVAL '1 day'),
  (4, 4, 7, 'Hình ảnh tư liệu rất sắc nét, Quang Trung đúng là vị anh hùng bách chiến bách thắng.', 'APPROVED', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));

-- 11. Insert Reactions
INSERT INTO reactions (id, artifact_id, user_id, type, created_at)
VALUES 
  (1, 1, 6, 'LIKE', NOW()),
  (2, 1, 7, 'LIKE', NOW()),
  (3, 2, 6, 'LIKE', NOW()),
  (4, 3, 7, 'LIKE', NOW()),
  (5, 4, 6, 'LIKE', NOW()),
  (6, 5, 7, 'LIKE', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('reactions_id_seq', (SELECT MAX(id) FROM reactions));

-- 12. Insert Transcripts
INSERT INTO transcripts (id, artifact_id, text_body, created_at)
VALUES 
  (1, 1, 'Trận Bạch Đằng năm 1288 là một trong những chiến thắng vĩ đại nhất trong lịch sử chống ngoại xâm của dân tộc ta...', NOW()),
  (2, 2, 'Chiến dịch Điện Biên Phủ diễn ra trong 56 ngày đêm khoét núi, ngủ hầm, mưa dầm, cơm vắt...', NOW()),
  (3, 4, 'Hoàng đế Quang Trung cưỡi voi đốc chiến, áo bào sạm đen khói súng tiến thẳng vào giải phóng kinh thành Thăng Long...', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('transcripts_id_seq', (SELECT MAX(id) FROM transcripts));

-- 13. Insert Livestream Session
INSERT INTO livestream_sessions (id, channel_id, creator_id, title, description, thumbnail_url, agora_channel_name, is_exclusive, status, viewer_count, started_at, created_at)
VALUES 
  (1, 1, 1, 'Trực tiếp: Tọa đàm Hào Khí Sử Việt và những góc nhìn mới', 'Giao lưu trực tuyến cùng tác giả kênh Sử Việt Hào Hùng, giải đáp thắc mắc về triều đại phong kiến Việt Nam.', 'assets/images/hue-citadel.jpg', 'su-ky-live-channel-01', false, 'LIVE', 128, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  status = EXCLUDED.status;

SELECT setval('livestream_sessions_id_seq', (SELECT MAX(id) FROM livestream_sessions));
