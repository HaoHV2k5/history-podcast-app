import 'dart:convert';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/channel_repository.dart';
import 'package:su_ky_mobile_production/core/api/livestream_repository.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/mock/services/app_state.dart';
import 'package:su_ky_mobile_production/notification_page.dart';

void main() {
  testWidgets('Follow sync with backend API, Notifications for followed channels, and PlayerPage comments sheet', (tester) async {
    tester.view.physicalSize = const Size(414, 896);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({'onboardingDone': true});
    final prefs = await SharedPreferences.getInstance();

    final followedApiCalls = <String>[];
    final mockHttp = MockClient((request) async {
      followedApiCalls.add('${request.method} ${request.url.path}');
      if (request.url.path == '/api/v1/channels/followed') {
        return http.Response(
          jsonEncode({
            'code': 200,
            'message': 'Success',
            'data': [
              {
                'id': 10,
                'name': 'Sử Ký Tiền Lê',
                'description': 'Kênh podcast lịch sử Tiền Lê',
                'followerCount': 100,
              }
            ],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (request.url.path.contains('/follow')) {
        return http.Response(
          jsonEncode({'code': 200, 'message': 'OK', 'data': null}),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      return http.Response(
        jsonEncode({'code': 200, 'message': 'OK', 'data': []}),
        200,
        headers: {'content-type': 'application/json'},
      );
    });

    final apiClient = ApiClient(preferences: prefs, httpClient: mockHttp);
    final channelRepo = ChannelRepository(client: apiClient);

    final state = AppState(
      prefs,
      apiClient: apiClient,
      channelRepository: channelRepo,
    );
    state.isLoggedIn = true;

    // --- 1. Test ChannelRepository follow/unfollow and getFollowedChannels ---
    await channelRepo.followChannel(10);
    expect(followedApiCalls.contains('POST /api/v1/channels/10/follow'), isTrue);

    await channelRepo.unfollowChannel(10);
    expect(followedApiCalls.contains('DELETE /api/v1/channels/10/follow'), isTrue);

    final followedList = await channelRepo.getFollowedChannels();
    expect(followedList.length, 1);
    expect(followedList.first.name, 'Sử Ký Tiền Lê');
    expect(followedList.first.followerCount, 100);

    // --- 2. Test toggleFollow in AppState ---
    remoteChannels.clear();
    remoteChannels.add(
      const Channel(
        'Sử Ký Tiền Lê',
        'T',
        '',
        'Kênh podcast lịch sử Tiền Lê',
        id: 10,
        followerCount: 100,
      ),
    );
    expect(state.followed.contains('Sử Ký Tiền Lê'), isFalse);

    // Follow channel
    state.toggleFollow('Sử Ký Tiền Lê');
    expect(state.followed.contains('Sử Ký Tiền Lê'), isTrue);
    expect(remoteChannels.first.followerCount, 101);

    // Unfollow channel
    state.toggleFollow('Sử Ký Tiền Lê');
    expect(state.followed.contains('Sử Ký Tiền Lê'), isFalse);
    expect(remoteChannels.first.followerCount, 100);

    // Set followed again for notification test
    state.followed.add('Sử Ký Tiền Lê');

    // --- 3. Test NotificationPage displays followed channel live & episode ---
    state.activeLivestreams.clear();
    state.activeLivestreams.add(
      LivestreamSessionModel(
        id: 55,
        channelId: 10,
        channelName: 'Sử Ký Tiền Lê',
        title: 'Trực tiếp Chiến thắng Bạch Đằng',
        status: 'LIVE',
        agoraChannelName: 'live_55',
        viewerCount: 20,
      ),
    );

    remoteEpisodes.clear();
    remoteEpisodes.add(
      const Episode(
        id: 'ep-99',
        title: 'Khái lược chiến dịch Như Nguyệt 1077',
        channel: 'Sử Ký Tiền Lê',
        category: 'Lịch sử',
        seconds: 1500,
        chapters: [],
        image: 'assets/images/hue-citadel.jpg',
        description: 'Tập đặc biệt về phòng tuyến Như Nguyệt.',
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: NotificationPage(state: state),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Kênh Sử Ký Tiền Lê đang phát trực tiếp'), findsOneWidget);
    expect(find.text('Tập mới từ kênh Sử Ký Tiền Lê'), findsOneWidget);

    // --- 4. Test PlayerPage comments button and comments sheet ---
    state.current = remoteEpisodes.first;
    state.playing = true;

    await tester.pumpWidget(
      MaterialApp(
        home: PlayerPage(state: state),
      ),
    );
    await tester.pumpAndSettle();

    // Verify player comments button
    final commentsBtn = find.byKey(const Key('player-comments-btn'));
    expect(commentsBtn, findsOneWidget);

    // Open comments bottom sheet
    await tester.tap(commentsBtn);
    await tester.pumpAndSettle();

    expect(find.textContaining('Bình luận'), findsWidgets);
    expect(find.byKey(const Key('comment-input')), findsOneWidget);
    expect(find.byKey(const Key('submit-comment-btn')), findsOneWidget);
  });
}
