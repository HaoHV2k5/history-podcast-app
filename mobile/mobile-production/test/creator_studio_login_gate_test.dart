import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'Unauthenticated user is gated from creating video and starting live',
    (tester) async {
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
      final apiClient = ApiClient(
        baseUrl: 'http://192.168.1.123:8080',
        preferences: prefs,
      );
      final state = AppState(prefs, apiClient: apiClient);

      await tester.pumpWidget(MaterialApp(home: SuKyApp(state: state)));
      await tester.pumpAndSettle();

      // Tab 0 (Khám phá): normal discovery view is accessible to guest
      expect(find.text('Sử Ký'), findsWidgets);

      // Tap Tab 2 (Tạo video) as unauthenticated user -> immediately opens AuthSheet!
      await tester.tap(find.byKey(const ValueKey('home-nav-2')));
      await tester.pumpAndSettle();

      // Verify AuthSheet opens immediately without needing to click inside the page
      expect(find.byType(AuthSheet), findsOneWidget);
      expect(find.text('Đăng nhập Sử Ký'), findsOneWidget);

      // Dismiss AuthSheet
      Navigator.of(tester.element(find.byType(AuthSheet))).pop();
      await tester.pumpAndSettle();

      // User remains on Tab 0 (Khám phá) because they did not log in
      expect(find.text('Sử Ký'), findsWidgets);

      // Tap Tab 1 (Trực tiếp) as unauthenticated user -> immediately opens AuthSheet!
      await tester.tap(find.byKey(const ValueKey('home-nav-1')));
      await tester.pumpAndSettle();

      // Verify AuthSheet opens immediately without needing to click inside
      expect(find.byType(AuthSheet), findsOneWidget);
      expect(find.text('Đăng nhập Sử Ký'), findsOneWidget);

      // Dismiss AuthSheet
      Navigator.of(tester.element(find.byType(AuthSheet))).pop();
      await tester.pumpAndSettle();

      // Still remains safe on Tab 0
      expect(find.text('Sử Ký'), findsWidgets);
    },
  );

  testWidgets(
    'Authenticated Creator accesses video creation pipeline and live studio',
    (tester) async {
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
      final apiClient = ApiClient(
        baseUrl: 'http://192.168.1.123:8080',
        preferences: prefs,
      );
      final state = AppState(prefs, apiClient: apiClient);

      await tester.pumpWidget(MaterialApp(home: SuKyApp(state: state)));
      await tester.pumpAndSettle();

      // Switch to Tab 2 (Tạo video)
      await tester.tap(find.byKey(const ValueKey('home-nav-2')));
      await tester.pumpAndSettle();

      // Verify AiWhiteboardPipelinePage is rendered directly
      expect(find.byKey(const Key('ai-pipeline-page')), findsOneWidget);
      expect(find.byKey(const Key('creator-studio-auth-gate')), findsNothing);
    },
  );
}
