import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_mock/app_state.dart';
import 'package:su_ky_mobile_mock/design.dart';
import 'package:su_ky_mobile_mock/discovery_carousel.dart';
import 'package:su_ky_mobile_mock/home_navigation.dart';
import 'package:su_ky_mobile_mock/main.dart';

Future<AppState> setup(WidgetTester tester, {bool reduced = false}) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  SharedPreferences.setMockInitialValues({});
  final app = AppState(await SharedPreferences.getInstance());
  await tester.pumpWidget(
    MaterialApp(
      theme: appTheme(),
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: reduced),
        child: child!,
      ),
      home: HomeShell(state: app),
    ),
  );
  await tester.pumpAndSettle();
  addTearDown(() async {
    await tester.pumpWidget(const SizedBox());
    app.dispose();
  });
  return app;
}

Future<void> tab(WidgetTester tester, int i) async {
  await tester.tap(find.byKey(ValueKey('home-nav-$i')));
  await tester.pumpAndSettle();
}

PageController carousel(WidgetTester tester, {bool hidden = false}) => tester
    .widget<PageView>(
      find.descendant(
        of: find.byType(DiscoveryCarousel, skipOffstage: !hidden),
        matching: find.byType(PageView, skipOffstage: !hidden),
        skipOffstage: !hidden,
      ),
    )
    .controller!;

void main() {
  testWidgets(
    'visited tab keeps its carousel State, pause and scroll position; same tab tap does not restart',
    (tester) async {
      await setup(tester);
      final state = tester.state(find.byType(DiscoveryCarousel));
      await tester.tap(find.byTooltip('Đề xuất tiếp theo'));
      await tester.pumpAndSettle();
      final page = carousel(tester).page;
      final scrollable = find
          .descendant(
            of: find.byKey(const PageStorageKey('discover-scroll')),
            matching: find.byType(Scrollable),
          )
          .first;
      await tester.drag(
        find.byKey(const PageStorageKey('discover-scroll')),
        const Offset(0, -220),
      );
      await tester.pumpAndSettle();
      final offset = tester.state<ScrollableState>(scrollable).position.pixels;
      await tab(tester, 1);
      await tab(tester, 2);
      await tab(tester, 0);
      expect(tester.state(find.byType(DiscoveryCarousel)), same(state));
      expect(carousel(tester).page, page);
      expect(
        tester.state<ScrollableState>(scrollable).position.pixels,
        closeTo(offset, .1),
      );
      await tab(tester, 0);
      expect(tester.state(find.byType(DiscoveryCarousel)), same(state));
      expect(find.byTooltip('Bật tự chuyển đề xuất'), findsOneWidget);
    },
  );

  testWidgets(
    'hidden tab suspends carousel timer and only resumes when visible',
    (tester) async {
      await setup(tester);
      final before = carousel(tester).page;
      await tab(tester, 1);
      expect(find.byType(DiscoveryCarousel), findsNothing);
      await tester.pump(const Duration(seconds: 15));
      await tester.pumpAndSettle();
      expect(carousel(tester, hidden: true).page, before);
      await tab(tester, 0);
      await tester.pump(const Duration(seconds: 7));
      await tester.pumpAndSettle();
      expect(carousel(tester).page, before! + 1);
    },
  );

  testWidgets(
    'search retains element and query, hidden field cannot retain focus; only active page is exposed',
    (tester) async {
      await setup(tester);
      await tab(tester, 1);
      final input = find.byKey(const Key('search-input'));
      final element = tester.element(input);
      await tester.enterText(input, 'phố');
      await tab(tester, 3);
      expect(find.byKey(const Key('search-input')), findsNothing);
      expect(
        tester
            .widget<EditableText>(
              find.byType(EditableText, skipOffstage: false),
            )
            .focusNode
            .hasFocus,
        false,
      );
      await tab(tester, 1);
      expect(tester.element(input), same(element));
      expect(tester.widget<TextField>(input).controller!.text, 'phố');
      expect(
        find.descendant(
          of: find.byType(RetainedHomeTabs),
          matching: find.byType(Opacity),
        ),
        findsNothing,
      );
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets(
    'rapid retarget preserves spring position while selected content updates immediately',
    (tester) async {
      await setup(tester);
      final indicator = find.byKey(const Key('home-tab-indicator'));
      final original = tester.getCenter(indicator).dx;
      await tester.tap(find.byKey(const ValueKey('home-nav-1')));
      await tester.pump();
      expect(tester.widget<HomeTabBar>(find.byType(HomeTabBar)).index, 1);
      expect(find.byKey(const Key('search-input')), findsOneWidget);
      expect(tester.getCenter(indicator).dx, closeTo(original, .01));
      await tester.pump(const Duration(milliseconds: 45));
      final midway = tester.getCenter(indicator).dx;
      expect(midway, greaterThan(original));
      await tester.tap(find.byKey(const ValueKey('home-nav-3')));
      await tester.pump();
      expect(tester.getCenter(indicator).dx, closeTo(midway, .01));
      expect(tester.widget<HomeTabBar>(find.byType(HomeTabBar)).index, 3);
      await tester.pump(const Duration(milliseconds: 16));
      await tester.tap(find.byKey(const ValueKey('home-nav-2')));
      await tester.pumpAndSettle();
      expect(
        tester.getCenter(indicator).dx,
        closeTo(
          tester.getCenter(find.byKey(const ValueKey('home-nav-2'))).dx,
          .1,
        ),
      );
      expect(find.text('Tập đã lưu'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets(
    'reduced motion snaps selection and preserves accessible selected/tap semantics',
    (tester) async {
      await setup(tester, reduced: true);
      final semantics = tester.ensureSemantics();

      await tester.tap(find.byKey(const ValueKey('home-nav-3')));
      await tester.pump();
      final indicator = find.byKey(const Key('home-tab-indicator'));
      expect(
        tester.getCenter(indicator).dx,
        closeTo(
          tester.getCenter(find.byKey(const ValueKey('home-nav-3'))).dx,
          .01,
        ),
      );
      final node = tester.getSemantics(
        find.byKey(const ValueKey('home-nav-3')),
      );
      expect(
        node,
        matchesSemantics(
          label: 'Cá nhân',
          isButton: true,
          isSelected: true,
          hasSelectedState: true,
          hasTapAction: true,
        ),
      );
      semantics.dispose();
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets(
      'tab bar fits $size with double text and all tap targets remain usable',
      (tester) async {
        await setup(tester, reduced: true);
        tester.view.physicalSize = size;
        tester.platformDispatcher.textScaleFactorTestValue = 2;
        addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
        await tester.pumpAndSettle();
        for (var i = 0; i < 4; i++) {
          final button = find.byKey(ValueKey('home-nav-$i'));
          final bounds = tester.getRect(button);
          expect(bounds.width, greaterThanOrEqualTo(48));
          expect(bounds.height, greaterThanOrEqualTo(48));
          await tab(tester, i);
        }
        expect(tester.takeException(), isNull);
      },
    );
  }
}
