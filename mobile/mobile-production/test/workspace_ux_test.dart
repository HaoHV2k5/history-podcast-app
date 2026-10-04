import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/demo_data.dart';
import 'package:su_ky_mobile_production/creator_state.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/narrator_pages.dart';
import 'package:su_ky_mobile_production/narrator_marketplace.dart';
import 'package:su_ky_mobile_production/narrator_profile.dart';
import 'package:su_ky_mobile_production/studio_pages.dart';
import 'package:su_ky_mobile_production/workspace_components.dart';

Future<SharedPreferences> fixture(
  WidgetTester tester, [
  String? scenario = 'ready',
]) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  SharedPreferences.setMockInitialValues({});
  final p = await SharedPreferences.getInstance();
  if (scenario != null) {
    await tester.runAsync(() => DemoDataService(p).load(scenario));
  }
  return p;
}

Future<void> press(WidgetTester tester, Finder finder) async {
  if (finder.evaluate().isEmpty) {
    await tester.scrollUntilVisible(finder, 240);
  }
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets(
    'Studio filters separate actionable, pending and approved drafts and preserve selection on return',
    (tester) async {
      final p = await fixture(tester);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: CreatorStudio(preferences: p),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Cần làm · 4'), findsOneWidget);
      expect(find.byKey(const Key('studio-draft-demo-d3')), findsNothing);
      expect(find.byKey(const Key('studio-draft-demo-d4')), findsNothing);
      await press(tester, find.byKey(const Key('studio-filter-Chờ duyệt')));
      expect(find.byKey(const Key('studio-draft-demo-d3')), findsOneWidget);
      expect(find.byKey(const Key('studio-draft-demo-d1')), findsNothing);
      await press(tester, find.byKey(const Key('studio-filter-Đã duyệt')));
      await press(tester, find.byKey(const Key('studio-draft-demo-d4')));
      final editor = tester.widget<DraftEditor>(find.byType(DraftEditor));
      expect(editor.draft!.editable, isFalse);
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<ChoiceChip>(find.byKey(const Key('studio-filter-Đã duyệt')))
            .selected,
        true,
      );
      await press(tester, find.byKey(const Key('studio-filter-Tất cả')));
      expect(find.text('Tất cả · 6'), findsOneWidget);
    },
  );

  testWidgets(
    'Studio secondary actions stay available in menu and video import opens correct editor',
    (tester) async {
      final p = await fixture(tester);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: CreatorStudio(preferences: p),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Nhập video mẫu'), findsNothing);
      expect(find.text('Thuê Narrator'), findsNothing);
      await press(tester, find.byKey(const Key('studio-options')));
      await press(tester, find.text('Nhập video mẫu'));
      expect(
        tester.widget<DraftEditor>(find.byType(DraftEditor)).draft!.format,
        'video',
      );
      await press(tester, find.byTooltip('Đóng nhập video'));
      await tester.pageBack();
      await tester.pumpAndSettle();
      await press(tester, find.byKey(const Key('studio-options')));
      await press(tester, find.text('Thuê Narrator'));
      expect(find.byType(NarratorMarketplacePage), findsOneWidget);
    },
  );

  testWidgets('Studio empty filter explains state and keeps create available', (
    tester,
  ) async {
    final p = await fixture(tester, null);
    final creator = CreatorState(p);
    await creator.useVerifiedFixture();
    await creator.createChannel('Kênh mới');
    creator.dispose();
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: CreatorStudio(preferences: p),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Trang đầu còn để ngỏ.'), findsOneWidget);
    expect(
      tester.widget<FilledButton>(find.byKey(const Key('new-draft'))).onPressed,
      isNotNull,
    );
  });

  testWidgets(
    'approved narrator sees jobs first, profile remains reachable, job filter survives profile navigation',
    (tester) async {
      final p = await fixture(tester);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: NarratorHome(preferences: p),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('01 / Xác thực danh tính'), findsNothing);
      expect(find.byType(WorkListItem), findsWidgets);
      await press(tester, find.text('Đang làm'));
      await press(tester, find.byKey(const Key('narrator-account')));
      expect(find.byType(NarratorAccountPage), findsOneWidget);
      expect(find.text('01 / Xác thực danh tính'), findsOneWidget);
      await press(tester, find.text('Xem hồ sơ giọng đọc'));
      expect(find.byType(NarratorProfilePage), findsOneWidget);
      await tester.pageBack();
      await tester.pumpAndSettle();
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'Đang làm'))
            .selected,
        true,
      );
      await press(tester, find.byKey(const Key('narrator-job-DEMO-HD-02')));
      expect(find.byType(NarratorJobPage), findsOneWidget);
    },
  );

  testWidgets(
    'pending narrator keeps onboarding and cannot access job filters before approval',
    (tester) async {
      final p = await fixture(tester, 'pending');
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: NarratorHome(preferences: p),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('01 / Xác thực danh tính'), findsOneWidget);
      expect(find.byKey(const Key('narrator-account')), findsNothing);
      expect(find.widgetWithText(ChoiceChip, 'Lời mời'), findsNothing);
      expect(find.byType(WorkListItem), findsNothing);
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets(
      'workspace homes and narrator account fit $size with 2x text and reduced motion',
      (tester) async {
        final p = await fixture(tester);
        tester.view.physicalSize = size;
        final profile = NarratorProfileState(p);
        addTearDown(profile.dispose);
        for (final page in <Widget>[
          CreatorStudio(preferences: p),
          NarratorHome(preferences: p),
          NarratorAccountPage(profile: profile),
        ]) {
          await tester.pumpWidget(
            MaterialApp(
              theme: appTheme(),
              builder: (_, child) => MediaQuery(
                data: MediaQueryData(
                  size: size,
                  textScaler: const TextScaler.linear(2),
                  disableAnimations: true,
                ),
                child: child!,
              ),
              home: page,
            ),
          );
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          await tester.drag(
            find.byType(ListView).first,
            const Offset(0, -2000),
          );
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        }
        await tester.pumpWidget(const SizedBox());
      },
    );
  }
}
