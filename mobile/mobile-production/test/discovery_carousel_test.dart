import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:su_ky_mobile_production/artwork_image.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/discovery_carousel.dart';
import 'package:su_ky_mobile_production/episode.dart';

Future<void> setup(
  WidgetTester tester, {
  bool reduced = false,
  VoidCallback? collection,
  ValueChanged<Episode>? episode,
}) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    MaterialApp(
      theme: appTheme(),
      home: Builder(
        builder: (context) => MediaQuery(
          data: MediaQuery.of(context).copyWith(disableAnimations: reduced),
          child: Scaffold(
            body: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                DiscoveryCarousel(
                  onCollection: collection ?? () {},
                  onEpisode: episode ?? (_) {},
                ),
                const SizedBox(height: 1800),
              ],
            ),
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

double current(WidgetTester tester) => tester
    .widget<PageView>(find.byKey(const Key('discovery-carousel')))
    .controller!
    .page!;

void main() {
  testWidgets('all recommendation cards fit a narrow screen at 2x text', (
    tester,
  ) async {
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await setup(tester, reduced: true);
    tester.view.physicalSize = const Size(320, 740);
    await tester.pumpAndSettle();
    for (var i = 0; i < 3; i++) {
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(find.byTooltip('Đề xuất tiếp theo'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Đề xuất tiếp theo'));
      await tester.pumpAndSettle();
    }
    expect(current(tester), 3003);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets(
    'auto rotation pauses and resumes without affecting manual navigation',
    (tester) async {
      await setup(tester);
      final initial = current(tester);
      await tester.pump(const Duration(seconds: 7));
      await tester.pumpAndSettle();
      expect(current(tester), initial + 1);
      await tester.tap(find.byKey(const Key('carousel-auto-toggle')));
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 14));
      await tester.pumpAndSettle();
      expect(current(tester), initial + 1);
      await tester.tap(find.byTooltip('Đề xuất tiếp theo'));
      await tester.pumpAndSettle();
      expect(current(tester), initial + 2);
      await tester.tap(find.byKey(const Key('carousel-auto-toggle')));
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 7));
      await tester.pumpAndSettle();
      expect(current(tester), initial + 3);
      await tester.pumpWidget(const SizedBox());
    },
  );

  testWidgets('swipe stops auto rotation; arrows and card destinations work', (
    tester,
  ) async {
    var opened = 0;
    Episode? picked;
    await setup(tester, collection: () => opened++, episode: (e) => picked = e);
    await tester.tap(find.text('Mở tuyển tập'));
    expect(opened, 1);
    await tester.tap(find.byKey(const Key('carousel-auto-toggle')));
    await tester.pumpAndSettle();
    await tester.drag(
      find.byKey(const Key('discovery-carousel')),
      const Offset(-360, 0),
    );
    await tester.pumpAndSettle();
    final after = current(tester);
    expect(after, 3001);
    await tester.pump(const Duration(seconds: 14));
    await tester.pumpAndSettle();
    expect(current(tester), after);
    await tester.tap(find.text('Khám phá tập').first);
    expect(picked?.id, episodes[1].id);
    await tester.tap(find.byTooltip('Đề xuất trước'));
    await tester.pumpAndSettle();
    expect(current(tester), 3000);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets(
    'reduced motion and scrolling offscreen stop automatic transitions',
    (tester) async {
      await setup(tester, reduced: true);
      await tester.pump(const Duration(seconds: 21));
      await tester.pumpAndSettle();
      expect(current(tester), 3000);
      await tester.tap(find.byTooltip('Đề xuất tiếp theo'));
      await tester.pumpAndSettle();
      expect(current(tester), 3001);
      await tester.pumpWidget(const SizedBox());
      await setup(tester);
      await tester.drag(find.byType(ListView), const Offset(0, -350));
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 14));
      await tester.pumpAndSettle();
      expect(current(tester), 3000);
      await tester.pumpWidget(const SizedBox());
    },
  );

  testWidgets('carousel card divides text and image 50/50 in width', (
    tester,
  ) async {
    await setup(tester, reduced: true);
    await tester.pumpAndSettle();

    final artworkFinder = find.byType(ArtworkImage);
    expect(artworkFinder, findsWidgets);

    final artworkSize = tester.getSize(artworkFinder.first);
    final rowFinder = find.ancestor(of: artworkFinder.first, matching: find.byType(Row)).first;
    final rowSize = tester.getSize(rowFinder);

    // Image width should be exactly 50% of the Row width
    expect((artworkSize.width / rowSize.width - 0.50).abs(), lessThan(0.01));
    await tester.pumpWidget(const SizedBox());
  });
}
