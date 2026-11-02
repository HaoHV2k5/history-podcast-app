import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/core/api/content_repository.dart';
import 'package:su_ky_mobile_production/episode.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const sampleRagText = '''
=== Chặn Đứng Đại Quân Tống ===
Năm 1077, quân Tống do Quách Quỳ chỉ huy tiến đến sông Như Nguyệt, nhưng bị chặn lại bởi chiến lũy tre dày đặc của Thái úy Lý Thường Kiệt.
Lợi dụng lúc quân Tống mệt mỏi và lương cạn, các đạo quân Đại Việt liên tiếp tập kích vượt sông, làm tê liệt hoàn toàn thế trận giặc phương Bắc.
Đại quân Tống, vốn đã kiệt sức vì hành quân xa và thiếu lương thảo, hoàn toàn bị động trước các cuộc tấn công bất ngờ của quân Đại Việt.

=== Hào Khí Nam Quốc Sơn Hà ===
Giữa đêm khuya, bài thơ 'Nam Quốc Sơn Hà' vang vọng, khẳng định chủ quyền và ý chí quyết tâm bảo vệ bờ cõi của dân tộc Đại Việt...
''';

  group('cleanEpisodeDescription tests', () {
    test('removes === RAG scene markers and cleans whitespace', () {
      final cleaned = cleanEpisodeDescription(
        sampleRagText,
        title: 'Phòng Tuyến Sông Như Nguyệt',
        channel: 'Sử Việt Hào Hùng',
      );

      expect(cleaned.contains('==='), isFalse);
      expect(cleaned.contains('Chặn Đứng Đại Quân Tống'), isFalse);
      expect(cleaned.contains('Hào Khí Nam Quốc Sơn Hà'), isFalse);
      expect(
        cleaned.contains('Năm 1077, quân Tống do Quách Quỳ chỉ huy tiến đến sông Như Nguyệt'),
        isTrue,
      );
      expect(
        cleaned.contains("bài thơ 'Nam Quốc Sơn Hà' vang vọng"),
        isTrue,
      );
    });

    test('generates fallback description when text is empty or only scene headers', () {
      final fallback = cleanEpisodeDescription(
        '=== Cảnh 1 ===\n=== Cảnh 2 ===',
        title: 'Bạch Đằng 938',
        channel: 'Sử Ký',
      );

      expect(fallback.contains('==='), isFalse);
      expect(fallback.contains('Bạch Đằng 938'), isTrue);
      expect(fallback.contains('Sử Ký'), isTrue);
    });

    test('parseChaptersFromScript extracts chapter titles and calculated timestamps', () {
      final chapters = parseChaptersFromScript(sampleRagText, 60);

      expect(chapters.length, 2);
      expect(chapters[0].title, 'Chặn Đứng Đại Quân Tống');
      expect(chapters[0].seconds, 0);
      expect(chapters[1].title, 'Hào Khí Nam Quốc Sơn Hà');
      expect(chapters[1].seconds, 30);
    });

    test('parseChaptersFromScript returns single default chapter when no scene tags', () {
      final chapters = parseChaptersFromScript('Văn bản không có phân cảnh.', 120);

      expect(chapters.length, 1);
      expect(chapters[0].title, 'Mở đầu');
      expect(chapters[0].seconds, 0);
    });
  });

  group('EpisodePage clean description and video info UI', () {
    testWidgets('renders video info card and clean description without RAG markers', (tester) async {
      tester.view.physicalSize = const Size(414, 2500);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final state = AppState(prefs);
      final episode = Episode(
        id: 'test-video-1',
        title: 'Phòng Tuyến Sông Như Nguyệt 1077',
        channel: 'Sử Việt Hào Hùng',
        image: 'assets/mock/images/van-mieu.jpg',
        category: 'Lịch sử Việt Nam',
        seconds: 53,
        description: sampleRagText,
        chapters: parseChaptersFromScript(sampleRagText, 53),
        isVideo: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: EpisodePage(episode: episode, state: state),
        ),
      );
      await tester.pumpAndSettle();

      // Check Video metadata card is rendered
      expect(find.text('Thông tin tác phẩm video'), findsOneWidget);
      expect(find.text('AI Bảng trắng'), findsOneWidget);
      expect(find.text('Mô tả nội dung video'), findsOneWidget);

      // Check clean description is displayed and does not show raw RAG === markers
      expect(find.byKey(const Key('episode-description-text')), findsOneWidget);
      final descWidget = tester.widget<Text>(find.byKey(const Key('episode-description-text')));
      expect(descWidget.data?.contains('==='), isFalse);
      expect(descWidget.data?.contains('Năm 1077, quân Tống'), isTrue);

      // Check chapters section displays the parsed chapters
      expect(find.text('Phân cảnh trong video'), findsOneWidget);
      expect(find.text('Chặn Đứng Đại Quân Tống'), findsOneWidget);
      expect(find.text('Hào Khí Nam Quốc Sơn Hà'), findsOneWidget);
    });
  });
}
