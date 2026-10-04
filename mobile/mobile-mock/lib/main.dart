import 'package:flutter/widgets.dart';

import 'mock/bootstrap.dart';

export 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(await createMockApplication());
}
