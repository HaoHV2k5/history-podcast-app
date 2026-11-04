import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../app.dart';
import '../app_state.dart';
import 'api/api_client.dart';
import 'api/auth_repository.dart';
import 'api/content_repository.dart';
import 'api/wallet_repository.dart';
import 'api/comment_repository.dart';
import 'api/channel_repository.dart';
import 'api/chat_repository.dart';
import 'api/contract_repository.dart';
import 'api/creator_series_repository.dart';
import 'api/creator_studio_repository.dart';
import 'api/deliverable_repository.dart';
import 'api/dispute_repository.dart';
import 'api/email_template_repository.dart';
import 'api/escrow_transaction_repository.dart';
import 'api/freelancer_repository.dart';
import 'api/hire_request_repository.dart';
import 'api/kyc_repository.dart';
import 'api/livestream_repository.dart';
import 'api/membership_repository.dart';
import 'api/milestone_repository.dart';
import 'api/moderation_review_repository.dart';
import 'api/narrator_demo_repository.dart';
import 'api/narrator_profile_repository.dart';
import 'api/post_repository.dart';
import 'api/reaction_repository.dart';
import 'api/refresh_token_repository.dart';
import 'api/review_repository.dart';
import 'api/role_repository.dart';
import 'api/system_config_repository.dart';
import 'api/transcript_repository.dart';
import 'api/user_repository.dart';
import 'api/wallet_transaction_repository.dart';
import 'api/withdrawal_repository.dart';
import 'backend_application_factory.dart';
import 'runtime_configuration.dart';

class LiveBackendApplicationFactory implements BackendApplicationFactory {
  const LiveBackendApplicationFactory();

  Future<String?> _probeCandidate(String url, Duration timeout) async {
    try {
      final clean = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
      final resp = await http
          .get(Uri.parse('$clean/api/v1/channels'))
          .timeout(timeout);
      if (resp.statusCode >= 200 && resp.statusCode < 500) {
        return clean;
      }
    } catch (_) {}
    return null;
  }

  Future<String> _resolveReachableBaseUrl(
    SharedPreferences preferences,
    RuntimeConfiguration configuration,
  ) async {
    final savedBaseUrl = preferences.getString('custom_api_base_url')?.trim();
    final defaultUrl = (!kIsWeb && defaultTargetPlatform == TargetPlatform.android)
        ? 'http://192.168.100.159:8080'
        : 'http://localhost:8080';

    final primary = (savedBaseUrl != null && savedBaseUrl.isNotEmpty)
        ? savedBaseUrl
        : (configuration.apiBaseUri?.toString() ?? defaultUrl);

    if (kIsWeb) return primary;

    // 1. Thử nhanh địa chỉ ưu tiên hiện tại (800ms)
    final primaryOk = await _probeCandidate(
      primary,
      const Duration(milliseconds: 800),
    );
    if (primaryOk != null) {
      return primaryOk;
    }

    // 2. Nếu không phản hồi, dò song song tất cả địa chỉ LAN/Emulator của các thành viên trong nhóm
    final candidates = <String>{
      'http://192.168.100.159:8080',
      'http://10.0.2.2:8080',
      'http://192.168.1.133:8080',
      'http://localhost:8080',
      'http://26.4.170.102:8080',
      primary,
    }.toList();

    final completer = Completer<String?>();
    var remaining = candidates.length;
    for (final candidate in candidates) {
      _probeCandidate(candidate, const Duration(milliseconds: 1500)).then((hit) {
        if (hit != null && !completer.isCompleted) {
          completer.complete(hit);
        } else {
          remaining--;
          if (remaining == 0 && !completer.isCompleted) {
            completer.complete(null);
          }
        }
      });
    }

    final resolved = await completer.future;
    if (resolved != null) {
      await preferences.setString('custom_api_base_url', resolved);
      return resolved;
    }
    return defaultUrl;
  }

