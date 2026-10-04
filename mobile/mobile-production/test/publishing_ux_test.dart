import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/creator_state.dart';
import 'package:su_ky_mobile_production/demo_data.dart';
import 'package:su_ky_mobile_production/demo_pages.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/publication_page.dart';

Future<AppState> readyApp(WidgetTester tester) async {
  if (tester.view.physicalSize == const Size(800, 600)) {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
  }
  SharedPreferences.setMockInitialValues({});
  final p = await SharedPreferences.getInstance();
  await tester.runAsync(() => DemoDataService(p).load('ready'));
  final app = AppState(p);
  addTearDown(app.dispose);
  return app;
}

Future<void> press(WidgetTester tester, Finder finder) async {
  if (finder.evaluate().isEmpty) {
    await tester.scrollUntilVisible(finder, 240);
  }
  await tester.ensureVisible(finder);
  await tester.pump();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

Future<void> openReview(WidgetTester tester, AppState app) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: appTheme(),
      home: PublicationPage(preferences: app.preferences, app: app),
    ),
  );
  await tester.pumpAndSettle();
  await press(tester, find.byKey(const Key('publication-demo-d4')));
}

void main() {
  testWidgets(
    'profile separates listener tasks, workspaces and demo settings',
    (tester) async {
      final app = await readyApp(tester);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: Scaffold(
            body: ProfileContent(state: app, onChannel: (_) {}),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('open-publish')), findsNothing);
      expect(find.byKey(const Key('open-demo-data')), findsNothing);
      expect(find.byKey(const Key('open-tx-history')), findsOneWidget);
      await press(tester, find.byKey(const Key('open-workspace')));
      expect(find.byType(CreativeWorkspacePage), findsOneWidget);
      for (final key in [
        'open-studio',
        'open-narrator',
        'open-publish',
        'open-wallet',
      ]) {
        expect(find.byKey(Key(key)), findsOneWidget);
      }
      await tester.pageBack();
      await tester.pumpAndSettle();
      await press(tester, find.byKey(const Key('open-settings')));
      await tester.tap(find.byKey(const Key('open-demo-data')));
      await tester.pump();
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 100)),
      );
      await tester.pumpAndSettle();
      expect(find.byType(DemoDataPage), findsOneWidget);
    },
  );

  testWidgets(
    'publication overview shows approved drafts with pending work delegated to Studio',
    (tester) async {
      final app = await readyApp(tester);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: PublicationPage(preferences: app.preferences, app: app),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('publication-demo-d4')), findsOneWidget);
      expect(find.byKey(const Key('publication-demo-d1')), findsNothing);
      expect(find.text('5 tập đang hoàn thiện'), findsOneWidget);
      expect(find.byKey(const Key('publication-primary')), findsNothing);
      await press(tester, find.byKey(const Key('publication-released')));
      expect(find.text('Chưa có tập đã phát hành'), findsOneWidget);
    },
  );

  testWidgets(
    'prepare then publish for members, reopen preserves audience; removing requires confirmation',
    (tester) async {
      final app = await readyApp(tester);
      await openReview(tester, app);
      await press(tester, find.byKey(const Key('audience-members')));
      await press(tester, find.byKey(const Key('publication-primary')));
      expect(find.text('Xác nhận phát hành'), findsOneWidget);
      expect(allEpisodes.where((e) => e.id == 'published-demo-d4'), isEmpty);
      await press(tester, find.byKey(const Key('publication-primary')));
      expect(
        allEpisodes.firstWhere((e) => e.id == 'published-demo-d4').membersOnly,
        true,
      );
      expect(find.text('Đã có trong danh mục'), findsOneWidget);
      await tester.pageBack();
      await tester.pumpAndSettle();
      await press(tester, find.byKey(const Key('publication-released')));
      await press(tester, find.byKey(const Key('publication-demo-d4')));
      await tester.scrollUntilVisible(find.text('Quyền xem: Hội viên'), 160);
      expect(find.text('Quyền xem: Hội viên'), findsOneWidget);
      await press(tester, find.byKey(const Key('unpublish-episode')));
      await press(tester, find.text('Giữ lại'));
      expect(allEpisodes.any((e) => e.id == 'published-demo-d4'), true);
      await press(tester, find.byKey(const Key('unpublish-episode')));
      await press(tester, find.text('Gỡ tập'));
      expect(allEpisodes.any((e) => e.id == 'published-demo-d4'), false);
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('Đã phát hành · 0'), findsOneWidget);
    },
  );

  testWidgets(
    'failed preparation is recoverable and never publishes implicitly',
    (tester) async {
      final app = await readyApp(tester);
      await openReview(tester, app);
      await press(tester, find.text('Công cụ kiểm thử'));
      await press(tester, find.text('Giả lập lỗi chuẩn bị'));
      expect(app.preferences.getString('productionJobsV1'), contains('failed'));
      await press(tester, find.byKey(const Key('publication-primary')));
      expect(find.text('Xác nhận phát hành'), findsOneWidget);
      expect(allEpisodes.where((e) => e.id == 'published-demo-d4'), isEmpty);
    },
  );

  testWidgets(
    'missing channel disables publish and displays how to resolve it',
    (tester) async {
      final app = await readyApp(tester);
      final creator = CreatorState(app.preferences)..channel = '';
      final production = PublicationState(creator);
      addTearDown(creator.dispose);
      addTearDown(production.dispose);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: PublicationReviewPage(
            draft: creator.drafts.firstWhere((d) => d.id == 'demo-d4'),
            production: production,
            app: app,
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(
        find.byKey(const Key('publication-primary')),
        240,
      );
      expect(
        tester
            .widget<FilledButton>(find.byKey(const Key('publication-primary')))
            .onPressed,
        isNull,
      );
      expect(
        find.text(
          'Cần tạo kênh, xác minh danh tính và duyệt tập trong Studio.',
        ),
        findsOneWidget,
      );
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets('personal and publish review fit $size at 2x text', (
      tester,
    ) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      tester.platformDispatcher.textScaleFactorTestValue = 2;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      final app = await readyApp(tester);
      final c = CreatorState(app.preferences),
          production = PublicationState(CreatorState(app.preferences));
      addTearDown(c.dispose);
      addTearDown(production.creator.dispose);
      addTearDown(production.dispose);
      for (final page in <Widget>[
        Scaffold(
          body: ProfileContent(state: app, onChannel: (_) {}),
        ),
        CreativeWorkspacePage(state: app),
        PersonalSettingsPage(state: app),
        PublicationReviewPage(
          draft: c.drafts.firstWhere((d) => d.id == 'demo-d4'),
          production: production,
          app: app,
        ),
      ]) {
        await tester.pumpWidget(MaterialApp(theme: appTheme(), home: page));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        await tester.drag(find.byType(ListView).first, const Offset(0, -2000));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      }
    });
  }
}
