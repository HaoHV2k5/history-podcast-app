import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:su_ky_mobile_production/bootstrap.dart';
import 'package:su_ky_mobile_production/core/backend_application_factory.dart';
import 'package:su_ky_mobile_production/core/runtime_configuration.dart';

class RecordingBackendFactory implements BackendApplicationFactory {
  int calls = 0;
  RuntimeConfiguration? received;
  bool fail = false;
  final Widget application = const Text('Real adapter application');

  @override
  Future<Widget> createApplication(RuntimeConfiguration configuration) async {
    calls++;
    received = configuration;
    if (fail) throw StateError('Backend unavailable');
    return application;
  }
}

void main() {
  test(
    'production defaults disable mock and contain no invented API address',
    () {
      const config = RuntimeConfiguration.fromEnvironment();
      expect(config.useMockServices, isFalse);
      expect(config.apiBaseUri, isNull);
    },
  );

  test('public base URL rejects embedded credentials and query secrets', () {
    for (final value in [
      'not a URL',
      'file:///tmp/backend',
      'https://demo:demo@example.test',
      'https://example.test?token=example',
      'https://example.test#fragment',
    ]) {
      expect(
        () => RuntimeConfiguration(apiBaseUrl: value).apiBaseUri,
        throwsFormatException,
      );
    }
    expect(
      const RuntimeConfiguration(apiBaseUrl: 'https://example.test/api')
          .apiBaseUri,
      Uri.parse('https://example.test/api'),
    );
  });

  test('backend mode only invokes injected backend factory', () async {
    final backend = RecordingBackendFactory();
    var mockCalls = 0;
    const config = RuntimeConfiguration(apiBaseUrl: 'https://example.test');
    final app = await buildApplication(
      configuration: config,
      backendFactory: backend,
      createMockApplication: () async {
        mockCalls++;
        return const SizedBox();
      },
    );
    expect(app, same(backend.application));
    expect(backend.received, same(config));
    expect(backend.calls, 1);
    expect(mockCalls, 0);
  });

  test('explicit mock opt-in only invokes mock application factory', () async {
    final backend = RecordingBackendFactory();
    var mockCalls = 0;
    const mockApp = Text('Local rehearsal');
    final app = await buildApplication(
      configuration: const RuntimeConfiguration(useMockServices: true),
      backendFactory: backend,
      createMockApplication: () async {
        mockCalls++;
        return mockApp;
      },
    );
    expect(app, same(mockApp));
    expect(mockCalls, 1);
    expect(backend.calls, 0);
  });

  test('backend failure never silently falls back to mock', () async {
    final backend = RecordingBackendFactory()..fail = true;
    var mockCalls = 0;
    await expectLater(
      buildApplication(
        configuration: const RuntimeConfiguration(),
        backendFactory: backend,
        createMockApplication: () async {
          mockCalls++;
          return const SizedBox();
        },
      ),
      throwsStateError,
    );
    expect(mockCalls, 0);
  });

  testWidgets(
    'setting a URL still shows pending integration, not fake success',
    (tester) async {
      final app = await const PendingBackendApplicationFactory()
          .createApplication(
            const RuntimeConfiguration(apiBaseUrl: 'https://example.test'),
          );
      await tester.pumpWidget(app);
      await tester.pumpAndSettle();
      expect(find.text('Đang chờ kết nối backend'), findsOneWidget);
      expect(find.textContaining('Chưa thực hiện đăng nhập'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
