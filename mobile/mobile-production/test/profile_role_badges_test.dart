import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';

void main() {
  group('Profile Role Badges Tests', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    testWidgets('Displays VIEWER badge by default for logged in user', (tester) async {
      final state = AppState(prefs);
      state.isLoggedIn = true;
      state.displayName = 'Nguyễn Quang Tùng';
      state.userEmail = 'phoenix090205@gmail.com';
      state.isCreator = false;
      state.isFreelancer = false;
      state.userRoles = ['VIEWER'];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProfileContent(
              state: state,
              onChannel: (_) {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('role-badge-viewer')), findsOneWidget);
      expect(find.text('VIEWER'), findsOneWidget);
      expect(find.byKey(const Key('role-badge-creator')), findsNothing);
      expect(find.byKey(const Key('role-badge-freelancer')), findsNothing);
    });

    testWidgets('Displays VIEWER and CREATOR badges when user is creator', (tester) async {
      final state = AppState(prefs);
      state.isLoggedIn = true;
      state.displayName = 'Nguyễn Quang Tùng';
      state.userEmail = 'phoenix090205@gmail.com';
      state.isCreator = true;
      state.isFreelancer = false;
      state.userRoles = ['VIEWER', 'CREATOR'];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProfileContent(
              state: state,
              onChannel: (_) {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('role-badge-viewer')), findsOneWidget);
      expect(find.byKey(const Key('role-badge-creator')), findsOneWidget);
      expect(find.text('VIEWER'), findsOneWidget);
      expect(find.text('CREATOR'), findsOneWidget);
      expect(find.byKey(const Key('role-badge-freelancer')), findsNothing);
    });

    testWidgets('Displays FREELANCER badge alongside VIEWER and CREATOR when role is present', (tester) async {
      final state = AppState(prefs);
      state.isLoggedIn = true;
      state.displayName = 'Nguyễn Quang Tùng';
      state.userEmail = 'phoenix090205@gmail.com';
      state.isCreator = true;
      state.setFreelancerRole(true);
      state.userRoles = ['VIEWER', 'CREATOR', 'FREELANCER'];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProfileContent(
              state: state,
              onChannel: (_) {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('role-badge-viewer')), findsOneWidget);
      expect(find.byKey(const Key('role-badge-creator')), findsOneWidget);
      expect(find.byKey(const Key('role-badge-freelancer')), findsOneWidget);
      expect(find.text('VIEWER'), findsOneWidget);
      expect(find.text('CREATOR'), findsOneWidget);
      expect(find.text('FREELANCER'), findsOneWidget);
    });
  });
}

