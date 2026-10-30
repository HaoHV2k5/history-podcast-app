import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/mock/services/app_state.dart';

void main() {
  testWidgets('PlayerPage transcript card opens full transcript sheet when tapping text_alignleft icon or card', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final state = AppState(prefs);

    final testEpisode = allEpisodes.first;
    state.play(testEpisode);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PlayerPage(state: state),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Scroll down to reveal the transcript card
    await tester.scrollUntilVisible(
      find.byKey(const Key('player-transcript-card')),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    // Verify transcript container and the icon button exist
    expect(find.byKey(const Key('player-transcript-card')), findsOneWidget);
    expect(find.byKey(const Key('player-transcript-icon-btn')), findsOneWidget);
    expect(find.byIcon(CupertinoIcons.text_alignleft), findsOneWidget);

    // Verify redundant buttons are removed/hidden
    expect(find.text('Mở rộng tại chỗ'), findsNothing);
    expect(find.text('Thu gọn'), findsNothing);
    expect(find.text('Xem toàn bộ thông tin'), findsNothing);

    // Tap the "dấu gạch gạch" (CupertinoIcons.text_alignleft) icon button to open full sheet
    await tester.tap(find.byKey(const Key('player-transcript-icon-btn')));
    await tester.pumpAndSettle();

    // Modal sheet should now be shown
    expect(find.text('BẢN THẢO & NỘI DUNG SỬ LIỆU'), findsOneWidget);
    expect(find.text(testEpisode.title), findsAtLeastNWidgets(1));
    expect(find.textContaining(testEpisode.channel), findsAtLeastNWidgets(1));

    // Close bottom sheet
    await tester.tapAt(const Offset(10, 10));
    await tester.pumpAndSettle();

    // Clean up
    await tester.pumpWidget(const SizedBox());
    state.dispose();
  });
}

