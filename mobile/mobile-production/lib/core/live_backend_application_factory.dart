import 'package:flutter/material.dart';
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

  @override
  Future<Widget> createApplication(RuntimeConfiguration configuration) async {
    final preferences = await SharedPreferences.getInstance();
    final baseUrl = configuration.apiBaseUri?.toString() ?? 'http://localhost:8080';
    
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

    // Tải dữ liệu thật từ Spring Boot backend
    await appState.initRealBackend();

    return SuKyApp(state: appState);
  }
}






