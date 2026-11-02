import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/creator_state.dart';
import 'package:su_ky_mobile_production/kyc_management_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('KycManagementPage renders approved state with verified info grid', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'userRoles': ['VIEWER', 'CREATOR'],
      'isCreator': true,
      'kycStatus': 'APPROVED',
      'userFullName': 'Trần Đại Nghĩa',
    });
    final prefs = await SharedPreferences.getInstance();
    final appState = AppState(prefs);
    final creatorState = CreatorState(prefs);
    creatorState.kyc = const KycProfile(
      fullName: 'Trần Đại Nghĩa',
      phone: '0912345678',
      contactEmail: 'phoenix090205@gmail.com',
      bankName: 'Vietcombank',
      bankAccountNumber: '001099008899',
      bankAccountHolder: 'TRAN DAI NGHIA',
      bio: 'Kênh podcast lịch sử Việt Nam chính thống',
      portfolioUrl: 'https://portfolio.eraidev.id.vn',
      status: KycStatus.approved,
      otpVerifiedAt: '27/10/2026',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: KycManagementPage(
          appState: appState,
          creatorState: creatorState,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Xác thực KYC'), findsOneWidget);
    expect(find.text('Hồ Sơ KYC Đã Được Phê Duyệt'), findsOneWidget);
    expect(find.text('ĐÃ PHÊ DUYỆT (APPROVED)'), findsOneWidget);
    expect(find.text('Chào mừng Nhà sáng tạo Trần Đại Nghĩa'), findsOneWidget);
    expect(find.text('Thông tin định danh đã xác thực'), findsOneWidget);
    expect(find.text('phoenix090205@gmail.com'), findsOneWidget);
    expect(find.text('Vietcombank'), findsOneWidget);
    expect(find.text('********8899'), findsOneWidget);
    expect(find.byKey(const Key('go-to-studio-btn')), findsOneWidget);
    expect(find.byKey(const Key('update-kyc-btn')), findsOneWidget);

    await tester.drag(find.byType(ListView), const Offset(0, -600));
    await tester.pumpAndSettle();

    expect(find.text('Quyền lợi sau khi xác thực'), findsOneWidget);
  });

  testWidgets('KycManagementPage renders pending state', (tester) async {
    SharedPreferences.setMockInitialValues({
      'userRoles': ['VIEWER'],
      'kycStatus': 'PENDING',
    });
    final prefs = await SharedPreferences.getInstance();
    final appState = AppState(prefs);
    final creatorState = CreatorState(prefs);
    creatorState.kyc = const KycProfile(
      fullName: 'Nguyễn Văn A',
      status: KycStatus.pending,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: KycManagementPage(
          appState: appState,
          creatorState: creatorState,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Hồ Sơ KYC Đang Chờ Phê Duyệt'), findsOneWidget);
    expect(find.text('ĐANG CHỜ DUYỆT (PENDING)'), findsOneWidget);
    expect(find.byKey(const Key('refresh-pending-btn')), findsOneWidget);
  });

  testWidgets('CreativeWorkspacePage navigates to KycManagementPage below wallet', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'userRoles': ['VIEWER', 'CREATOR'],
      'isCreator': true,
      'kycStatus': 'APPROVED',
    });
    final prefs = await SharedPreferences.getInstance();
    final appState = AppState(prefs);

    await tester.pumpWidget(
      MaterialApp(
        home: CreativeWorkspacePage(state: appState),
      ),
    );
    await tester.pumpAndSettle();

    await tester.drag(find.byType(ListView), const Offset(0, -400));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('open-wallet')), findsOneWidget);
    expect(find.byKey(const Key('open-workspace-kyc')), findsOneWidget);

    await tester.tap(find.byKey(const Key('open-workspace-kyc')));
    await tester.pumpAndSettle();

    expect(find.byType(KycManagementPage), findsOneWidget);
    expect(find.text('Xác thực KYC'), findsOneWidget);
  });
}
