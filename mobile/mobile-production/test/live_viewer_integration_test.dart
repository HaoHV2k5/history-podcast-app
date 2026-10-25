import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/channel_repository.dart';
import 'package:su_ky_mobile_production/core/api/comment_repository.dart';
import 'package:su_ky_mobile_production/core/api/content_repository.dart';
import 'package:su_ky_mobile_production/core/api/creator_series_repository.dart';
import 'package:su_ky_mobile_production/core/api/membership_repository.dart';
import 'package:su_ky_mobile_production/core/api/reaction_repository.dart';
import 'package:su_ky_mobile_production/core/api/transcript_repository.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/main.dart';

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
    'Phân hệ 1: Live Backend syncs episodes, channels, series, transcripts, reactions & membership plan cleanly',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      var subscribeCalled = false;
      var reactionCreated = false;

      http.Response jsonResponse(Map<String, dynamic> body) =>
          http.Response.bytes(
            utf8.encode(jsonEncode(body)),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );

      final mockHttp = MockClient((request) async {
        final path = request.url.path;
        final method = request.method.toUpperCase();

        if (method == 'GET' && path == '/api/v1/contents/search') {
          return jsonResponse({
            'success': true,
            'data': [
              {
                'contentId': 101,
                'artifactId': 501,
                'channelId': 10,
                'channelName': 'Sử Ký Đại Việt',
                'title': 'Bạch Đằng Giang · Ba lần sóng dậy',
                'description':
                    'Phân tích địa chiến lược cửa biển Bạch Đằng qua ba thời kỳ.',
                'status': 'PUBLISHED',
                'fileUrl': 'assets/audio/van-mieu-stone.wav',
                'durationSeconds': 420,
                'isExclusive': false,
                'likeCount': 88,
                'dislikeCount': 1,
                'commentCount': 2,
              },
            ],
          });
        }

        if (method == 'GET' && path == '/api/v1/channels') {
          return jsonResponse({
            'success': true,
            'data': [
              {
                'id': 10,
                'name': 'Sử Ký Đại Việt',
                'description':
                    'Chuyên trang lịch sử quân sự và bang giao Đại Việt.',
                'avatarUrl': 'assets/images/hue-citadel.jpg',
                'coverUrl': 'assets/images/hue-citadel.jpg',
                'status': 'ACTIVE',
              },
            ],
          });
        }

        if (method == 'GET' &&
            path == '/api/v1/channels/10/memberships/membership-plans') {
          return jsonResponse({
            'success': true,
            'data': {
              'id': 7,
              'channelId': 10,
              'planName': 'Hội viên Sử Ký Đại Việt',
              'monthlyPrice': 49000,
              'description': 'Mở khóa toàn bộ chuyên đề quân sự chuyên sâu.',
              'perks': [
                'Nghe sớm 48 giờ các tập chuyên đề',
                'Truy cập kho bản đồ cổ độ phân giải cao',
              ],
              'isActive': true,
            },
          });
        }

        if (method == 'POST' &&
            path == '/api/v1/channels/10/memberships/subscribe') {
          subscribeCalled = true;
          return jsonResponse({
            'success': true,
            'data': {
              'id': 900,
              'channelId': 10,
              'channelName': 'Sử Ký Đại Việt',
              'status': 'ACTIVE',
              'startDate': '2026-10-25T10:00:00Z',
            },
          });
        }

        if (method == 'GET' && path == '/api/v1/channels/10/series') {
          return jsonResponse({
            'success': true,
            'data': [
              {
                'id': 30,
                'channelId': 10,
                'channelName': 'Sử Ký Đại Việt',
                'title': 'Những trận thủy chiến định mệnh',
                'description': 'Tuyển tập 3 trận thủy chiến trên sông Bạch Đằng.',
                'coverUrl': 'assets/images/hue-citadel.jpg',
                'status': 'PUBLISHED',
                'itemCount': 1,
                'totalDurationSeconds': 420,
              },
            ],
          });
        }

        if (method == 'GET' && path == '/api/v1/series/30') {
          return jsonResponse({
            'success': true,
            'data': {
              'id': 30,
              'channelId': 10,
              'channelName': 'Sử Ký Đại Việt',
              'title': 'Những trận thủy chiến định mệnh',
              'description': 'Tuyển tập 3 trận thủy chiến trên sông Bạch Đằng.',
              'coverUrl': 'assets/images/hue-citadel.jpg',
              'status': 'PUBLISHED',
              'itemCount': 1,
              'totalDurationSeconds': 420,
              'items': [
                {
                  'id': 1,
                  'seriesId': 30,
                  'contentId': 101,
                  'orderNo': 1,
                  'title': 'Bạch Đằng Giang · Ba lần sóng dậy',
                  'description':
                      'Phân tích địa chiến lược cửa biển Bạch Đằng qua ba thời kỳ.',
                  'thumbnailUrl': 'assets/images/hue-citadel.jpg',
                  'mediaUrl': 'assets/audio/van-mieu-stone.wav',
                  'durationSeconds': 420,
                  'isExclusive': false,
                  'status': 'PUBLISHED',
                },
              ],
            },
          });
        }

        if (method == 'GET' && path == '/api/v1/transcripts') {
          return jsonResponse({
            'success': true,
            'data': [
              {
                'id': 1,
                'artifactId': 501,
                'textBody':
                    'Năm 938, Ngô Quyền cho đóng cọc gỗ lim bịt sắt tại cửa biển Bạch Đằng.',
              },
            ],
          });
        }

        if (method == 'GET' && path == '/api/v1/comments') {
          return jsonResponse({
            'success': true,
            'data': [
              {
                'id': 77,
                'artifactId': 501,
                'authorName': 'Độc giả Sử Ký',
                'textBody': 'Phân tích con nước thủy triều rất chuẩn xác.',
                'status': 'ACTIVE',
                'createdAt': '2026-10-25T08:00:00Z',
              },
            ],
          });
        }

        if (method == 'POST' && path == '/api/v1/reactions') {
          reactionCreated = true;
          return jsonResponse({
            'success': true,
            'data': {
              'id': 555,
              'artifactId': 501,
              'userId': 1,
              'type': 'LIKE',
            },
          });
        }

        return jsonResponse({'success': true, 'data': []});
      });

      final client = ApiClient(
        baseUrl: 'https://api.suky.test',
        preferences: prefs,
        httpClient: mockHttp,
      );

      final state = AppState(
        prefs,
        apiClient: client,
        contentRepository: ContentRepository(client),
        channelRepository: ChannelRepository(client: client),
        creatorSeriesRepository: CreatorSeriesRepository(client: client),
        membershipRepository: MembershipRepository(client: client),
        commentRepository: CommentRepository(client: client),
        transcriptRepository: TranscriptRepository(client: client),
        reactionRepository: ReactionRepository(client: client),
      );

      await state.initRealBackend();

      // Verify remoteEpisodes and remoteChannels were stored in allEpisodes & channels
      expect(state.isLiveBackend, isTrue);
      expect(
        allEpisodes.any((e) => e.title == 'Bạch Đằng Giang · Ba lần sóng dậy'),
        isTrue,
      );
      expect(channels.any((c) => c.name == 'Sử Ký Đại Việt'), isTrue);
      expect(channelByName('Sử Ký Đại Việt').id, 10);

      await tester.pumpWidget(SuKyApp(state: state));
      await tester.pumpAndSettle();

      // Verify DemoNote is hidden in Live Backend mode
      expect(
        find.text('Bản thử giao diện · Tên kênh và tập là dữ liệu mẫu.'),
        findsNothing,
      );

      // Verify remote episode appears on Discover tab
      expect(find.text('Bạch Đằng Giang · Ba lần sóng dậy'), findsWidgets);

      // Open EpisodePage for the remote episode
      final remoteEp = allEpisodes.firstWhere((e) => e.id == '501');
      final ctx = tester.element(find.byType(HomeShell));
      Navigator.of(ctx).push(
        MaterialPageRoute<void>(
          builder: (_) => EpisodePage(episode: remoteEp, state: state),
        ),
      );
      await tester.pumpAndSettle();

      // Production button text (not 'Nghe audio thử')
      expect(find.text('Nghe tập này'), findsOneWidget);
      expect(find.text('88 thích'), findsOneWidget);

      // Like episode syncs with ReactionRepository
      await tester.tap(find.byKey(const Key('like-episode')));
      await tester.pumpAndSettle();
      expect(reactionCreated, isTrue);
      expect(find.text('89 thích'), findsOneWidget);

      // Scroll down to Episode tabs and tap Transcript tab (episode-tab-3)
      final epScrollable = find
          .descendant(
            of: find.byType(EpisodePage),
            matching: find.byType(Scrollable),
          )
          .first;
      await tester.drag(epScrollable, const Offset(0, -320));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('episode-tab-3')));
      await tester.pumpAndSettle();
      expect(
        find.textContaining('Năm 938, Ngô Quyền cho đóng cọc gỗ lim'),
        findsOneWidget,
      );

      // Open ChannelPage for 'Sử Ký Đại Việt'
      Navigator.of(ctx).push(
        MaterialPageRoute<void>(
          builder: (_) => ChannelPage(
            channel: channelByName('Sử Ký Đại Việt'),
            state: state,
            onEpisode: (_) {},
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Series shelf & real Membership plan banner appear on ChannelPage
      expect(find.text('Series chuyên đề'), findsOneWidget);
      expect(find.text('Những trận thủy chiến định mệnh'), findsOneWidget);
      expect(
        find.textContaining('Hội viên Sử Ký Đại Việt · 49.000đ/tháng'),
        findsOneWidget,
      );

      // Tap Series to open SeriesDetailPage
      await tester.ensureVisible(
        find.text('Những trận thủy chiến định mệnh'),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Những trận thủy chiến định mệnh'));
      await tester.pumpAndSettle();
      expect(find.byType(SeriesDetailPage), findsOneWidget);
      expect(find.byKey(const Key('play-series-btn')), findsOneWidget);
      Navigator.of(ctx).pop();
      await tester.pumpAndSettle();

      // Open MembershipPage and subscribe with real backend
      Navigator.of(ctx).push(
        MaterialPageRoute<void>(
          builder: (_) => MembershipPage(
            channel: channelByName('Sử Ký Đại Việt'),
            state: state,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('membership-plan-price')), findsOneWidget);
      expect(
        find.text('Nghe sớm 48 giờ các tập chuyên đề'),
        findsOneWidget,
      );
      // Mock simulation toggles are hidden in Live Backend mode
      expect(find.text('Đổi quyền trực tiếp để test'), findsNothing);

      final memScrollable = find
          .descendant(
            of: find.byType(MembershipPage),
            matching: find.byType(Scrollable),
          )
          .first;
      await tester.scrollUntilVisible(
        find.byKey(const Key('checkout-start')),
        250,
        scrollable: memScrollable,
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('checkout-start')));
      await tester.pumpAndSettle();

      expect(subscribeCalled, isTrue);
      expect(state.memberships.contains('Sử Ký Đại Việt'), isTrue);

      await tester.pumpWidget(const SizedBox());
      state.dispose();
    },
  );
}
