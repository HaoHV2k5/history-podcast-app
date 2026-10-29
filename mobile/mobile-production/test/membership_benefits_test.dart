import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/creator_channel_page.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/mock/services/creator_state.dart';

void main() {
  group('Membership Benefits Tests (Issue 14)', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    testWidgets('MembershipPage displays real podcast unlocking benefits and VIP livestream', (tester) async {
      final state = AppState(prefs);
      final channel = channelByName('Sử Ký Đại Việt');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MembershipPage(
              channel: channel,
              state: state,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify real benefits
      expect(find.text('Mở khóa các tập Podcast Hội viên'), findsOneWidget);
      expect(find.text('Phát sóng trực tiếp độc quyền (VIP)'), findsOneWidget);

      // Verify mock perks are not present by default
      expect(find.textContaining('Huy hiệu bình luận'), findsNothing);
      expect(find.textContaining('Nghe sớm 48h'), findsNothing);
    });

    testWidgets('CreatorChannelPage displays real benefits instead of mock fallback', (tester) async {
      tester.view.physicalSize = const Size(390, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final state = CreatorState(prefs);
      state.channel = 'Lịch Sử tiền Lê';

      await tester.pumpWidget(
        MaterialApp(
          home: CreatorChannelPage(state: state),
        ),
      );
      await tester.pumpAndSettle();

      // Scroll down to membership section
      final scrollable = find.byType(Scrollable).first;
      await tester.scrollUntilVisible(
        find.text('GÓI HỘI VIÊN KÊNH (VIP)'),
        300,
        scrollable: scrollable,
      );
      await tester.pumpAndSettle();

      // Verify real benefits are shown in fallback
      expect(find.text('Mở khóa toàn bộ các tập Podcast dành riêng cho hội viên'), findsOneWidget);
      expect(find.text('Nghe không giới hạn các nội dung độc quyền của kênh'), findsOneWidget);
      expect(find.text('Tham gia phòng phát sóng trực tiếp độc quyền (VIP)'), findsOneWidget);

      // Verify old mock perks are completely gone
      expect(find.textContaining('Huy hiệu hội viên đặc biệt khi bình luận'), findsNothing);
      expect(find.textContaining('Nghe trước các tập podcast mới ra mắt'), findsNothing);
    });
  });
}
