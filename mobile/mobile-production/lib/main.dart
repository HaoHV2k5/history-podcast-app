import 'package:flutter/widgets.dart';

import 'bootstrap.dart';
import 'core/backend_application_factory.dart';
import 'core/runtime_configuration.dart';
import 'mock/bootstrap.dart' deferred as mock;

export 'app.dart';

Future<void> main() => launchProduction();

/// The integration team can inject its real root composition here.
Future<void> launchProduction({
  RuntimeConfiguration configuration =
      const RuntimeConfiguration.fromEnvironment(),
  BackendApplicationFactory backendFactory =
      const PendingBackendApplicationFactory(),
}) async {
  WidgetsFlutterBinding.ensureInitialized();
  final application = await buildApplication(
    configuration: configuration,
    backendFactory: backendFactory,
    createMockApplication: () async {
      await mock.loadLibrary();
      return mock.createMockApplication();
    },
  );
  runApp(application);
}
