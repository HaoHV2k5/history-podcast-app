import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/main.dart';

void main() {
  testWidgets('progress checkpoints every five ticks at a fractional speed', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final s = AppState(prefs);
    s.setSpeed(1.75);
    s.play(episodes.first);
    await tester.pump(const Duration(seconds: 5));
    expect(s.position, 8);
    final reloaded = AppState(prefs);
    expect(reloaded.progressFor(episodes.first), 8);
    s.seek(31);
    s.setSleep(1);
    await tester.pump(const Duration(minutes: 1));
    expect(s.playing, isFalse);
    expect(AppState(prefs).progressFor(episodes.first), s.position);
    s.dispose();
    reloaded.dispose();
  });

  test(
    'per-episode progress resumes after reload without automatic playback',
    () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final s = AppState(prefs);
      s.play(episodes[0]);
      s.seek(180);
      s.play(episodes[1]);
      s.seek(90);
      s.togglePlaying();
      s.setSpeed(1.75);
      final reloaded = AppState(prefs);
      expect(reloaded.current, isNull);
      expect(reloaded.playing, isFalse);
      expect(reloaded.listeningHistory.map((e) => e.id), [
        episodes[1].id,
        episodes[0].id,
      ]);
      expect(reloaded.progressFor(episodes[0]), 180);
      expect(reloaded.progressFor(episodes[1]), 90);
      expect(reloaded.speed, 1.75);
      expect(reloaded.play(episodes[0]), isTrue);
      expect(reloaded.position, 180);
      reloaded.seek(episodes[0].seconds);
      expect(reloaded.resumableEpisode?.id, episodes[1].id);
      s.dispose();
      reloaded.dispose();
    },
  );

  test('recent search deduplicates Vietnamese and persists clear', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final s = AppState(prefs);
    for (final q in ['a', 'b', 'c', 'd', 'e', 'Thăng Long', 'thang long']) {
      s.rememberSearch(q);
    }
    expect(s.recentSearches.length, 5);
    expect(s.recentSearches.first, 'thang long');
    final reloaded = AppState(prefs);
    expect(reloaded.recentSearches, s.recentSearches);
    s.clearRecentSearches();
    final cleared = AppState(prefs);
    expect(cleared.recentSearches, isEmpty);
    s.dispose();
    reloaded.dispose();
    cleared.dispose();
  });

  test(
    'invalid persisted history is ignored and membership still gates resume',
    () async {
      SharedPreferences.setMockInitialValues({
        'recentPlayed': ['unknown', memberEpisodes.first.id],
        'listeningProgress': '{"unknown":99,"${memberEpisodes.first.id}":140}',
      });
      final s = AppState(await SharedPreferences.getInstance());
      expect(s.listeningHistory.length, 1);
      expect(s.resumableEpisode, isNull);
      expect(s.play(memberEpisodes.first), isFalse);
      s.dispose();
    },
  );

  testWidgets('topic browse, recent query and speed selection work', (
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
    await tester.tap(find.text('Tìm kiếm'));
    await tester.pumpAndSettle();
    expect(find.text('Duyệt theo chủ đề'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('search-topic-Văn hóa')));
    await tester.pumpAndSettle();
    expect(find.text('2 tập phù hợp'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('search-input')), 'Hoi An');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();
    expect(s.recentSearches, ['Hoi An']);
    await tester.tap(find.text('Khám phá'));
    await tester.pumpAndSettle();
    s.play(episodes.first, startAt: 180);
    s.togglePlaying();
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('continue-listening')), findsOneWidget);
    final semantics = tester.ensureSemantics();
    await tester.pump();
    expect(
      tester
          .getSemantics(find.byKey(const Key('continue-listening')))
          .getSemanticsData()
          .flagsCollection
          .isButton,
      isTrue,
    );
    semantics.dispose();
    await tester.tap(find.byKey(const Key('mini-player-open')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('1.0×'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('1.0×'));
    await tester.pumpAndSettle();
    expect(find.text('Tốc độ phát'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('speed-1.75')));
    await tester.pumpAndSettle();
    expect(s.speed, 1.75);
    await tester.tap(find.byTooltip('Thu nhỏ trình nghe'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Thư viện'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('library-filter-Đã nghe')));
    await tester.pumpAndSettle();
    expect(find.text('Nghe gần đây'), findsOneWidget);
    expect(find.text('Chuyện kể từ đất Thăng Long'), findsWidgets);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    s.dispose();
  });
}
