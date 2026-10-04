import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_mock/creator_state.dart';
import 'package:su_ky_mobile_mock/studio_pages.dart';
import 'package:su_ky_mobile_mock/design.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test(
    'KYC gate, review order, rejection reasons, persistence and locks',
    () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final s = CreatorState(prefs);
      await expectLater(s.createChannel('Sử nhỏ'), throwsStateError);
      await s.useVerifiedFixture();
      await s.createChannel('Sử nhỏ');
      const draft = CreatorDraft(
        id: '1',
        title: 'Một ngày ở Thăng Long',
        script: 'Kịch bản mẫu',
        sources: 'Tư liệu mẫu',
      );
      await s.save(draft);
      await expectLater(
        s.transition('1', DraftStage.approved),
        throwsStateError,
      );
      await s.transition('1', DraftStage.checked);
      await s.transition('1', DraftStage.pending, format: 'video');
      await expectLater(s.save(draft), throwsStateError);
      await expectLater(
        s.transition('1', DraftStage.rejected),
        throwsStateError,
      );
      await s.transition('1', DraftStage.rejected, reason: 'Thiếu số trang');
      final reloaded = CreatorState(prefs);
      expect(reloaded.channel, 'Sử nhỏ');
      expect(reloaded.drafts.single.reason, 'Thiếu số trang');
      expect(reloaded.drafts.single.format, 'video');
      await reloaded.save(draft);
      expect(reloaded.drafts.single.stage, DraftStage.draft);
      await reloaded.transition('1', DraftStage.checked);
      await reloaded.transition('1', DraftStage.pending);
      await reloaded.transition('1', DraftStage.approved);
      await expectLater(reloaded.save(draft), throwsStateError);
      await reloaded.save(const CreatorDraft(id: '2', title: 'Ý tưởng'));
      await expectLater(
        reloaded.transition('2', DraftStage.checked),
        throwsStateError,
      );
      s.dispose();
      reloaded.dispose();
    },
  );

  testWidgets('editor validates, saves and protects unsaved changes', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final s = CreatorState(await SharedPreferences.getInstance());
    await s.useVerifiedFixture();
    await s.createChannel('Sử nhỏ');
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Builder(
          builder: (c) => Scaffold(
            body: TextButton(
              onPressed: () => Navigator.push(
                c,
                MaterialPageRoute<void>(builder: (_) => DraftEditor(state: s)),
              ),
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    final scroll = find
        .descendant(
          of: find.byType(SingleChildScrollView),
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
    expect(s.drafts, isEmpty);
    await tester.scrollUntilVisible(
      find.byKey(const Key('draft-title')),
      -300,
      scrollable: scroll,
    );
    expect(find.text('Đặt tên cho câu chuyện của bạn.'), findsOneWidget);
    await tester.enterText(
      find.byKey(const Key('draft-title')),
      'Bản thảo mới',
    );
    await tester.pump();
    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Rời bản thảo?'), findsOneWidget);
    await tester.tap(find.text('Viết tiếp'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.byKey(const Key('save-draft')),
      300,
      scrollable: scroll,
    );
    await tester.tap(find.byKey(const Key('save-draft')));
    await tester.pumpAndSettle();
    expect(s.drafts.single.title, 'Bản thảo mới');
    expect(tester.takeException(), isNull);
    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Open'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    s.dispose();
  });

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets('Studio and all editor stages fit $size at 2x text', (
      tester,
    ) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final s = CreatorState(prefs);
      Future<void> mount(Widget page) => tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          builder: (_, child) => MediaQuery(
            data: MediaQueryData(
              size: size,
              textScaler: const TextScaler.linear(2),
            ),
            child: child!,
          ),
          home: page,
        ),
      );
      await mount(CreatorStudio(preferences: prefs));
      await tester.pumpAndSettle();
      await tester.drag(find.byType(ListView), const Offset(0, -1200));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await s.useVerifiedFixture();
      await s.createChannel('Những trang sử nhỏ');
      await s.save(
        const CreatorDraft(
          id: '1',
          title: 'Một ngày ở Thăng Long',
          script: 'Kịch bản',
          sources: 'Nguồn',
        ),
      );
      for (final stage in DraftStage.values) {
        if (stage == DraftStage.checked || stage == DraftStage.pending) {
          await s.transition('1', stage);
        }
        if (stage == DraftStage.rejected) {
          await s.transition(
            '1',
            stage,
            reason: 'Góp ý mẫu cần bổ sung tư liệu.',
          );
        }
        if (stage == DraftStage.approved) {
          await s.transition('1', DraftStage.checked);
          await s.transition('1', DraftStage.pending);
          await s.transition('1', stage);
        }
        await tester.pumpWidget(const SizedBox());
        await mount(DraftEditor(state: s, draft: s.drafts.single));
        await tester.pumpAndSettle();
        for (var i = 0; i < 12; i++) {
          await tester.drag(
            find.byType(SingleChildScrollView),
            const Offset(0, -350),
          );
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        }
      }
      await tester.pumpWidget(const SizedBox());
      s.dispose();
    });
  }
}
