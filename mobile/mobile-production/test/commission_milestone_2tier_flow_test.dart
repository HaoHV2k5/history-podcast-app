import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/commission_milestone_workspace.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/channel_repository.dart';
import 'package:su_ky_mobile_production/core/api/chat_repository.dart';
import 'package:su_ky_mobile_production/core/api/contract_repository.dart';
import 'package:su_ky_mobile_production/core/api/dispute_repository.dart';
import 'package:su_ky_mobile_production/core/api/hire_request_repository.dart';
import 'package:su_ky_mobile_production/core/api/milestone_repository.dart';
import 'package:su_ky_mobile_production/core/api/review_repository.dart';
import 'package:su_ky_mobile_production/design.dart';

void main() {
  testWidgets(
      'Reversed Commission & 2-Tier Milestone Escrow Flow matches MILESTONE_FLOW_GUIDE.md 100%',
      (tester) async {
    tester.view.physicalSize = const Size(900, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    SharedPreferences.setMockInitialValues({
      'isLoggedIn': true,
      'currentUserId': 10,
      'displayName': 'Khách Đặt Sử Ký',
    });
    final prefs = await SharedPreferences.getInstance();

    Map<String, dynamic>? lastCreatedCommissionBody;
    Map<String, dynamic>? lastCreatedContractBody;
    bool commissionAccepted = false;
    bool contractAccepted = false;
    bool milestone1Funded = false;
    bool milestone1Approved = false;
    bool milestone1ReleasedEarly = false;
    bool deliverableViewedWithAuth = false;

    String commissionStatus = 'PENDING';
    int? linkedContractId;
    String contractStatus = 'PENDING';
    String m1Status = 'WAITING';
    String m2Status = 'WAITING';

    final mockHttp = MockClient((req) async {
      final path = req.url.path;
      final method = req.method;

      Map<String, dynamic> ok(dynamic data) => {
            'success': true,
            'message': 'OK',
            'data': data,
          };

      http.Response jsonRes(dynamic payload, {int status = 200}) =>
          http.Response(
            jsonEncode(payload),
            status,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );

      // 1. GET /api/v1/channels/1
      if (path == '/api/v1/channels/1' && method == 'GET') {
        return jsonRes(ok({
          'id': 1,
          'creatorId': 20,
          'name': 'Kênh Đại Việt Sử Ký',
          'description': 'Chuyên trang lịch sử cổ trung đại',
        }));
      }

      // 2. POST /api/v1/commissions (Form 1: 3 fields + channelId, creatorId)
      if (path == '/api/v1/commissions' && method == 'POST') {
        lastCreatedCommissionBody =
            jsonDecode(req.body) as Map<String, dynamic>;
        return jsonRes(ok({
          'id': 501,
          'requesterId': 10,
          'requesterFullName': 'Khách Đặt Sử Ký',
          'creatorId': 20,
          'creatorFullName': 'Sử Gia Trần Quốc',
          'channelId': 1,
          'channelName': 'Kênh Đại Việt Sử Ký',
          'contentType': lastCreatedCommissionBody!['contentType'],
          'title': lastCreatedCommissionBody!['title'],
          'description': lastCreatedCommissionBody!['description'],
          'status': 'PENDING',
        }));
      }

      // 3. GET /api/v1/commissions/my-sent & /my-received
      if ((path == '/api/v1/commissions/my-sent' ||
              path == '/api/v1/commissions/my-received') &&
          method == 'GET') {
        return jsonRes(ok([
          {
            'id': 501,
            'requesterId': 10,
            'requesterFullName': 'Khách Đặt Sử Ký',
            'creatorId': 20,
            'creatorFullName': 'Sử Gia Trần Quốc',
            'channelId': 1,
            'channelName': 'Kênh Đại Việt Sử Ký',
            'contentType': 'SINGLE_VIDEO',
            'title': 'Trận Bạch Đằng năm 938',
            'description': 'Phân tích chiến thuật bãi cọc ngầm trên sông Bạch Đằng',
            'status': commissionStatus,
            'contractId': linkedContractId,
            'contractStatus': linkedContractId != null ? contractStatus : null,
          }
        ]));
      }

      // 4. POST /api/v1/commissions/501/accept
      if (path == '/api/v1/commissions/501/accept' && method == 'POST') {
        commissionAccepted = true;
        commissionStatus = 'ACCEPTED';
        return jsonRes(ok({
          'id': 501,
          'requesterId': 10,
          'creatorId': 20,
          'channelId': 1,
          'channelName': 'Kênh Đại Việt Sử Ký',
          'contentType': 'SINGLE_VIDEO',
          'title': 'Trận Bạch Đằng năm 938',
          'description': 'Phân tích chiến thuật bãi cọc ngầm trên sông Bạch Đằng',
          'status': 'ACCEPTED',
          'conversationId': 'commission_501',
        }));
      }

      // 5. POST /api/v1/chats/conversation
      if (path == '/api/v1/chats/conversation' && method == 'POST') {
        return jsonRes(ok({
          'conversationId': 'commission_501',
          'partnerId': 20,
          'partnerName': 'Sử Gia Trần Quốc',
          'partnerRole': 'CREATOR',
          'contextType': 'COMMISSION',
          'contextId': 501,
          'topicTitle': 'Trận Bạch Đằng năm 938',
          'channelName': 'Kênh Đại Việt Sử Ký',
        }));
      }

      // 6. GET /api/v1/booking-escrow/policy
      if (path == '/api/v1/booking-escrow/policy' && method == 'GET') {
        return jsonRes(ok({
          'platformFeePercent': 5.0,
          'creatorReceivePercent': 95.0,
          'minMilestoneAmount': 10000,
          'maxMilestonesPerContract': 20,
          'maxRevisionsPerMilestone': 2,
          'revisionExtraDays': 2,
          'autoApproveDays': 3,
          'escrowHoldDays': 3,
        }));
      }

      // 7. POST /api/v1/contracts (Form 2: Lập Lộ trình Milestone Tổng)
      if (path == '/api/v1/contracts' && method == 'POST') {
        lastCreatedContractBody = jsonDecode(req.body) as Map<String, dynamic>;
        linkedContractId = 900;
        commissionStatus = 'CONTRACT_SENT';
        contractStatus = 'PENDING';
        return jsonRes(ok({
          'id': 900,
          'hireRequestId': 501,
          'channelId': 1,
          'channelName': 'Kênh Đại Việt Sử Ký',
          'requesterId': 10,
          'requesterFullName': 'Khách Đặt Sử Ký',
          'creatorId': 20,
          'creatorFullName': 'Sử Gia Trần Quốc',
          'title': lastCreatedContractBody!['title'],
          'description': lastCreatedContractBody!['description'],
          'totalAmount': 600000,
          'platformFeePercent': 5.0,
          'platformFee': 30000,
          'netAmount': 570000,
          'status': contractStatus,
          'milestones': [
            {
              'id': 901,
              'contractId': 900,
              'orderNo': 1,
              'title': 'Giai đoạn 1: Đề cương & Kịch bản chi tiết',
              'requirement': 'File PDF kịch bản hoàn chỉnh khoảng 3.000 từ',
              'amount': 200000,
              'platformFee': 10000,
              'netAmount': 190000,
              'durationDays': 3,
              'status': m1Status,
              'revisionsUsed': 0,
              'maxRevisions': 2,
            },
            {
              'id': 902,
              'contractId': 900,
              'orderNo': 2,
              'title': 'Giai đoạn 2: Bản thu âm & Hậu kỳ hoàn chỉnh',
              'requirement': 'File MP3/MP4 Master chất lượng cao sẵn sàng xuất bản',
              'amount': 400000,
              'platformFee': 20000,
              'netAmount': 380000,
              'durationDays': 4,
              'status': m2Status,
              'revisionsUsed': 0,
              'maxRevisions': 2,
            }
          ],
        }));
      }

      // 8. GET /api/v1/contracts/900 & /api/v1/milestones/contract/900
      if (path == '/api/v1/contracts/900' && method == 'GET') {
        return jsonRes(ok({
          'id': 900,
          'hireRequestId': 501,
          'channelId': 1,
          'channelName': 'Kênh Đại Việt Sử Ký',
          'requesterId': 10,
          'requesterFullName': 'Khách Đặt Sử Ký',
          'creatorId': 20,
          'creatorFullName': 'Sử Gia Trần Quốc',
          'title': 'Hợp đồng sản xuất: Trận Bạch Đằng năm 938',
          'description': 'Sản xuất theo lộ trình 2 giai đoạn.',
          'totalAmount': 600000,
          'platformFeePercent': 5.0,
          'platformFee': 30000,
          'netAmount': 570000,
          'status': contractStatus,
          'milestones': [
            {
              'id': 901,
              'contractId': 900,
              'orderNo': 1,
              'title': 'Giai đoạn 1: Đề cương & Kịch bản chi tiết',
              'requirement': 'File PDF kịch bản hoàn chỉnh khoảng 3.000 từ',
              'amount': 200000,
              'platformFee': 10000,
              'netAmount': 190000,
              'durationDays': 3,
              'status': m1Status,
              'revisionsUsed': 0,
              'maxRevisions': 2,
            },
            {
              'id': 902,
              'contractId': 900,
              'orderNo': 2,
              'title': 'Giai đoạn 2: Bản thu âm & Hậu kỳ hoàn chỉnh',
              'requirement': 'File MP3/MP4 Master chất lượng cao sẵn sàng xuất bản',
              'amount': 400000,
              'platformFee': 20000,
              'netAmount': 380000,
              'durationDays': 4,
              'status': m2Status,
              'revisionsUsed': 0,
              'maxRevisions': 2,
            }
          ],
        }));
      }

      if (path == '/api/v1/milestones/contract/900' && method == 'GET') {
        return jsonRes(ok([
          {
            'id': 901,
            'contractId': 900,
            'orderNo': 1,
            'title': 'Giai đoạn 1: Đề cương & Kịch bản chi tiết',
            'requirement': 'File PDF kịch bản hoàn chỉnh khoảng 3.000 từ',
            'amount': 200000,
            'platformFee': 10000,
            'netAmount': 190000,
            'durationDays': 3,
            'status': m1Status,
            'revisionsUsed': 0,
            'maxRevisions': 2,
          },
          {
            'id': 902,
            'contractId': 900,
            'orderNo': 2,
            'title': 'Giai đoạn 2: Bản thu âm & Hậu kỳ hoàn chỉnh',
            'requirement': 'File MP3/MP4 Master chất lượng cao sẵn sàng xuất bản',
            'amount': 400000,
            'platformFee': 20000,
            'netAmount': 380000,
            'durationDays': 4,
            'status': m2Status,
            'revisionsUsed': 0,
            'maxRevisions': 2,
          }
        ]));
      }

      // 9. Tầng 1: POST /api/v1/contracts/900/accept -> Mở khóa duy nhất Mốc #1 sang UNFUNDED, #2 giữ WAITING
      if (path == '/api/v1/contracts/900/accept' && method == 'POST') {
        contractAccepted = true;
        contractStatus = 'ACTIVE';
        m1Status = 'UNFUNDED';
        m2Status = 'WAITING';
        return jsonRes(ok({'id': 900, 'status': 'ACTIVE'}));
      }

      // 10. Tầng 2: POST /api/v1/milestones/901/fund -> Mốc #1 sang IN_PROGRESS (giả lậpCreator đã nộp file để kiểm tra SUBMITTED luôn sau khi fund)
      if (path == '/api/v1/milestones/901/fund' && method == 'POST') {
        milestone1Funded = true;
        m1Status = 'SUBMITTED';
        return jsonRes(ok({
          'id': 901,
          'contractId': 900,
          'orderNo': 1,
          'title': 'Giai đoạn 1: Đề cương & Kịch bản chi tiết',
          'amount': 200000,
          'status': m1Status,
        }));
      }

      // 11. GET /api/v1/milestones/901/deliverables
      if (path == '/api/v1/milestones/901/deliverables' && method == 'GET') {
        if (m1Status == 'SUBMITTED' || m1Status == 'APPROVED') {
          return jsonRes(ok([
            {
              'id': 7001,
              'milestoneId': 901,
              'versionNumber': 1,
              'title': 'Kịch bản Bạch Đằng v1',
              'fileName': 'kich_ban_bach_dang_938.txt',
              'fileType': 'DOCUMENT',
              'description': 'Bản thảo đầy đủ 3.000 từ',
            }
          ]));
        }
        return jsonRes(ok([]));
      }

      // 12. GET /api/v1/deliverables/7001/view (Authenticated bytes stream)
      if (path == '/api/v1/deliverables/7001/view' && method == 'GET') {
        deliverableViewedWithAuth = true;
        return http.Response.bytes(
          utf8.encode('Nội dung kịch bản Trận Bạch Đằng năm 938 hoàn chỉnh.'),
          200,
          headers: {'content-type': 'text/plain; charset=utf-8'},
        );
      }

      // 13. POST /api/v1/milestones/901/approve -> Mốc #1 sang APPROVED, tự động mở khóa Mốc #2 sang UNFUNDED
      if (path == '/api/v1/milestones/901/approve' && method == 'POST') {
        milestone1Approved = true;
        m1Status = 'APPROVED';
        m2Status = 'UNFUNDED';
        return jsonRes(ok({
          'id': 901,
          'contractId': 900,
          'orderNo': 1,
          'title': 'Giai đoạn 1: Đề cương & Kịch bản chi tiết',
          'amount': 200000,
          'status': 'APPROVED',
          'escrowStatus': 'HELD',
        }));
      }

      // 14. POST /api/v1/milestones/901/release-early -> Giải ngân sớm
      if (path == '/api/v1/milestones/901/release-early' && method == 'POST') {
        milestone1ReleasedEarly = true;
        m1Status = 'RELEASED';
        return jsonRes(ok({
          'id': 901,
          'contractId': 900,
          'orderNo': 1,
          'title': 'Giai đoạn 1: Đề cương & Kịch bản chi tiết',
          'amount': 200000,
          'status': 'RELEASED',
          'escrowStatus': 'RELEASED',
        }));
      }

      return jsonRes(ok([]));
    });

    final apiClient = ApiClient(
      baseUrl: 'http://localhost:8080',
      preferences: prefs,
      httpClient: mockHttp,
    );

    final appState = AppState(
      prefs,
      apiClient: apiClient,
      channelRepository: ChannelRepository(client: apiClient),
      hireRequestRepository: HireRequestRepository(client: apiClient),
      contractRepository: ContractRepository(client: apiClient),
      milestoneRepository: MilestoneRepository(client: apiClient),
      disputeRepository: DisputeRepository(client: apiClient),
      chatRepository: ChatRepository(client: apiClient),
      reviewRepository: ReviewRepository(client: apiClient),
    );

    // PHẦN 1: Kiểm tra Form 1 (CustomCommissionRequestSheet) chỉ có đúng 3 trường + Policy Banner Vị trí 1
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: CustomCommissionRequestSheet(
            state: appState,
            channelId: 1,
            creatorId: 20,
            channelName: 'Kênh Đại Việt Sử Ký',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('commission-form-policy-banner')), findsOneWidget);
    expect(find.text('Video / Podcast lẻ'), findsOneWidget);
    expect(find.text('Series nhiều tập'), findsOneWidget);

    await tester.enterText(
      find.byKey(const Key('commission-title-input')),
      'Trận Bạch Đằng năm 938',
    );
    await tester.enterText(
      find.byKey(const Key('commission-desc-input')),
      'Phân tích chiến thuật bãi cọc ngầm trên sông Bạch Đằng',
    );
    await tester.tap(find.byKey(const Key('submit-commission-btn')));
    await tester.pumpAndSettle();

    expect(lastCreatedCommissionBody, isNotNull);
    expect(lastCreatedCommissionBody!['channelId'], equals(1));
    expect(lastCreatedCommissionBody!['creatorId'], equals(20));
    expect(lastCreatedCommissionBody!['contentType'], equals('SINGLE_VIDEO'));
    expect(lastCreatedCommissionBody!['title'], equals('Trận Bạch Đằng năm 938'));

    // PHẦN 2: Kiểm tra Creator nhận đơn, bấm Chấp nhận (Mở phòng Chat 1-1 có Policy Banner Vị trí 2)
    final receivedList = await appState.hireRequestRepository!.getMyReceived();
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: SingleChildScrollView(
            child: CommissionManagementSection(
              state: appState,
              sentCommissions: const [],
              receivedCommissions: receivedList,
              loading: false,
              onRefresh: () async {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('accept-commission-btn-501')));
    await tester.pumpAndSettle();
    expect(commissionAccepted, isTrue);

    // PHẦN 3: Ngay sau khi bấm Chấp nhận đơn, Form 2 (CreateOrEditMilestoneRoadmapSheet) tự động mở + Bảng tạm tính 95%/5%
    expect(find.byKey(const Key('roadmap-realtime-summary-box')), findsOneWidget);
    expect(find.text('600.000đ'), findsWidgets); // Tổng 200k + 400k = 600k
    expect(find.text('570.000đ'), findsWidgets); // Thực nhận 95% = 570k

    await tester.tap(find.byKey(const Key('submit-milestone-roadmap-btn')));
    await tester.pumpAndSettle();

    expect(lastCreatedContractBody, isNotNull);
    expect(lastCreatedContractBody!['hireRequestId'], equals(501));
    expect((lastCreatedContractBody!['milestones'] as List).length, equals(2));

    // PHẦN 4: Kiểm tra Tầng 1 & Tầng 2 trong ContractMilestoneRoadmapSheet
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: ContractMilestoneRoadmapSheet(
            state: appState,
            contractId: 900,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Kiểm tra Vị trí 3 SLA Policy Box hiển thị đầy đủ
    expect(find.byKey(const Key('contract-sla-policy-box')), findsOneWidget);

    // Tầng 1: Khách bấm "Chấp thuận Lộ trình Tổng" -> Hợp đồng sang ACTIVE, Mốc #1 sang UNFUNDED, Mốc #2 giữ WAITING
    await tester.tap(find.byKey(const Key('accept-contract-roadmap-btn')));
    await tester.pumpAndSettle();
    expect(contractAccepted, isTrue);

    // Tầng 2: Khách bấm "Nạp tiền ký quỹ giai đoạn #1"
    final fundBtn = find.byKey(const Key('fund-milestone-btn-901'));
    expect(fundBtn, findsOneWidget);
    await tester.ensureVisible(fundBtn);
    await tester.tap(fundBtn);
    await tester.pumpAndSettle();
    expect(milestone1Funded, isTrue);

    // Kiểm tra Xem sản phẩm bàn giao qua luồng bảo mật JWT
    final previewBtn = find.byKey(const Key('preview-deliverable-btn-7001'));
    expect(previewBtn, findsOneWidget);
    await tester.ensureVisible(previewBtn);
    await tester.tap(previewBtn);
    await tester.pumpAndSettle();
    expect(deliverableViewedWithAuth, isTrue);
    expect(
      find.textContaining('Nội dung kịch bản Trận Bạch Đằng năm 938 hoàn chỉnh.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Đóng').last);
    await tester.pumpAndSettle();

    // Tầng 2: Khách bấm "Duyệt nghiệm thu #1" -> Mốc #1 sang APPROVED, Mốc #2 tự động mở khóa sang UNFUNDED
    final approveBtn = find.byKey(const Key('approve-milestone-btn-901'));
    expect(approveBtn, findsOneWidget);
    await tester.ensureVisible(approveBtn);
    await tester.tap(approveBtn);
    await tester.pumpAndSettle();
    expect(milestone1Approved, isTrue);

    // Ngay sau khi duyệt Mốc #1, nút "Nạp tiền ký quỹ giai đoạn #2" và nút "Giải ngân ngay" (Mục 15) xuất hiện!
    expect(find.byKey(const Key('fund-milestone-btn-902')), findsOneWidget);

    // Mở lại Mốc #1 (vì sau khi APPROVED nó tự động thu gọn thông minh) để bấm "Giải ngân ngay"
    await tester.tap(find.byKey(const Key('toggle-all-milestones-collapse-btn')));
    await tester.pumpAndSettle();

    final releaseEarlyBtn = find.byKey(const Key('release-early-milestone-btn-901'));
    expect(releaseEarlyBtn, findsOneWidget);
    await tester.ensureVisible(releaseEarlyBtn);
    await tester.tap(releaseEarlyBtn);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('confirm-release-early-btn')));
    await tester.pumpAndSettle();
    expect(milestone1ReleasedEarly, isTrue);
  });

  testWidgets(
      'Section 6.4 Verification: 4-Stage Status Badge, isNegotiating Lock, Stepper Bar, Smart Collapse & Upload Modal Version History',
      (tester) async {
    tester.view.physicalSize = const Size(900, 1600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    // Đăng nhập dưới vai trò Creator (ID = 20)
    SharedPreferences.setMockInitialValues({
      'isLoggedIn': true,
      'currentUserId': 20,
      'displayName': 'Sử Gia Trần Quốc',
    });
    final prefs = await SharedPreferences.getInstance();

    String contractStatus = 'PENDING';
    String m1Status = 'WAITING';
    String m2Status = 'WAITING';

    final mockHttp = MockClient((req) async {
      final path = req.url.path;
      final method = req.method;

      Map<String, dynamic> ok(dynamic data) => {
            'success': true,
            'message': 'OK',
            'data': data,
          };

      http.Response jsonRes(dynamic payload) => http.Response(
            jsonEncode(payload),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );

      if (path == '/api/v1/contracts/950' && method == 'GET') {
        return jsonRes(ok({
          'id': 950,
          'hireRequestId': 550,
          'channelId': 1,
          'channelName': 'Kênh Đại Việt Sử Ký',
          'requesterId': 10,
          'requesterFullName': 'Khách Đặt Sử Ký',
          'creatorId': 20,
          'creatorFullName': 'Sử Gia Trần Quốc',
          'title': 'Hợp đồng Series Nhà Trần 3 lần kháng Nguyên',
          'description':
              'Mô tả hợp đồng dài hơn hai dòng để kiểm tra nút Xem đầy đủ và Thu gọn trong Drawer chi tiết hợp đồng.\nDòng 2: Kịch bản lịch sử chuẩn xác.\nDòng 3: Âm thanh chuẩn phòng thu.',
          'totalAmount': 1000000,
          'platformFeePercent': 5.0,
          'platformFee': 50000,
          'netAmount': 950000,
          'status': contractStatus,
          'milestones': [
            {
              'id': 951,
              'contractId': 950,
              'orderNo': 1,
              'title': 'Mốc 1: Đề cương & Nghiên cứu sử liệu',
              'requirement': 'Tài liệu PDF 20 trang',
              'amount': 400000,
              'platformFee': 20000,
              'netAmount': 380000,
              'durationDays': 3,
              'status': m1Status,
              'revisionsUsed': 1,
              'maxRevisions': 2,
            },
            {
              'id': 952,
              'contractId': 950,
              'orderNo': 2,
              'title': 'Mốc 2: Thu âm & Dựng hậu kỳ',
              'requirement': 'File MP4 Full HD',
              'amount': 600000,
              'platformFee': 30000,
              'netAmount': 570000,
              'durationDays': 5,
              'status': m2Status,
              'revisionsUsed': 0,
              'maxRevisions': 2,
            },
          ],
        }));
      }

      if (path == '/api/v1/milestones/contract/950' && method == 'GET') {
        return jsonRes(ok([
          {
            'id': 951,
            'contractId': 950,
            'orderNo': 1,
            'title': 'Mốc 1: Đề cương & Nghiên cứu sử liệu',
            'requirement': 'Tài liệu PDF 20 trang',
            'amount': 400000,
            'platformFee': 20000,
            'netAmount': 380000,
            'durationDays': 3,
            'status': m1Status,
            'revisionsUsed': 1,
            'maxRevisions': 2,
          },
          {
            'id': 952,
            'contractId': 950,
            'orderNo': 2,
            'title': 'Mốc 2: Thu âm & Dựng hậu kỳ',
            'requirement': 'File MP4 Full HD',
            'amount': 600000,
            'platformFee': 30000,
            'netAmount': 570000,
            'durationDays': 5,
            'status': m2Status,
            'revisionsUsed': 0,
            'maxRevisions': 2,
          },
        ]));
      }

      if (path == '/api/v1/milestones/951/deliverables' && method == 'GET') {
        return jsonRes(ok([
          {
            'id': 8001,
            'milestoneId': 951,
            'versionNumber': 1,
            'title': 'Bản đề cương v1',
            'fileName': 'de_cuong_nha_tran_v1.pdf',
            'fileType': 'DOCUMENT',
            'description': 'Bản nộp lần 1',
          }
        ]));
      }

      return jsonRes(ok([]));
    });

    final apiClient = ApiClient(
      baseUrl: 'http://localhost:8080',
      preferences: prefs,
      httpClient: mockHttp,
    );

    final appState = AppState(
      prefs,
      apiClient: apiClient,
      contractRepository: ContractRepository(client: apiClient),
      milestoneRepository: MilestoneRepository(client: apiClient),
      disputeRepository: DisputeRepository(client: apiClient),
      chatRepository: ChatRepository(client: apiClient),
      reviewRepository: ReviewRepository(client: apiClient),
    );

    // Giai đoạn 1: Hợp đồng đang PENDING (isNegotiating == true)
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: ContractMilestoneRoadmapSheet(
            state: appState,
            contractId: 950,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Kiểm tra Badge & Progress Bar khi PENDING
    expect(find.text('Chờ khách duyệt lộ trình'), findsWidgets);
    expect(
      find.text('Chưa bắt đầu — Chờ khách chấp thuận lộ trình'),
      findsOneWidget,
    );
    expect(find.text('CHỜ KHÁCH DUYỆT LỘ TRÌNH'), findsWidgets);

    // Khi PENDING (isNegotiating == true), Creator thấy đầy đủ nút sửa lộ trình & sửa/xóa mốc
    expect(find.byKey(const Key('edit-full-roadmap-btn')), findsOneWidget);
    expect(find.byKey(const Key('edit-milestone-btn-951')), findsOneWidget);
    expect(find.byKey(const Key('delete-milestone-btn-951')), findsOneWidget);

    // Kiểm tra nút Xem đầy đủ / Thu gọn mô tả hợp đồng 2 dòng
    expect(find.byKey(const Key('toggle-contract-desc-btn')), findsOneWidget);

    // Kiểm tra Stepper Bar và nút Smart Collapse
    expect(
      find.byKey(const Key('contract-milestone-stepper-bar')),
      findsOneWidget,
    );
    expect(
      find.byKey(const Key('toggle-all-milestones-collapse-btn')),
      findsOneWidget,
    );

    // Giai đoạn 2: Khách đã duyệt lộ trình (ACTIVE, Mốc #1 UNFUNDED) -> Khóa cứng lộ trình (isNegotiating == false)
    contractStatus = 'ACTIVE';
    m1Status = 'UNFUNDED';
    m2Status = 'WAITING';

    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: ContractMilestoneRoadmapSheet(
            key: const ValueKey('active-unfunded'),
            state: appState,
            contractId: 950,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Badge hiển thị rõ Giai đoạn 2: "Khách đã duyệt • Chờ ký quỹ Mốc #1"
    expect(find.text('Khách đã duyệt • Chờ ký quỹ Mốc #1'), findsOneWidget);
    expect(
      find.textContaining('Đang ở Mốc #1/2: Mốc 1: Đề cương & Nghiên cứu sử liệu (Chờ khách nạp cọc)'),
      findsOneWidget,
    );

    // Khóa cứng lộ trình: toàn bộ nút sửa lộ trình / sửa mốc / xóa mốc biến mất hoàn toàn!
    expect(find.byKey(const Key('edit-full-roadmap-btn')), findsNothing);
    expect(find.byKey(const Key('edit-milestone-btn-951')), findsNothing);
    expect(find.byKey(const Key('delete-milestone-btn-951')), findsNothing);

    // Giai đoạn 3: Mốc #1 đang IN_PROGRESS (sau khi có yêu cầu sửa từ v1) -> Mở Modal nộp bản mới v2 và kiểm tra lịch sử phiên bản
    m1Status = 'IN_PROGRESS';
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: ContractMilestoneRoadmapSheet(
            key: const ValueKey('active-inprogress'),
            state: appState,
            contractId: 950,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final uploadBtn = find.byKey(const Key('upload-deliverable-btn-951'));
    expect(uploadBtn, findsOneWidget);
    await tester.ensureVisible(uploadBtn);
    await tester.tap(uploadBtn);
    await tester.pumpAndSettle();

    // Modal mở ra ngay lập tức, hiển thị lịch sử phiên bản đã nộp (v1 · Hiện tại) và nút Chọn tệp bên trong Modal
    expect(
      find.byKey(const Key('upload-modal-version-history-951')),
      findsOneWidget,
    );
    expect(find.text('v1 · Hiện tại'), findsOneWidget);
    expect(find.text('de_cuong_nha_tran_v1.pdf'), findsWidgets);
    expect(
      find.byKey(const Key('upload-modal-pick-file-btn')),
      findsOneWidget,
    );
  });
}
