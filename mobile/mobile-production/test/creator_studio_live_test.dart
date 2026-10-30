import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/channel_repository.dart';
import 'package:su_ky_mobile_production/core/api/creator_series_repository.dart';
import 'package:su_ky_mobile_production/core/api/creator_studio_repository.dart';
import 'package:su_ky_mobile_production/creator_studio_extensions.dart';
import 'package:su_ky_mobile_production/studio_pages.dart';

void main() {
  testWidgets(
    'Phân hệ 3: Creator Studio nối thật Quản lý Kênh, Gói Hội viên, Series và AI Whiteboard Pipeline 6 bước',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      var planSaved = false;
      var seriesCreated = false;
      var seriesDeleted = false;
      var settingsSaved = false;
      var storyboardCalled = false;
      var verifyCalled = false;
      var renderCalled = false;
      var jobPolled = false;
      var publishSubmitted = false;

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
              'name': 'Sử Việt Toàn Thư',
              'description': 'Kênh chuyên khảo lịch sử cổ trung đại Việt Nam.',
              'avatarUrl': 'assets/images/hue-citadel.jpg',
              'coverUrl': 'assets/images/hue-citadel.jpg',
              'status': 'ACTIVE',
            },
          });
        }

        if (method == 'GET' &&
            path == '/api/v1/channels/10/memberships/membership-plans') {
          return jsonUtf8({
            'data': {
              'id': 501,
              'channelId': 10,
              'planName': 'Tri Âm Sử Việt',
              'monthlyPrice': 39000,
              'description': 'Mở khóa toàn bộ tập chuyên sâu.',
              'perks': ['Nghe sớm 48 giờ'],
              'isActive': true,
            },
          });
        }

        if (method == 'POST' &&
            path == '/api/v1/channels/10/memberships/membership-plans') {
          planSaved = true;
          final payload = jsonDecode(request.body) as Map<String, dynamic>;
          return jsonUtf8({
            'data': {
              'id': 501,
              'channelId': 10,
              'planName': payload['name'],
              'monthlyPrice': payload['monthlyPrice'],
              'description': payload['description'],
              'perks': payload['perks'],
              'isActive': payload['status'] == 'ACTIVE',
            },
          });
        }

        if (method == 'GET' && path == '/api/v1/creator/series') {
          return jsonUtf8({
            'data': [
              {
                'id': 301,
                'channelId': 10,
                'channelName': 'Sử Việt Toàn Thư',
                'title': 'Ba lần kháng chiến chống Nguyên Mông',
                'description': 'Hào khí Đông A thế kỷ XIII.',
                'status': 'PUBLISHED',
                'itemCount': 3,
                'totalDurationSeconds': 1800,
              },
            ],
          });
        }

        if (method == 'POST' && path == '/api/v1/creator/series') {
          seriesCreated = true;
          final payload = jsonDecode(request.body) as Map<String, dynamic>;
          return jsonUtf8({
            'data': {
              'id': 302,
              'channelId': 10,
              'channelName': 'Sử Việt Toàn Thư',
              'title': payload['title'],
              'description': payload['description'],
              'status': 'PUBLISHED',
              'itemCount': 0,
              'totalDurationSeconds': 0,
            },
          });
        }

        if (method == 'DELETE' && path == '/api/v1/creator/series/301') {
          seriesDeleted = true;
          return jsonUtf8({'data': null});
        }

        if (method == 'GET' && path == '/api/v1/creator/studio/settings') {
          return jsonUtf8({
            'data': {
              'preferredVoiceId': 'vi-VN-NamMinhNeural',
              'voiceProvider': 'EDGE_TTS',
            },
          });
        }

        if (method == 'PUT' && path == '/api/v1/creator/studio/settings') {
          settingsSaved = true;
          return jsonUtf8({
            'data': {
              'preferredVoiceId': 'vi-VN-NamMinhNeural',
              'voiceProvider': 'EDGE_TTS',
            },
          });
        }

        if (method == 'GET' && path == '/api/v1/creator/studio/voices') {
          return jsonUtf8({
            'data': [
              {
                'voiceId': 'vi-VN-NamMinhNeural',
                'name': 'Nam Minh · Trầm ấm sử thi',
                'provider': 'EDGE_TTS',
              },
            ],
          });
        }

        if (method == 'GET' && path == '/api/v1/creator/studio/videos') {
          return jsonUtf8({
            'data': [
              {
                'contentId': 701,
                'artifactId': 801,
                'channelId': 10,
                'channelName': 'Sử Việt Toàn Thư',
                'title': 'Chiến dịch Chi Lăng - Xương Giang 1427',
                'status': 'PROCESSING',
                'aiShieldTierLabel': 'Đạt chuẩn sử liệu (98%)',
              },
            ],
          });
        }

        if (method == 'POST' && path == '/api/v1/creator/studio/storyboard') {
          storyboardCalled = true;
          return jsonUtf8({
            'data': {
              'topic': 'Chiến dịch Chi Lăng 1427',
              'summary': 'Phân cảnh phục kích Liễu Thăng tại ải Chi Lăng.',
              'scenes': [
                {'sceneNo': 1, 'narration': 'Mùa thu năm 1427 tại ải Chi Lăng.'},
              ],
            },
          });
        }

        if (method == 'POST' &&
            path == '/api/v1/creator/studio/verify-script') {
          verifyCalled = true;
          return jsonUtf8({
            'data': {
              'verified': true,
              'accuracyScore': 98,
              'feedback': 'Chính xác theo Đại Việt Sử Ký Toàn Thư.',
            },
          });
        }

        if (method == 'POST' && path == '/api/v1/creator/studio/render') {
          renderCalled = true;
          return jsonUtf8({
            'data': {
              'jobId': 'job-999',
              'contentId': 701,
              'artifactId': 801,
              'channelId': 10,
              'status': 'PROCESSING',
              'message': 'Đang dựng video bảng trắng',
            },
          });
        }

        if (method == 'GET' && path == '/api/v1/creator/studio/jobs/job-999') {
          jobPolled = true;
          return jsonUtf8({
            'data': {
              'jobId': 'job-999',
              'status': 'COMPLETED',
              'progress': 100,
            },
          });
        }

        if (method == 'POST' &&
            path == '/api/v1/creator/studio/videos/701/submit-publish') {
          publishSubmitted = true;
          return jsonUtf8({
            'data': {
              'contentId': 701,
              'title': 'Chiến dịch Chi Lăng - Xương Giang 1427',
              'status': 'PUBLISHED',
              'aiShieldTierLabel': 'Đã duyệt AI Shield · Xuất bản',
            },
          });
        }

        return jsonUtf8({'data': null});
      });

      final apiClient = ApiClient(preferences: prefs, httpClient: mockHttp);

      await tester.pumpWidget(
        MaterialApp(
          home: CreatorStudio(
            preferences: prefs,
            channelRepository: ChannelRepository(client: apiClient),
            creatorSeriesRepository: CreatorSeriesRepository(client: apiClient),
            creatorStudioRepository: CreatorStudioRepository(client: apiClient),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Kênh từ Backend tự động hiển thị
      expect(find.text('Sử Việt Toàn Thư'), findsOneWidget);
      expect(find.text('Gói Hội viên · 39000đ'), findsOneWidget);
      expect(find.text('Series (1)'), findsOneWidget);

      // 2. Mở cấu hình Gói Hội viên tháng & cập nhật mức giá 59000đ
      await tester.tap(find.byKey(const Key('open-membership-plan-btn')));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('plan-price-input')),
        '59000',
      );
      await tester.tap(find.byKey(const Key('save-membership-plan-btn')));
      await tester.pumpAndSettle();

      expect(planSaved, isTrue);
      expect(find.text('Gói Hội viên · 59000đ'), findsOneWidget);

      // 3. Mở trang Quản lý Series -> Tạo mới & Xóa Series
      await tester.tap(find.byKey(const Key('open-series-manager-btn')));
      await tester.pumpAndSettle();

      expect(
        find.text('Ba lần kháng chiến chống Nguyên Mông'),
        findsOneWidget,
      );

      await tester.enterText(
        find.byKey(const Key('series-title-input')),
        'Khởi nghĩa Lam Sơn (1418 - 1427)',
      );
      await tester.enterText(
        find.byKey(const Key('series-desc-input')),
        'Hành trình 10 năm giải phóng Đông Quan.',
      );
      await tester.tap(find.byKey(const Key('submit-create-series-btn')));
      await tester.pumpAndSettle();

      expect(seriesCreated, isTrue);
      expect(find.text('Khởi nghĩa Lam Sơn (1418 - 1427)'), findsOneWidget);

      final seriesScrollable = find
          .descendant(
            of: find.byType(CreatorSeriesManagerPage),
            matching: find.byType(Scrollable),
          )
          .first;
      await tester.scrollUntilVisible(
        find.byKey(const Key('delete-series-301')),
        200,
        scrollable: seriesScrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('delete-series-301')));
      await tester.pumpAndSettle();
      expect(seriesDeleted, isTrue);

      await tester.pageBack();
      await tester.pumpAndSettle();

      // 4. Mở Xưởng AI Studio 6 bước và chạy toàn bộ Pipeline
      await tester.tap(find.byKey(const Key('open-ai-pipeline-btn')));
      await tester.pumpAndSettle();

      final aiScrollable = find
          .descendant(
            of: find.byType(AiWhiteboardPipelinePage),
            matching: find.byType(Scrollable),
          )
          .first;

      // Bước 1: Lưu cấu hình giọng đọc AI
      await tester.tap(find.byKey(const Key('save-ai-settings-btn')));
      await tester.pumpAndSettle();
      expect(settingsSaved, isTrue);

      // Bước 2: Sinh Storyboard RAG
      await tester.scrollUntilVisible(
        find.byKey(const Key('ai-topic-input')),
        80,
        scrollable: aiScrollable,
      );
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('ai-topic-input')),
        'Chiến dịch Chi Lăng 1427',
      );
      await tester.scrollUntilVisible(
        find.byKey(const Key('generate-storyboard-btn')),
        80,
        scrollable: aiScrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('generate-storyboard-btn')));
      await tester.pumpAndSettle();
      expect(storyboardCalled, isTrue);
      expect(find.byKey(const Key('storyboard-preview-box')), findsOneWidget);

      // Bước 3: Thẩm định kịch bản sử liệu
      await tester.scrollUntilVisible(
        find.byKey(const Key('verify-script-btn')),
        80,
        scrollable: aiScrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('verify-script-btn')));
      await tester.pumpAndSettle();
      expect(verifyCalled, isTrue);
      expect(find.byKey(const Key('verification-result-box')), findsOneWidget);

      // Bước 4: Khởi chạy Render Video
      await tester.scrollUntilVisible(
        find.byKey(const Key('start-render-btn')),
        80,
        scrollable: aiScrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('start-render-btn')));
      await tester.pumpAndSettle();
      expect(renderCalled, isTrue);
      expect(find.byKey(const Key('render-job-status')), findsOneWidget);

      // Bước 5: Cập nhật tiến độ Render Job
      await tester.scrollUntilVisible(
        find.byKey(const Key('poll-render-job-btn')),
        80,
        scrollable: aiScrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('poll-render-job-btn')));
      await tester.pumpAndSettle();
      expect(jobPolled, isTrue);
      expect(find.textContaining('COMPLETED'), findsOneWidget);

      // Bước 6: Gửi duyệt AI Shield & Xuất bản Video
      await tester.scrollUntilVisible(
        find.byKey(const Key('submit-publish-video-701')),
        80,
        scrollable: aiScrollable,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('submit-publish-video-701')));
      await tester.pumpAndSettle();
      expect(publishSubmitted, isTrue);
      expect(
        find.textContaining('Đã duyệt AI Shield · Xuất bản'),
        findsOneWidget,
      );
    },
  );
}
