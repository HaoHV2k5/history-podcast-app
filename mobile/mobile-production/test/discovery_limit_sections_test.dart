import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/episode.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Discovery shows only 3 episodes and 3 channels initially, with toggle buttons to expand all', (tester) async {
    tester.view.physicalSize = const Size(414, 1500);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({'onboardingDone': true});
    final prefs = await SharedPreferences.getInstance();
    final apiClient = ApiClient(baseUrl: 'http://192.168.1.123:8080', preferences: prefs);
    final state = AppState(prefs, apiClient: apiClient);

    // Mock 6 remoteEpisodes and 5 remoteChannels
    remoteEpisodes.clear();
    for (int i = 1; i <= 6; i++) {
      remoteEpisodes.add(
        Episode(
          id: 'ep-$i',
          title: 'Tập Lịch Sử Thứ $i',
          channel: 'Kênh Sử Ký $i',
          image: 'https://example.com/img-$i.png',
          category: 'khang-chien',
          seconds: 300,
          description: 'Mô tả tập $i',
          chapters: const [],
        ),
      );
    }

    remoteChannels.clear();
    for (int i = 1; i <= 5; i++) {
      remoteChannels.add(
        Channel(
          'Kênh Sử Ký $i',
          'K',
          'https://example.com/avatar-$i.png',
          'Mô tả kênh $i',
          id: i,
        ),
      );
    }

    await tester.pumpWidget(MaterialApp(home: SuKyApp(state: state)));
    await tester.pumpAndSettle();

    // 1. Verify initially: 4th, 5th, 6th episodes are NOT rendered in the list
    expect(find.text('Tập Lịch Sử Thứ 4'), findsNothing);
    expect(find.text('Tập Lịch Sử Thứ 5'), findsNothing);
    expect(find.text('Tập Lịch Sử Thứ 6'), findsNothing);

    // Verify Expand Episodes button exists
    expect(find.byKey(const Key('expand-all-episodes-bottom-btn')), findsOneWidget);
    expect(find.text('Xem toàn bộ 6 tập mới nhất'), findsOneWidget);

    // Tap Expand Episodes
    await tester.ensureVisible(find.byKey(const Key('expand-all-episodes-bottom-btn')));
    await tester.tap(find.byKey(const Key('expand-all-episodes-bottom-btn')));
    await tester.pumpAndSettle();

    // Verify all 6 episodes are now visible
    expect(find.text('Tập Lịch Sử Thứ 4'), findsOneWidget);
    expect(find.text('Tập Lịch Sử Thứ 5'), findsOneWidget);
    expect(find.text('Tập Lịch Sử Thứ 6'), findsOneWidget);
    expect(find.text('Thu gọn danh sách tập'), findsOneWidget);

    // Tap Collapse Episodes
    await tester.tap(find.byKey(const Key('expand-all-episodes-bottom-btn')));
    await tester.pumpAndSettle();
    expect(find.text('Tập Lịch Sử Thứ 4'), findsNothing);
    expect(find.text('Tập Lịch Sử Thứ 5'), findsNothing);

    // 2. Verify Channels: initially 4th and 5th channels are NOT rendered
    expect(find.text('Kênh Sử Ký 1'), findsOneWidget);
    expect(find.text('Kênh Sử Ký 2'), findsOneWidget);
    expect(find.text('Kênh Sử Ký 3'), findsOneWidget);
    expect(find.text('Kênh Sử Ký 4'), findsNothing);
    expect(find.text('Kênh Sử Ký 5'), findsNothing);

    // Verify Expand Channels button exists
    expect(find.byKey(const Key('expand-all-channels-bottom-btn')), findsOneWidget);
    expect(find.text('Xem toàn bộ 5 kênh kể chuyện'), findsOneWidget);

    // Tap Expand Channels
    await tester.ensureVisible(find.byKey(const Key('expand-all-channels-bottom-btn')));
    await tester.tap(find.byKey(const Key('expand-all-channels-bottom-btn')));
    await tester.pumpAndSettle();

    // Verify all 5 channels are now shown
    expect(find.text('Kênh Sử Ký 4'), findsOneWidget);
    expect(find.text('Kênh Sử Ký 5'), findsOneWidget);
    expect(find.text('Thu gọn danh sách kênh'), findsOneWidget);

    // Tap Collapse Channels
    await tester.tap(find.byKey(const Key('expand-all-channels-bottom-btn')));
    await tester.pumpAndSettle();
    expect(find.text('Kênh Sử Ký 4'), findsNothing);
    expect(find.text('Kênh Sử Ký 5'), findsNothing);
  });
}
