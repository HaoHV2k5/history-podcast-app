import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/freelancer_repository.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/mock/services/narrator_profile.dart';
import 'package:su_ky_mobile_production/narrator_pages.dart';

class MockFreelancerApiClient extends ApiClient {
  FreelancerProfileModel? mockProfile;
  final List<Map<String, dynamic>> callLogs = [];

  MockFreelancerApiClient() : super(baseUrl: 'http://mock-api');

  @override
  Future<Map<String, dynamic>> get(String path, {Map<String, String>? queryParams}) async {
    callLogs.add({'method': 'GET', 'path': path});
    if (path == '/api/v1/freelancers/me') {
      if (mockProfile == null) {
        throw ApiException(statusCode: 404, message: 'Bạn chưa tạo hồ sơ Freelancer');
      }
      return {
        'code': 1000,
        'message': 'Thành công',
        'data': {
          'id': mockProfile!.id,
          'userId': mockProfile!.userId,
          'userEmail': mockProfile!.userEmail,
          'userFullName': mockProfile!.userFullName,
          'headline': mockProfile!.headline,
          'bio': mockProfile!.bio,
          'skills': mockProfile!.skills,
          'serviceTypes': mockProfile!.serviceTypes,
          'voiceDemoUrl': mockProfile!.voiceDemoUrl,
          'referencePrice': mockProfile!.referencePrice,
          'portfolioUrl': mockProfile!.portfolioUrl,
          'status': mockProfile!.status,
          'roles': mockProfile!.roles,
        }
      };
    } else if (path.startsWith('/api/v1/freelancers/user/')) {
      final userId = int.tryParse(path.split('/').last) ?? 1;
      return {
        'code': 1000,
        'data': {
          'id': 1,
          'userId': userId,
          'headline': 'Diễn đọc lịch sử chuyên nghiệp',
          'status': 'ACTIVE',
        }
      };
    }
    throw UnimplementedError('Unhandled GET: $path');
  }

  @override
  Future<Map<String, dynamic>> post(String path, {Object? body}) async {
    callLogs.add({'method': 'POST', 'path': path, 'body': body});
    if (path == '/api/v1/freelancers/become-freelancer') {
      final map = body as Map<String, dynamic>;
      mockProfile = FreelancerProfileModel(
        id: 99,
        userId: 10,
        userEmail: 'freelancer@test.com',
        userFullName: 'Trần Đại Nghĩa',
        headline: map['headline'] as String,
        bio: map['bio'] as String?,
        skills: map['skills'] as String?,
        serviceTypes: map['serviceTypes'] as String? ?? 'VOICEOVER',
        voiceDemoUrl: map['voiceDemoUrl'] as String?,
        referencePrice: (map['referencePrice'] as num?)?.toDouble(),
        portfolioUrl: map['portfolioUrl'] as String?,
        status: 'ACTIVE',
        roles: ['ROLE_FREELANCER'],
      );
      return {
        'code': 1000,
        'message': 'Chúc mừng! Bạn đã kích hoạt thành công vai trò Freelancer',
        'data': {
          'id': mockProfile!.id,
          'userId': mockProfile!.userId,
          'userEmail': mockProfile!.userEmail,
          'userFullName': mockProfile!.userFullName,
          'headline': mockProfile!.headline,
          'bio': mockProfile!.bio,
          'skills': mockProfile!.skills,
          'serviceTypes': mockProfile!.serviceTypes,
          'voiceDemoUrl': mockProfile!.voiceDemoUrl,
          'referencePrice': mockProfile!.referencePrice,
          'portfolioUrl': mockProfile!.portfolioUrl,
          'status': mockProfile!.status,
          'roles': mockProfile!.roles,
        }
      };
    }
    throw UnimplementedError('Unhandled POST: $path');
  }

