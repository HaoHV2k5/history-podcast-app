import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/creator_state.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/kyc_form.dart';
import 'package:su_ky_mobile_production/main.dart';

class DelayedKyc extends CreatorState {
  DelayedKyc(super.preferences);
  Completer<void> request = Completer<void>();
  int calls = 0;
  @override
  Future<void> submitKyc({
    required String fullName,
    required String idNumber,
    required String dob,
    required String phone,
    String otp = '',
    required bool idFront,
    required bool idBack,
    required bool selfie,
  }) {
    calls++;
    return request.future;
  }
}

Future<SharedPreferences> fresh(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  SharedPreferences.setMockInitialValues({});
  return SharedPreferences.getInstance();
}

Future<void> press(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

Future<void> openKyc(
  WidgetTester tester,
  CreatorState state, {
  double scale = 1,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: appTheme(),
      builder: (c, child) => MediaQuery(
        data: MediaQuery.of(c).copyWith(
          textScaler: TextScaler.linear(scale),
          disableAnimations: true,
        ),
        child: child!,
      ),
      home: Builder(
        builder: (c) => Scaffold(
          body: TextButton(
            child: const Text('Mở KYC'),
            onPressed: () => showModalBottomSheet<void>(
              context: c,
              isScrollControlled: true,
              useSafeArea: true,
              isDismissible: false,
              enableDrag: false,
              builder: (sheet) => KycSheet(
                state: state,
                onSubmitted: () => Navigator.pop(sheet),
              ),
            ),
          ),
        ),
      ),
    ),
  );
  await press(tester, find.text('Mở KYC'));
}

