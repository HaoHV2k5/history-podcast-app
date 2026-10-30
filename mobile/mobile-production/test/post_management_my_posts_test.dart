import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/post_repository.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/narrator_marketplace.dart';

void main() {
  testWidgets('Post Management: Create Post (6 fields), View My Posts, Applications, Edit, Delete, Apply', (tester) async {
    tester.view.physicalSize = const Size(800, 1000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    bool postCreated = false;
    bool applicantChosen = false;
    bool postUpdated = false;
    bool postDeleted = false;
    bool appliedToPost = false;

    final mockPosts = [
      {
        'id': 101,
        'userId': 1,
        'userFullName': 'Nguyễn Quang Tùng',
        'type': 'BOOKING',
        'serviceType': 'VOICE',
        'title': 'Tuyển giọng đọc kịch bản Chi Lăng',
        'description': 'Cần giọng đọc trầm ấm hào hùng thời lượng 15 phút',
        'referencePrice': 600000,
        'status': 'OPEN',
        'expiresAt': '2026-11-20T00:00:00Z',
        'applicationCount': 1,
      }
    ];

    final mockApplications = [
      {
        'id': 501,
        'postId': 101,
        'applicantId': 88,
        'applicantFullName': 'Trần Văn Giọng Kể',
        'applicantHeadline': 'Nghệ sĩ diễn xướng lịch sử',
        'proposedPrice': 550000,
        'message': 'Tôi rất hào hứng với kịch bản Chi Lăng này.',
        'status': 'PENDING',
      }
    ];

    final mockHttp = MockClient((req) async {
      final path = req.url.path;
      final method = req.method;

      Map<String, dynamic> ok(dynamic data) => {
            'success': true,
            'message': 'OK',
            'data': data,
          };

      http.Response jsonRes(dynamic payload, {int status = 200}) => http.Response(
            jsonEncode(payload),
            status,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );

      // 1. GET /api/v1/posts
      if (path == '/api/v1/posts' && method == 'GET') {
        return jsonRes(ok({'content': mockPosts, 'totalElements': mockPosts.length}));
      }

      // 2. GET /api/v1/posts/me
      if (path == '/api/v1/posts/me' && method == 'GET') {
        return jsonRes(ok({'content': mockPosts, 'totalElements': mockPosts.length}));
      }

      // 3. POST /api/v1/posts (Đăng tin mới với 6 fields chuẩn)
      if (path == '/api/v1/posts' && method == 'POST') {
        final body = jsonDecode(req.body) as Map<String, dynamic>;
        expect(body['type'], isNotNull);
        expect(body['serviceType'], isNotNull);
        expect(body['title'], isNotNull);
        expect(body['description'], isNotNull);
        expect(body['referencePrice'], isNotNull);
        postCreated = true;
        return jsonRes(ok(mockPosts.first));
      }

      // 4. GET /api/v1/posts/101/applications
      if (path == '/api/v1/posts/101/applications' && method == 'GET') {
        return jsonRes(ok({'content': mockApplications, 'totalElements': 1}));
      }

      // 5. POST /api/v1/posts/101/applications/88/choose
      if (path == '/api/v1/posts/101/applications/88/choose' && method == 'POST') {
        applicantChosen = true;
        return jsonRes(ok(mockApplications.first));
      }

      // 6. GET /api/v1/posts/applications/me
      if (path == '/api/v1/posts/applications/me' && method == 'GET') {
        return jsonRes(ok({'content': mockApplications, 'totalElements': 1}));
      }

      // 7. PUT /api/v1/posts/101
      if (path == '/api/v1/posts/101' && method == 'PUT') {
        postUpdated = true;
        return jsonRes(ok(mockPosts.first));
      }

      // 8. DELETE /api/v1/posts/101
      if (path == '/api/v1/posts/101' && method == 'DELETE') {
        postDeleted = true;
        return jsonRes(ok(true));
      }

      // 9. POST /api/v1/posts/101/apply
      if (path == '/api/v1/posts/101/apply' && method == 'POST') {
        appliedToPost = true;
        return jsonRes(ok(mockApplications.first));
      }

      // 10. GET /api/v1/hire-requests
      if (path == '/api/v1/hire-requests' && method == 'GET') {
        return jsonRes(ok([]));
      }

      // 8. GET /api/v1/narrator-profiles
      if (path == '/api/v1/narrator-profiles' && method == 'GET') {
        return jsonRes(ok([]));
      }

      return jsonRes(ok([]));
    });

    final apiClient = ApiClient(
      baseUrl: 'http://localhost:8080',
      preferences: prefs,
      httpClient: mockHttp,
    );

    final postRepo = PostRepository(client: apiClient);

    final appState = AppState(
      prefs,
      apiClient: apiClient,
      postRepository: postRepo,
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

    // 1. Kiểm tra màn hình "Tuyển dụng & Việc" và bài đăng từ API
    expect(find.text('Tuyển dụng & Việc'), findsOneWidget);
    expect(find.text('Tuyển giọng đọc kịch bản Chi Lăng'), findsOneWidget);

    // 2. Chuyển sang Tab "Tin của tôi"
    final myPostsTab = find.byKey(const Key('tab-my-posts'));
    expect(myPostsTab, findsOneWidget);
    await tester.tap(myPostsTab);
    await tester.pumpAndSettle();

    // 3. Trong "Tin của tôi", bài đăng của user hiển thị chuẩn xác
    expect(find.text('Bài đăng của tôi (1)'), findsOneWidget);
    expect(find.text('Tuyển giọng đọc kịch bản Chi Lăng'), findsOneWidget);
    expect(find.text('600.000đ'), findsOneWidget);

    // 4. Mở danh sách ứng viên
    final viewAppsBtn = find.text('Ứng viên (1)');
    expect(viewAppsBtn, findsOneWidget);
    await tester.tap(viewAppsBtn);
    await tester.pumpAndSettle();

    // Xem thông tin ứng viên và chọn ứng viên
    expect(find.text('Trần Văn Giọng Kể'), findsOneWidget);
    expect(find.text('Chọn ứng viên này'), findsOneWidget);
    await tester.tap(find.text('Chọn ứng viên này'));
    await tester.pumpAndSettle();
    expect(applicantChosen, isTrue);

    // Đóng danh sách ứng viên
    await tester.tap(find.byTooltip('Đóng'));
    await tester.pumpAndSettle();

    // 5. Kiểm tra Form Đăng tin mới (6 fields chuẩn Swagger)
    final openPostBtn = find.byKey(const Key('open-post-job-btn'));
    expect(openPostBtn, findsOneWidget);
    await tester.tap(openPostBtn);
    await tester.pumpAndSettle();

    expect(find.text('Đăng tin mới (Booking & Tìm việc)'), findsOneWidget);
    expect(find.text('Cần thuê / Tuyển'), findsOneWidget);
    expect(find.text('Giọng đọc (Voice)'), findsOneWidget);

    // Nhập tiêu đề
    await tester.enterText(
      find.widgetWithText(TextField, 'Tiêu đề bài đăng *'),
      'Tuyển giọng đọc kịch bản Đinh Bộ Lĩnh',
    );
    // Nhập mô tả
    await tester.enterText(
      find.widgetWithText(TextField, 'Nội dung mô tả chi tiết *'),
      'Kịch bản cờ lau tập trận, hào hùng và sinh động.',
    );
    // Bấm Đăng bài ngay
    await tester.tap(find.text('Đăng bài ngay'));
    await tester.pumpAndSettle();

    expect(postCreated, isTrue);

    // 6. Kiểm tra Sửa bài đăng (PUT /api/v1/posts/101)
    final editBtn = find.text('Sửa');
    expect(editBtn, findsOneWidget);
    await tester.tap(editBtn);
    await tester.pumpAndSettle();

    expect(find.text('Cập nhật bài đăng #101'), findsOneWidget);
    await tester.tap(find.text('Lưu thay đổi'));
    await tester.pumpAndSettle();
    expect(postUpdated, isTrue);

    // 7. Kiểm tra SubTab "Đơn đã nộp (1)"
    final myAppsSubTab = find.text('Đơn đã nộp (1)');
    expect(myAppsSubTab, findsOneWidget);
    await tester.tap(myAppsSubTab);
    await tester.pumpAndSettle();
    expect(find.text('Bài đăng #101'), findsOneWidget);
    expect(find.text('PENDING'), findsOneWidget);

    // Quay lại subtab Bài đăng của tôi
    await tester.tap(find.text('Bài đăng của tôi (1)'));
    await tester.pumpAndSettle();

    // 8. Kiểm tra Xóa bài đăng (DELETE /api/v1/posts/101)
    final deleteBtn = find.byTooltip('Xóa bài đăng');
    expect(deleteBtn, findsOneWidget);
    await tester.tap(deleteBtn);
    await tester.pumpAndSettle();

    expect(find.text('Xác nhận xóa bài'), findsOneWidget);
    await tester.tap(find.text('Xác nhận xóa'));
    await tester.pumpAndSettle();
    expect(postDeleted, isTrue);

    // 9. Kiểm tra Ứng tuyển vào bài đăng ở Tab 0 (POST /api/v1/posts/101/apply)
    final jobBoardTab = find.textContaining('Tin tuyển dụng');
    expect(jobBoardTab, findsOneWidget);
    await tester.tap(jobBoardTab);
    await tester.pumpAndSettle();

    final applyBtn = find.text('Ứng tuyển').first;
    expect(applyBtn, findsOneWidget);
    await tester.tap(applyBtn);
    await tester.pumpAndSettle();

    expect(find.text('Ứng tuyển bài đăng #101'), findsOneWidget);
    await tester.enterText(
      find.widgetWithText(TextField, 'Lời nhắn / Giới thiệu năng lực'),
      'Tôi có 5 năm kinh nghiệm đọc truyện lịch sử.',
    );
    await tester.tap(find.text('Gửi đơn ứng tuyển'));
    await tester.pumpAndSettle();
    expect(appliedToPost, isTrue);
  });
}
