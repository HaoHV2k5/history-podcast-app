import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/chat_repository.dart';
import 'package:su_ky_mobile_production/core/api/contract_repository.dart';
import 'package:su_ky_mobile_production/core/api/post_repository.dart';
import 'package:su_ky_mobile_production/creator_freelancer_chat.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/narrator_marketplace.dart';

void main() {
  group('Creator - Freelancer Chat Suite', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    testWidgets('Chat Sheet: connects to POST /api/v1/chats/conversation, sends and persists messages', (tester) async {
      tester.view.physicalSize = const Size(800, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      bool apiCalled = false;
      Map<String, dynamic>? requestBody;

      final mockHttp = MockClient((req) async {
        final path = req.url.path;
        if (path == '/api/v1/chats/conversation' && req.method == 'POST') {
          apiCalled = true;
          requestBody = jsonDecode(req.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode({
              'success': true,
              'message': 'OK',
              'data': {
                'conversationId': 'contract_99',
                'partnerId': 50,
                'partnerName': 'Trần Nam (Freelancer)',
                'partnerEmail': 'trannam@example.com',
                'partnerAvatarUrl': null,
                'partnerRole': 'NARRATOR',
                'contextType': 'CONTRACT',
                'contextId': 99,
              },
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        return http.Response('{"success": false}', 404);
      });

      final apiClient = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );
      final chatRepo = ChatRepository(client: apiClient);

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(fontFamily: 'BeVietnamPro'),
          home: Scaffold(
            body: CreatorFreelancerChatSheet(
              chatRepository: chatRepo,
              contractId: 99,
              partnerName: 'Trần Nam (Freelancer)',
              contextTitle: 'Hợp đồng thu âm số 99',
              senderRole: 'CREATOR',
              senderName: 'Creator Nguyễn',
              preferences: prefs,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Kiểm tra API đã được gọi đúng contractId 99
      expect(apiCalled, isTrue);
      expect(requestBody?['contractId'], 99);

      // Kiểm tra thông tin đối tác & phòng chat Firestore hiển thị
      expect(find.text('Trần Nam (Freelancer)'), findsAtLeastNWidgets(1));
      expect(find.text('FREELANCER'), findsOneWidget);
      expect(find.textContaining('contract_99'), findsOneWidget);

      // Gửi tin nhắn mới
      final inputFinder = find.byKey(const Key('chat-message-input'));
      expect(inputFinder, findsOneWidget);
      await tester.enterText(inputFinder, 'Xin chào Trần Nam, bản thu xong chưa bạn?');
      await tester.pumpAndSettle();

      final sendBtnFinder = find.byKey(const Key('chat-message-send-btn'));
      expect(sendBtnFinder, findsOneWidget);
      await tester.tap(sendBtnFinder);
      await tester.pump(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      // Tin nhắn hiển thị trên khung chat
      expect(find.text('Xin chào Trần Nam, bản thu xong chưa bạn?'), findsOneWidget);

      // Tin nhắn được lưu vào SharedPreferences với conversationId contract_99
      final savedJson = prefs.getString('chat_messages_v1_contract_99');
      expect(savedJson, isNotNull);
      expect(savedJson!.contains('Xin chào Trần Nam, bản thu xong chưa bạn?'), isTrue);
    });

    testWidgets('Chat Hub: Filter tabs and Quick Connect opens Chat Sheet', (tester) async {
      tester.view.physicalSize = const Size(800, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final mockHttp = MockClient((req) async {
        if (req.url.path == '/api/v1/chats/conversation') {
          return http.Response(
            jsonEncode({
              'success': true,
              'message': 'OK',
              'data': {
                'conversationId': 'post_88_applicant_77',
                'partnerId': 77,
                'partnerName': 'Lê Thu Thảo',
                'partnerEmail': 'thao@example.com',
                'partnerAvatarUrl': null,
                'partnerRole': 'NARRATOR',
                'contextType': 'APPLICATION',
                'contextId': 88,
              },
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        return http.Response('{"success": false}', 404);
      });

      final apiClient = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );
      final chatRepo = ChatRepository(client: apiClient);

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(fontFamily: 'BeVietnamPro'),
          home: Scaffold(
            body: CreatorFreelancerChatHubSheet(
              chatRepository: chatRepo,
              preferences: prefs,
              isCreator: true,
              currentUserName: 'Creator Test',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Hiển thị tiêu đề Chat Hub
      expect(find.text('Hội thoại Tuyển dụng & Hợp đồng'), findsOneWidget);

      // Chuyển sang tab "Kết nối ID ⚡"
      final quickTabFinder = find.byKey(const Key('chat-hub-tab-quick'));
      expect(quickTabFinder, findsOneWidget);
      await tester.tap(quickTabFinder);
      await tester.pumpAndSettle();

      // Nhập Post ID và Applicant ID
      final postIdInput = find.byKey(const Key('quick-post-id-input'));
      final applicantIdInput = find.byKey(const Key('quick-applicant-id-input'));
      expect(postIdInput, findsOneWidget);
      expect(applicantIdInput, findsOneWidget);

      await tester.enterText(postIdInput, '88');
      await tester.enterText(applicantIdInput, '77');
      await tester.pumpAndSettle();

      // Bấm nút "Mở phòng chat Ứng tuyển"
      final startChatBtn = find.byKey(const Key('quick-connect-applicant-btn'));
      expect(startChatBtn, findsOneWidget);
      await tester.tap(startChatBtn);
      await tester.pumpAndSettle();

      // Đã mở màn hình Chat Sheet với đối tác
      expect(find.text('Lê Thu Thảo'), findsAtLeastNWidgets(1));
      expect(find.textContaining('post_88_applicant_77'), findsOneWidget);
    });

    testWidgets('Marketplace: "Trò chuyện" button is present next to "Đăng tin" and opens Hub', (tester) async {
      tester.view.physicalSize = const Size(800, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final mockHttp = MockClient((req) async {
        final path = req.url.path;
        if (path == '/api/v1/posts' && req.method == 'GET') {
          return http.Response(
            jsonEncode({
              'success': true,
              'message': 'OK',
              'data': {'content': [], 'totalElements': 0},
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        return http.Response(
          jsonEncode({'success': true, 'data': []}),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      final apiClient = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );
      final postRepo = PostRepository(client: apiClient);
      final contractRepo = ContractRepository(client: apiClient);
      final chatRepo = ChatRepository(client: apiClient);

      final appState = AppState(
        prefs,
        apiClient: apiClient,
        postRepository: postRepo,
        contractRepository: contractRepo,
        chatRepository: chatRepo,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: Scaffold(
            body: RecruitmentMarketplaceView(state: appState),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Nút "Trò chuyện" nằm ngay cạnh nút "Đăng tin"
      final chatBtnFinder = find.byKey(const Key('open-chat-hub-btn'));
      final postBtnFinder = find.byKey(const Key('open-post-job-btn'));

      expect(chatBtnFinder, findsOneWidget);
      expect(postBtnFinder, findsOneWidget);
      expect(find.text('Trò chuyện'), findsOneWidget);
      expect(find.text('Đăng tin'), findsOneWidget);

      // Bấm nút "Trò chuyện" mở Chat Hub
      await tester.tap(chatBtnFinder);
      await tester.pumpAndSettle();

      expect(find.text('Hội thoại Tuyển dụng & Hợp đồng'), findsOneWidget);
      expect(find.byKey(const Key('chat-hub-tab-all')), findsOneWidget);
      expect(find.byKey(const Key('chat-hub-tab-contracts')), findsOneWidget);
      expect(find.byKey(const Key('chat-hub-tab-apps')), findsOneWidget);
      expect(find.byKey(const Key('chat-hub-tab-quick')), findsOneWidget);
    });
  });
}
