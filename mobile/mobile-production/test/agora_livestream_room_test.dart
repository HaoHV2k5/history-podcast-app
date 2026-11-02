import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/core/api/livestream_repository.dart';
import 'package:su_ky_mobile_production/livestream_page.dart';
import 'package:su_ky_mobile_production/mock/services/app_state.dart';

void main() {
  testWidgets('LivestreamRoomPage renders host studio with Agora controls and camera view',
      (tester) async {
    tester.view.physicalSize = const Size(414, 896);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({'onboardingDone': true});
    final prefs = await SharedPreferences.getInstance();
    final state = AppState(prefs);

    final session = LivestreamSessionModel(
      id: 991,
      channelId: 1,
      channelName: 'Sử Ký Tiền Lê',
      title: 'Đàm đạo Sử Ký: Khởi nghĩa Lam Sơn & Nghệ thuật Quân sự',
      agoraChannelName: 'livestream_session_991',
      status: 'LIVE',
      viewerCount: 15,
    );
    state.activeLivestreams.add(session);

    await tester.pumpWidget(
      MaterialApp(
        home: LivestreamRoomPage(
          session: session,
          state: state,
          isHost: true,
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Verify header and live badges
    expect(find.text('ĐANG PHÁT SÓNG'), findsOneWidget);
    expect(find.byKey(const Key('livestream-camera-view')), findsOneWidget);

    // Verify host studio toolbar controls
    expect(find.byKey(const Key('host-mic-toggle')), findsOneWidget);
    expect(find.byKey(const Key('host-camera-toggle')), findsOneWidget);
    expect(find.byKey(const Key('host-screenshare-toggle')), findsOneWidget);

    // Test mic toggle
    await tester.tap(find.byKey(const Key('host-mic-toggle')), warnIfMissed: false);
    await tester.pump();

    // Test camera toggle
    await tester.tap(find.byKey(const Key('host-camera-toggle')), warnIfMissed: false);
    await tester.pump();

    // Verify live chat section
    expect(find.text('TRÒ CHUYỆN TRỰC TIẾP'), findsOneWidget);
    expect(find.byKey(const Key('livestream-chat-input')), findsOneWidget);
    expect(find.byKey(const Key('livestream-chat-send')), findsOneWidget);
  });

  testWidgets('LivestreamRoomPage renders viewer stage with audio mute button and chat',
      (tester) async {
    tester.view.physicalSize = const Size(414, 896);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({'onboardingDone': true});
    final prefs = await SharedPreferences.getInstance();
    final state = AppState(prefs);

    final session = LivestreamSessionModel(
      id: 992,
      channelId: 1,
      channelName: 'Sử Ký Tiền Lê',
      title: 'Hùng ca Điện Biên Phủ 1954',
      agoraChannelName: 'livestream_session_992',
      status: 'LIVE',
      viewerCount: 42,
    );
    state.activeLivestreams.add(session);

    await tester.pumpWidget(
      MaterialApp(
        home: LivestreamRoomPage(
          session: session,
          state: state,
          isHost: false,
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Verify viewer stage
    expect(find.byKey(const Key('livestream-camera-view')), findsOneWidget);
    expect(find.byKey(const Key('viewer-audio-toggle')), findsOneWidget);

    // Tap audio mute toggle
    await tester.tap(find.byKey(const Key('viewer-audio-toggle')));
    await tester.pump();

    // Host controls should NOT be visible to viewer
    expect(find.byKey(const Key('host-mic-toggle')), findsNothing);
    expect(find.byKey(const Key('host-camera-toggle')), findsNothing);
  });
}
