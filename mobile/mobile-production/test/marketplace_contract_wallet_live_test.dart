import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/chat_repository.dart';
import 'package:su_ky_mobile_production/core/api/contract_repository.dart';
import 'package:su_ky_mobile_production/core/api/deliverable_repository.dart';
import 'package:su_ky_mobile_production/core/api/dispute_repository.dart';
import 'package:su_ky_mobile_production/core/api/hire_request_repository.dart';
import 'package:su_ky_mobile_production/core/api/kyc_repository.dart';
import 'package:su_ky_mobile_production/core/api/milestone_repository.dart';
import 'package:su_ky_mobile_production/core/api/narrator_profile_repository.dart';
import 'package:su_ky_mobile_production/core/api/post_repository.dart';
import 'package:su_ky_mobile_production/core/api/review_repository.dart';
import 'package:su_ky_mobile_production/core/api/wallet_repository.dart';
import 'package:su_ky_mobile_production/core/api/withdrawal_repository.dart';
import 'package:su_ky_mobile_production/creator_state.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/narrator_marketplace.dart';
import 'package:su_ky_mobile_production/wallet_page.dart';

void main() {
  testWidgets(
    'Marketplace, HireRequest, Contract Chat & Wallet TopUp connect to live Backend APIs',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      var hireRequestCreated = false;
      var contractCreated = false;
      var chatOpened = false;
      var depositCreated = false;

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
              utf8.encode(jsonEncode(payload)).allowMalformed,
              status,
              headers: {'content-type': 'application/json; charset=utf-8'},
            );

        if (path == '/api/v1/narrator-profiles' && method == 'GET') {
          return jsonRes(
            ok([
              {
                'id': 88,
                'userId': 18,
                'bio': 'Giọng đọc sử liệu trầm ấm miền Bắc',
                'languages': 'Tiếng Việt (Bắc)',
                'baseRate': 350000,
                'status': 'ACTIVE',
              },
            ]),
          );
        }

        if (path == '/api/v1/hire-requests' && method == 'GET') {
          return jsonRes(ok([]));
        }

        if (path == '/api/v1/hire-requests' && method == 'POST') {
          hireRequestCreated = true;
          final body = jsonDecode(req.body) as Map<String, dynamic>;
          return jsonRes(
            ok({
              'id': 301,
              'creatorId': body['creatorId'] ?? 1,
              'narratorId': body['narratorId'] ?? 88,
              'description': body['description'],
              'proposedPrice': body['proposedPrice'] ?? 300000,
              'status': 'PENDING',
            }),
            status: 201,
          );
        }

        if (path == '/api/v1/contracts/me' && method == 'GET') {
          return jsonRes(
            ok({
              'items': [
                {
                  'id': 501,
                  'postId': 10,
                  'postTitle': 'Khởi nghĩa Lam Sơn',
                  'creatorId': 1,
                  'creatorFullName': 'Sử Việt Ký',
                  'freelancerId': 88,
                  'freelancerFullName': 'Nghệ sĩ Minh Đức',
                  'serviceType': 'VOICEOVER',
                  'title': 'Bình Ngô Đại Cáo · Bản thu chuẩn',
                  'description': 'Đọc nhịp điệu hào sảng, phát âm chuẩn tên đất.',
                  'totalAmount': 450000,
                  'status': 'PENDING',
                  'milestones': [
                    {
                      'id': 601,
                      'title': 'Bản thu hoàn chỉnh',
                      'amount': 450000,
                      'status': 'PENDING',
                    },
                  ],
                },
              ],
              'page': 0,
              'size': 20,
              'totalElements': 1,
            }),
          );
        }

        if (path == '/api/v1/contracts' && method == 'POST') {
          contractCreated = true;
          final body = jsonDecode(req.body) as Map<String, dynamic>;
          return jsonRes(
            ok({
              'id': 502,
              'freelancerId': body['freelancerId'] ?? 1,
              'serviceType': 'VOICEOVER',
              'title': body['title'] ?? 'Tập mới',
              'description': body['description'] ?? '',
              'totalAmount': 300000,
              'status': 'PENDING',
              'milestones': body['milestones'] ?? [],
            }),
            status: 201,
          );
        }

        if (path == '/api/v1/chats/conversation' && method == 'POST') {
          chatOpened = true;
          final body = jsonDecode(req.body) as Map<String, dynamic>;
          return jsonRes(
            ok({
              'conversationId': 'conv_contract_${body['contractId'] ?? 501}',
              'partnerId': 88,
              'partnerName': 'Nghệ sĩ Minh Đức',
              'partnerRole': 'FREELANCER',
              'contextType': 'CONTRACT',
              'contextId': body['contractId'] ?? 501,
            }),
          );
        }

        if (path == '/api/v1/wallets/me' && method == 'GET') {
          return jsonRes(
            ok({
              'id': 9,
              'availableBalance': 1250000,
              'pendingBalance': 300000,
            }),
          );
        }

        if (path == '/api/v1/wallets/me/transactions' && method == 'GET') {
          return jsonRes(
            ok({
              'items': [
                {
                  'id': 701,
                  'walletId': 9,
                  'type': 'DEPOSIT',
                  'amount': 1250000,
                  'status': 'SUCCESS',
                  'description': 'Nạp ví qua VNPay Sandbox',
                },
              ],
            }),
          );
        }

        if (path == '/api/v1/wallets/me/deposits' && method == 'POST') {
          depositCreated = true;
          return jsonRes(
            ok({
              'paymentUrl': 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            }),
            status: 201,
          );
        }

        if (path == '/api/v1/bank-accounts' && method == 'GET') {
          return jsonRes(
            ok([
              {
                'id': 12,
                'userId': 1,
                'bankName': 'Vietcombank',
                'accountNumber': '001100998877',
                'accountHolderName': 'NGUYEN VAN SU',
                'verified': true,
              },
            ]),
          );
        }

        if (path == '/api/v1/withdrawals/me' && method == 'GET') {
          return jsonRes(ok({'items': []}));
        }

        if (path == '/api/v1/contracts/me/milestone-financials' &&
            method == 'GET') {
          return jsonRes(
            ok({
              'totalSpent': 900000,
              'escrowHeld': 450000,
              'totalRefunded': 0,
            }),
          );
        }

        if (path == '/api/v1/posts' && method == 'GET') {
          return jsonRes(
            ok({
              'items': [
                {
                  'id': 41,
                  'type': 'BOOKING',
                  'serviceType': 'VOICEOVER',
                  'title': 'Cần giọng đọc Đại Việt Sử Ký',
                  'description': 'Thu âm 3 chương sử liệu thời Trần',
                  'referencePrice': 400000,
                  'status': 'OPEN',
                },
              ],
            }),
          );
        }

        if (path == '/api/v1/disputes' && method == 'GET') {
          return jsonRes(ok({'items': []}));
        }

        if (path.startsWith('/api/v1/reviews/user/') && method == 'GET') {
          return jsonRes(ok({'items': []}));
        }

        if (path == '/api/v1/kyc-profiles' && method == 'GET') {
          return jsonRes(ok({'items': []}));
        }

        return jsonRes(ok({}));
      });

      final client = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );

      final contractRepo = ContractRepository(client: client);
      final hireReqRepo = HireRequestRepository(client: client);
      final milestoneRepo = MilestoneRepository(client: client);
      final deliverableRepo = DeliverableRepository(client: client);
      final disputeRepo = DisputeRepository(client: client);
      final chatRepo = ChatRepository(client: client);
      final narratorProfileRepo = NarratorProfileRepository(client: client);
      final postRepo = PostRepository(client: client);
      final reviewRepo = ReviewRepository(client: client);
      final walletRepo = WalletRepository(client);
      final withdrawalRepo = WithdrawalRepository(client: client);
      final kycRepo = KycRepository(client: client);

      // Verify PageResponse.items deserialization across repositories
      final posts = await postRepo.searchPosts();
      expect(posts.length, 1);
      expect(posts.first.title, 'Cần giọng đọc Đại Việt Sử Ký');
      expect(await disputeRepo.getAllDisputes(), isEmpty);
      expect(await reviewRepo.getUserReviews(1), isEmpty);
      expect(await kycRepo.getKycProfiles(), isEmpty);

      final creatorState = CreatorState(
        prefs,
        contractRepository: contractRepo,
        hireRequestRepository: hireReqRepo,
        milestoneRepository: milestoneRepo,
        deliverableRepository: deliverableRepo,
        disputeRepository: disputeRepo,
        chatRepository: chatRepo,
        narratorProfileRepository: narratorProfileRepo,
        postRepository: postRepo,
        walletRepository: walletRepo,
        withdrawalRepository: withdrawalRepo,
        kycRepository: kycRepo,
      );
      await creatorState.useVerifiedFixture();
      await creatorState.createChannel('Sử Việt Ký');
      final draft = const CreatorDraft(
        id: 'draft-lam-son',
        title: 'Khởi nghĩa Lam Sơn 1418',
        script: 'Mùa xuân năm Mậu Tuất 1418, Lê Lợi dựng cờ khởi nghĩa tại Lam Sơn.',
        sources: 'Đại Việt Sử Ký Toàn Thư, Bản Kỷ Toàn Thư, Quyển X.',
      );
      await creatorState.save(draft);

      // 1. Test NarratorMarketplacePage: syncs remote voices & contracts, invites narrator, opens ContractChatSheet
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: NarratorMarketplacePage(
            state: creatorState,
            preselectedDraft: draft,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Invite first narrator
      final inviteFinder = find.text('Mời thu âm').first;
      await tester.ensureVisible(inviteFinder);
      await tester.pumpAndSettle();
      await tester.tap(inviteFinder);
      await tester.pumpAndSettle();

      final confirmInviteBtn = find.byKey(const Key('confirm-send-invite'));
      await tester.ensureVisible(confirmInviteBtn);
      await tester.pumpAndSettle();
      await tester.tap(confirmInviteBtn);
      await tester.pumpAndSettle();

      expect(hireRequestCreated, isTrue);
      expect(contractCreated, isTrue);

      // Open contract detail & ContractChatSheet
      final syncedContract = find.text('Bình Ngô Đại Cáo · Bản thu chuẩn');
      await tester.ensureVisible(syncedContract);
      await tester.pumpAndSettle();
      expect(syncedContract, findsOneWidget);
      await tester.tap(syncedContract);
      await tester.pumpAndSettle();

      final chatBtn = find.byKey(const Key('open-contract-chat-btn'));
      await tester.ensureVisible(chatBtn);
      await tester.pumpAndSettle();
      expect(chatBtn, findsOneWidget);
      await tester.tap(chatBtn);
      await tester.pumpAndSettle();

      expect(chatOpened, isTrue);
      expect(find.text('PHÒNG TRAO ĐỔI HỢP ĐỒNG'), findsOneWidget);

      await tester.enterText(
        find.byKey(const Key('contract-chat-input')),
        'Nhờ bạn đọc chậm đoạn mở đầu Bình Ngô Đại Cáo nhé.',
      );
      await tester.tap(find.byKey(const Key('contract-chat-send-btn')));
      await tester.pumpAndSettle();

      expect(
        find.text('Nhờ bạn đọc chậm đoạn mở đầu Bình Ngô Đại Cáo nhé.'),
        findsOneWidget,
      );

      // Close chat sheet
      await tester.tap(find.byTooltip('Đóng phòng chat'));
      await tester.pumpAndSettle();

      // 2. Test WalletPage: syncs live balance, bank account & TopUpWalletSheet
      await tester.pumpWidget(
        MaterialApp(
          key: UniqueKey(),
          theme: appTheme(),
          home: WalletPage(
            preferences: prefs,
            walletRepository: walletRepo,
            withdrawalRepository: withdrawalRepo,
            contractRepository: contractRepo,
            kycRepository: kycRepo,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('1.250.000đ'), findsOneWidget);

      final topUpBtn = find.byKey(const Key('open-topup-sheet-btn'));
      await tester.ensureVisible(topUpBtn);
      await tester.pumpAndSettle();
      expect(topUpBtn, findsOneWidget);
      await tester.tap(topUpBtn);
      await tester.pumpAndSettle();

      final presetChip = find.byKey(const Key('topup-preset-1000000'));
      await tester.ensureVisible(presetChip);
      await tester.pumpAndSettle();
      await tester.tap(presetChip);
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('topup-amount-input')),
        '1.000.000',
      );
      await tester.pumpAndSettle();

      final confirmTopUp = find.byKey(const Key('confirm-topup-btn'));
      await tester.ensureVisible(confirmTopUp);
      await tester.pumpAndSettle();
      await tester.tap(confirmTopUp);
      await tester.pumpAndSettle();

      expect(depositCreated, isTrue);
      await tester.drag(find.byType(ListView).first, const Offset(0, 300));
      await tester.pumpAndSettle();
      expect(find.text('2.250.000đ'), findsOneWidget);
    },
  );
}

extension on List<int> {
  String get allowMalformed => utf8.decode(this, allowMalformed: true);
}
