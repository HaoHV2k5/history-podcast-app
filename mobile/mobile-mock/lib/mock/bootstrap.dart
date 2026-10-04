import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../app.dart';
import 'services/app_state.dart';

/// Local rehearsal only. No production token/account/payment integration.
Future<Widget> createMockApplication() async =>
    SuKyApp(state: AppState(await SharedPreferences.getInstance()));
