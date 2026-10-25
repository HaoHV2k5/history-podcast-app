import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/channel_repository.dart';
import 'package:su_ky_mobile_production/core/api/livestream_repository.dart';
import 'package:su_ky_mobile_production/core/api/membership_repository.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/livestream_page.dart';

void main() {
  setUp(() {
    remoteEpisodes.clear();
    remoteChannels.clear();
  });

  tearDown(() {
    remoteEpisodes.clear();
    remoteChannels.clear();
  });

  testWidgets(
    'Phân hệ 2: Khám phá Livestream, vào phòng nghe, gửi Live Chat, cổng VIP Hội viên và Tạo/Kết thúc phòng phát sóng',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      SharedPreferences.setMockInitialValues({'onboardingDone': true});
      final prefs = await SharedPreferences.getInstance();

      var leaveCalled = false;
      var endCalled = false;
      final sentChats = <Map<String, dynamic>>[];

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

        if (method == 'GET' && path == '/api/v1/channels') {
          return jsonUtf8({
            'data': [
              {
                'id': 10,
                'name': 'Dấu Ấn Lịch Sử',
                'description': 'Chuyện hậu trường cung đình và những bước ngoặt.',
                'avatarUrl': 'assets/images/hue-citadel.jpg',
                'coverUrl': 'assets/images/hue-citadel.jpg',
              },
            ],
          });
        }

        if (method == 'GET' &&
            path == '/api/v1/channels/10/memberships/membership-plans') {
          return jsonUtf8({
            'data': {
              'id': 501,
              'channelId': 10,
              'planName': 'Tri Âm Dấu Ấn',
              'monthlyPrice': 39000,
              'description': 'Mở khóa phòng trực tiếp VIP và tập chuyên sâu.',
              'perks': ['Tham gia Livestream VIP'],
              'isActive': true,
            },
          });
        }

        if (method == 'POST' &&
            path == '/api/v1/channels/10/memberships/subscribe') {
          return jsonUtf8({
            'data': {
              'subscriptionId': 9002,
              'channelId': 10,
              'channelName': 'Dấu Ấn Lịch Sử',
              'status': 'ACTIVE',
              'startedAt': '2026-10-25T12:00:00Z',
              'expiresAt': '2026-11-25T12:00:00Z',
            },
          });
        }

        if (method == 'GET' && path == '/api/v1/livestreams') {
          return jsonUtf8({
            'data': {
              'items': [
                {
                  'id': 101,
                  'channelId': 10,
                  'channelName': 'Dấu Ấn Lịch Sử',
                  'title': 'Bàn tròn lịch sử: Hải chiến Bạch Đằng 938',
                  'description': 'Giải mã trận địa cọc gỗ trên sông Bạch Đằng.',
                  'agoraChannelName': 'prm_live_10_101',
                  'isExclusive': false,
                  'status': 'LIVE',
                  'viewerCount': 42,
                },
                {
                  'id': 102,
                  'channelId': 10,
                  'channelName': 'Dấu Ấn Lịch Sử',
                  'title': 'Đêm cấm thành Huế: Tư liệu mật triều Nguyễn',
                  'description': 'Phiên thảo luận riêng cho hội viên kênh.',
                  'agoraChannelName': 'prm_live_10_102',
                  'isExclusive': true,
                  'status': 'LIVE',
                  'viewerCount': 18,
                },
              ],
              'page': 0,
              'size': 10,
              'totalElements': 2,
              'totalPages': 1,
            },
          });
        }

        if (method == 'POST' && path == '/api/v1/livestreams/101/join') {
          return jsonUtf8({
            'data': {
              'appId': 'agora_test_app',
              'token': 'rtc_token_101',
              'agoraChannelName': 'prm_live_10_101',
              'uid': 2001,
              'role': 'SUBSCRIBER',
              'expirationSeconds': 3600,
            },
          });
        }

        if (method == 'POST' && path == '/api/v1/livestreams/102/join') {
          return jsonUtf8({
            'data': {
              'appId': 'agora_test_app',
              'token': 'rtc_token_102',
              'agoraChannelName': 'prm_live_10_102',
              'uid': 2001,
              'role': 'SUBSCRIBER',
              'expirationSeconds': 3600,
            },
          });
        }

        if (method == 'GET' && path == '/api/v1/livestreams/101/chats') {
          return jsonUtf8({
            'data': [
              {
                'id': 'server-msg-1',
                'author': 'Sử gia Trần',
                'role': 'creator',
                'text': 'Chào mừng các thính giả đến với buổi phát trực tiếp!',
                'timestamp': 1700000001000,
                'timeFormatted': '20:00:01',
              },
            ],
          });
        }

        if (method == 'POST' && path == '/api/v1/livestreams/101/chats') {
          final payload = jsonDecode(request.body) as Map<String, dynamic>;
          sentChats.add(payload);
          return jsonUtf8({'data': null});
        }

        if (method == 'POST' && path == '/api/v1/livestreams/101/leave') {
          leaveCalled = true;
          return jsonUtf8({
            'data': {
              'id': 101,
              'channelId': 10,
              'channelName': 'Dấu Ấn Lịch Sử',
              'title': 'Bàn tròn lịch sử: Hải chiến Bạch Đằng 938',
              'agoraChannelName': 'prm_live_10_101',
              'isExclusive': false,
              'status': 'LIVE',
              'viewerCount': 42,
            },
          });
        }

        if (method == 'POST' && path == '/api/v1/livestreams') {
          final payload = jsonDecode(request.body) as Map<String, dynamic>;
          return jsonUtf8({
            'data': {
              'id': 205,
              'channelId': payload['channelId'] ?? 10,
              'channelName': 'Dấu Ấn Lịch Sử',
              'title': payload['title'],
              'description': payload['description'],
              'agoraChannelName': 'prm_live_10_205',
              'isExclusive': payload['isExclusive'] == true,
              'status': 'LIVE',
              'viewerCount': 1,
            },
          }, 201);
        }

        if (method == 'POST' && path == '/api/v1/livestreams/205/join') {
          return jsonUtf8({
            'data': {
              'appId': 'agora_test_app',
              'token': 'rtc_token_205_host',
              'agoraChannelName': 'prm_live_10_205',
              'uid': 1,
              'role': 'PUBLISHER',
              'expirationSeconds': 3600,
            },
          });
        }

        if (method == 'POST' && path == '/api/v1/livestreams/205/end') {
          endCalled = true;
          return jsonUtf8({
            'data': {
              'id': 205,
              'channelId': 10,
              'channelName': 'Dấu Ấn Lịch Sử',
              'title': 'Buổi kể chuyện mới từ Studio',
              'agoraChannelName': 'prm_live_10_205',
              'isExclusive': false,
              'status': 'ENDED',
              'viewerCount': 0,
            },
          });
        }

        return jsonUtf8({'data': []});
      });

      final apiClient = ApiClient(preferences: prefs, httpClient: mockHttp);
      final state = AppState(
        prefs,
        apiClient: apiClient,
        channelRepository: ChannelRepository(client: apiClient),
        membershipRepository: MembershipRepository(client: apiClient),
        livestreamRepository: LivestreamRepository(client: apiClient),
      );

      await state.initRealBackend();
      expect(state.activeLivestreams.length, 2);

      await tester.pumpWidget(SuKyApp(state: state));
      await tester.pumpAndSettle();

      // 1. Kệ "Đang phát trực tiếp" hiển thị trên màn hình Khám phá
      expect(find.text('Đang phát trực tiếp'), findsOneWidget);
      expect(
        find.text('Bàn tròn lịch sử: Hải chiến Bạch Đằng 938'),
        findsOneWidget,
      );

      // 2. Nhấn vào phòng phát sóng công khai (ID 101)
      await tester.ensureVisible(find.byKey(const Key('livestream-card-101')));
      await tester.tap(find.byKey(const Key('livestream-card-101')));
      await tester.pumpAndSettle();

      // Kiểm tra thông tin phòng và tin nhắn từ server
      expect(find.text('ĐANG PHÁT SÓNG'), findsOneWidget);
      expect(
        find.text('Chào mừng các thính giả đến với buổi phát trực tiếp!'),
        findsOneWidget,
      );
      expect(find.text('NGƯỜI KỂ'), findsOneWidget);

      // 3. Gửi tin nhắn Live Chat từ người xem
      await tester.enterText(
        find.byKey(const Key('livestream-chat-input')),
        'Cho mình hỏi thủy triều lúc đó rút vào giờ nào ạ?',
      );
      await tester.tap(find.byKey(const Key('livestream-chat-send')));
      await tester.pumpAndSettle();

      expect(
        find.text('Cho mình hỏi thủy triều lúc đó rút vào giờ nào ạ?'),
        findsOneWidget,
      );
      expect(sentChats.length, 1);
      expect(
        sentChats.first['text'],
        'Cho mình hỏi thủy triều lúc đó rút vào giờ nào ạ?',
      );

      // 4. Thoát phòng 101 -> gọi API leaveSession
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(leaveCalled, isTrue);

      // 5. Nhấn vào phòng VIP độc quyền (ID 102) khi chưa là hội viên -> Hiện cổng VIP
      await tester.ensureVisible(find.byKey(const Key('livestream-card-102')));
      await tester.tap(find.byKey(const Key('livestream-card-102')));
      await tester.pumpAndSettle();

      expect(find.text('PHÒNG TRỰC TIẾP ĐỘC QUYỀN · VIP'), findsOneWidget);
      expect(
        find.byKey(const Key('livestream-open-membership-btn')),
        findsOneWidget,
      );

      // Mở trang hội viên để kích hoạt gói rồi quay lại tự động vào phòng VIP
      await tester.tap(find.byKey(const Key('livestream-open-membership-btn')));
      await tester.pumpAndSettle();

      final memScrollable = find
          .descendant(
            of: find.byType(MembershipPage),
            matching: find.byType(Scrollable),
          )
          .first;
      await tester.scrollUntilVisible(
        find.byKey(const Key('checkout-start')),
        200,
        scrollable: memScrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('checkout-start')));
      await tester.pumpAndSettle();

      await tester.pageBack();
      await tester.pumpAndSettle();

      // Sau khi kích hoạt hội viên, phòng VIP 102 tự động mở khóa
      expect(find.text('HỘI VIÊN VIP'), findsOneWidget);

      await tester.pageBack();
      await tester.pumpAndSettle();

      // 6. Luồng Creator mở phiên phát sóng mới và kết thúc phát sóng
      await tester.pumpWidget(
        MaterialApp(
          home: CreativeWorkspacePage(state: state),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('open-livestream-studio')));
      await tester.pumpAndSettle();

      final studioScrollable = find
          .descendant(
            of: find.byType(CreatorLivestreamStudioPage),
            matching: find.byType(Scrollable),
          )
          .first;
      await tester.scrollUntilVisible(
        find.byKey(const Key('livestream-title-input')),
        200,
        scrollable: studioScrollable,
      );
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('livestream-title-input')),
        'Buổi kể chuyện mới từ Studio',
      );
      await tester.scrollUntilVisible(
        find.byKey(const Key('livestream-desc-input')),
        200,
        scrollable: studioScrollable,
      );
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('livestream-desc-input')),
        'Giao lưu tư liệu lịch sử trực tiếp.',
      );
      await tester.scrollUntilVisible(
        find.byKey(const Key('start-livestream-btn')),
        200,
        scrollable: studioScrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('start-livestream-btn')));
      await tester.pumpAndSettle();

      // Đang ở trong phòng phát sóng với quyền Host (PUBLISHER)
      expect(find.byKey(const Key('end-livestream-btn')), findsOneWidget);
      expect(find.byKey(const Key('host-mic-toggle')), findsOneWidget);

      // Kết thúc phiên phát sóng
      await tester.tap(find.byKey(const Key('end-livestream-btn')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('confirm-end-livestream-btn')));
      await tester.pumpAndSettle();

      expect(endCalled, isTrue);
      expect(state.activeLivestreams.any((s) => s.id == 205), isFalse);
    },
  );
}
