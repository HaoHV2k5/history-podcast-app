import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/creator_state.dart';
import 'package:su_ky_mobile_production/demo_data.dart';
import 'package:su_ky_mobile_production/demo_pages.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/narrator_pages.dart';
import 'package:su_ky_mobile_production/narrator_profile.dart';
import 'package:su_ky_mobile_production/narrator_state.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test(
    'demo snapshots once, switches presets and restores only owned keys',
    () async {
      SharedPreferences.setMockInitialValues({
        'displayName': 'Tên trước demo',
        'savedEpisodes': ['ha-noi'],
        'unrelated': 'keep',
      });
      final p = await SharedPreferences.getInstance(), d = DemoDataService(p);
      await expectLater(d.load('missing'), throwsStateError);
      expect(d.hasBackup, isFalse);
      await d.load('ready');
      expect(p.getString('displayName'), 'Minh Anh · Demo');
      final s = AppState(p), n = NarratorProfileState(p);
      expect(s.resumableEpisode?.id, 'thang-long');
      expect(n.canReceiveJobs, isTrue);
      s.dispose();
      n.dispose();
      await d.load('pending');
      final pending = NarratorProfileState(p);
      expect(pending.canReceiveJobs, isFalse);
      pending.dispose();
      await d.restore();
      expect(p.getString('displayName'), 'Tên trước demo');
      expect(p.getStringList('savedEpisodes'), ['ha-noi']);
      expect(p.getString('unrelated'), 'keep');
      expect(p.containsKey('narratorProfileV1'), isFalse);
      expect(d.hasBackup, isFalse);
    },
  );
  test(
    'narrator verification is separate and review locks edits until rejection',
    () async {
      SharedPreferences.setMockInitialValues({});
      final p = await SharedPreferences.getInstance();
      final n = NarratorProfileState(p), c = CreatorState(p);
      await n.verification.useVerifiedFixture();
      expect(c.kyc.isApproved, isFalse);
      await expectLater(
        n.saveProfile(
          name: 'a',
          bio: 'x',
          region: 'Bắc',
          transcript: 'x',
          sample: 'fake.wav',
        ),
        throwsStateError,
      );
      Future<void> save() => n.saveProfile(
        name: 'Người đọc thử',
        bio: 'Giọng kể trầm ấm và rõ tên nhân vật.',
        region: 'Bắc',
        transcript: 'Một trích đoạn hoàn toàn hư cấu để thử giao diện.',
        sample: 'demo-tu-su.wav',
      );
      await save();
      await n.submit();
      await expectLater(save(), throwsStateError);
      await expectLater(n.reviewDemo(false, reason: 'x'), throwsStateError);
      await n.reviewDemo(false, reason: 'Bổ sung trích đoạn dài hơn.');
      await save();
      await n.submit();
      await n.reviewDemo(true);
      final restored = NarratorProfileState(p);
      expect(restored.canReceiveJobs, isTrue);
      expect(restored.name, n.name);
      await expectLater(restored.submit(), throwsStateError);
      restored.dispose();
      n.dispose();
      c.dispose();
    },
  );
  test(
    'narrator role cannot act on other jobs or perform creator acceptance',
    () async {
      SharedPreferences.setMockInitialValues({});
      final p = await SharedPreferences.getInstance();
      await DemoDataService(p).load('ready');
      final n = NarratorProfileState(p),
          c = CreatorState(p),
          jobs = NarratorState(c);
      await expectLater(
        jobs.actAsNarrator('DEMO-HD-05', 'accept', n),
        throwsStateError,
      );
      await expectLater(
        jobs.actAsNarrator('DEMO-HD-03', 'complete', n),
        throwsStateError,
      );
      await jobs.actAsNarrator(
        'DEMO-HD-01',
        'counter',
        n,
        value: '450.000đ / tập mẫu',
      );
      await jobs.actAsNarrator('DEMO-HD-01', 'accept', n);
      await expectLater(
        jobs.actAsNarrator('DEMO-HD-01', 'narratorSign', n),
        throwsStateError,
      );
      await jobs.act('DEMO-HD-01', 'creatorSign', value: '889900');
      await jobs.actAsNarrator(
        'DEMO-HD-01',
        'narratorSign',
        n,
        value: '889900',
      );
      await expectLater(
        jobs.actAsNarrator('DEMO-HD-01', 'deliver', n, value: 'C:/fake.exe'),
        throwsStateError,
      );
      await jobs.actAsNarrator(
        'DEMO-HD-01',
        'deliver',
        n,
        value: 'narrator-demo.wav',
      );
      await jobs.act(
        'DEMO-HD-01',
        'revise',
        value: 'Đọc lại niên đại trong trích đoạn.',
      );
      await jobs.actAsNarrator(
        'DEMO-HD-01',
        'deliver',
        n,
        value: 'narrator-demo-v2.mp3',
      );
      await jobs.act('DEMO-HD-01', 'complete');
      final restored = NarratorState(c);
      expect(restored.order('DEMO-HD-01').status, ContractStatus.completed);
      expect(
        restored.order('DEMO-HD-01').deliveredAudioName,
        'narrator-demo-v2.mp3',
      );
      n.verification.kyc = const KycProfile(status: KycStatus.rejected);
      await expectLater(
        jobs.actAsNarrator('DEMO-HD-02', 'deliver', n),
        throwsStateError,
      );
      restored.dispose();
      jobs.dispose();
      n.dispose();
      c.dispose();
    },
  );
  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets('narrator and demo pages fit $size at 2x text', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      tester.platformDispatcher.textScaleFactorTestValue = 2;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      SharedPreferences.setMockInitialValues({});
      final p = await SharedPreferences.getInstance();
      await tester.runAsync(() => DemoDataService(p).load('ready'));
      final n = NarratorProfileState(p),
          c = CreatorState(p),
          jobs = NarratorState(c),
          s = AppState(p);
      for (final page in <Widget>[
        NarratorHome(preferences: p),
        NarratorProfilePage(state: n),
        NarratorJobPage(profile: n, jobs: jobs, creator: c, id: 'DEMO-HD-02'),
        DemoDataPage(state: s),
      ]) {
        await tester.pumpWidget(MaterialApp(theme: appTheme(), home: page));
        if (page is DemoDataPage) {
          await tester.runAsync(
            () => Future<void>.delayed(const Duration(milliseconds: 150)),
          );
        }
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        await tester.drag(find.byType(ListView).first, const Offset(0, -1400));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      }
      await tester.pumpWidget(const SizedBox());
      s.dispose();
      jobs.dispose();
      n.dispose();
      c.dispose();
    });
  }
  testWidgets('revision profile save closes cleanly and submits to review', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final p = await SharedPreferences.getInstance();
    await tester.runAsync(() => DemoDataService(p).load('revision'));
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: NarratorHome(preferences: p),
      ),
    );
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Soạn hồ sơ giọng đọc'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Soạn hồ sơ giọng đọc'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(0), 'Hải Đăng thử');
    await tester.scrollUntilVisible(
      find.text('Lưu hồ sơ giọng đọc'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Lưu hồ sơ giọng đọc'));
    await tester.pumpAndSettle();
    expect(find.byType(NarratorProfilePage), findsNothing);
    expect(find.text('Bỏ thay đổi hồ sơ?'), findsNothing);
    await tester.ensureVisible(find.text('Gửi hồ sơ giọng đọc'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Gửi hồ sơ giọng đọc'));
    await tester.pumpAndSettle();
    expect(find.text('Chờ duyệt giọng đọc'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
  });
}
