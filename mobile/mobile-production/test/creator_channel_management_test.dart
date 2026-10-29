import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/channel_repository.dart';
import 'package:su_ky_mobile_production/creator_channel_page.dart';
import 'package:su_ky_mobile_production/creator_state.dart';
import 'package:su_ky_mobile_production/studio_pages.dart';

void main() {
  testWidgets(
    'Quản lý Kênh Podcast: Tải ảnh bìa 16:9 (/me/cover), ảnh đại diện (/me/avatar), cập nhật thông tin kênh (PUT /channels/{id}) và loại bỏ category mock',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      var coverUploaded = false;
      var avatarUploaded = false;
      var channelUpdated = false;
      String? updatedName;
      String? updatedDesc;

      final mockHttp = MockClient((request) async {
        final path = request.url.path;
        final method = request.method;

        http.Response jsonUtf8(Map<String, dynamic> body, [int status = 200]) {
          return http.Response.bytes(
            utf8.encode(jsonEncode(body)),
            status,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (method == 'GET' && path == '/api/v1/channels/me') {
          return jsonUtf8({
            'data': {
              'id': 10,
              'creatorId': 42,
              'name': 'Đại Việt Sử Ký',
              'description': 'Kênh chuyên khảo lịch sử triều đại Việt Nam qua các thời kỳ.',
              'avatarUrl': 'https://res.cloudinary.com/test/image/upload/avatar.png',
              'coverUrl': 'https://res.cloudinary.com/test/image/upload/cover.png',
              'status': 'ACTIVE',
              'createdAt': '2026-10-15T08:00:00Z',
              'updatedAt': '2026-10-20T10:30:00Z',
            },
          });
        }

        if (method == 'POST' && path == '/api/v1/channels/me/cover') {
          coverUploaded = true;
          return jsonUtf8({
            'data': {
              'id': 10,
              'creatorId': 42,
              'name': 'Đại Việt Sử Ký',
              'description': 'Kênh chuyên khảo lịch sử triều đại Việt Nam qua các thời kỳ.',
              'avatarUrl': 'https://res.cloudinary.com/test/image/upload/avatar.png',
              'coverUrl': 'https://res.cloudinary.com/test/image/upload/new_cover.png',
              'status': 'ACTIVE',
              'createdAt': '2026-10-15T08:00:00Z',
              'updatedAt': '2026-10-29T10:00:00Z',
            },
          });
        }

        if (method == 'POST' && path == '/api/v1/channels/me/avatar') {
          avatarUploaded = true;
          return jsonUtf8({
            'data': {
              'id': 10,
              'creatorId': 42,
              'name': 'Đại Việt Sử Ký',
              'description': 'Kênh chuyên khảo lịch sử triều đại Việt Nam qua các thời kỳ.',
              'avatarUrl': 'https://res.cloudinary.com/test/image/upload/new_avatar.png',
              'coverUrl': 'https://res.cloudinary.com/test/image/upload/cover.png',
              'status': 'ACTIVE',
              'createdAt': '2026-10-15T08:00:00Z',
              'updatedAt': '2026-10-29T10:05:00Z',
            },
          });
        }

        if (method == 'PUT' && path == '/api/v1/channels/10') {
          channelUpdated = true;
          final payload = jsonDecode(request.body) as Map<String, dynamic>;
          updatedName = payload['name'] as String?;
          updatedDesc = payload['description'] as String?;
          return jsonUtf8({
            'data': {
              'id': 10,
              'creatorId': 42,
              'name': updatedName ?? 'Đại Việt Sử Ký',
              'description': updatedDesc ?? '',
              'avatarUrl': 'https://res.cloudinary.com/test/image/upload/avatar.png',
              'coverUrl': 'https://res.cloudinary.com/test/image/upload/cover.png',
              'status': 'ACTIVE',
              'createdAt': '2026-10-15T08:00:00Z',
              'updatedAt': '2026-10-29T11:00:00Z',
            },
          });
        }

        if (method == 'GET' &&
            path == '/api/v1/channels/10/memberships/membership-plans') {
          return jsonUtf8({
            'data': {
              'id': 77,
              'channelId': 10,
              'name': 'Gói Tinh Hoa Sử Ký',
              'monthlyPrice': 49000,
              'description': 'Xem sớm và nghe audio độc quyền.',
              'perks': ['Xem sớm trước 48h', 'Huy hiệu hội viên'],
              'status': 'ACTIVE',
            },
          });
        }

        return jsonUtf8({'error': 'Not found: $path'}, 404);
      });

      final apiClient = ApiClient(preferences: prefs, httpClient: mockHttp);
      final channelRepo = ChannelRepository(client: apiClient);

      final state = CreatorState(
        prefs,
        storageKey: 'test-creator-channel',
        channelRepository: channelRepo,
      );
      state.demoVerified = true;
      state.kyc = KycProfile.fixtureApproved();
      state.channel = 'Đại Việt Sử Ký';
      state.channelDescription = 'Kênh chuyên khảo lịch sử triều đại Việt Nam qua các thời kỳ.';

      await tester.pumpWidget(
        MaterialApp(
          home: CreatorChannelPage(state: state),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Kiểm tra hiển thị tiêu đề, status badge và metadata chuẩn Backend
      expect(find.text('KÊNH HOẠT ĐỘNG (ACTIVE)'), findsOneWidget);
      expect(find.text('Mã kênh: #10'), findsOneWidget);
      expect(find.text('Tác giả ID: #42'), findsOneWidget);
      expect(find.textContaining('Ngày tạo:'), findsOneWidget);

      // Đảm bảo loại bỏ trường thừa không có trong backend: category / "Lịch sử Việt Nam"
      expect(find.text('Chủ đề chính'), findsNothing);

      // 2. Kiểm tra các nút upload ảnh bìa (16:9) và ảnh đại diện (1:1)
      expect(find.byKey(const Key('upload-channel-cover-btn')), findsOneWidget);
      expect(find.byKey(const Key('upload-channel-avatar-btn')), findsOneWidget);

      // Nhấn nút đổi ảnh bìa
      await tester.tap(find.byKey(const Key('upload-channel-cover-btn')));
      await tester.pumpAndSettle();
      expect(coverUploaded, isTrue);

      // Nhấn nút đổi ảnh đại diện
      await tester.tap(find.byKey(const Key('upload-channel-avatar-btn')));
      await tester.pumpAndSettle();
      expect(avatarUploaded, isTrue);

      // 3. Kiểm tra form Chỉnh sửa thông tin Kênh và bấm Lưu
      final nameField = find.byKey(const Key('channel-name-input'));
      final descField = find.byKey(const Key('channel-desc-input'));
      expect(nameField, findsOneWidget);
      expect(descField, findsOneWidget);

      await tester.enterText(nameField, 'Sử Ký Hào Hùng Đại Việt');
      await tester.enterText(descField, 'Mô tả mới được cập nhật chuẩn xác qua API PUT.');
      await tester.pumpAndSettle();

      final saveBtn = find.byKey(const Key('save-channel-info-btn'));
      await tester.drag(find.byType(ListView).first, const Offset(0, -300));
      await tester.pumpAndSettle();
      await tester.tap(saveBtn);
      await tester.pumpAndSettle();

      expect(channelUpdated, isTrue);
      expect(updatedName, 'Sử Ký Hào Hùng Đại Việt');
      expect(updatedDesc, 'Mô tả mới được cập nhật chuẩn xác qua API PUT.');

      // 4. Kiểm tra gói hội viên VIP hiển thị
      await tester.drag(find.byType(ListView).first, const Offset(0, -250));
      await tester.pumpAndSettle();
      final vipHeader = find.text('GÓI HỘI VIÊN KÊNH (VIP)');
      expect(vipHeader, findsOneWidget);
      expect(find.text('Gói Tinh Hoa Sử Ký'), findsOneWidget);
      expect(find.text('49.000đ / tháng'), findsOneWidget);
    },
  );

  testWidgets(
    'Studio Page: Nút và Thẻ Quản lý Kênh điều hướng sang CreatorChannelPage',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      final mockHttp = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'data': {
              'id': 10,
              'creatorId': 42,
              'name': 'Đại Việt Sử Ký',
              'description': 'Kênh podcast lịch sử.',
              'status': 'ACTIVE',
            },
          }),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      final apiClient = ApiClient(preferences: prefs, httpClient: mockHttp);
      final channelRepo = ChannelRepository(client: apiClient);

      await tester.pumpWidget(
        MaterialApp(
          home: CreatorStudio(
            preferences: prefs,
            channelRepository: channelRepo,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Kiểm tra có nút [Quản lý Kênh]
      final channelMgmtBtn = find.byKey(const Key('open-channel-management-btn'));
      expect(channelMgmtBtn, findsOneWidget);

      await tester.tap(channelMgmtBtn);
      await tester.pumpAndSettle();

      // Điều hướng thành công đến CreatorChannelPage
      expect(find.text('Quản lý Kênh'), findsOneWidget);
      expect(find.byKey(const Key('upload-channel-cover-btn')), findsOneWidget);
    },
  );
}