  @override
  Future<Map<String, dynamic>> put(String path, {Object? body}) async {
    callLogs.add({'method': 'PUT', 'path': path, 'body': body});
    if (path == '/api/v1/freelancers/me') {
      final map = body as Map<String, dynamic>;
      mockProfile = FreelancerProfileModel(
        id: mockProfile?.id ?? 99,
        userId: mockProfile?.userId ?? 10,
        userEmail: mockProfile?.userEmail ?? 'freelancer@test.com',
        userFullName: mockProfile?.userFullName ?? 'Trần Đại Nghĩa',
        headline: map['headline'] as String,
        bio: map['bio'] as String?,
        skills: map['skills'] as String?,
        serviceTypes: map['serviceTypes'] as String? ?? 'VOICEOVER',
        voiceDemoUrl: map['voiceDemoUrl'] as String?,
        referencePrice: (map['referencePrice'] as num?)?.toDouble(),
        portfolioUrl: map['portfolioUrl'] as String?,
        status: 'ACTIVE',
        roles: ['ROLE_FREELANCER'],
      );
      return {
        'code': 1000,
        'message': 'Cập nhật hồ sơ Freelancer thành công',
        'data': {
          'id': mockProfile!.id,
          'userId': mockProfile!.userId,
          'headline': mockProfile!.headline,
          'bio': mockProfile!.bio,
          'skills': mockProfile!.skills,
          'serviceTypes': mockProfile!.serviceTypes,
          'voiceDemoUrl': mockProfile!.voiceDemoUrl,
          'referencePrice': mockProfile!.referencePrice,
          'portfolioUrl': mockProfile!.portfolioUrl,
          'status': mockProfile!.status,
        }
      };
    }
    throw UnimplementedError('Unhandled PUT: $path');
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('FreelancerRepository unit test: becomeFreelancer, getMyProfile, updateMyProfile', () async {
    final client = MockFreelancerApiClient();
    final repo = FreelancerRepository(client: client);

    // 1. becomeFreelancer
    final onboard = await repo.becomeFreelancer(
      headline: 'Nghệ sĩ diễn đọc lịch sử - Giọng Bắc',
      bio: '5 năm kinh nghiệm thu âm podcast lịch sử',
      skills: 'Diễn đọc truyền cảm, lồng tiếng nhân vật',
      serviceTypes: 'VOICEOVER',
      voiceDemoUrl: 'https://storage.suky.vn/demo.mp3',
      referencePrice: 500000,
      portfolioUrl: 'https://youtube.com/@lichsuvietnam',
    );

    expect(onboard.headline, 'Nghệ sĩ diễn đọc lịch sử - Giọng Bắc');
    expect(onboard.status, 'ACTIVE');
    expect(onboard.roles, contains('ROLE_FREELANCER'));
    expect(onboard.referencePrice, 500000);

    // 2. getMyProfile
    final me = await repo.getMyProfile();
    expect(me.id, 99);
    expect(me.headline, 'Nghệ sĩ diễn đọc lịch sử - Giọng Bắc');

    // 3. updateMyProfile
    final updated = await repo.updateMyProfile(
      headline: 'Chuyên gia thuyết minh & Diễn đọc lịch sử',
      bio: 'Kinh nghiệm phong phú qua nhiều dự án',
      referencePrice: 600000,
    );
    expect(updated.headline, 'Chuyên gia thuyết minh & Diễn đọc lịch sử');
    expect(updated.referencePrice, 600000);
  });

  testWidgets('Freelancer Onboarding & Profile Management Flow in NarratorHome', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final mockClient = MockFreelancerApiClient();
    final repo = FreelancerRepository(client: mockClient);

    // Initially user has NOT onboarded yet (mockProfile == null)
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: NarratorHome(
          preferences: preferences,
          freelancerRepository: repo,
        ),
      ),
    );
    await tester.pumpAndSettle();

    // 1. Verify that NO KYC sheet / CCCD / Brevo OTP is shown!
    expect(find.text('Điền KYC người đọc'), findsNothing);
    expect(find.text('01 / Xác thực danh tính'), findsNothing);

    // 2. Verify official Freelancer Registration Card is displayed
    expect(find.text('Đăng ký hồ sơ Freelancer'), findsOneWidget);
    expect(find.text('Đăng ký trở thành Freelancer'), findsOneWidget);

    // 3. Tap "Đăng ký trở thành Freelancer" to open NarratorProfilePage
    await tester.tap(find.text('Đăng ký trở thành Freelancer'));
    await tester.pumpAndSettle();

    expect(find.byType(NarratorProfilePage), findsOneWidget);
    expect(find.text('Hồ sơ chuyên môn & Năng lực'), findsOneWidget);
    expect(find.text('Tiêu đề chuyên môn (Headline) *'), findsOneWidget);

    // 4. Fill in the 7 fields from Swagger FreelancerOnboardRequest
    // Form field 0: headline
    await tester.enterText(
      find.byType(TextFormField).at(0),
      'Nghệ sĩ diễn đọc tư liệu cổ sử',
    );
    // Form field 1: bio
    await tester.enterText(
      find.byType(TextFormField).at(1),
      'Chuyên thu âm các áng văn hào hùng thời Lý - Trần.',
    );
    // Form field 2: skills
    await tester.enterText(
      find.byType(TextFormField).at(2),
      'Diễn đọc truyền cảm, Giọng Bắc trầm ấm',
    );

    // Scroll down to reveal referencePrice, voiceDemoUrl, portfolioUrl
    await tester.drag(find.byType(ListView).last, const Offset(0, -400));
    await tester.pumpAndSettle();

    // Form field 4: referencePrice
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Mức giá tham khảo (VNĐ/tập)'),
      '450000',
    );
    // Form field 5: voiceDemoUrl
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Đường dẫn Voice Demo (URL / File audio)'),
      'https://suky.vn/audio/sample-ly-thuong-kiet.mp3',
    );

    // Scroll further down
    await tester.drag(find.byType(ListView).last, const Offset(0, -300));
    await tester.pumpAndSettle();

    // Form field 6: portfolioUrl
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Đường dẫn Portfolio / Sản phẩm mẫu'),
      'https://youtube.com/@dai-viet-su-ky',
    );

    // 5. Submit form
    await tester.scrollUntilVisible(
      find.text('Lưu hồ sơ giọng đọc'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Lưu hồ sơ giọng đọc'));
    await tester.pumpAndSettle();

    // Verify modal dismissed and API POST /api/v1/freelancers/become-freelancer was invoked
    expect(find.byType(NarratorProfilePage), findsNothing);
    expect(
      mockClient.callLogs.any((c) => c['method'] == 'POST' && c['path'] == '/api/v1/freelancers/become-freelancer'),
      isTrue,
    );

    // 6. NarratorHome is now ACTIVE as Freelancer!
    expect(find.text('FREELANCER · HOẠT ĐỘNG'), findsOneWidget);
    expect(find.text('Nghệ sĩ diễn đọc tư liệu cổ sử'), findsWidgets);
    expect(find.text('Giá tham khảo: 450000đ/tập'), findsOneWidget);

    // 7. Verify Job Tabs are now available for taking jobs!
    expect(find.text('Lời mời'), findsOneWidget);
    expect(find.text('Đang làm'), findsOneWidget);
    expect(find.text('Lịch sử'), findsOneWidget);
  });
}
