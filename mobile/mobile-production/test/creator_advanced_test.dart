import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/creator_state.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/studio_pages.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('Creator Flow: KYC validation (age >= 18, 12 digits ID), pending & decision gates', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final state = CreatorState(prefs);

    // Channel creation blocked when KYC not approved
    await expectLater(state.createChannel('Sử ký Việt'), throwsStateError);

    // Under 18 years old validation (BR-01)
    await expectLater(
      state.submitKyc(
        fullName: 'Nguyễn Văn Em',
        idNumber: '001099123456',
        dob: '01/01/2015', // Under 18
        phone: '0912345678',
        idFront: true,
        idBack: true,
        selfie: true,
      ),
      throwsStateError,
    );

    // Invalid CCCD (not 12 digits)
    await expectLater(
      state.submitKyc(
        fullName: 'Nguyễn Văn Em',
        idNumber: '12345',
        dob: '01/01/1990',
        phone: '0912345678',
        idFront: true,
        idBack: true,
        selfie: true,
      ),
      throwsStateError,
    );

    // Valid submission (>= 18 years old)
    state.requestDemoOtp('0912345678');
    await state.submitKyc(
      fullName: 'Trần Văn Sử',
      idNumber: '001099001122',
      dob: '15/08/1995',
      phone: '0912345678',
      otp: '889900',
      idFront: true,
      idBack: true,
      selfie: true,
    );

    expect(state.kyc.status, KycStatus.pending);
    expect(state.demoVerified, false);
    // Channel creation still blocked while pending
    await expectLater(state.createChannel('Sử ký Việt'), throwsStateError);

    // Rejection simulation
    await state.simulateKycDecision(false, reason: 'Ảnh CCCD bị mờ');
    expect(state.kyc.status, KycStatus.rejected);
    expect(state.kyc.rejectionReason, 'Ảnh CCCD bị mờ');
    expect(state.demoVerified, false);

    // Rejected profiles must be corrected and resubmitted before approval.
    await expectLater(state.simulateKycDecision(true), throwsStateError);
    state.requestDemoOtp('0912345678');
    await state.submitKyc(
      fullName: 'Trần Văn Sử',
      idNumber: '001099001122',
      dob: '15/08/1995',
      phone: '0912345678',
      otp: '889900',
      idFront: true,
      idBack: true,
      selfie: true,
    );
    await state.simulateKycDecision(true);
    expect(state.kyc.status, KycStatus.approved);
    expect(state.demoVerified, true);

    // Now channel can be created
    await state.createChannel('Sử ký Việt', description: 'Góc nhìn sử Việt');
    expect(state.channel, 'Sử ký Việt');
    expect(state.channelDescription, 'Góc nhìn sử Việt');

    state.dispose();
  });

  test('Creator Flow: Video STT import, Review history audit and Retry draft (BR-04)', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final state = CreatorState(prefs);
    await state.useVerifiedFixture();
    await state.createChannel('Kinh Kỳ Cổ');

    // Import Video STT
    await state.importVideoScript(
      id: 'ep-vid-1',
      fileName: 'Thang_Long_1080p.mp4',
      fileSize: '185 MB',
      transcript: 'Hoàng thành Thăng Long là quần thể di tích gắn với lịch sử kinh thành Hà Nội.',
      title: 'Dấu tích Hoàng thành',
    );

    final draft = state.drafts.single;
    expect(draft.id, 'ep-vid-1');
    expect(draft.format, 'video');
    expect(draft.videoFileName, 'Thang_Long_1080p.mp4');
    expect(draft.script.contains('Hoàng thành'), true);
    expect(draft.reviewHistory.isNotEmpty, true);

    // AI Check transition
    await state.transition('ep-vid-1', DraftStage.checked);
    expect(state.drafts.single.stage, DraftStage.checked);

    // Retry draft (BR-04: unlimited retries before submission)
    await state.retryDraft('ep-vid-1');
    expect(state.drafts.single.stage, DraftStage.draft);
    expect(state.drafts.single.reviewHistory.length, 3);

    // Check again and submit for moderation
    await state.transition('ep-vid-1', DraftStage.checked);
    await state.transition('ep-vid-1', DraftStage.pending);
    expect(state.drafts.single.stage, DraftStage.pending);

    // Moderator approves
    await state.transition('ep-vid-1', DraftStage.approved);
    expect(state.drafts.single.stage, DraftStage.approved);

    state.dispose();
  });

  testWidgets('Creator Flow: UI test Video STT modal and Preview player', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(375, 812);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final state = CreatorState(prefs);
    await state.useVerifiedFixture();
    await state.createChannel('Thăng Long Ký');

    final d = const CreatorDraft(
      id: 'd1',
      title: 'Hồ Gươm sương sớm',
      script: 'Mặt hồ sáng sớm phủ một lớp sương mờ.',
      sources: 'Hà Nội 36 phố phường - Thạch Lam.',
    );
    await state.save(d);

    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: DraftEditor(state: state, draft: state.drafts.single),
      ),
    );
    await tester.pumpAndSettle();

    // Verify draft loaded
    expect(find.text('Hồ Gươm sương sớm'), findsOneWidget);

    // Open Video Upload modal
    expect(find.byKey(const Key('appbar-upload-video')), findsOneWidget);
    await tester.tap(find.byKey(const Key('appbar-upload-video')));
    await tester.pumpAndSettle();

    // Modal is open
    expect(find.text('Tải video & Bóc tách kịch bản'), findsOneWidget);
    expect(find.text('Bí ẩn kiến trúc Hoàng thành Thăng Long'), findsOneWidget);

    // Tap extract
    await tester.tap(find.text('Tiến hành bóc tách (Speech-to-Text)'));
    // Advance timers for simulation
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();

    // Script should be updated from video transcript
    expect(find.textContaining('khu khảo cổ 18 Hoàng Diệu'), findsOneWidget);

    // Scroll and save updated draft
    final scroll = find
        .descendant(
          of: find.byType(DraftEditor),
          matching: find.byType(Scrollable),
        )
        .first;
    await tester.scrollUntilVisible(
      find.byKey(const Key('save-draft')),
      300,
      scrollable: scroll,
    );
    await tester.tap(find.byKey(const Key('save-draft')));
    await tester.pumpAndSettle();
    ScaffoldMessenger.of(tester.element(find.byType(DraftEditor)))
        .clearSnackBars();
    await tester.pumpAndSettle();

    expect(
      state.drafts.single.videoFileName,
      'Hoang_thanh_Thang_Long_1080p.mp4',
    );
    expect(state.drafts.single.videoFileSize, '185 MB');
    final reload = CreatorState(prefs);
    expect(reload.drafts.single.extractedTranscript, contains('18 Hoàng Diệu'));
    expect(reload.drafts.single.reviewHistory.last.timestamp, contains('/'));
    reload.dispose();

    // Scroll to and tap AI check button
    await tester.scrollUntilVisible(
      find.text('Thử kết quả AI: đạt'),
      300,
      scrollable: scroll,
    );
    await tester.tap(find.text('Thử kết quả AI: đạt'));
    await tester.pumpAndSettle();

    // Scroll to preview player and retry button
    await tester.scrollUntilVisible(
      find.byKey(const Key('retry-draft-btn')),
      300,
      scrollable: scroll,
    );

    // Verify preview player card and retry button appear
    expect(find.textContaining('Bản dựng nghe thử'), findsOneWidget);
    expect(find.byKey(const Key('retry-draft-btn')), findsOneWidget);

    await tester.scrollUntilVisible(
      find.byKey(const Key('studio-preview-play')),
      -200,
      scrollable: scroll,
    );
    await tester.tap(find.byKey(const Key('studio-preview-play')));
    await tester.pump(const Duration(seconds: 2));
    expect(find.textContaining('0:02 / 4:15'), findsOneWidget);
    await tester.tap(find.byKey(const Key('studio-preview-play')));
    await tester.pump(const Duration(seconds: 1));
    expect(find.textContaining('0:02 / 4:15'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.byKey(const Key('retry-draft-btn')),
      200,
      scrollable: scroll,
    );

    // Tap retry button (BR-04)
    await tester.tap(find.byKey(const Key('retry-draft-btn')));
    await tester.pumpAndSettle();

    // Returned to draft stage
    expect(state.drafts.single.stage, DraftStage.draft);

    await tester.pumpWidget(const SizedBox());
    state.dispose();
  });
}