void main() {
  test('DOB form and state use calendar-valid, birthday-aware demo gate', () {
    final today = DateTime(2026, 10, 4);
    expect(validateKycBirthDate('04/10/2008', today: today), isNull);
    expect(
      validateKycBirthDate('05/10/2008', today: today),
      contains('18 tuổi'),
    );
    expect(
      validateKycBirthDate('31/02/1996', today: today),
      contains('không hợp lệ'),
    );
    expect(validateKycBirthDate('29/02/1996', today: today), isNull);
    expect(validateKycBirthDate('01/01/2099', today: today), isNotNull);
  });

  testWidgets(
    'comment failed save has no phantom entry; retry persists once and pending prevents duplicate',
    (tester) async {
      final prefs = await fresh(tester);
      var request = Completer<bool>();
      final state = AppState(
        prefs,
        writeComments: (key, value) async {
          final ok = await request.future;
          return ok ? prefs.setStringList(key, value) : false;
        },
      );
      final id = episodes.first.id,
          count = state.getComments(episodes.first.id).length;
      final first = state.addComment(id, 'Một góc nhìn mới');
      expect(
        await state.addComment(id, 'Một góc nhìn mới'),
        contains('đang được lưu'),
      );
      request.complete(false);
      expect(await first, contains('thử lại'));
      expect(state.getComments(id).length, count);
      expect(prefs.getStringList('userComments'), isNull);
      request = Completer<bool>()..complete(true);
      expect(await state.addComment(id, 'Một góc nhìn mới'), isNull);
      expect(state.getComments(id).length, count + 1);
      expect(
        AppState(prefs)
            .getComments(id)
            .where((c) => c.content == 'Một góc nhìn mới')
            .length,
        1,
      );
      state.dispose();
    },
  );

  testWidgets(
    'comment editor locks while saving, retains failed text and retries',
    (tester) async {
      final prefs = await fresh(tester);
      var request = Completer<bool>();
      final state = AppState(prefs, writeComments: (_, _) => request.future);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: Scaffold(
            body: SingleChildScrollView(
              child: EpisodeCommentsSection(
                episode: episodes.first,
                state: state,
              ),
            ),
          ),
        ),
      );
      final input = find.byKey(const Key('comment-input'));
      await tester.enterText(input, 'Câu chuyện đáng nghe');
      await tester.tap(find.byKey(const Key('submit-comment-btn')));
      await tester.pump();
      expect(tester.widget<TextField>(input).readOnly, true);
      expect(
        tester
            .widget<IconButton>(find.byKey(const Key('submit-comment-btn')))
            .onPressed,
        isNull,
      );
      request.completeError(StateError('storage failure'));
      await tester.pumpAndSettle();
      expect(
        tester.widget<TextField>(input).controller!.text,
        'Câu chuyện đáng nghe',
      );
      expect(find.textContaining('thử lại'), findsOneWidget);
      request = Completer<bool>()..complete(true);
      await press(tester, find.byKey(const Key('submit-comment-btn')));
      expect(tester.widget<TextField>(input).controller!.text, isEmpty);
      expect(find.text('Đã lưu bình luận trên thiết bị.'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
      state.dispose();
    },
  );

  testWidgets(
    'KYC dismiss confirmation preserves edits, barrier cannot discard, back can discard',
    (tester) async {
      final state = CreatorState(await fresh(tester));
      await openKyc(tester, state);
      await tester.enterText(find.byType(TextFormField).first, 'Tên đã sửa');
      await tester.tapAt(const Offset(5, 5));
      await tester.pumpAndSettle();
      expect(find.byType(KycSheet), findsOneWidget);
      await press(tester, find.byTooltip('Đóng hồ sơ'));
      expect(find.text('Rời hồ sơ đang nhập?'), findsOneWidget);
      await press(tester, find.text('Nhập tiếp'));
      expect(
        tester
            .widget<TextFormField>(find.byType(TextFormField).first)
            .controller!
            .text,
        'Tên đã sửa',
      );
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      await press(tester, find.text('Bỏ thay đổi'));
      expect(find.byType(KycSheet), findsNothing);
      expect(state.kyc.status, KycStatus.notSubmitted);
      state.dispose();
    },
  );

  testWidgets(
    'KYC invalid DOB focuses field and phone changes invalidate old OTP',
    (tester) async {
      final state = CreatorState(await fresh(tester));
      await openKyc(tester, state);
      await tester.enterText(find.byType(TextFormField).at(2), '31/02/1996');
      await press(tester, find.byKey(const Key('kyc-submit')));
      expect(find.text('Ngày sinh không hợp lệ.'), findsOneWidget);
      expect(
        tester
            .widget<TextField>(
              find.descendant(
                of: find.byType(TextFormField).at(2),
                matching: find.byType(TextField),
              ),
            )
            .focusNode!
            .hasFocus,
        true,
      );
      await tester.enterText(find.byType(TextFormField).at(2), '12/04/1996');
      await press(tester, find.text('Gửi OTP thử'));
      await tester.enterText(find.byType(TextFormField).at(4), '889900');
      await tester.enterText(find.byType(TextFormField).at(3), '0901234567');
      await tester.pumpAndSettle();
      expect(find.byType(TextFormField), findsNWidgets(4));
      await press(tester, find.text('Gửi OTP thử'));
      expect(
        tester
            .widget<TextFormField>(find.byType(TextFormField).at(4))
            .controller!
            .text,
        isEmpty,
      );
      await tester.pumpWidget(const SizedBox());
      state.dispose();
    },
  );

  testWidgets(
    'KYC busy blocks back and duplicate submit; failed request retains fields for retry',
    (tester) async {
      final state = DelayedKyc(await fresh(tester));
      await openKyc(tester, state);
      await press(tester, find.text('Gửi OTP thử'));
      await tester.enterText(find.byType(TextFormField).at(4), '889900');
      for (var i = 0; i < 3; i++) {
        await press(tester, find.byType(CheckboxListTile).at(i));
      }
      await tester.ensureVisible(find.byKey(const Key('kyc-submit')));
      await tester.tap(find.byKey(const Key('kyc-submit')));
      await tester.pump();
      expect(
        tester
            .widget<FilledButton>(find.byKey(const Key('kyc-submit')))
            .onPressed,
        isNull,
      );
      await tester.binding.handlePopRoute();
      await tester.pump();
      expect(find.byType(KycSheet), findsOneWidget);
      expect(state.calls, 1);
      state.request.completeError(StateError('Chưa lưu được hồ sơ. Thử lại.'));
      await tester.pumpAndSettle();
      expect(find.textContaining('Thử lại.'), findsOneWidget);
      expect(
        tester
            .widget<TextFormField>(find.byType(TextFormField).at(4))
            .controller!
            .text,
        '889900',
      );
      state.request = Completer<void>()..complete();
      await press(tester, find.byKey(const Key('kyc-submit')));
      expect(state.calls, 2);
      expect(find.byType(KycSheet), findsNothing);
      state.dispose();
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets(
      'KYC layout fits $size with 2x text, keyboard inset and reduced motion',
      (tester) async {
        final state = CreatorState(await fresh(tester));
        tester.view.physicalSize = size;
        await openKyc(tester, state, scale: 2);
        await press(tester, find.text('Gửi OTP thử'));
        tester.view.viewInsets = const FakeViewPadding(bottom: 140);
        addTearDown(tester.view.resetViewInsets);
        await tester.pumpAndSettle();
        await tester.ensureVisible(find.byType(TextFormField).at(4));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
        state.dispose();
      },
    );
  }
}
