import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_mock/app_state.dart';
import 'package:su_ky_mobile_mock/episode.dart';
import 'package:su_ky_mobile_mock/main.dart';
import 'package:su_ky_mobile_mock/audience_pages.dart';

Future<AppState> setup(
  WidgetTester tester, {
  Size size = const Size(375, 812),
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  SharedPreferences.setMockInitialValues({});
  final state = AppState(await SharedPreferences.getInstance());
  await tester.pumpWidget(SuKyApp(state: state));
  await tester.pumpAndSettle();
  return state;
}

void main() {
  testWidgets(
    'tabs retain scroll and player opens and dismisses without stopping',
    (tester) async {
      final state = await setup(tester);
      final discover = find.byKey(const PageStorageKey('discover-scroll'));
      await tester.drag(discover, const Offset(0, -250));
      await tester.pumpAndSettle();
      final before = tester
          .state<ScrollableState>(
            find
                .descendant(of: discover, matching: find.byType(Scrollable))
                .first,
          )
          .position
          .pixels;
      expect(before, greaterThan(0));
      await tester.tap(find.text('Cá nhân'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Khám phá'));
      await tester.pumpAndSettle();
      final after = tester
          .state<ScrollableState>(
            find
                .descendant(of: discover, matching: find.byType(Scrollable))
                .first,
          )
          .position
          .pixels;
      expect(after, closeTo(before, 1));
      state.play(episodes.first);
      await tester.pumpAndSettle();
      var globalUpdates = 0;
      state.addListener(() => globalUpdates++);
      await tester.pump(const Duration(seconds: 2));
      expect(globalUpdates, 0);
      await tester.tap(
        find
            .descendant(
              of: find.byType(MiniPlayer),
              matching: find.byType(InkWell),
            )
            .first,
      );
      await tester.pumpAndSettle();
      expect(find.byType(PlayerPage), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.drag(find.text('TRÌNH NGHE'), const Offset(0, 160));
      await tester.pumpAndSettle();
      expect(find.byType(PlayerPage), findsNothing);
      expect(state.playing, true);
      await tester.pumpWidget(const SizedBox());
      state.dispose();
    },
  );
  testWidgets(
    'save survives reloading state; search accepts Vietnamese without accents',
    (tester) async {
      final state = await setup(tester);
      await tester.ensureVisible(find.byKey(const Key('featured-episode')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('featured-episode')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('save-episode')));
      await tester.pumpAndSettle();
      expect(state.saved, contains(episodes.first.id));
      final reloaded = AppState(await SharedPreferences.getInstance());
      expect(reloaded.saved, contains(episodes.first.id));
      reloaded.dispose();
      await tester.pageBack();
      await tester.pumpAndSettle();
      await tester.tap(find.text('Thư viện'));
      await tester.pumpAndSettle();
      expect(find.text('1 tập'), findsOneWidget);
      await tester.tap(find.text('Tìm kiếm'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('search-input')),
        'thang long',
      );
      await tester.pumpAndSettle();
      expect(find.text('1 tập phù hợp'), findsOneWidget);
      await tester.enterText(
        find.byKey(const Key('search-input')),
        'khong co tap nay',
      );
      await tester.pumpAndSettle();
      expect(find.text('Chưa tìm thấy câu chuyện'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      state.dispose();
    },
  );

  testWidgets(
    'playback survives detail browsing, clamps seek, pauses and sleeps',
    (tester) async {
      final state = await setup(tester);
      state.play(episodes.first);
      await tester.pump(const Duration(seconds: 2));
      expect(state.position, 2);
      state.togglePlaying();
      await tester.pump(const Duration(seconds: 2));
      expect(state.position, 2);
      state.seek(-30);
      expect(state.position, 0);
      state.seek(9999);
      expect(state.position, episodes.first.seconds);
      expect(state.playing, false);
      state.play(episodes[1], startAt: 630);
      expect(state.position, 630);
      expect(state.current, episodes[1]);
      state.setSleep(15);
      await tester.pump(const Duration(minutes: 15));
      expect(state.playing, false);
      expect(state.sleepMinutes, isNull);
      await tester.pumpWidget(const SizedBox());
      state.dispose();
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets('all screens fit $size with large text', (tester) async {
      final state = await setup(tester, size: size);
      tester.platformDispatcher.textScaleFactorTestValue = 2;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      tester.platformDispatcher.accessibilityFeaturesTestValue =
          const FakeAccessibilityFeatures(disableAnimations: true);
      addTearDown(
        tester.platformDispatcher.clearAccessibilityFeaturesTestValue,
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      for (final nav in ['Tìm kiếm', 'Thư viện', 'Cá nhân']) {
        await tester.tap(find.text(nav).last);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      }
      final ctx = tester.element(find.byType(HomeShell));
      for (final page in <Widget>[
        ChannelPage(channel: channels.first, state: state, onEpisode: (_) {}),
        MembershipPage(channel: channels.first, state: state),
      ]) {
        Navigator.of(ctx).push(MaterialPageRoute<void>(builder: (_) => page));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        await tester.drag(find.byType(ListView).last, const Offset(0, -900));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        await tester.pageBack();
        await tester.pumpAndSettle();
      }
      Navigator.of(ctx).push(
        MaterialPageRoute<void>(
          builder: (_) => EpisodePage(episode: episodes.first, state: state),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      state.play(episodes.first);
      Navigator.of(
        ctx,
      ).push(MaterialPageRoute<void>(builder: (_) => PlayerPage(state: state)));
      await tester.pumpAndSettle();
      await tester.drag(find.byType(ListView).last, const Offset(0, -900));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(find.text('Hẹn giờ'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Hẹn giờ'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(find.text('15 phút'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('15 phút'));
      await tester.pumpAndSettle();
      expect(state.sleepMinutes, 15);
      await tester.pumpWidget(const SizedBox());
      state.dispose();
    });
  }

  testWidgets(
    'membership gate is channel-scoped, persists, and revocation stops playback',
    (tester) async {
      final state = await setup(tester);
      final locked = memberEpisodes.first;
      expect(state.play(locked, startAt: 420), false);
      expect(state.current, isNull);
      final ctx = tester.element(find.byType(HomeShell));
      Navigator.of(ctx).push(
        MaterialPageRoute<void>(
          builder: (_) => EpisodePage(episode: locked, state: state),
        ),
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('play-episode')));
      await tester.tap(find.byKey(const Key('play-episode')));
      await tester.pumpAndSettle();
      expect(find.byType(MembershipPage), findsOneWidget);
      expect(state.current, isNull);
      await tester.scrollUntilVisible(
        find.byKey(const Key('checkout-start')),
        300,
        scrollable: find
            .descendant(
              of: find.byType(MembershipPage),
              matching: find.byType(Scrollable),
            )
            .last,
      );
      await tester.tap(find.byKey(const Key('checkout-start')));
      await tester.pumpAndSettle();
      expect(state.canPlay(locked), false);
      await tester.ensureVisible(find.text('Thử thanh toán thành công'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Thử thanh toán thành công'));
      await tester.pumpAndSettle();
      expect(state.canPlay(locked), true);
      expect(state.canPlay(memberEpisodes.last), false);
      final reloaded = AppState(await SharedPreferences.getInstance());
      expect(reloaded.canPlay(locked), true);
      reloaded.dispose();
      await tester.pageBack();
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('play-episode')));
      await tester.tap(find.byKey(const Key('play-episode')));
      await tester.pumpAndSettle();
      expect(find.byType(PlayerPage), findsOneWidget);
      expect(state.current, locked);
      await state.setDemoMembership(locked.channel, false);
      await tester.pumpAndSettle();
      expect(state.current, isNull);
      expect(state.playing, false);
      expect(find.text('Tập nghe đã đóng'), findsOneWidget);
      expect(state.play(locked), false);
      await tester.pumpWidget(const SizedBox());
      state.dispose();
    },
  );

  testWidgets('profile validates and persists the display name', (
    tester,
  ) async {
    final state = await setup(tester);
    await tester.tap(find.text('Cá nhân'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Sửa tên hiển thị'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('profile-name')), '   ');
    await tester.tap(find.text('Lưu tên'));
    await tester.pumpAndSettle();
    expect(find.text('Nhập tên hiển thị của bạn.'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('profile-name')), '  An  ');
    await tester.tap(find.text('Lưu tên'));
    await tester.pumpAndSettle();
    expect(find.text('An'), findsOneWidget);
    final reloaded = AppState(await SharedPreferences.getInstance());
    expect(reloaded.displayName, 'An');
    reloaded.dispose();
    await tester.pumpWidget(const SizedBox());
    state.dispose();
  });
}
