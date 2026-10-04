import 'package:flutter/widgets.dart';

import 'core/backend_application_factory.dart';
import 'core/runtime_configuration.dart';

/// Mock mode requires an explicit opt-in. Backend mode never falls back to mock.
Future<Widget> buildApplication({
  required RuntimeConfiguration configuration,
  required Future<Widget> Function() createMockApplication,
  BackendApplicationFactory backendFactory =
      const PendingBackendApplicationFactory(),
}) {
  if (configuration.useMockServices) return createMockApplication();
  return backendFactory.createApplication(configuration);
}
