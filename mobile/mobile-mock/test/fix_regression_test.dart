import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_mock/app_state.dart';
import 'package:su_ky_mobile_mock/creator_state.dart';
import 'package:su_ky_mobile_mock/design.dart';
import 'package:su_ky_mobile_mock/episode.dart';
import 'package:su_ky_mobile_mock/main.dart';
import 'package:su_ky_mobile_mock/narrator_marketplace.dart';
import 'package:su_ky_mobile_mock/narrator_state.dart';
import 'package:su_ky_mobile_mock/wallet_state.dart';
import 'package:su_ky_mobile_mock/studio_pages.dart';

Future<CreatorState> creator() async {
  SharedPreferences.setMockInitialValues({});
  final s = CreatorState(await SharedPreferences.getInstance());
  await s.useVerifiedFixture();
  await s.createChannel('Kênh thử');
  await s.save(
    const CreatorDraft(
      id: 'd1',
      title: 'Kinh thành xưa',
      script: 'Kịch bản đã lưu.',
      sources: 'Tư liệu mẫu.',
    ),
  );
  return s;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'KYC rejects nonnumeric IDs, impossible dates, missing and stale OTP',
    () async {
      SharedPreferences.setMockInitialValues({});
      final s = CreatorState(await SharedPreferences.getInstance());
      Future<void> submit({
        String id = '001099123456',
        String dob = '15/08/1995',
        String phone = '0912345678',
        String otp = '',
      }) => s.submitKyc(
        fullName: 'Trần Văn Sử',
        idNumber: id,
        dob: dob,
        phone: phone,
        otp: otp,
        idFront: true,
        idBack: true,
        selfie: true,
      );
      await expectLater(submit(id: 'abcdefghijkl'), throwsStateError);
      for (final date in [
        'invalid',
        '31/02/1995',
        '01/13/1995',
        '01/01/2099',
      ]) {
        await expectLater(submit(dob: date), throwsStateError);
      }
      await expectLater(submit(phone: ''), throwsStateError);
      await expectLater(submit(otp: '889900'), throwsStateError);
      s.requestDemoOtp('0912345678');
      await expectLater(submit(otp: '123456'), throwsStateError);
      await expectLater(
        submit(phone: '0901234567', otp: '889900'),
        throwsStateError,
      );
      await submit(otp: '889900');
      expect(s.kyc.status, KycStatus.pending);
      await s.simulateKycDecision(true);
      await expectLater(s.simulateKycDecision(false), throwsStateError);
      s.dispose();
    },
  );

  test(
    'pending and approved drafts stay locked through every mutation path',
    () async {
      final s = await creator();
      await s.transition('d1', DraftStage.checked);
      await s.transition('d1', DraftStage.pending);
      for (final stage in [DraftStage.pending, DraftStage.approved]) {
        if (stage == DraftStage.approved) await s.transition('d1', stage);
        await expectLater(s.retryDraft('d1'), throwsStateError);
        await expectLater(
          s.save(const CreatorDraft(id: 'd1', title: 'Overwrite')),
          throwsStateError,
        );
        await expectLater(
          s.importVideoScript(
            id: 'd1',
            fileName: 'test.mp4',
            fileSize: '5 MB',
            transcript: 'Overwrite',
          ),
          throwsStateError,
        );
        expect(s.drafts.single.stage, stage);
        expect(s.drafts.single.script, 'Kịch bản đã lưu.');
      }
      s.dispose();
    },
  );

  test(
    'creator mutations require approved KYC even for existing channels',
    () async {
      final s = await creator();
      s.requestDemoOtp('0912345678');
      await s.submitKyc(
        fullName: 'Trần Văn Sử',
        idNumber: '001099123456',
        dob: '15/08/1995',
        phone: '0912345678',
        otp: '889900',
        idFront: true,
        idBack: true,
        selfie: true,
      );
      await s.simulateKycDecision(false);
      await expectLater(
        s.transition('d1', DraftStage.checked),
        throwsStateError,
      );
      await expectLater(s.retryDraft('d1'), throwsStateError);
      await expectLater(
        s.save(const CreatorDraft(id: 'new', title: 'New')),
        throwsStateError,
      );
      await expectLater(
        s.importVideoScript(
          id: 'new',
          fileName: 'x.mp4',
          fileSize: '5 MB',
          transcript: 'New',
        ),
        throwsStateError,
      );
      await expectLater(
        s.updateChannelProfile(
          name: 'Bypass',
          description: '',
          category: 'Lịch sử',
        ),
        throwsStateError,
      );
      final c = NarratorState(s);
      await expectLater(
        c.invite(
          draftId: 'd1',
          narratorId: 'nar-1',
          narratorName: 'Hải Đăng',
          fee: '300000',
          notes: 'Yêu cầu',
          deadline: DateTime.now().add(const Duration(days: 7)),
        ),
        throwsStateError,
      );
      c.dispose();
      s.dispose();
    },
  );

  test(
    'switching demo auth identifiers clears stale persisted fields',
    () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final s = AppState(prefs);
      await s.login(identifier: 'test@example.com', password: '123456');
      await s.login(identifier: '0912345678', password: '123456');
      var reload = AppState(prefs);
      expect(reload.userEmail, isNull);
      expect(reload.userPhone, '0912345678');
      reload.dispose();
      await s.register(
        name: 'Người thử',
        identifier: 'other@example.com',
        password: '123456',
      );
      reload = AppState(prefs);
      expect(reload.userPhone, isNull);
      reload.dispose();
      await s.login(identifier: '0912345678', password: '123456');
      await s.loginAsGuest();
      reload = AppState(prefs);
      expect(reload.userPhone, isNull);
      reload.dispose();
      s.dispose();
    },
  );

  test('contract negotiation, signatures, revisions and acceptance persist with guards', () async {
    final s = await creator();
    final c = NarratorState(s);
    await WalletState(s.preferences).seed();
    await expectLater(
      c.invite(
        draftId: 'd1',
        narratorId: 'nar-1',
        narratorName: 'Hải Đăng',
        fee: '',
        notes: 'Yêu cầu',
        deadline: DateTime.now(),
      ),
      throwsStateError,
    );
    await c.invite(
      draftId: 'd1',
      narratorId: 'nar-1',
      narratorName: 'Hải Đăng',
      fee: '300000',
      notes: 'Giọng kể chậm',
      deadline: DateTime.now().add(const Duration(days: 7)),
    );
    final id = c.orders.single.id;
    await expectLater(c.act(id, 'creatorSign'), throwsStateError);
    await expectLater(c.act(id, 'deliver'), throwsStateError);
    await c.act(id, 'counter', value: '350000');
    expect(c.orders.single.status, ContractStatus.negotiating);
    await c.act(id, 'accept');
    await expectLater(c.act(id, 'narratorSign'), throwsStateError);
    await c.act(id, 'creatorSign', value: '889900');
    await c.act(id, 'narratorSign', value: '889900');
    await c.act(id, 'deliver');
    await expectLater(c.act(id, 'revise', value: ''), throwsStateError);
    await c.act(id, 'revise', value: 'Sửa cách đọc niên đại ở phút 02:10.');
    expect(c.orders.single.status, ContractStatus.inProduction);
    await c.act(id, 'deliver');
    await c.act(id, 'complete');
    await expectLater(
      c.act(id, 'revise', value: 'Không được'),
      throwsStateError,
    );
    final reload = NarratorState(CreatorState(s.preferences));
    expect(reload.orders.single.status, ContractStatus.completed);
    expect(reload.orders.single.revisionNotes, contains('02:10'));
    expect(reload.orders.single.feeProposal, '350000');
    expect(reload.orders.single.history.length, 9);
    reload.creator.dispose();
    reload.dispose();
    c.dispose();
    s.dispose();
  });

  testWidgets(
    'invitation resolves a copied draft by ID and saves after confirmation',
    (tester) async {
      final s = await creator();
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: NarratorMarketplacePage(
            state: s,
            preselectedDraft: CreatorDraft.fromJson(s.drafts.single.toJson()),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(
        find.byKey(const Key('invite-nar-1')),
        250,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('invite-nar-1')));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(find.byKey(const Key('confirm-send-invite')));
      await tester.tap(find.byKey(const Key('confirm-send-invite')));
      await tester.pumpAndSettle();
      final reload = NarratorState(s);
      expect(reload.orders.single.draftId, 'd1');
      expect(find.textContaining('Chờ phản hồi'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      reload.dispose();
      s.dispose();
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets('video and invitation sheets scroll at 2x text on $size', (
      tester,
    ) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final s = await creator();
      Widget app(Widget home) => MaterialApp(
        theme: appTheme(),
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: const TextScaler.linear(2),
            disableAnimations: true,
          ),
          child: child!,
        ),
        home: home,
      );
      await tester.pumpWidget(
        app(
          Scaffold(
            body: Builder(
              builder: (context) => TextButton(
                onPressed: () => showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  builder: (_) => VideoUploadSttModal(
                    onExtractComplete: (_, _, _, _, _) {},
                  ),
                ),
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(
        find.text('Tiến hành bóc tách (Speech-to-Text)'),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      await tester.pumpWidget(app(NarratorMarketplacePage(state: s)));
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(
        find.byKey(const Key('invite-nar-1')),
        250,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('invite-nar-1')));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('confirm-send-invite')));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      s.dispose();
    });
  }

  testWidgets(
    'player short drag springs back and reduced-motion player can close',
    (tester) async {
      SharedPreferences.setMockInitialValues({});
      final s = AppState(await SharedPreferences.getInstance());
      await tester.pumpWidget(SuKyApp(state: s));
      s.play(episodes.first);
      await tester.pumpAndSettle();
      final mini = find
          .descendant(
            of: find.byType(MiniPlayer),
            matching: find.byType(InkWell),
          )
          .first;
      await tester.tap(mini);
      await tester.pumpAndSettle();
      final header = find.text('TRÌNH NGHE');
      final origin = tester.getTopLeft(header);
      final gesture = await tester.startGesture(tester.getCenter(header));
      await gesture.moveBy(const Offset(0, 40));
      await tester.pump(const Duration(milliseconds: 200));
      await gesture.up();
      await tester.pumpAndSettle();
      expect(find.byType(PlayerPage), findsOneWidget);
      expect(tester.getTopLeft(header).dy, closeTo(origin.dy, 1));
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      s.dispose();
      final reduced = AppState(await SharedPreferences.getInstance());
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(disableAnimations: true),
            child: child!,
          ),
          home: HomeShell(state: reduced),
        ),
      );
      reduced.play(episodes.first);
      await tester.pumpAndSettle();
      await tester.tap(
        find
            .descendant(
              of: find.byType(MiniPlayer),
              matching: find.byType(InkWell),
            )
            .first,
      );
      await tester.pumpAndSettle();
      await tester.drag(find.text('TRÌNH NGHE'), const Offset(0, 160));
      await tester.pumpAndSettle();
      expect(find.byType(PlayerPage), findsNothing);
      expect(reduced.playing, isTrue);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      reduced.dispose();
    },
  );
}
