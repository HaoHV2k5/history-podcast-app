import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/brand_header.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/main.dart';
import 'package:su_ky_mobile_production/paper_surface.dart';

void main() {
  testWidgets('detail navigation never shifts the page sideways', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues({});
    final s = AppState(await SharedPreferences.getInstance());
    await tester.pumpWidget(SuKyApp(state: s));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('featured-episode')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('featured-episode')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 60));
    expect(tester.getRect(find.byType(EpisodePage)).left, closeTo(0, .1));
    await tester.pumpAndSettle();
    await tester.pageBack();
    await tester.pump(const Duration(milliseconds: 40));
    expect(tester.getRect(find.byType(EpisodePage)).left, closeTo(0, .1));
    await tester.pumpAndSettle();
    expect(find.byType(EpisodePage), findsNothing);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    s.dispose();
  });

  testWidgets('rapid tab changes keep header and mini player fixed', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final s = AppState(await SharedPreferences.getInstance());
    await tester.pumpWidget(SuKyApp(state: s));
    s.play(episodes.first);
    await tester.pumpAndSettle();
    s.togglePlaying();
    final header = tester.getRect(find.byType(BrandHeader));
    final mini = tester.getRect(find.byKey(const Key('mini-player-container')));
    for (final name in ['Cá nhân', 'Thư viện', 'Tìm kiếm', 'Khám phá']) {
      await tester.tap(find.text(name));
      await tester.pump(const Duration(milliseconds: 30));
      expect(tester.getRect(find.byType(BrandHeader)), header);
      expect(
        tester.getRect(find.byKey(const Key('mini-player-container'))),
        mini,
      );
    }
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    s.dispose();
  });

  testWidgets('paper grain never intercepts touch and hides in high contrast', (
    tester,
  ) async {
    var taps = 0;
    Widget page(bool highContrast) => MediaQuery(
      data: MediaQueryData(highContrast: highContrast),
      child: Directionality(
        textDirection: TextDirection.ltr,
        child: PaperSurface(
          child: GestureDetector(
            onTap: () => taps++,
            behavior: HitTestBehavior.opaque,
            child: const SizedBox(
              width: 200,
              height: 200,
              child: Center(child: Text('Nội dung')),
            ),
          ),
        ),
      ),
    );
    await tester.pumpWidget(page(false));
    await tester.tap(find.text('Nội dung'));
    expect(taps, 1);
    await tester.pumpWidget(page(true));
    expect(find.byKey(const Key('paper-grain')), findsNothing);
    await tester.tap(find.text('Nội dung'));
    expect(taps, 2);
    expect(tester.takeException(), isNull);
  });
}
