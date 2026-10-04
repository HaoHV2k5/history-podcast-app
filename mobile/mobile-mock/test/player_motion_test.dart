import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_mock/app_state.dart';
import 'package:su_ky_mobile_mock/episode.dart';
import 'package:su_ky_mobile_mock/main.dart';

void main() {
  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets('floating player controls remain usable at 2x text on $size', (
      tester,
    ) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      tester.platformDispatcher.textScaleFactorTestValue = 2;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      SharedPreferences.setMockInitialValues({});
      final s = AppState(await SharedPreferences.getInstance());
      await tester.pumpWidget(SuKyApp(state: s));
      s.play(episodes.first);
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('mini-player-toggle')));
      await tester.pumpAndSettle();
      expect(s.playing, isFalse);
      final before = s.position;
      await tester.tap(find.byKey(const Key('mini-player-skip')));
      await tester.pumpAndSettle();
      expect(s.position, before + 15);
      expect(find.byType(PlayerPage), findsNothing);
      final list = find.byKey(const PageStorageKey('discover-scroll'));
      await tester.dragFrom(
        tester.getTopLeft(list) + const Offset(20, 14),
        const Offset(0, -120),
      );
      await tester.pumpAndSettle();
      final miniRect = tester.getRect(
        find.byKey(const Key('mini-player-container')),
      );
      expect(miniRect.left, greaterThan(0));
      expect(miniRect.right, lessThan(size.width));
      await tester.tap(find.byKey(const Key('mini-player-open')));
      await tester.pumpAndSettle();
      expect(find.byType(PlayerPage), findsOneWidget);
      await tester.tap(find.byTooltip('Thu nhỏ trình nghe'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('mini-player-toggle')), findsOneWidget);
      expect(s.position, before + 15);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      s.dispose();
    });
  }

  testWidgets(
    'dragging player reveals the live screen and cancels back continuously',
    (tester) async {
      SharedPreferences.setMockInitialValues({});
      final s = AppState(await SharedPreferences.getInstance());
      await tester.pumpWidget(SuKyApp(state: s));
      s.play(episodes.first);
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('mini-player-open')));
      await tester.pumpAndSettle();
      expect(
        ModalRoute.of(tester.element(find.byType(PlayerPage)))!.opaque,
        isFalse,
      );
      final header = find.text('TRÌNH NGHE');
      final gesture = await tester.startGesture(tester.getCenter(header));
      await gesture.moveBy(const Offset(0, 55));
      await tester.pump();
      expect(
        tester.getRect(find.byKey(const Key('expanded-player-surface'))).top,
        greaterThan(30),
      );
      await gesture.cancel();
      await tester.pumpAndSettle();
      expect(
        tester.getRect(find.byKey(const Key('expanded-player-surface'))).top,
        closeTo(0, .1),
      );
      await tester.tap(find.byTooltip('Thu nhỏ trình nghe'));
      await tester.pumpAndSettle();
      expect(find.byType(PlayerPage), findsNothing);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      s.dispose();
    },
  );

  testWidgets(
    'player opening can be reversed before it finishes without losing controls',
    (tester) async {
      SharedPreferences.setMockInitialValues({});
      final s = AppState(await SharedPreferences.getInstance());
      await tester.pumpWidget(SuKyApp(state: s));
      s.play(episodes.first);
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('mini-player-open')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 120));
      final ctx = tester.element(find.byType(PlayerPage));
      Navigator.pop(ctx);
      await tester.pumpAndSettle();
      expect(find.byType(PlayerPage), findsNothing);
      await tester.tap(find.byKey(const Key('mini-player-toggle')));
      await tester.pumpAndSettle();
      expect(s.playing, isFalse);
      await tester.tap(find.text('Cá nhân'));
      await tester.pump();
      await tester.tap(find.text('Thư viện'));
      await tester.pump();
      await tester.tap(find.text('Tìm kiếm'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('search-input')), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      s.dispose();
    },
  );
}
