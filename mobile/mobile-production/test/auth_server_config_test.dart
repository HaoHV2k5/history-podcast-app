import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/auth_repository.dart';

class TimeoutMockClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw TimeoutException('Future not completed');
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('AuthSheet shows server badge and opens server config dialog', (tester) async {
    tester.view.physicalSize = const Size(414, 896);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({
      'onboardingDone': true,
      'custom_api_base_url': 'http://192.168.1.123:8080',
    });
    final prefs = await SharedPreferences.getInstance();
    final apiClient = ApiClient(baseUrl: 'http://192.168.1.123:8080', preferences: prefs);
    final state = AppState(prefs, apiClient: apiClient);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AuthSheet(state: state),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify server badge is hidden from the header for clean production UX
    expect(find.byKey(const Key('auth-server-badge-btn')), findsNothing);
    expect(find.textContaining('192.168.1.123:8080'), findsNothing);
  });

  testWidgets('AuthSheet catches TimeoutException and displays friendly error with config button', (tester) async {
    tester.view.physicalSize = const Size(414, 896);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({
      'onboardingDone': true,
      'custom_api_base_url': 'http://192.168.1.123:8080',
    });
    final prefs = await SharedPreferences.getInstance();
    final apiClient = ApiClient(
      baseUrl: 'http://192.168.1.123:8080',
      preferences: prefs,
      httpClient: TimeoutMockClient(),
    );
    final state = AppState(
      prefs,
      apiClient: apiClient,
      authRepository: AuthRepository(apiClient),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AuthSheet(state: state),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Enter email and password
    await tester.enterText(find.byKey(const Key('auth-identifier')), 'phoenix090205@gmail.com');
    await tester.enterText(find.byKey(const Key('auth-password')), 'password123');
    await tester.pumpAndSettle();

    // Submit
    await tester.tap(find.byKey(const Key('auth-submit-btn')));
    await tester.pumpAndSettle();

    // Verify friendly timeout message and server config button
    expect(find.textContaining('Quá thời gian chờ kết nối'), findsOneWidget);
    expect(find.byKey(const Key('auth-error-config-server-btn')), findsOneWidget);

    // Tap config server button from error card
    await tester.tap(find.byKey(const Key('auth-error-config-server-btn')));
    await tester.pumpAndSettle();

    expect(find.text('Cấu hình máy chủ API'), findsOneWidget);
  });
}
