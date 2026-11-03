import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/video_surface.dart';

void main() {
  testWidgets('FullscreenVideoPage opens, renders overlay and exits cleanly', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final state = AppState(prefs);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: VideoSurface(state: state),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Verify fullscreen button exists
    expect(find.byKey(const Key('video-fullscreen')), findsOneWidget);

    // Tap fullscreen
    await tester.tap(find.byKey(const Key('video-fullscreen')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // Verify FullscreenVideoPage is displayed
    expect(find.byType(FullscreenVideoPage), findsOneWidget);
    expect(find.byKey(const Key('fullscreen-back-btn')), findsOneWidget);
    expect(find.byKey(const Key('fullscreen-exit-btn')), findsOneWidget);

    // Exit fullscreen
    await tester.tap(find.byKey(const Key('fullscreen-exit-btn')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump();

    // Verify returned to regular page
    expect(find.byType(FullscreenVideoPage), findsNothing);
    expect(find.byKey(const Key('video-fullscreen')), findsOneWidget);
  });
}
