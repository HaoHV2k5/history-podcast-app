import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Unauthenticated user is gated from creating video and starting live', (tester) async {
    tester.view.physicalSize = const Size(414, 896);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({
      'onboardingDone': true,
      'isLoggedIn': false,
    });
    final prefs = await SharedPreferences.getInstance();
    final apiClient = ApiClient(baseUrl: 'http://192.168.1.123:8080', preferences: prefs);
    final state = AppState(prefs, apiClient: apiClient);

    await tester.pumpWidget(
      MaterialApp(
        home: SuKyApp(state: state),
      ),
    );
    await tester.pumpAndSettle();

    // Tab 0 (Khám phá): normal discovery view is accessible to guest
    expect(find.text('Sử Ký'), findsWidgets);

    // Switch to Tab 2 (Tạo video)
    await tester.tap(find.byKey(const ValueKey('home-nav-2')));
    await tester.pumpAndSettle();

    // Verify CreatorStudioAuthGate is shown instead of AiWhiteboardPipelinePage
    expect(find.byKey(const Key('creator-studio-auth-gate')), findsOneWidget);
    expect(find.byKey(const Key('ai-pipeline-page')), findsNothing);
    expect(find.text('Đăng nhập vào Xưởng Video AI'), findsOneWidget);
    expect(find.byKey(const Key('creator-gate-login-btn')), findsOneWidget);

    // Tap login button on gate
    await tester.ensureVisible(find.byKey(const Key('creator-gate-login-btn')));
    await tester.tap(find.byKey(const Key('creator-gate-login-btn')));
    await tester.pumpAndSettle();

    // Verify AuthSheet opens
    expect(find.byType(AuthSheet), findsOneWidget);

    // Dismiss AuthSheet
    Navigator.of(tester.element(find.byType(AuthSheet))).pop();
    await tester.pumpAndSettle();

    // Switch to Tab 1 (Trực tiếp)
    await tester.tap(find.byKey(const ValueKey('home-nav-1')));
    await tester.pumpAndSettle();

    expect(find.text('Trực tiếp'), findsWidgets);
    expect(find.byKey(const Key('open-live-studio-btn')), findsOneWidget);

    // Tap "Mở phòng live" as unauthenticated user
    await tester.ensureVisible(find.byKey(const Key('open-live-studio-btn')));
    await tester.tap(find.byKey(const Key('open-live-studio-btn')));
    await tester.pumpAndSettle();

    // Verify AuthSheet opens and warning snackbar is shown
    expect(find.byType(AuthSheet), findsOneWidget);
    expect(find.textContaining('Vui lòng đăng nhập'), findsOneWidget);
  });

  testWidgets('Authenticated Creator accesses video creation pipeline and live studio', (tester) async {
    tester.view.physicalSize = const Size(414, 896);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({
      'onboardingDone': true,
      'isLoggedIn': true,
      'isCreator': true,
      'userRoles': ['CREATOR', 'VIEWER'],
    });
    final prefs = await SharedPreferences.getInstance();
    final apiClient = ApiClient(baseUrl: 'http://192.168.1.123:8080', preferences: prefs);
    final state = AppState(prefs, apiClient: apiClient);

    await tester.pumpWidget(
      MaterialApp(
        home: SuKyApp(state: state),
      ),
    );
    await tester.pumpAndSettle();

    // Switch to Tab 2 (Tạo video)
    await tester.tap(find.byKey(const ValueKey('home-nav-2')));
    await tester.pumpAndSettle();

    // Verify AiWhiteboardPipelinePage is rendered directly
    expect(find.byKey(const Key('ai-pipeline-page')), findsOneWidget);
    expect(find.byKey(const Key('creator-studio-auth-gate')), findsNothing);
  });
}
