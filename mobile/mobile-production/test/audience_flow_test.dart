import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/main.dart';

void main() {
  Future<AppState> setupApp(WidgetTester tester) async {
    tester.view.physicalSize = const Size(375, 812);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final state = AppState(prefs);
    await tester.pumpWidget(SuKyApp(state: state));
    await tester.pumpAndSettle();
    return state;
  }

  testWidgets('Audience Flow: search finds channels and opens channel page', (
    tester,
  ) async {
    final state = await setupApp(tester);
    await tester.tap(find.text('Tìm kiếm'));
    await tester.pumpAndSettle();

    final input = find.byType(TextField);
    await tester.enterText(input, 'di sản');
    await tester.pumpAndSettle();

    // Verify channel section header is visible
    expect(find.text('Kênh kể chuyện'), findsOneWidget);
    expect(find.text('Dọc miền di sản'), findsWidgets);

    // Tap the channel tile
    await tester.tap(find.text('Dọc miền di sản').first);
    await tester.pumpAndSettle();

    // Verify ChannelPage opened
    expect(find.byType(ChannelPage), findsOneWidget);
    expect(
      find.text(
        'Đi qua những vùng đất, lắng nghe những lớp ký ức. Kể chuyện lịch sử từ kiến trúc, di sản và đời sống.',
      ),
      findsOneWidget,
    );

    await tester.pumpWidget(const SizedBox());
    state.dispose();
  });

  testWidgets('Audience Flow: episode like and dislike toggles with count', (
    tester,
  ) async {
    final state = await setupApp(tester);
    final epId = episodes.first.id;
    final initialCount = state.getLikeCount(epId);

    // Open first episode page
    final ctx = tester.element(find.byType(HomeShell));
    Navigator.of(ctx).push(
      MaterialPageRoute<void>(
        builder: (_) => EpisodePage(episode: episodes.first, state: state),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('like-episode')), findsOneWidget);
    expect(find.byKey(const Key('dislike-episode')), findsOneWidget);

    // Like episode
    await tester.tap(find.byKey(const Key('like-episode')));
    await tester.pumpAndSettle();

    expect(state.isLiked(epId), true);
    expect(state.getLikeCount(epId), initialCount + 1);

    // Dislike switches like to dislike
    await tester.tap(find.byKey(const Key('dislike-episode')));
    await tester.pumpAndSettle();

    expect(state.isLiked(epId), false);
    expect(state.isDisliked(epId), true);
    expect(state.getLikeCount(epId), initialCount);

    await tester.pumpWidget(const SizedBox());
    state.dispose();
  });

  testWidgets('Audience Flow: comments list, submission and moderation check', (
    tester,
  ) async {
    final state = await setupApp(tester);
    final ctx = tester.element(find.byType(HomeShell));
    Navigator.of(ctx).push(
      MaterialPageRoute<void>(
        builder: (_) => EpisodePage(episode: episodes.first, state: state),
      ),
    );
    await tester.pumpAndSettle();

    // Drag up episode scrollable so tabs are clearly in view
    final epScrollable = find
        .descendant(
          of: find.byType(EpisodePage),
          matching: find.byType(Scrollable),
        )
        .first;
    await tester.drag(epScrollable, const Offset(0, -300));
    await tester.pumpAndSettle();

    // Tap comments tab
    await tester.tap(find.byKey(const Key('episode-tab-2')));
    await tester.pumpAndSettle();

    // Drag up further so comment input & submit button are clearly visible
    await tester.drag(epScrollable, const Offset(0, -300));
    await tester.pumpAndSettle();

    // Verify sample seed comments exist
    expect(
      find.text(
        'Cách dẫn dắt về Văn Miếu rất chậm rãi và sâu sắc. Thích nhất đoạn phân tích về những tấm bia tiến sĩ.',
      ),
      findsOneWidget,
    );

    // Try submitting prohibited comment
    await tester.enterText(
      find.byKey(const Key('comment-input')),
      'Nội dung này rất tục tĩu và vô lý',
    );
    await tester.tap(find.byKey(const Key('submit-comment-btn')));
    await tester.pumpAndSettle();

    // Moderation error appears
    expect(
      find.text(
        'Bình luận chứa từ ngữ chưa phù hợp với chuẩn mực thảo luận lịch sử.',
      ),
      findsOneWidget,
    );

    // Submit valid comment
    await tester.enterText(
      find.byKey(const Key('comment-input')),
      'Tư liệu lịch sử này rất thú vị và bổ ích!',
    );
    await tester.tap(find.byKey(const Key('submit-comment-btn')));
    await tester.pumpAndSettle();

    // Comment appears in list
    expect(
      find.text('Tư liệu lịch sử này rất thú vị và bổ ích!'),
      findsOneWidget,
    );

    await tester.pumpWidget(const SizedBox());
    state.dispose();
  });

  testWidgets(
    'Audience Flow: auth sheet login/register and transactions sheet',
    (tester) async {
      final state = await setupApp(tester);
      await tester.tap(find.text('Cá nhân'));
      await tester.pumpAndSettle();

      // Open login/register sheet
      expect(find.byKey(const Key('open-login-btn')), findsOneWidget);
      await tester.tap(find.byKey(const Key('open-login-btn')));
      await tester.pumpAndSettle();

      expect(find.text('Đăng nhập Sử Ký'), findsOneWidget);

      // Guest login
      await tester.tap(find.text('Dùng tài khoản khách thử nghiệm'));
      await tester.pumpAndSettle();

      expect(state.isLoggedIn, true);
      expect(state.displayName, 'Khách trải nghiệm');
      expect(find.text('khach.demo@suky.vn'), findsOneWidget);

      // Activate a demo membership to generate transaction
      await state.setDemoMembership(channels.first.name, true);
      await tester.pumpAndSettle();

      expect(state.transactions.isNotEmpty, true);
      expect(state.transactions.first.type, 'Kích hoạt thử');

      // Drag profile scrollable to show transaction history item
      final profileScrollable = find
          .descendant(
            of: find.byType(ProfileContent),
            matching: find.byType(Scrollable),
          )
          .first;
      await tester.scrollUntilVisible(
        find.byKey(const Key('open-tx-history')),
        300,
        scrollable: profileScrollable,
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('open-tx-history')));
      await tester.pumpAndSettle();

      expect(find.text('Gói hội viên & Giao dịch'), findsOneWidget);
      expect(find.text('Loại thao tác: Kích hoạt thử'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
      state.dispose();
    },
  );
}