  @override
  Future<Widget> createApplication(RuntimeConfiguration configuration) async {
    final preferences = await SharedPreferences.getInstance();
    final baseUrl = await _resolveReachableBaseUrl(preferences, configuration);
    
    final apiClient = ApiClient(baseUrl: baseUrl, preferences: preferences);
    final authRepository = AuthRepository(apiClient);
    final contentRepository = ContentRepository(apiClient);
    final walletRepository = WalletRepository(apiClient);
    final commentRepository = CommentRepository(client: apiClient);
    final channelRepository = ChannelRepository(client: apiClient);
    final chatRepository = ChatRepository(client: apiClient);
    final contractRepository = ContractRepository(client: apiClient);
    final creatorSeriesRepository = CreatorSeriesRepository(client: apiClient);
    final creatorStudioRepository = CreatorStudioRepository(client: apiClient);
    final deliverableRepository = DeliverableRepository(client: apiClient);
    final disputeRepository = DisputeRepository(client: apiClient);
    final emailTemplateRepository = EmailTemplateRepository(client: apiClient);
    final escrowTransactionRepository = EscrowTransactionRepository(client: apiClient);
    final freelancerRepository = FreelancerRepository(client: apiClient);
    final hireRequestRepository = HireRequestRepository(client: apiClient);
    final kycRepository = KycRepository(client: apiClient);
    final livestreamRepository = LivestreamRepository(client: apiClient);
    final membershipRepository = MembershipRepository(client: apiClient);
    final milestoneRepository = MilestoneRepository(client: apiClient);
    final moderationReviewRepository = ModerationReviewRepository(client: apiClient);
    final narratorDemoRepository = NarratorDemoRepository(client: apiClient);
    final narratorProfileRepository = NarratorProfileRepository(client: apiClient);
    final postRepository = PostRepository(client: apiClient);
    final reactionRepository = ReactionRepository(client: apiClient);
    final refreshTokenRepository = RefreshTokenRepository(client: apiClient);
    final reviewRepository = ReviewRepository(client: apiClient);
    final roleRepository = RoleRepository(client: apiClient);
    final systemConfigRepository = SystemConfigRepository(client: apiClient);
    final transcriptRepository = TranscriptRepository(client: apiClient);
    final userRepository = UserRepository(client: apiClient);
    final walletTransactionRepository = WalletTransactionRepository(client: apiClient);
    final withdrawalRepository = WithdrawalRepository(client: apiClient);

    // Khởi tạo AppState với Real Repositories
    final appState = AppState(
      preferences,
      apiClient: apiClient,
      authRepository: authRepository,
      contentRepository: contentRepository,
      walletRepository: walletRepository,
      commentRepository: commentRepository,
      channelRepository: channelRepository,
      chatRepository: chatRepository,
      contractRepository: contractRepository,
      creatorSeriesRepository: creatorSeriesRepository,
      creatorStudioRepository: creatorStudioRepository,
      deliverableRepository: deliverableRepository,
      disputeRepository: disputeRepository,
      emailTemplateRepository: emailTemplateRepository,
      escrowTransactionRepository: escrowTransactionRepository,
      freelancerRepository: freelancerRepository,
      hireRequestRepository: hireRequestRepository,
      kycRepository: kycRepository,
      livestreamRepository: livestreamRepository,
      membershipRepository: membershipRepository,
      milestoneRepository: milestoneRepository,
      moderationReviewRepository: moderationReviewRepository,
      narratorDemoRepository: narratorDemoRepository,
      narratorProfileRepository: narratorProfileRepository,
      postRepository: postRepository,
      reactionRepository: reactionRepository,
      refreshTokenRepository: refreshTokenRepository,
      reviewRepository: reviewRepository,
      roleRepository: roleRepository,
      systemConfigRepository: systemConfigRepository,
      transcriptRepository: transcriptRepository,
      userRepository: userRepository,
      walletTransactionRepository: walletTransactionRepository,
      withdrawalRepository: withdrawalRepository,
    );

    // Khởi tạo và đồng bộ backend trong nền (non-blocking) để app hiển thị giao diện ngay lập tức
    () async {
      if ((apiClient.token == null || apiClient.token!.isEmpty) &&
          preferences.getBool('manual_logout') != true) {
        try {
          await appState.login(
            identifier: 'test1tr@example.com',
            password: 'Creator@123',
          );
        } catch (_) {
          await appState.initRealBackend();
        }
      } else {
        await appState.initRealBackend();
      }
    }();

    return SuKyApp(state: appState);
  }
}






