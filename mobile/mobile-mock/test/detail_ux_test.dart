import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_mock/creator_state.dart';
import 'package:su_ky_mobile_mock/demo_data.dart';
import 'package:su_ky_mobile_mock/design.dart';
import 'package:su_ky_mobile_mock/narrator_pages.dart';
import 'package:su_ky_mobile_mock/narrator_profile.dart';
import 'package:su_ky_mobile_mock/narrator_state.dart';
import 'package:su_ky_mobile_mock/wallet_forms.dart';
import 'package:su_ky_mobile_mock/wallet_page.dart';
import 'package:su_ky_mobile_mock/wallet_state.dart';

Future<SharedPreferences> ready(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  await tester.runAsync(() => DemoDataService(prefs).load('ready'));
  return prefs;
}

Future<void> press(WidgetTester tester, Finder finder) async {
  if (finder.evaluate().isEmpty) await tester.scrollUntilVisible(finder, 200);
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  test('VND input accepts grouped whole amounts and rejects decimal, negative and mixed formats', () {
    expect(parseWalletAmount(' 200.000 '), 200000);
    expect(parseWalletAmount('1200000'), 1200000);
    expect(parseWalletAmount('1.200.000'), 1200000);
    for (final value in [
      '',
      '-100000',
      '1.5',
      '100.00',
      '200,000',
      '200.000đ',
    ]) {
      expect(parseWalletAmount(value), isNull, reason: value);
    }
    expect(jobDeadline(''), 'Chưa có ngày hợp lệ');
    expect(jobDeadline('2026-10-15T18:00:00'), '15/10/2026');
  });

  testWidgets(
    'bank mismatch stays inline with inputs retained and does not write',
    (tester) async {
      final p = await ready(tester);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: WalletPage(preferences: p),
        ),
      );
      await tester.pumpAndSettle();
      await press(tester, find.byKey(const Key('link-bank')));
      await tester.enterText(find.byKey(const Key('bank-account')), '12345678');
      await tester.enterText(find.byKey(const Key('bank-holder')), 'Tên khác');
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      expect(find.textContaining('Tên phải khớp'), findsOneWidget);
      expect(find.byType(WalletFormDialog), findsOneWidget);
      expect(WalletState(p).wallet('creator')['bank'], isNull);
      expect(
        tester
            .widget<TextFormField>(find.byKey(const Key('bank-account')))
            .controller!
            .text,
        '12345678',
      );
      await tester.enterText(
        find.byKey(const Key('bank-holder')),
        CreatorState(p).kyc.fullName,
      );
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      expect(find.byType(WalletFormDialog), findsNothing);
      expect(WalletState(p).wallet('creator')['bank'], isNotNull);
    },
  );

  testWidgets(
    'withdraw review and editing never deduct until confirmation, then pending blocks duplicate and bank changes',
    (tester) async {
      final p = await ready(tester),
          ledger = WalletState(p),
          creator = CreatorState(p);
      await ledger.linkBank(
        'creator',
        creator.kyc,
        'Ngân hàng mẫu',
        '12345678',
        creator.kyc.fullName,
      );
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: WalletPage(preferences: p),
        ),
      );
      await tester.pumpAndSettle();
      await press(tester, find.byKey(const Key('withdraw-button')));
      await tester.enterText(
        find.byKey(const Key('withdraw-amount')),
        '99.999',
      );
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      expect(find.textContaining('Từ 100.000đ'), findsOneWidget);
      await tester.enterText(
        find.byKey(const Key('withdraw-amount')),
        '200.000',
      );
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      expect(
        find.textContaining('Còn khả dụng sau yêu cầu: 1.300.000đ'),
        findsOneWidget,
      );
      expect(WalletState(p).available('creator'), 1500000);
      await press(tester, find.text('Sửa số tiền'));
      expect(
        tester
            .widget<TextFormField>(find.byKey(const Key('withdraw-amount')))
            .controller!
            .text,
        '200.000',
      );
      await press(tester, find.text('Hủy'));
      expect(WalletState(p).available('creator'), 1500000);
      await press(tester, find.byKey(const Key('withdraw-button')));
      await tester.enterText(
        find.byKey(const Key('withdraw-amount')),
        '200000',
      );
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      expect(WalletState(p).available('creator'), 1300000);
      expect(
        tester
            .widget<FilledButton>(find.byKey(const Key('withdraw-button')))
            .onPressed,
        isNull,
      );
      expect(
        tester
            .widget<OutlinedButton>(find.byKey(const Key('link-bank')))
            .onPressed,
        isNull,
      );
      expect(
        (WalletState(p).wallet('creator')['withdrawals'] as List).length,
        1,
      );
      creator.dispose();
      ledger.dispose();
    },
  );

  testWidgets(
    'job cancellation needs confirmation and proposal validates without losing invitation',
    (tester) async {
      final p = await ready(tester),
          creator = CreatorState(p),
          profile = NarratorProfileState(p);
      final jobs = NarratorState(creator);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: NarratorJobPage(
            profile: profile,
            jobs: jobs,
            creator: creator,
            id: 'DEMO-HD-01',
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Đề xuất thù lao khác'), findsNothing);
      await press(tester, find.text('Hủy trước sản xuất'));
      await press(tester, find.text('Giữ công việc'));
      expect(jobs.order('DEMO-HD-01').status, ContractStatus.invited);
      await press(tester, find.text('Thương lượng hoặc từ chối'));
      await press(tester, find.text('Đề xuất thù lao khác'));
      await press(tester, find.text('Gửi yêu cầu mẫu'));
      expect(find.text('Nhập đề xuất của bạn.'), findsOneWidget);
      await tester.enterText(
        find.byKey(const Key('job-request-value')),
        '350.000đ / tập',
      );
      await press(tester, find.text('Gửi yêu cầu mẫu'));
      expect(jobs.order('DEMO-HD-01').status, ContractStatus.negotiating);
      expect(jobs.order('DEMO-HD-01').feeProposal, '350.000đ / tập');
      await press(tester, find.text('Hủy trước sản xuất'));
      await press(tester, find.text('Xác nhận hủy'));
      expect(jobs.order('DEMO-HD-01').status, ContractStatus.cancelled);
      await tester.pumpWidget(const SizedBox());
      profile.dispose();
      jobs.dispose();
      creator.dispose();
    },
  );

  testWidgets(
    'production does not auto deliver an invented file and disputes validate reason',
    (tester) async {
      final p = await ready(tester),
          creator = CreatorState(p),
          profile = NarratorProfileState(p);
      final jobs = NarratorState(creator);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: NarratorJobPage(
            profile: profile,
            jobs: jobs,
            creator: creator,
            id: 'DEMO-HD-02',
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Tên file bàn giao mẫu'), findsNothing);
      await press(tester, find.text('Thử bàn giao bằng tên file'));
      await press(tester, find.text('Bàn giao tên file mẫu'));
      expect(jobs.order('DEMO-HD-02').status, ContractStatus.inProduction);
      expect(
        find.textContaining('Chọn bản thu, hoặc nhập tên file'),
        findsOneWidget,
      );
      await press(tester, find.text('Cần hỗ trợ công việc?'));
      await press(tester, find.text('Gửi yêu cầu phân xử mẫu'));
      await tester.enterText(find.byKey(const Key('job-request-value')), 'x');
      await press(tester, find.text('Gửi yêu cầu mẫu'));
      expect(find.text('Ghi ít nhất 5 ký tự.'), findsOneWidget);
      expect(jobs.order('DEMO-HD-02').status, ContractStatus.inProduction);
      await tester.enterText(
        find.byKey(const Key('job-request-value')),
        'Cần đối chiếu điều khoản',
      );
      await press(tester, find.text('Gửi yêu cầu mẫu'));
      expect(jobs.order('DEMO-HD-02').status, ContractStatus.disputed);
      expect(WalletState(p).escrows['DEMO-HD-02']['status'], 'held');
      await tester.pumpWidget(const SizedBox());
      profile.dispose();
      jobs.dispose();
      creator.dispose();
    },
  );

  testWidgets(
    'stale withdrawal review keeps dialog and input when a pending request appears',
    (tester) async {
      final p = await ready(tester),
          ledger = WalletState(p),
          creator = CreatorState(p);
      await ledger.linkBank(
        'creator',
        creator.kyc,
        'Ngân hàng mẫu',
        '12345678',
        creator.kyc.fullName,
      );
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: WalletFormDialog(
            ledger: ledger,
            owner: 'creator',
            kyc: creator.kyc,
            linkBank: false,
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('withdraw-amount')),
        '200.000',
      );
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      await ledger.withdraw('creator', creator.kyc, 100000);
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      expect(find.byType(WalletFormDialog), findsOneWidget);
      expect(find.text('Hãy xử lý yêu cầu đang chờ trước.'), findsOneWidget);
      expect(WalletState(p).available('creator'), 1400000);
      expect(
        (WalletState(p).wallet('creator')['withdrawals'] as List).length,
        1,
      );
      await press(tester, find.text('Sửa số tiền'));
      expect(
        tester
            .widget<TextFormField>(find.byKey(const Key('withdraw-amount')))
            .controller!
            .text,
        '200.000',
      );
      await tester.pumpWidget(const SizedBox());
      creator.dispose();
      ledger.dispose();
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets('wallet review fits $size at double text', (tester) async {
      final p = await ready(tester),
          ledger = WalletState(p),
          creator = CreatorState(p);
      await ledger.linkBank(
        'creator',
        creator.kyc,
        'Ngân hàng mẫu',
        '12345678',
        creator.kyc.fullName,
      );
      tester.view.physicalSize = size;
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: MediaQuery(
            data: MediaQueryData(
              size: size,
              textScaler: const TextScaler.linear(2),
              disableAnimations: true,
            ),
            child: WalletFormDialog(
              ledger: ledger,
              owner: 'creator',
              kyc: creator.kyc,
              linkBank: false,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('withdraw-amount')),
        '200.000',
      );
      await press(tester, find.byKey(const Key('wallet-form-submit')));
      expect(find.text('Kiểm tra yêu cầu'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      creator.dispose();
      ledger.dispose();
    });
  }
}
