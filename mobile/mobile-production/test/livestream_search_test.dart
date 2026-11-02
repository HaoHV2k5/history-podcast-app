import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/livestream_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Livestream search filters active rooms and handles empty search state', (tester) async {
    tester.view.physicalSize = const Size(414, 1000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({'onboardingDone': true});
    final prefs = await SharedPreferences.getInstance();
    final apiClient = ApiClient(baseUrl: 'http://192.168.1.123:8080', preferences: prefs);
    final state = AppState(prefs, apiClient: apiClient);

    // Mock active livestream sessions
    state.activeLivestreams.clear();
    state.activeLivestreams.addAll([
      LivestreamSessionModel(
        id: 101,
        channelId: 1,
        channelName: 'Sử Việt Hào Hùng',
        title: 'Đàm đạo Chiến dịch Điện Biên Phủ',
        description: 'Phân tích chiến thuật quân sự',
        agoraChannelName: 'live_101',
        status: 'LIVE',
        isExclusive: false,
        viewerCount: 42,
      ),
      LivestreamSessionModel(
        id: 102,
        channelId: 2,
        channelName: 'Huyền Thoại Bạch Đằng',
        title: 'Khởi nghĩa Lam Sơn & Nghệ thuật Quân sự',
        description: 'Bình định vương Lê Lợi',
        agoraChannelName: 'live_102',
        status: 'LIVE',
        isExclusive: true,
        viewerCount: 15,
      ),
    ]);

    await tester.pumpWidget(MaterialApp(home: SuKyApp(state: state)));
    await tester.pumpAndSettle();

    // Switch to Tab 1 (Trực tiếp)
    await tester.tap(find.byKey(const ValueKey('home-nav-1')));
    await tester.pumpAndSettle();

    // 1. Verify Search input is present and both sessions are visible
    expect(find.byKey(const Key('livestream-search-input')), findsOneWidget);
    expect(find.text('Đàm đạo Chiến dịch Điện Biên Phủ'), findsOneWidget);
    expect(find.text('Khởi nghĩa Lam Sơn & Nghệ thuật Quân sự'), findsOneWidget);

    // 2. Search for "Điện Biên"
    await tester.enterText(find.byKey(const Key('livestream-search-input')), 'Điện Biên');
    await tester.pumpAndSettle();

    // Verify only the matching room is shown
    expect(find.text('Đàm đạo Chiến dịch Điện Biên Phủ'), findsOneWidget);
    expect(find.text('Khởi nghĩa Lam Sơn & Nghệ thuật Quân sự'), findsNothing);

    // 3. Search for keyword that does not match
    await tester.enterText(find.byKey(const Key('livestream-search-input')), 'Tây Sơn');
    await tester.pumpAndSettle();

    // Verify search empty state
    expect(find.text('Không tìm thấy phòng live'), findsOneWidget);
    expect(find.byKey(const Key('livestream-reset-filters-btn')), findsOneWidget);

    // 4. Tap reset button
    await tester.tap(find.byKey(const Key('livestream-reset-filters-btn')));
    await tester.pumpAndSettle();

    // Verify both rooms reappear
    expect(find.text('Đàm đạo Chiến dịch Điện Biên Phủ'), findsOneWidget);
    expect(find.text('Khởi nghĩa Lam Sơn & Nghệ thuật Quân sự'), findsOneWidget);
  });
}

