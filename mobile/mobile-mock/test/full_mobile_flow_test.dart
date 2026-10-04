import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_mock/app_state.dart';
import 'package:su_ky_mobile_mock/creator_state.dart';
import 'package:su_ky_mobile_mock/demo_data.dart';
import 'package:su_ky_mobile_mock/design.dart';
import 'package:su_ky_mobile_mock/episode.dart';
import 'package:su_ky_mobile_mock/narrator_state.dart';
import 'package:su_ky_mobile_mock/notification_page.dart';
import 'package:su_ky_mobile_mock/publication_page.dart';
import 'package:su_ky_mobile_mock/video_surface.dart';
import 'package:su_ky_mobile_mock/wallet_page.dart';
import 'package:su_ky_mobile_mock/wallet_state.dart';
import 'package:su_ky_mobile_mock/contract_pdf.dart';

Future<SharedPreferences> fresh() async {
  SharedPreferences.setMockInitialValues({});
  return SharedPreferences.getInstance();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test(
    'contract PDF is generated with local Vietnamese font and sample fields',
    () async {
      final p = await fresh();
      await DemoDataService(p).load('ready');
      final c = CreatorState(p), jobs = NarratorState(c);
      final bytes = await contractPdf(jobs.order('DEMO-HD-06'));
      expect(String.fromCharCodes(bytes.take(4)), '%PDF');
      expect(bytes.length, greaterThan(1000));
      c.dispose();
      jobs.dispose();
    },
  );
  test('wallet blocks invalid KYC/bank/amount and returns failed funds exactly once', () async {
    final p = await fresh(), w = WalletState(p), c = CreatorState(p);
    await w.seed();
    await expectLater(w.seed(), throwsStateError);
    await expectLater(
      w.linkBank('creator', c.kyc, 'Mẫu', '12345678', 'Sai tên'),
      throwsStateError,
    );
    await c.useVerifiedFixture();
    await expectLater(
      w.linkBank('creator', c.kyc, 'Mẫu', '123', c.kyc.fullName),
      throwsStateError,
    );
    await expectLater(
      w.linkBank('creator', c.kyc, 'Mẫu', '12345678', 'Sai tên'),
      throwsStateError,
    );
    await w.linkBank('creator', c.kyc, 'Mẫu', '12345678', c.kyc.fullName);
    await expectLater(w.withdraw('creator', c.kyc, 99999), throwsStateError);
    await expectLater(w.withdraw('creator', c.kyc, 99999999), throwsStateError);
    await w.withdraw('creator', c.kyc, 200000);
    expect(w.available('creator'), 1800000);
    await expectLater(w.withdraw('creator', c.kyc, 200000), throwsStateError);
    final id =
        (w.wallet('creator')['withdrawals'] as List).first['id'] as String;
    await w.resolveWithdrawal(
      'creator',
      id,
      false,
      reason: 'Ngân hàng mẫu lỗi',
    );
    expect(w.available('creator'), 2000000);
    await expectLater(
      w.resolveWithdrawal('creator', id, false, reason: 'Ngân hàng mẫu lỗi'),
      throwsStateError,
    );
    await w.withdraw('creator', c.kyc, 100000);
    final next =
        (w.wallet('creator')['withdrawals'] as List).first['id'] as String;
    await w.resolveWithdrawal('creator', next, true);
    await w.releaseHolding('creator');
    expect(WalletState(p).available('creator'), 2400000);
    c.dispose();
    w.dispose();
  });
  test('OTP, insufficient escrow, signing, refund and release cannot duplicate money', () async {
    final p = await fresh();
    await DemoDataService(p).load('ready');
    final c = CreatorState(p), jobs = NarratorState(c), w = WalletState(p);
    await jobs.act('DEMO-HD-01', 'accept');
    await expectLater(
      jobs.act('DEMO-HD-01', 'creatorSign', value: '000000'),
      throwsStateError,
    );
    await jobs.act('DEMO-HD-01', 'creatorSign', value: '889900');
    final original = w.available('creator');
    await jobs.act('DEMO-HD-01', 'narratorSign', value: '889900');
    w.refresh();
    expect(w.available('creator'), original - 300000);
    await w.reserve('DEMO-HD-01', 'nar-1', 300000);
    expect(w.available('creator'), original - 300000);
    await jobs.act('DEMO-HD-01', 'deliver');
    await jobs.act(
      'DEMO-HD-01',
      'dispute',
      value: 'Không thống nhất bản bàn giao',
    );
    await jobs.act('DEMO-HD-01', 'demoRefund');
    w.refresh();
    expect(w.available('creator'), original);
    await expectLater(jobs.act('DEMO-HD-01', 'demoRelease'), throwsStateError);
    await jobs.act('DEMO-HD-03', 'complete');
    w.refresh();
    expect(w.holding('narrator:nar-1'), 600000);
    await w.settle('DEMO-HD-03', refund: false);
    expect(w.holding('narrator:nar-1'), 600000);
    await expectLater(w.reserve('other', 'nar-1', 9000000), throwsStateError);
    jobs.dispose();
    c.dispose();
    w.dispose();
  });
  test('cancellation is before production and narrator disputes preserve escrow until resolution', () async {
    final p = await fresh();
    await DemoDataService(p).load('ready');
    final c = CreatorState(p), jobs = NarratorState(c);
    await jobs.act('DEMO-HD-06', 'cancel');
    expect(jobs.order('DEMO-HD-06').status, ContractStatus.cancelled);
    await expectLater(jobs.act('DEMO-HD-02', 'cancel'), throwsStateError);
    await expectLater(
      jobs.act('DEMO-HD-02', 'dispute', value: 'x'),
      throwsStateError,
    );
    await jobs.act('DEMO-HD-02', 'dispute', value: 'Cần đối chiếu điều khoản');
    expect(WalletState(p).escrows['DEMO-HD-02']['status'], 'held');
    await jobs.act('DEMO-HD-02', 'demoRelease');
    expect(WalletState(p).escrows['DEMO-HD-02']['status'], 'released');
    c.dispose();
    jobs.dispose();
  });
  test('publish requires final review and ready artifact; reload has correct type, gate and unpublish', () async {
    final p = await fresh();
    await DemoDataService(p).load('ready');
    final c = CreatorState(p),
        production = PublicationState(c),
        app = AppState(p);
    await expectLater(production.buildDemo('demo-d1'), throwsStateError);
    await expectLater(
      production.publish('demo-d4', membersOnly: true),
      throwsStateError,
    );
    await production.buildDemo('demo-d4', fail: true);
    await expectLater(
      production.publish('demo-d4', membersOnly: true),
      throwsStateError,
    );
    await production.buildDemo('demo-d4');
    await production.publish('demo-d4', membersOnly: true);
    app.reloadCatalog();
    final episode = allEpisodes.firstWhere((e) => e.id == 'published-demo-d4');
    expect(episode.isVideo, isTrue);
    expect(episode.mediaAsset, 'assets/mock/video/playback-demo.mp4');
    expect(app.canPlay(episode), isFalse);
    expect(channelByName(c.channel).hasMembership, isTrue);
    await app.setDemoMembership(c.channel, true);
    expect(app.canPlay(episode), isTrue);
    await expectLater(
      production.publish('demo-d4', membersOnly: false),
      throwsStateError,
    );
    app.recentPlayed.insert(0, episode.id);
    await production.unpublish('demo-d4');
    app.reloadCatalog();
    expect(app.listeningHistory.any((e) => e.id == episode.id), isFalse);
    final restored = AppState(p);
    expect(allEpisodes.any((e) => e.id == episode.id), isFalse);
    restored.dispose();
    app.dispose();
    c.dispose();
    production.dispose();
  });
  test('checkout pending/failure/retry/success/expiry persist and never grant premature rights', () async {
    final p = await fresh(), s = AppState(p), e = videoEpisodes.last;
    await s.beginCheckout(e.channel);
    expect(s.canPlay(e), false);
    await expectLater(s.beginCheckout(e.channel), throwsStateError);
    await s.finishCheckout(e.channel, false);
    expect(s.checkoutStatus(e.channel), 'failed');
    await s.beginCheckout(e.channel);
    await s.finishCheckout(e.channel, true);
    expect(s.canPlay(e), true);
    await s.expireMembership(e.channel);
    expect(s.canPlay(e), false);
    final restored = AppState(p);
    expect(restored.checkoutStatus(e.channel), 'expired');
    restored.dispose();
    s.dispose();
  });
  test(
    'queue persists and skips content whose membership was revoked',
    () async {
      final p = await fresh(), s = AppState(p);
      await s.setDemoMembership(memberEpisodes.first.channel, true);
      s.addToQueue(memberEpisodes.first);
      s.addToQueue(episodes.first);
      s.addToQueue(episodes.first);
      expect(s.queue.length, 2);
      await s.setDemoMembership(memberEpisodes.first.channel, false);
      s.playNext();
      expect(s.current, episodes.first);
      expect(s.queue, isEmpty);
      s.addToQueue(episodes[1]);
      final restored = AppState(p);
      expect(restored.queue, [episodes[1].id]);
      restored.dispose();
      s.dispose();
    },
  );
  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets(
      'new mobile pages fit $size at 2x text with loading/error video',
      (tester) async {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1;
        tester.platformDispatcher.textScaleFactorTestValue = 2;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
        final p = await fresh();
        await tester.runAsync(() => DemoDataService(p).load('ready'));
        final app = AppState(p);
        for (final page in <Widget>[
          WalletPage(preferences: p),
          PublicationPage(preferences: p, app: app),
          NotificationPage(state: app),
        ]) {
          await tester.pumpWidget(MaterialApp(theme: appTheme(), home: page));
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          await tester.drag(
            find.byType(ListView).first,
            const Offset(0, -2000),
          );
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        }
        app.current = videoEpisodes.first;
        app.videoLoading = true;
        await tester.pumpWidget(
          MaterialApp(
            theme: appTheme(),
            home: Scaffold(body: VideoSurface(state: app)),
          ),
        );
        await tester.pump();
        expect(tester.takeException(), isNull);
        app.videoLoading = false;
        app.videoError = 'Demo failure';
        await tester.pumpWidget(
          MaterialApp(
            theme: appTheme(),
            home: Scaffold(body: VideoSurface(state: app)),
          ),
        );
        await tester.pump();
        expect(find.byKey(const Key('retry-video')), findsOneWidget);
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
        app.dispose();
      },
    );
  }
}
