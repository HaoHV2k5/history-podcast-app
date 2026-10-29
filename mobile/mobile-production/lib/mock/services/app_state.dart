import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_player/video_player.dart';

import '../../episode.dart';
import '../../audio_playback.dart';
import '../../local_file.dart';
import '../../artwork_state.dart';
import '../../core/api/api_client.dart';
import '../../core/api/auth_repository.dart';
import '../../core/api/content_repository.dart';
import '../../core/api/wallet_repository.dart';
import '../../core/api/comment_repository.dart';
import '../../core/api/channel_repository.dart';
import '../../core/api/chat_repository.dart';
import '../../core/api/contract_repository.dart';
import '../../core/api/creator_series_repository.dart';
import '../../core/api/creator_studio_repository.dart';
import '../../core/api/deliverable_repository.dart';
import '../../core/api/dispute_repository.dart';
import '../../core/api/email_template_repository.dart';
import '../../core/api/escrow_transaction_repository.dart';
import '../../core/api/freelancer_repository.dart';
import '../../core/api/hire_request_repository.dart';
import '../../core/api/kyc_repository.dart';
import '../../core/api/livestream_repository.dart';
import '../../core/api/membership_repository.dart';
import '../../core/api/milestone_repository.dart';
import '../../core/api/moderation_review_repository.dart';
import '../../core/api/narrator_demo_repository.dart';
import '../../core/api/narrator_profile_repository.dart';
import '../../core/api/post_repository.dart';
import '../../core/api/reaction_repository.dart';
import '../../core/api/refresh_token_repository.dart';
import '../../core/api/review_repository.dart';
import '../../core/api/role_repository.dart';
import '../../core/api/system_config_repository.dart';
import '../../core/api/transcript_repository.dart';
import '../../core/api/user_repository.dart';
import '../../core/api/wallet_transaction_repository.dart';
import '../../core/api/withdrawal_repository.dart';
import 'creator_state.dart';

class LivestreamMediaState {
  final bool isScreenSharing;
  final bool isCameraOn;
  final bool isMicOn;
  final bool isFrontCamera;
  final int currentSlideIndex;
  final String? customDocumentTitle;

  const LivestreamMediaState({
    this.isScreenSharing = false,
    this.isCameraOn = true,
    this.isMicOn = true,
    this.isFrontCamera = true,
    this.currentSlideIndex = 0,
    this.customDocumentTitle,
  });

  LivestreamMediaState copyWith({
    bool? isScreenSharing,
    bool? isCameraOn,
    bool? isMicOn,
    bool? isFrontCamera,
    int? currentSlideIndex,
    String? customDocumentTitle,
  }) {
    return LivestreamMediaState(
      isScreenSharing: isScreenSharing ?? this.isScreenSharing,
      isCameraOn: isCameraOn ?? this.isCameraOn,
      isMicOn: isMicOn ?? this.isMicOn,
      isFrontCamera: isFrontCamera ?? this.isFrontCamera,
      currentSlideIndex: currentSlideIndex ?? this.currentSlideIndex,
      customDocumentTitle: customDocumentTitle ?? this.customDocumentTitle,
    );
  }
}

/// AppState kết nối API thực tế tới Spring Boot Backend
class AppState extends ChangeNotifier {
  AppState(
    this.preferences, {
    this.writeComments,
    this.apiClient,
    this.authRepository,
    this.contentRepository,
    this.walletRepository,
    this.commentRepository,
    this.channelRepository,
    this.chatRepository,
    this.contractRepository,
    this.creatorSeriesRepository,
    this.creatorStudioRepository,
    this.deliverableRepository,
    this.disputeRepository,
    this.emailTemplateRepository,
    this.escrowTransactionRepository,
    this.freelancerRepository,
    this.hireRequestRepository,
    this.kycRepository,
    this.livestreamRepository,
    this.membershipRepository,
    this.milestoneRepository,
    this.moderationReviewRepository,
    this.narratorDemoRepository,
    this.narratorProfileRepository,
    this.postRepository,
    this.reactionRepository,
    this.refreshTokenRepository,
    this.reviewRepository,
    this.roleRepository,
    this.systemConfigRepository,
    this.transcriptRepository,
    this.userRepository,
    this.walletTransactionRepository,
    this.withdrawalRepository,
  }) {
    reloadCatalog(notify: false);
    checkoutStates.addAll(
      (jsonDecode(
        preferences.getString('checkoutStatesV1') ?? '{}',
      ) as Map<String, dynamic>).map((k, v) => MapEntry(k, v as String)),
    );
    queue.addAll(
      (preferences.getStringList('playbackQueueV1') ?? []).where(
        (id) => allEpisodes.any((e) => e.id == id),
      ),
    );
    saved.addAll(preferences.getStringList('savedEpisodes') ?? []);
    followed.addAll(preferences.getStringList('followedChannels') ?? []);
    memberships.addAll(preferences.getStringList('demoMemberships') ?? []);
    likedEpisodes.addAll(preferences.getStringList('likedEpisodes') ?? []);
    dislikedEpisodes.addAll(
      preferences.getStringList('dislikedEpisodes') ?? [],
    );
    displayName = preferences.getString('displayName') ?? 'Người nghe';
    isLoggedIn = preferences.getBool('isLoggedIn') ?? false;
    currentUserId = preferences.getInt('currentUserId');
    userEmail = preferences.getString('userEmail');
    userPhone = preferences.getString('userPhone');
    userRoles = preferences.getStringList('userRoles') ?? ['VIEWER'];
    isCreator = preferences.getBool('isCreator') ?? false;
    isFreelancer = preferences.getBool('isFreelancer') ??
        preferences.getBool('isFreelancerActiveV1') ??
        userRoles.contains('FREELANCER') ||
        userRoles.contains('NARRATOR');
    kycStatus = preferences.getString('kycStatus');

    recentSearches.addAll(
      (preferences.getStringList('recentSearches') ?? [])
          .where((q) => q.trim().isNotEmpty)
          .take(5),
    );
    final known = {for (final e in allEpisodes) e.id: e};
    recentPlayed.addAll(
      (preferences.getStringList('recentPlayed') ?? [])
          .where(known.containsKey)
          .toSet(),
    );
    try {
      final raw = jsonDecode(
        preferences.getString('listeningProgress') ?? '{}',
      );
      if (raw is Map) {
        for (final entry in raw.entries) {
          final e = known[entry.key];
          if (e != null && entry.value is int) {
            listeningProgress[e.id] = (entry.value as int).clamp(0, e.seconds);
          }
        }
      }
    } catch (_) {}

    final preferredRate = preferences.getDouble('playbackSpeed');
    if ([1.0, 1.25, 1.5, 1.75, 2.0].contains(preferredRate)) {
      speed = preferredRate!;
    }

    // Initialize comments
    _loadComments();

    // Initialize membership transactions
    final savedTxs = preferences.getStringList('membershipTransactions');
    if (savedTxs != null && savedTxs.isNotEmpty) {
      for (final raw in savedTxs) {
        try {
          transactions.add(MembershipTransaction.fromJson(raw));
        } catch (_) {}
      }
    } else if (memberships.isNotEmpty) {
      for (final ch in memberships) {
        transactions.add(
          MembershipTransaction(
            id: 'TX-INIT-${ch.hashCode.abs() % 10000}',
            channelName: ch,
            date: 'Hôm nay',
            type: 'Kích hoạt thử',
            status: 'Thành công (Mô phỏng)',
            planTitle: 'G\u00f3i th\u00e1ng k\u00eanh $ch',
          ),
        );
      }
    }
  }

  final SharedPreferences preferences;
  final Future<bool> Function(String key, List<String> value)? writeComments;
  final ApiClient? apiClient;
  final AuthRepository? authRepository;
  final ContentRepository? contentRepository;
  final WalletRepository? walletRepository;
  final CommentRepository? commentRepository;
  final ChannelRepository? channelRepository;
  final ChatRepository? chatRepository;
  final ContractRepository? contractRepository;
  final CreatorSeriesRepository? creatorSeriesRepository;
  final CreatorStudioRepository? creatorStudioRepository;
  final DeliverableRepository? deliverableRepository;
  final DisputeRepository? disputeRepository;
  final EmailTemplateRepository? emailTemplateRepository;
  final EscrowTransactionRepository? escrowTransactionRepository;
  final FreelancerRepository? freelancerRepository;
  final HireRequestRepository? hireRequestRepository;
  final KycRepository? kycRepository;
  final LivestreamRepository? livestreamRepository;
  final MembershipRepository? membershipRepository;
  final MilestoneRepository? milestoneRepository;
  final ModerationReviewRepository? moderationReviewRepository;
  final NarratorDemoRepository? narratorDemoRepository;
  final NarratorProfileRepository? narratorProfileRepository;
  final PostRepository? postRepository;
  final ReactionRepository? reactionRepository;
  final RefreshTokenRepository? refreshTokenRepository;
  final ReviewRepository? reviewRepository;
  final RoleRepository? roleRepository;
  final SystemConfigRepository? systemConfigRepository;
  final TranscriptRepository? transcriptRepository;
  final UserRepository? userRepository;
  final WalletTransactionRepository? walletTransactionRepository;
  final WithdrawalRepository? withdrawalRepository;

  bool get isLiveBackend =>
      contentRepository != null ||
      channelRepository != null ||
      authRepository != null ||
      membershipRepository != null ||
      livestreamRepository != null;

  CreatorState get creatorState => _creatorState ??= CreatorState(
        preferences,
        channelRepository: channelRepository,
        kycRepository: kycRepository,
        creatorStudioRepository: creatorStudioRepository,
        creatorSeriesRepository: creatorSeriesRepository,
        walletRepository: walletRepository,
        withdrawalRepository: withdrawalRepository,
        contractRepository: contractRepository,
        hireRequestRepository: hireRequestRepository,
        milestoneRepository: milestoneRepository,
        deliverableRepository: deliverableRepository,
        disputeRepository: disputeRepository,
        chatRepository: chatRepository,
        narratorProfileRepository: narratorProfileRepository,
        narratorDemoRepository: narratorDemoRepository,
        freelancerRepository: freelancerRepository,
        postRepository: postRepository,
      );
  CreatorState? _creatorState;

  bool isLoadingCatalog = false;
  String? catalogError;
  int? currentUserId;
  int walletAvailableBalance = 0;
  int walletPendingBalance = 0;
  List<String> userRoles = ['VIEWER'];
  bool isCreator = false;
  bool isFreelancer = false;
  String? kycStatus;

  void setFreelancerRole(bool enabled) {
    isFreelancer = enabled;
    if (enabled) {
      if (!userRoles.contains('FREELANCER')) {
        userRoles.add('FREELANCER');
      }
    } else {
      userRoles.remove('FREELANCER');
      userRoles.remove('NARRATOR');
    }
    preferences.setBool('isFreelancer', enabled);
    preferences.setStringList('userRoles', userRoles);
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    if (!isLoggedIn) return;
    if (userRepository != null) {
      try {
        final profile = await userRepository!.getMyProfile();
        currentUserId = profile.id;
        await preferences.setInt('currentUserId', profile.id);
        if (profile.fullName.trim().isNotEmpty) {
          displayName = profile.fullName.trim();
          await preferences.setString('displayName', displayName);
        }
        if (profile.email.isNotEmpty) {
          userEmail = profile.email;
          await preferences.setString('userEmail', userEmail!);
        }
        if (profile.phone != null && profile.phone!.isNotEmpty) {
          userPhone = profile.phone;
          await preferences.setString('userPhone', userPhone!);
        }
        final rolesSet = <String>{...profile.roles};
        if (profile.roleName != null && profile.roleName!.isNotEmpty) {
          rolesSet.add(profile.roleName!);
        }
        if (profile.isCreator) {
          rolesSet.add('CREATOR');
        }
        if (profile.isFreelancer) {
          rolesSet.add('FREELANCER');
        }
        if (preferences.getBool('isFreelancerActiveV1') == true ||
            preferences.getBool('isFreelancer') == true ||
            preferences.getString('narratorFreelancerProfileV1') != null) {
          rolesSet.add('FREELANCER');
        }
        if (rolesSet.isEmpty) {
          rolesSet.add('VIEWER');
        }
        userRoles = rolesSet.toList();
        isCreator = profile.isCreator || userRoles.contains('CREATOR');
        isFreelancer = profile.isFreelancer ||
            userRoles.contains('FREELANCER') ||
            userRoles.contains('NARRATOR') ||
            preferences.getBool('isFreelancer') == true ||
            preferences.getBool('isFreelancerActiveV1') == true;
        await preferences.setStringList('userRoles', userRoles);
        await preferences.setBool('isCreator', isCreator);
        await preferences.setBool('isFreelancer', isFreelancer);
      } catch (_) {}
    }

    if (freelancerRepository != null) {
      try {
        final f = await freelancerRepository!.getMyProfile();
        if (f.status == 'ACTIVE' || f.roles.contains('FREELANCER')) {
          if (!userRoles.contains('FREELANCER')) {
            userRoles.add('FREELANCER');
            await preferences.setStringList('userRoles', userRoles);
          }
          isFreelancer = true;
          await preferences.setBool('isFreelancer', true);
        }
      } catch (_) {}
    }

    if (kycRepository != null) {
      try {
        final kyc = await kycRepository!.getMyKycProfile();
        if (kyc != null) {
          kycStatus = kyc.status.toUpperCase();
          await preferences.setString('kycStatus', kycStatus!);
          if (kycStatus == 'APPROVED') {
            if (!userRoles.contains('CREATOR')) {
              userRoles.add('CREATOR');
              await preferences.setStringList('userRoles', userRoles);
            }
            isCreator = true;
            await preferences.setBool('isCreator', true);
          }
        }
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<void> refreshWalletBalance() async {
    if (walletRepository == null) return;
    try {
      final w = await walletRepository!.getMyWallet();
      walletAvailableBalance = w.availableBalance.round();
      walletPendingBalance = w.pendingBalance.round();
      notifyListeners();
    } catch (_) {}
  }

  final Map<String, List<SeriesModel>> channelSeries = {};
  final Map<int, SeriesDetailModel> seriesDetails = {};
  final Map<String, MembershipPlanModel> channelPlans = {};
  final Map<String, String> episodeTranscripts = {};
  final Map<String, int> _reactionIds = {};
  final List<LivestreamSessionModel> activeLivestreams = [];
  final Map<int, List<LivestreamChatMessage>> _livestreamChats = {};
  final Map<int, LivestreamMediaState> _sessionMediaStates = {};

  LivestreamMediaState getLivestreamMediaState(int sessionId) {
    return _sessionMediaStates[sessionId] ?? const LivestreamMediaState();
  }

  void updateLivestreamMediaState(
    int sessionId, {
    bool? isScreenSharing,
    bool? isCameraOn,
    bool? isMicOn,
    bool? isFrontCamera,
    int? currentSlideIndex,
    String? customDocumentTitle,
  }) {
    final current = getLivestreamMediaState(sessionId);
    _sessionMediaStates[sessionId] = current.copyWith(
      isScreenSharing: isScreenSharing,
      isCameraOn: isCameraOn,
      isMicOn: isMicOn,
      isFrontCamera: isFrontCamera,
      currentSlideIndex: currentSlideIndex,
      customDocumentTitle: customDocumentTitle,
    );
    notifyListeners();
  }

  List<SeriesModel> getChannelSeries(String channelName) =>
      List.unmodifiable(channelSeries[channelName] ?? const []);

  String getTranscript(String episodeId) => episodeTranscripts[episodeId] ?? '';

  MembershipPlanModel? getChannelPlan(String channelName) =>
      channelPlans[channelName];

  Future<void> updateApiBaseUrl(String newUrl) async {
    if (apiClient != null) {
      apiClient!.updateBaseUrl(newUrl);
      await preferences.setString('custom_api_base_url', apiClient!.baseUrl);
      await refreshCatalog();
    }
  }

  Future<void> refreshCatalog() => initRealBackend();

  Future<void> initRealBackend({bool allowAutoFallback = true}) async {
    isLoadingCatalog = true;
    catalogError = null;
    notifyListeners();

    var hadNetworkFailure = false;

    if (contentRepository != null) {
      try {
        final fetched = await contentRepository!.getPublishedEpisodes();
        if (fetched.isNotEmpty) {
          remoteEpisodes
            ..clear()
            ..addAll(fetched);
        }
      } catch (_) {
        hadNetworkFailure = true;
      }
    }

    if (channelRepository != null || contentRepository != null) {
      try {
        final List<Channel> loadedChannels = [];
        if (channelRepository != null) {
          final models = await channelRepository!.getAllChannels();
          for (final m in models) {
            if (m.name.trim().isEmpty) continue;
            MembershipPlanModel? plan;
            try {
              plan = await channelRepository!.getChannelMembershipPlan(m.id);
              if (plan != null) {
                channelPlans[m.name] = plan;
              }
            } catch (_) {}

            if (creatorSeriesRepository != null && m.id > 0) {
              try {
                final seriesList = await creatorSeriesRepository!
                    .getPublicChannelSeries(m.id);
                if (seriesList.isNotEmpty) {
                  channelSeries[m.name] = seriesList;
                }
              } catch (_) {}
            }

            loadedChannels.add(
              Channel(
                m.name,
                m.name.substring(0, 1).toUpperCase(),
                (m.avatarUrl != null && m.avatarUrl!.isNotEmpty)
                    ? m.avatarUrl!
                    : 'assets/images/hue-citadel.jpg',
                m.description.isNotEmpty
                    ? m.description
                    : 'Kênh kể chuyện lịch sử trên nền tảng Sử Ký.',
                id: m.id,
                coverImage: m.coverUrl ?? '',
                monthlyPrice: plan?.monthlyPrice,
                hasBackendPlan: plan != null && plan.isActive,
              ),
            );
          }
        } else if (contentRepository != null) {
          loadedChannels.addAll(await contentRepository!.getChannels());
        }

        if (loadedChannels.isNotEmpty) {
          remoteChannels
            ..clear()
            ..addAll(loadedChannels);
        }
      } catch (_) {
        hadNetworkFailure = true;
      }
    }

    if (isLoggedIn) {
      await refreshProfile();
    }

    if (walletRepository != null) {
      try {
        final w = await walletRepository!.getMyWallet();
        walletAvailableBalance = w.availableBalance.round();
        walletPendingBalance = w.pendingBalance.round();
      } catch (_) {}
    }

    if (membershipRepository != null) {
      try {
        final myMems = await membershipRepository!.getMyMemberships();
        for (final m in myMems) {
          if (m.channelName.isNotEmpty &&
              (m.status.isEmpty ||
                  m.status.toUpperCase() == 'ACTIVE' ||
                  m.status.toUpperCase() == 'SUCCESS')) {
            memberships.add(m.channelName);
            checkoutStates[m.channelName] = 'active';
          }
          final txId = 'MEM-${m.channelId}';
          if (!transactions.any((t) => t.id == txId) &&
              m.channelName.isNotEmpty) {
            transactions.insert(
              0,
              MembershipTransaction(
                id: txId,
                channelName: m.channelName,
                date: m.startedAt.isNotEmpty
                    ? m.startedAt.split('T').first
                    : 'Gần đây',
                type: 'Đăng ký hội viên',
                status: m.status.isNotEmpty ? m.status : 'ACTIVE',
                planTitle: 'Hội viên kênh ${m.channelName}',
              ),
            );
          }
        }
      } catch (_) {}
    }

    if (commentRepository != null) {
      try {
        final realComments = await commentRepository!.getComments();
        for (final rc in realComments) {
          final epId = rc.artifactId?.toString() ?? '1';
          final epCmt = EpisodeComment(
            id: rc.id.toString(),
            episodeId: epId,
            authorName: rc.authorName ?? 'Người nghe',
            content: rc.textBody,
            timeAgo: rc.createdAt != null
                ? rc.createdAt!.split('T').first
                : 'Vừa xong',
            isFlagged: rc.status?.toUpperCase() == 'FLAGGED',
          );
          final list = _comments.putIfAbsent(epId, () => []);
          if (!list.any((c) => c.id == epCmt.id)) {
            list.insert(0, epCmt);
          }
        }
      } catch (_) {}
    }

    if (transcriptRepository != null) {
      try {
        final list = await transcriptRepository!.getAll();
        for (final t in list) {
          if (t.textBody.trim().isNotEmpty) {
            episodeTranscripts[t.artifactId.toString()] = t.textBody.trim();
          }
        }
      } catch (_) {}
    }

    if (reactionRepository != null) {
      try {
        final list = await reactionRepository!.getAll();
        for (final r in list) {
          final epId = r.artifactId.toString();
          if (currentUserId != null && r.userId == currentUserId) {
            _reactionIds[epId] = r.id;
            if (r.type.toUpperCase() == 'DISLIKE') {
              dislikedEpisodes.add(epId);
              likedEpisodes.remove(epId);
            } else {
              likedEpisodes.add(epId);
              dislikedEpisodes.remove(epId);
            }
          }
        }
      } catch (_) {}
    }

    if (livestreamRepository != null) {
      try {
        final liveList = await livestreamRepository!.getLivestreams(
          status: 'LIVE',
        );
        activeLivestreams
          ..clear()
          ..addAll(
            liveList
                .where((s) => s.status.toUpperCase() == 'LIVE')
                .map((s) {
                  if (s.channelName.isNotEmpty) return s;
                  final chMatch = channels.where((c) => c.id == s.channelId);
                  return chMatch.isNotEmpty
                      ? s.copyWith(channelName: chMatch.first.name)
                      : s;
                }),
          );
      } catch (_) {}
    }

    // Tự động thử fallback địa chỉ IP LAN nếu địa chỉ mặc định bị lỗi mạng
    if (hadNetworkFailure && allowAutoFallback && apiClient != null && !kIsWeb) {
      final currentBase = apiClient!.baseUrl;
      String? fallbackUrl;
      if (currentBase.contains('10.0.2.2')) {
        fallbackUrl = 'http://10.87.31.229:8080';
      } else if (currentBase.contains('192.168.1.72') || currentBase.contains('172.18.1.206') || currentBase.contains('10.87.31.229')) {
        fallbackUrl = 'http://10.0.2.2:8080';
      }
      if (fallbackUrl != null) {
        apiClient!.updateBaseUrl(fallbackUrl);
        return initRealBackend(allowAutoFallback: false);
      }
    }

    if (hadNetworkFailure && remoteEpisodes.isEmpty && remoteChannels.isEmpty) {
      catalogError =
          'Chưa kết nối được máy chủ Sử Ký. Đang hiển thị kho tư liệu lưu sẵn.';
    } else {
      catalogError = null;
    }

    isLoadingCatalog = false;
    notifyListeners();
  }

  Future<void> loadEpisodeEngagement(String episodeId) async {
    final artId = int.tryParse(episodeId);
    var changed = false;
    if (commentRepository != null && artId != null) {
      try {
        final list = await commentRepository!.getComments(artifactId: artId);
        final bucket = _comments.putIfAbsent(episodeId, () => []);
        for (final rc in list) {
          final epCmt = EpisodeComment(
            id: rc.id.toString(),
            episodeId: episodeId,
            authorName: rc.authorName ?? 'Người nghe',
            content: rc.textBody,
            timeAgo: rc.createdAt != null
                ? rc.createdAt!.split('T').first
                : 'Vừa xong',
            isFlagged: rc.status?.toUpperCase() == 'FLAGGED',
          );
          if (!bucket.any((c) => c.id == epCmt.id)) {
            bucket.insert(0, epCmt);
            changed = true;
          }
        }
      } catch (_) {}
    }
    if (transcriptRepository != null &&
        !episodeTranscripts.containsKey(episodeId)) {
      try {
        final all = await transcriptRepository!.getAll();
        for (final t in all) {
          if (t.textBody.trim().isNotEmpty) {
            episodeTranscripts[t.artifactId.toString()] = t.textBody.trim();
            changed = true;
          }
        }
      } catch (_) {}
    }
    if (changed) notifyListeners();
  }

  Future<SeriesDetailModel?> loadSeriesDetail(int seriesId) async {
    if (creatorSeriesRepository == null) return seriesDetails[seriesId];
    try {
      final detail = await creatorSeriesRepository!.getPublicSeriesDetail(
        seriesId,
      );
      seriesDetails[seriesId] = detail;
      for (final item in detail.items) {
        final epId = item.contentId.toString();
        if (!allEpisodes.any((e) => e.id == epId || e.contentId == item.contentId)) {
          final media = item.mediaUrl ?? '';
          final isVid =
              media.toLowerCase().endsWith('.mp4') ||
              media.toLowerCase().endsWith('.webm');
          remoteEpisodes.add(
            Episode(
              id: epId,
              title: item.title,
              channel: detail.channelName ?? 'Sử Ký',
              image:
                  (item.thumbnailUrl != null && item.thumbnailUrl!.isNotEmpty)
                  ? item.thumbnailUrl!
                  : (detail.coverUrl ?? 'assets/images/hue-citadel.jpg'),
              category: detail.title,
              seconds: item.durationSeconds > 0 ? item.durationSeconds : 300,
              description: item.description ?? detail.description ?? '',
              chapters: const [Chapter('Mở đầu', 0)],
              membersOnly: item.isExclusive,
              isVideo: isVid,
              mediaAsset: media,
              channelId: detail.channelId,
              contentId: item.contentId,
              seriesId: detail.id,
              seriesTitle: detail.title,
            ),
          );
        }
      }
      notifyListeners();
      return detail;
    } catch (_) {
      return seriesDetails[seriesId];
    }
  }

  List<Episode> episodesForSeries(SeriesModel series) {
    final detail = seriesDetails[series.id];
    if (detail != null && detail.items.isNotEmpty) {
      final result = <Episode>[];
      for (final item in detail.items) {
        final match = allEpisodes.where(
          (e) =>
              e.contentId == item.contentId ||
              e.id == item.contentId.toString(),
        );
        if (match.isNotEmpty) {
          result.add(match.first);
        }
      }
      if (result.isNotEmpty) return result;
    }
    final bySeriesId = allEpisodes
        .where((e) => e.seriesId == series.id)
        .toList();
    if (bySeriesId.isNotEmpty) return bySeriesId;
    if (series.channelName != null && series.channelName!.isNotEmpty) {
      return allEpisodes
          .where((e) => e.channel == series.channelName)
          .toList();
    }
    return const [];
  }

  Future<MembershipPlanModel?> loadChannelMembershipPlan(
    String channelName,
  ) async {
    final ch = channelByName(channelName);
    final channelId = ch.id;
    if (channelId == null || channelId <= 0) return channelPlans[channelName];
    if (channelRepository != null) {
      try {
        final plan = await channelRepository!.getChannelMembershipPlan(
          channelId,
        );
        if (plan != null) {
          channelPlans[channelName] = plan;
        }
      } catch (_) {}
    }
    if (membershipRepository != null && isLoggedIn) {
      try {
        final check = await membershipRepository!.checkMembership(channelId);
        if (check.isMember) {
          memberships.add(channelName);
          checkoutStates[channelName] = 'active';
        }
      } catch (_) {}
    }
    notifyListeners();
    return channelPlans[channelName];
  }

  Future<void> subscribeChannelMembership(String channelName) async {
    final ch = channelByName(channelName);
    final channelId = ch.id;
    if (membershipRepository != null && channelId != null && channelId > 0) {
      final res = await membershipRepository!.subscribe(channelId);
      if (walletRepository != null) {
        try {
          final w = await walletRepository!.getMyWallet();
          walletAvailableBalance = w.availableBalance.round();
          walletPendingBalance = w.pendingBalance.round();
        } catch (_) {}
      }
      memberships.add(channelName);
      checkoutStates[channelName] = 'active';
      await preferences.setStringList('demoMemberships', memberships.toList());
      await preferences.setString(
        'checkoutStatesV1',
        jsonEncode(checkoutStates),
      );
      final plan = channelPlans[channelName];
      final now = DateTime.now();
      final dateStr =
          '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';
      transactions.insert(
        0,
        MembershipTransaction(
          id: 'SUB-${res.id > 0 ? res.id : now.millisecondsSinceEpoch % 1000000}',
          channelName: channelName,
          date: dateStr,
          type: 'Đăng ký hội viên',
          status: res.status.isNotEmpty ? res.status : 'ACTIVE',
          planTitle: plan?.planName ?? 'Gói tháng kênh $channelName',
        ),
      );
      await preferences.setStringList(
        'membershipTransactions',
        transactions.map((t) => t.toJson()).toList(),
      );
      notifyListeners();
      return;
    }
    await setDemoMembership(channelName, true);
  }

  List<LivestreamSessionModel> activeLivestreamsForChannel(Channel channel) {
    return activeLivestreams.where((s) {
      if (s.status.toUpperCase() != 'LIVE') return false;
      if (channel.id != null && channel.id! > 0 && s.channelId == channel.id) {
        return true;
      }
      return s.channelName.trim().toLowerCase() ==
          channel.name.trim().toLowerCase();
    }).toList();
  }

  String resolveLivestreamChannelName(LivestreamSessionModel session) {
    if (session.channelName.trim().isNotEmpty) {
      return session.channelName.trim();
    }
    final match = channels.where((c) => c.id == session.channelId);
    if (match.isNotEmpty) return match.first.name;
    return channels.isNotEmpty ? channels.first.name : 'Sử Ký';
  }

  bool canJoinLivestream(LivestreamSessionModel session) {
    if (!session.isExclusive) return true;
    final chName = resolveLivestreamChannelName(session);
    return memberships.contains(chName);
  }

  Future<void> refreshLivestreams() async {
    if (livestreamRepository == null) return;
    try {
      final liveList = await livestreamRepository!.getLivestreams(
        status: 'LIVE',
      );
      activeLivestreams
        ..clear()
        ..addAll(
          liveList
              .where((s) => s.status.toUpperCase() == 'LIVE')
              .map(
                (s) => s.channelName.isNotEmpty
                    ? s
                    : s.copyWith(channelName: resolveLivestreamChannelName(s)),
              ),
        );
      notifyListeners();
    } catch (_) {}
  }

  Future<LivestreamSessionModel?> fetchLivestreamSession(int id) async {
    if (livestreamRepository == null) return null;
    try {
      final session = await livestreamRepository!.getSession(id);
      final idx = activeLivestreams.indexWhere((s) => s.id == id);
      if (idx >= 0) {
        activeLivestreams[idx] = session.channelName.isNotEmpty
            ? session
            : session.copyWith(
                channelName: activeLivestreams[idx].channelName,
              );
        notifyListeners();
      }
      return session;
    } catch (_) {
      return null;
    }
  }

  Future<LivestreamTokenModel> joinLivestream(
    LivestreamSessionModel session, {
    bool isHost = false,
  }) async {
    if (!isHost && session.isExclusive && !canJoinLivestream(session)) {
      throw StateError('LIVESTREAM_MEMBER_REQUIRED');
    }
    if (livestreamRepository != null) {
      final token = await livestreamRepository!.getJoinToken(session.id);
      final idx = activeLivestreams.indexWhere((s) => s.id == session.id);
      if (idx >= 0 && !isHost) {
        final current = activeLivestreams[idx];
        activeLivestreams[idx] = current.copyWith(
          viewerCount: current.viewerCount + 1,
        );
        notifyListeners();
      }
      return token;
    }
    final idx = activeLivestreams.indexWhere((s) => s.id == session.id);
    if (idx >= 0 && !isHost) {
      final current = activeLivestreams[idx];
      activeLivestreams[idx] = current.copyWith(
        viewerCount: current.viewerCount + 1,
      );
      notifyListeners();
    }
    return LivestreamTokenModel(
      appId: 'demo_agora_app_id',
      agoraChannelName: session.agoraChannelName,
      token: 'rtc_token_${session.id}',
      clientUid: currentUserId ?? 1001,
      role: isHost ? 'PUBLISHER' : 'SUBSCRIBER',
      expirationSeconds: 3600,
    );
  }

  Future<LivestreamSessionModel?> leaveLivestream(
    int sessionId, {
    bool reset = false,
  }) async {
    if (livestreamRepository != null) {
      try {
        final updated = await livestreamRepository!.leaveSession(
          sessionId,
          reset: reset,
        );
        final idx = activeLivestreams.indexWhere((s) => s.id == sessionId);
        if (idx >= 0) {
          activeLivestreams[idx] = updated.channelName.isNotEmpty
              ? updated
              : updated.copyWith(
                  channelName: activeLivestreams[idx].channelName,
                );
        }
        notifyListeners();
        return updated;
      } catch (_) {}
    }
    final idx = activeLivestreams.indexWhere((s) => s.id == sessionId);
    if (idx >= 0) {
      final current = activeLivestreams[idx];
      final nextCount = reset
          ? 0
          : (current.viewerCount - 1).clamp(0, 999999);
      final updated = current.copyWith(viewerCount: nextCount);
      activeLivestreams[idx] = updated;
      notifyListeners();
      return updated;
    }
    return null;
  }

  Future<LivestreamSessionModel> createLivestreamSession({
    required int channelId,
    required String channelName,
    required String title,
    String? description,
    bool isExclusive = false,
  }) async {
    if (livestreamRepository != null) {
      final created = await livestreamRepository!.createSession(
        channelId: channelId,
        title: title.trim(),
        description: description?.trim(),
        isExclusive: isExclusive,
      );
      final enriched = created.channelName.isNotEmpty
          ? created
          : created.copyWith(
              channelName: channelName,
              creatorName: displayName,
            );
      activeLivestreams.removeWhere(
        (s) => s.channelId == channelId || s.channelName == channelName,
      );
      activeLivestreams.insert(0, enriched);
      notifyListeners();
      return enriched;
    }

    final nowMs = DateTime.now().millisecondsSinceEpoch;
    final localSession = LivestreamSessionModel(
      id: nowMs % 1000000,
      channelId: channelId,
      channelName: channelName,
      creatorName: displayName,
      title: title.trim(),
      description: description?.trim(),
      agoraChannelName: 'prm_live_${channelId}_$nowMs',
      status: 'LIVE',
      isExclusive: isExclusive,
      viewerCount: 1,
      startedAt: DateTime.now().toIso8601String(),
    );
    activeLivestreams.removeWhere(
      (s) => s.channelId == channelId || s.channelName == channelName,
    );
    activeLivestreams.insert(0, localSession);
    notifyListeners();
    return localSession;
  }

  Future<void> endLivestreamSession(int sessionId) async {
    if (livestreamRepository != null) {
      try {
        await livestreamRepository!.endSession(sessionId);
      } catch (_) {}
    }
    activeLivestreams.removeWhere((s) => s.id == sessionId);
    notifyListeners();
  }

  List<LivestreamChatMessage> getLivestreamChats(int sessionId) =>
      List.unmodifiable(_livestreamChats[sessionId] ?? const []);

  Future<List<LivestreamChatMessage>> fetchLivestreamChats(
    int sessionId, {
    int since = 0,
  }) async {
    final bucket = _livestreamChats.putIfAbsent(sessionId, () => []);
    if (livestreamRepository != null) {
      try {
        final incoming = await livestreamRepository!.getChatMessages(
          sessionId,
          since: since,
        );
        var added = false;
        for (final msg in incoming) {
          if (!bucket.any((m) => m.id == msg.id)) {
            bucket.add(msg);
            added = true;
          }
        }
        if (added) notifyListeners();
      } catch (_) {}
    }
    return List.unmodifiable(bucket);
  }

  Future<LivestreamChatMessage> sendLivestreamChat(
    int sessionId,
    String text, {
    bool isHost = false,
  }) async {
    final trimmed = text.trim();
    final now = DateTime.now();
    final hh = now.hour.toString().padLeft(2, '0');
    final mm = now.minute.toString().padLeft(2, '0');
    final ss = now.second.toString().padLeft(2, '0');
    final msg = LivestreamChatMessage(
      id: 'chat-${now.microsecondsSinceEpoch}',
      author: displayName,
      role: isHost ? 'creator' : 'viewer',
      text: trimmed,
      timestamp: now.millisecondsSinceEpoch,
      timeFormatted: '$hh:$mm:$ss',
    );
    final bucket = _livestreamChats.putIfAbsent(sessionId, () => []);
    bucket.add(msg);
    notifyListeners();

    if (livestreamRepository != null) {
      try {
        await livestreamRepository!.sendChatMessage(
          sessionId,
          messageId: msg.id,
          author: msg.author,
          role: msg.role,
          text: msg.text,
        );
      } catch (_) {}
    }
    return msg;
  }
  final Map<String, String> checkoutStates = {};
  final List<String> queue = [];
  String checkoutStatus(String channel) =>
      checkoutStates[channel] ??
      (memberships.contains(channel) ? 'active' : 'none');
  Future<void> beginCheckout(String channel) async {
    if (!channelByName(channel).hasMembership ||
        memberships.contains(channel) ||
        checkoutStatus(channel) == 'pending') {
      throw StateError(
        'Kênh chưa có gói, đã kích hoạt hoặc giao dịch đang chờ.',
      );
    }
    checkoutStates[channel] = 'pending';
    await preferences.setString('checkoutStatesV1', jsonEncode(checkoutStates));
    notifyListeners();
  }

  Future<void> finishCheckout(String channel, bool success) async {
    if (checkoutStatus(channel) != 'pending') {
      throw StateError('Không có giao dịch đang chờ.');
    }
    if (success) {
      await setDemoMembership(channel, true);
      return;
    }
    checkoutStates[channel] = 'failed';
    await preferences.setString('checkoutStatesV1', jsonEncode(checkoutStates));
    transactions.insert(
      0,
      MembershipTransaction(
        id: 'TX-${DateTime.now().microsecondsSinceEpoch}',
        channelName: channel,
        date: 'Hôm nay',
        type: 'Đăng ký thử',
        status: 'Thất bại mẫu · Không cấp quyền',
        planTitle: 'Giá chưa cấu hình',
      ),
    );
    await preferences.setStringList(
      'membershipTransactions',
      transactions.map((t) => t.toJson()).toList(),
    );
    notifyListeners();
  }

  Future<void> expireMembership(String channel) async {
    if (!memberships.contains(channel)) {
      throw StateError('Chưa có quyền để thử hết hạn.');
    }
    await setDemoMembership(channel, false);
    checkoutStates[channel] = 'expired';
    await preferences.setString('checkoutStatesV1', jsonEncode(checkoutStates));
    notifyListeners();
  }

  void addToQueue(Episode episode) {
    if (!canPlay(episode) || queue.contains(episode.id)) return;
    queue.add(episode.id);
    unawaited(preferences.setStringList('playbackQueueV1', queue));
    notifyListeners();
  }

  void removeFromQueue(String id) {
    queue.remove(id);
    unawaited(preferences.setStringList('playbackQueueV1', queue));
    notifyListeners();
  }

  void playNext() {
    while (queue.isNotEmpty) {
      final id = queue.removeAt(0);
      final candidates = allEpisodes.where((e) => e.id == id && canPlay(e));
      if (candidates.isNotEmpty) {
        play(candidates.first);
        break;
      }
    }
    unawaited(preferences.setStringList('playbackQueueV1', queue));
    notifyListeners();
  }

  void reloadCatalog({bool notify = true}) {
    ArtworkStore(preferences).reload(notify: false);
    publishedEpisodes.clear();
    try {
      final items = jsonDecode(
        preferences.getString('publishedEpisodesV1') ?? '[]',
      ) as List;
      publishedEpisodes.addAll(
        items.map((j) => episodeFromJson(j as Map<String, dynamic>)),
      );
    } catch (_) {}
    if (current != null && !allEpisodes.any((e) => e.id == current!.id)) {
      _closeVideo();
      _closeAudio();
      playing = false;
      current = null;
      position = 0;
    }
    if (notify) notifyListeners();
  }

  final Set<String> saved = {};
  final Set<String> followed = {};
  final Set<String> memberships = {};
  final Set<String> likedEpisodes = {};
  final Set<String> dislikedEpisodes = {};
  final List<MembershipTransaction> transactions = [];
  final Map<String, List<EpisodeComment>> _comments = {};

  late String displayName;
  bool isLoggedIn = false;
  String? userEmail;
  String? userPhone;

  void _loadComments() {
    if (!isLiveBackend) {
      for (final c in initialSampleComments) {
        _comments.putIfAbsent(c.episodeId, () => []).add(c);
      }
    }
    final rawUserComments = preferences.getStringList('userComments');
    if (rawUserComments != null) {
      for (final raw in rawUserComments) {
        try {
          final cmt = EpisodeComment.fromJson(raw);
          final list = _comments.putIfAbsent(cmt.episodeId, () => []);
          // Replace or insert
          final idx = list.indexWhere((it) => it.id == cmt.id);
          if (idx >= 0) {
            list[idx] = cmt;
          } else {
            list.insert(0, cmt);
          }
        } catch (_) {}
      }
    }
  }

  void _saveComments() {
    final allList = <String>[];
    for (final entry in _comments.values) {
      for (final c in entry) {
        allList.add(c.toJson());
      }
    }
    unawaited(preferences.setStringList('userComments', allList));
  }

  bool canPlay(Episode episode) =>
      !episode.membersOnly || memberships.contains(episode.channel);

  Future<void> updateName(String value) async {
    final trimmed = value.trim();
    if (trimmed.isEmpty || trimmed.runes.length > 40) {
      throw ArgumentError('Tên cần từ 1 đến 40 ký tự.');
    }
    if (userRepository != null && isLoggedIn) {
      try {
        final updated = await userRepository!.updateMyProfile(fullName: trimmed);
        if (updated.fullName.trim().isNotEmpty) {
          displayName = updated.fullName.trim();
        } else {
          displayName = trimmed;
        }
      } catch (_) {
        displayName = trimmed;
      }
    } else {
      displayName = trimmed;
    }
    await preferences.setString('displayName', displayName);
    notifyListeners();
  }

  // --- Auth API Integration ---
  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    final id = identifier.trim();
    if (id.isEmpty) {
      throw ArgumentError('Nhập email hoặc số điện thoại.');
    }
    if (password.length < 6) {
      throw ArgumentError('Mật khẩu cần ít nhất 6 ký tự.');
    }

    if (authRepository != null) {
      final res = await authRepository!.login(email: id, password: password);
      isLoggedIn = true;
      userEmail = res.email;
      userPhone = res.phone;
      displayName = res.email.split('@').first;
      final initialRoles = <String>{...res.roles};
      if (res.role.isNotEmpty) initialRoles.add(res.role);
      if (initialRoles.isEmpty) initialRoles.add('VIEWER');
      userRoles = initialRoles.toList();
      isCreator = userRoles.contains('CREATOR');
      isFreelancer = userRoles.contains('FREELANCER') || userRoles.contains('NARRATOR');
      await preferences.setStringList('userRoles', userRoles);
      await preferences.setBool('isCreator', isCreator);
      await preferences.setBool('isFreelancer', isFreelancer);

      if (userRepository != null) {
        try {
          final profile = await userRepository!
              .getMyProfile()
              .timeout(const Duration(seconds: 4));
          currentUserId = profile.id;
          await preferences.setInt('currentUserId', profile.id);
          if (profile.fullName.trim().isNotEmpty) {
            displayName = profile.fullName.trim();
          }
          if (profile.roles.isNotEmpty) {
            initialRoles.addAll(profile.roles);
          }
          if (profile.isCreator) initialRoles.add('CREATOR');
          if (profile.isFreelancer) initialRoles.add('FREELANCER');
          userRoles = initialRoles.toList();
          isCreator = userRoles.contains('CREATOR');
          isFreelancer = userRoles.contains('FREELANCER') || userRoles.contains('NARRATOR');
          await preferences.setStringList('userRoles', userRoles);
          await preferences.setBool('isCreator', isCreator);
          await preferences.setBool('isFreelancer', isFreelancer);
        } catch (_) {}
      }

      if (freelancerRepository != null) {
        try {
          final f = await freelancerRepository!
              .getMyProfile()
              .timeout(const Duration(seconds: 4));
          if (f.status == 'ACTIVE' || f.roles.contains('FREELANCER')) {
            initialRoles.add('FREELANCER');
            userRoles = initialRoles.toList();
            isFreelancer = true;
            await preferences.setStringList('userRoles', userRoles);
            await preferences.setBool('isFreelancer', true);
          }
        } catch (_) {}
      }

      if (kycRepository != null) {
        try {
          final kyc = await kycRepository!
              .getMyKycProfile()
              .timeout(const Duration(seconds: 4));
          if (kyc != null && kyc.status.toUpperCase() == 'APPROVED') {
            initialRoles.add('CREATOR');
            userRoles = initialRoles.toList();
            isCreator = true;
            await preferences.setStringList('userRoles', userRoles);
            await preferences.setBool('isCreator', true);
          }
        } catch (_) {}
      }

      await preferences.setBool('isLoggedIn', true);
      await preferences.remove('manual_logout');
      await preferences.setString('displayName', displayName);
      await preferences.setString('userEmail', res.email);
      await preferences.remove('walletDemoV1');
      await preferences.remove('creatorStudioV1');
      await preferences.remove('narratorProfileV1');
      await preferences.remove('narratorVerificationV1');
      memberships.clear();
      checkoutStates.clear();
      await preferences.remove('memberships');
      await preferences.remove('checkoutStates');
      notifyListeners();
      unawaited(initRealBackend());
      return;
    }

    isLoggedIn = true;
    if (id.contains('@')) {
      userEmail = id;
      userPhone = null;
      if (displayName == 'Người nghe') {
        displayName = id.split('@').first;
      }
    } else {
      userPhone = id;
      userEmail = null;
      if (displayName == 'Người nghe') {
        displayName = 'Người nghe ';
      }
    }
    await preferences.setBool('isLoggedIn', true);
    if (userEmail != null) {
      await preferences.setString('userEmail', userEmail!);
    } else {
      await preferences.remove('userEmail');
    }
    if (userPhone != null) {
      await preferences.setString('userPhone', userPhone!);
    } else {
      await preferences.remove('userPhone');
    }
    await preferences.setString('displayName', displayName);
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String identifier,
    required String password,
    String? confirmPassword,
    String? phone,
  }) async {
    final n = name.trim();
    final id = identifier.trim();
    if (n.isEmpty) throw ArgumentError('Nhập họ tên của bạn.');
    if (id.isEmpty) throw ArgumentError('Nhập email hoặc số điện thoại.');
    if (password.length < 6) {
      throw ArgumentError('Mật khẩu cần ít nhất 6 ký tự.');
    }
    if (confirmPassword != null &&
        confirmPassword.isNotEmpty &&
        confirmPassword != password) {
      throw ArgumentError('Mật khẩu xác nhận không khớp.');
    }

    if (authRepository != null) {
      String email;
      String regPhone;
      if (id.contains('@')) {
        email = id;
        regPhone = (phone != null && phone.trim().isNotEmpty)
            ? phone.trim()
            : '09${(DateTime.now().millisecondsSinceEpoch % 100000000).toString().padLeft(8, '0')}';
      } else {
        regPhone = id;
        email = '$id@suky.vn';
      }

      final res = await authRepository!.register(
        email: email,
        password: password,
        confirmPassword: confirmPassword ?? password,
        phone: regPhone,
      );
      displayName = n;
      isLoggedIn = true;
      userEmail = res.email;
      userPhone = res.phone;
      if (userRepository != null) {
        try {
          await userRepository!.updateMyProfile(fullName: n);
        } catch (_) {}
      }
      await preferences.setBool('isLoggedIn', true);
      await preferences.remove('manual_logout');
      await preferences.setString('displayName', displayName);
      await preferences.setString('userEmail', res.email);
      await preferences.remove('walletDemoV1');
      await preferences.remove('creatorStudioV1');
      await preferences.remove('narratorProfileV1');
      await preferences.remove('narratorVerificationV1');
      memberships.clear();
      checkoutStates.clear();
      await preferences.remove('memberships');
      await preferences.remove('checkoutStates');
      notifyListeners();
      unawaited(initRealBackend());
      return;
    }

    displayName = n;
    isLoggedIn = true;
    if (id.contains('@')) {
      userEmail = id;
      userPhone = null;
    } else {
      userPhone = id;
      userEmail = null;
    }
    await preferences.setBool('isLoggedIn', true);
    await preferences.setString('displayName', displayName);
    if (userEmail != null) {
      await preferences.setString('userEmail', userEmail!);
    } else {
      await preferences.remove('userEmail');
    }
    if (userPhone != null) {
      await preferences.setString('userPhone', userPhone!);
    } else {
      await preferences.remove('userPhone');
    }
    notifyListeners();
  }

  Future<void> loginAsGuest() async {
    isLoggedIn = true;
    displayName = 'Khách trải nghiệm';
    userEmail = 'khach.demo@suky.vn';
    userPhone = null;
    await preferences.setBool('isLoggedIn', true);
    await preferences.setString('displayName', displayName);
    await preferences.setString('userEmail', userEmail!);
    await preferences.remove('userPhone');
    notifyListeners();
  }

  Future<void> logout() async {
    SessionAudioFiles.clear();
    if (ArtworkStore(preferences).read().containsKey('avatar')) {
      await ArtworkStore(preferences).put('avatar', null);
    }
    try {
      await authRepository?.logout();
    } catch (_) {}
    isLoggedIn = false;
    currentUserId = null;
    userEmail = null;
    userPhone = null;
    userRoles = ['VIEWER'];
    isCreator = false;
    isFreelancer = false;
    kycStatus = null;
    await preferences.remove('currentUserId');
    await preferences.remove('userRoles');
    await preferences.remove('isCreator');
    await preferences.remove('isFreelancer');
    await preferences.remove('kycStatus');
    await preferences.setBool('manual_logout', true);
    displayName = 'Người nghe';
    memberships.clear();
    checkoutStates.clear();
    await preferences.setBool('isLoggedIn', false);
    await preferences.remove('userEmail');
    await preferences.remove('userPhone');
    await preferences.remove('memberships');
    await preferences.remove('checkoutStates');
    await preferences.remove('walletDemoV1');
    await preferences.remove('creatorStudioV1');
    await preferences.remove('narratorProfileV1');
    await preferences.remove('narratorVerificationV1');
    await preferences.setString('displayName', displayName);
    notifyListeners();
  }

  // --- Like & Dislike Simulation (UC-08) ---
  bool isLiked(String episodeId) => likedEpisodes.contains(episodeId);
  bool isDisliked(String episodeId) => dislikedEpisodes.contains(episodeId);

  int getLikeCount(String episodeId) {
    final ep = allEpisodes.where((e) => e.id == episodeId).firstOrNull;
    final base = ep?.remoteLikeCount ?? seedEpisodeLikes[episodeId] ?? 20;
    return base + (isLiked(episodeId) ? 1 : 0);
  }

  void toggleLike(String episodeId) {
    final nowLiked = !likedEpisodes.contains(episodeId);
    if (!nowLiked) {
      likedEpisodes.remove(episodeId);
    } else {
      likedEpisodes.add(episodeId);
      dislikedEpisodes.remove(episodeId);
    }
    unawaited(
      preferences.setStringList('likedEpisodes', likedEpisodes.toList()),
    );
    unawaited(
      preferences.setStringList('dislikedEpisodes', dislikedEpisodes.toList()),
    );
    notifyListeners();
    unawaited(_syncReaction(episodeId, nowLiked ? 'LIKE' : null));
  }

  void toggleDislike(String episodeId) {
    final nowDisliked = !dislikedEpisodes.contains(episodeId);
    if (!nowDisliked) {
      dislikedEpisodes.remove(episodeId);
    } else {
      dislikedEpisodes.add(episodeId);
      likedEpisodes.remove(episodeId);
    }
    unawaited(
      preferences.setStringList('likedEpisodes', likedEpisodes.toList()),
    );
    unawaited(
      preferences.setStringList('dislikedEpisodes', dislikedEpisodes.toList()),
    );
    notifyListeners();
    unawaited(_syncReaction(episodeId, nowDisliked ? 'DISLIKE' : null));
  }

  Future<void> _syncReaction(String episodeId, String? type) async {
    if (reactionRepository == null) return;
    final artId = int.tryParse(episodeId);
    if (artId == null) return;
    final uid = currentUserId ?? 1;
    try {
      final existingId = _reactionIds[episodeId];
      if (type == null) {
        if (existingId != null) {
          await reactionRepository!.delete(existingId);
          _reactionIds.remove(episodeId);
        }
      } else if (existingId != null) {
        await reactionRepository!.update(
          existingId,
          artifactId: artId,
          userId: uid,
          type: type,
        );
      } else {
        final created = await reactionRepository!.create(
          artifactId: artId,
          userId: uid,
          type: type,
        );
        _reactionIds[episodeId] = created.id;
      }
    } catch (_) {}
  }

  // --- Comments Simulation (UC-08) ---
  List<EpisodeComment> getComments(String episodeId) =>
      List.unmodifiable(_comments[episodeId] ?? []);

  final Set<String> _sendingComments = {};

  Future<String?> addComment(String episodeId, String rawContent) async {
    final content = rawContent.trim();
    if (content.isEmpty) {
      return 'Vui lòng nhập nội dung bình luận.';
    }
    if (content.runes.length < 3) {
      return 'Bình luận quá ngắn (tối thiểu 3 ký tự).';
    }
    if (content.runes.length > 300) return 'Bình luận tối đa 300 ký tự.';
    if (_sendingComments.contains(episodeId)) {
      return 'Bình luận đang được lưu. Vui lòng chờ.';
    }

    // Automated moderation check (BR-03 / UC-08)
    final lower = normalizeSearch(content);
    for (final bad in prohibitedCommentWords) {
      if (lower.contains(normalizeSearch(bad))) {
        return 'Bình luận chứa từ ngữ chưa phù hợp với chuẩn mực thảo luận lịch sử.';
      }
    }

    _sendingComments.add(episodeId);
    try {
      String createdId = 'cmt-${DateTime.now().microsecondsSinceEpoch}';

      if (commentRepository != null) {
        final artId = int.tryParse(episodeId);
        final res = await commentRepository!.createComment(
          artifactId: artId,
          textBody: content,
        );
        createdId = res.id.toString();
      }

      final comment = EpisodeComment(
        id: createdId,
        episodeId: episodeId,
        authorName: displayName,
        content: content,
        timeAgo: 'Vừa xong',
      );

      final next = [
        comment.toJson(),
        for (final list in _comments.values)
          for (final item in list) item.toJson(),
      ];
      if (!await (writeComments ?? preferences.setStringList)(
        'userComments',
        next,
      )) {
        throw StateError('Chưa lưu được bình luận.');
      }
      _comments.putIfAbsent(episodeId, () => []).insert(0, comment);
      notifyListeners();
      return null;
    } catch (_) {
      try {
        await preferences.reload();
      } catch (_) {}
      return 'Chưa lưu được bình luận. Nội dung vẫn được giữ để bạn thử lại.';
    } finally {
      _sendingComments.remove(episodeId);
    }

  }

  void toggleLikeComment(String episodeId, String commentId) {
    final list = _comments[episodeId];
    if (list == null) return;
    final idx = list.indexWhere((c) => c.id == commentId);
    if (idx >= 0) {
      final c = list[idx];
      final nextLiked = !c.isLiked;
      final nextLikes = nextLiked
          ? c.likes + 1
          : (c.likes > 0 ? c.likes - 1 : 0);
      list[idx] = c.copyWith(isLiked: nextLiked, likes: nextLikes);
      _saveComments();
      notifyListeners();
    }
  }

  void reportComment(String episodeId, String commentId) {
    final list = _comments[episodeId];
    if (list == null) return;
    final idx = list.indexWhere((c) => c.id == commentId);
    if (idx >= 0) {
      list[idx] = list[idx].copyWith(isFlagged: true);
      _saveComments();
      notifyListeners();
    }
  }

  // --- Membership & Transactions (UC-09, FR-06) ---
  Future<void> setDemoMembership(String channel, bool enabled) async {
    if (!channelByName(channel).hasMembership) return;
    final next = {...memberships};
    enabled ? next.add(channel) : next.remove(channel);
    await preferences.setStringList('demoMemberships', next.toList());
    memberships
      ..clear()
      ..addAll(next);
    checkoutStates[channel] = enabled ? 'active' : 'cancelled';
    await preferences.setString('checkoutStatesV1', jsonEncode(checkoutStates));

    // Record mock transaction
    // Record mock transaction
    final now = DateTime.now();
    final day = now.day.toString().padLeft(2, '0');
    final month = now.month.toString().padLeft(2, '0');
    final dateStr = '$day/$month/${now.year}';
    final tx = MembershipTransaction(
      id: 'TX-${now.millisecondsSinceEpoch % 1000000}',
      channelName: channel,
      date: dateStr,
      type: enabled ? 'Kích hoạt thử' : 'Tắt quyền thử',
      status: 'Thành công (Mô phỏng)',
      planTitle: 'Gói tháng kênh $channel',
    );
    transactions.insert(0, tx);
    unawaited(
      preferences.setStringList(
        'membershipTransactions',
        transactions.map((t) => t.toJson()).toList(),
      ),
    );

    if (current != null && !canPlay(current!)) {
      _closeVideo();
      _closeAudio();
      playing = false;
      current = null;
      position = 0;
      _fraction = 0;
    }
    notifyListeners();
  }

  final List<String> recentSearches = [];
  final List<String> recentPlayed = [];
  final Map<String, int> listeningProgress = {};
  List<Episode> get listeningHistory => recentPlayed
      .where((id) => allEpisodes.any((e) => e.id == id))
      .map((id) => allEpisodes.firstWhere((e) => e.id == id))
      .toList();
  int progressFor(Episode e) =>
      current?.id == e.id ? position : listeningProgress[e.id] ?? 0;
  Episode? get resumableEpisode {
    for (final e in listeningHistory) {
      if (canPlay(e) && progressFor(e) > 0 && progressFor(e) < e.seconds) {
        return e;
      }
    }
    return null;
  }

  void rememberSearch(String value) {
    final q = value.trim();
    if (q.isEmpty) return;
    recentSearches.removeWhere(
      (old) => normalizeSearch(old) == normalizeSearch(q),
    );
    recentSearches.insert(0, q.length > 100 ? q.substring(0, 100) : q);
    if (recentSearches.length > 5) {
      recentSearches.removeRange(5, recentSearches.length);
    }
    unawaited(preferences.setStringList('recentSearches', recentSearches));
    notifyListeners();
  }

  void clearRecentSearches() {
    recentSearches.clear();
    unawaited(preferences.remove('recentSearches'));
    notifyListeners();
  }

  void _storeListening() {
    _ticksSinceSave = 0;
    if (current != null) listeningProgress[current!.id] = position;
    unawaited(
      preferences.setString('listeningProgress', jsonEncode(listeningProgress)),
    );
    unawaited(preferences.setStringList('recentPlayed', recentPlayed));
  }

  Episode? current;
  AudioPlayback? audio;
  int _audioGeneration = 0;
  bool get hasRealAudio =>
      current?.isVideo == false && current!.mediaAsset.isNotEmpty;
  bool get audioLoading => audio?.loading == true;
  String? get audioError => audio?.error;

  void _closeAudio() {
    _audioGeneration++;
    final old = audio;
    audio = null;
    old?.dispose();
    MediaFocus.release(this);
  }

  Future<void> _openAudio(Episode episode) async {
    _closeAudio();
    final generation = _audioGeneration;
    final controller = AudioPlayback();
    audio = controller;
    bool lastLoading = false;
    String? lastError;
    controller.addListener(() {
      if (generation != _audioGeneration) return;
      if (controller.error != null) playing = false;
      if (controller.loading != lastLoading || controller.error != lastError) {
        lastLoading = controller.loading;
        lastError = controller.error;
        notifyListeners();
      }
    });
    final isRemote =
        episode.mediaAsset.startsWith('http://') ||
        episode.mediaAsset.startsWith('https://') ||
        episode.mediaAsset.startsWith('data:');
    await controller.open(
      episode.mediaAsset,
      asset: !isRemote,
      startAt: position,
      speed: speed,
      autoplay: false,
    );
    if (generation != _audioGeneration) return;
    if (controller.initialized) {
      controller.seek(Duration(seconds: position));
      controller.setSpeed(speed);
      if (playing) {
        MediaFocus.claim(this, pauseForMediaFocus);
        controller.play();
      }
    }
    notifyListeners();
  }

  void retryAudio() {
    if (!hasRealAudio || !canPlay(current!)) return;
    playing = true;
    unawaited(_openAudio(current!));
  }

  void pauseForMediaFocus() {
    if (playing) togglePlaying();
  }

  VideoPlayerController? video;
  bool videoLoading = false;
  String? videoError;
  int _videoGeneration = 0;

  void _closeVideo() {
    _videoGeneration++;
    final old = video;
    video = null;
    if (old != null) unawaited(old.dispose());
    videoLoading = false;
    videoError = null;
  }

  Future<void> _openVideo(Episode episode) async {
    _closeVideo();
    final generation = _videoGeneration;
    final isRemote =
        episode.mediaAsset.startsWith('http://') ||
        episode.mediaAsset.startsWith('https://');
    final controller = isRemote
        ? VideoPlayerController.networkUrl(Uri.parse(episode.mediaAsset))
        : VideoPlayerController.asset(episode.mediaAsset);
    video = controller;
    videoLoading = true;
    notifyListeners();
    try {
      await controller.initialize();
      if (generation != _videoGeneration) return;
      await controller.seekTo(Duration(seconds: position));
      await controller.setPlaybackSpeed(speed);
      if (playing) await controller.play();
      videoLoading = false;
      controller.addListener(() {
        if (generation != _videoGeneration || current?.id != episode.id) return;
        final value = controller.value;
        if (value.hasError && videoError == null) {
          videoError = 'Chưa phát được video. Hãy thử lại.';
          playing = false;
          notifyListeners();
        }
      });
      notifyListeners();
    } catch (_) {
      if (generation != _videoGeneration) return;
      videoLoading = false;
      videoError = 'Không tải được clip. Kiểm tra kết nối và thử lại.';
      playing = false;
      notifyListeners();
    }
  }

  void retryVideo() {
    if (current?.isVideo != true || !canPlay(current!)) return;
    playing = true;
    unawaited(_openVideo(current!));
  }

  bool playing = false;
  int position = 0;
  final ValueNotifier<int> playbackTick = ValueNotifier(0);
  double speed = 1;
  Timer? _ticker;
  Timer? _sleep;
  int? sleepMinutes;
  double _fraction = 0;
  int _ticksSinceSave = 0;

  void toggleSaved(Episode episode) {
    saved.contains(episode.id)
        ? saved.remove(episode.id)
        : saved.add(episode.id);
    unawaited(preferences.setStringList('savedEpisodes', saved.toList()));
    notifyListeners();
  }

  void toggleFollow(String channel) {
    followed.contains(channel)
        ? followed.remove(channel)
        : followed.add(channel);
    unawaited(preferences.setStringList('followedChannels', followed.toList()));
    notifyListeners();
  }

  bool play(Episode episode, {int? startAt}) {
    if (!canPlay(episode)) return false;
    _storeListening();
    final changed = current?.id != episode.id;
    if (changed) {
      _closeVideo();
      _closeAudio();
      position = listeningProgress[episode.id] ?? 0;
      _fraction = 0;
    }
    current = episode;
    if (startAt != null) position = startAt.clamp(0, episode.seconds);
    if (position >= episode.seconds) position = 0;
    playing = true;
    MediaFocus.claim(this, pauseForMediaFocus);
    if (episode.isVideo) {
      if (changed || video == null || videoError != null) {
        unawaited(_openVideo(episode));
      } else {
        unawaited(video!.seekTo(Duration(seconds: position)));
        unawaited(video!.play());
      }
    }
    if (hasRealAudio) {
      if (changed || audio == null || audioError != null) {
        unawaited(_openAudio(episode));
      } else if (audio!.initialized) {
        audio!.seek(Duration(seconds: position));
        audio!.play();
      }
    }
    recentPlayed.remove(episode.id);
    recentPlayed.insert(0, episode.id);
    _storeListening();
    _ticker ??= Timer.periodic(const Duration(seconds: 1), (_) {
      if (!playing || current == null) return;
      if (current!.isVideo) {
        if (video == null || !video!.value.isInitialized) return;
        position = video!.value.position.inSeconds.clamp(0, current!.seconds);
      } else if (hasRealAudio) {
        if (audio?.initialized != true) return;
        position = audio!.position.inSeconds.clamp(0, current!.seconds);
      } else {
        _fraction += speed;
        position = (position + _fraction.floor()).clamp(0, current!.seconds);
        _fraction -= _fraction.floor();
      }
      if (position >= current!.seconds ||
          (current!.isVideo && video?.value.isCompleted == true) ||
          (hasRealAudio && audio?.completed == true)) {
        position = current!.seconds;
        playing = false;
        notifyListeners();
        _storeListening();
        if (queue.isNotEmpty) {
          playNext();
          return;
        }
      }
      _ticksSinceSave++;
      if (_ticksSinceSave >= 5 || !playing) _storeListening();
      playbackTick.value++;
    });
    notifyListeners();
    return true;
  }

  void togglePlaying() {
    if (current == null) return;
    if (!playing) {
      play(current!);
      return;
    }
    playing = false;
    if (video != null && video!.value.isInitialized) {
      position = video!.value.position.inSeconds.clamp(0, current!.seconds);
    }
    if (video != null) unawaited(video!.pause());
    if (audio?.initialized == true) {
      position = audio!.position.inSeconds.clamp(0, current!.seconds);
      audio!.pause();
    }
    _storeListening();
    notifyListeners();
  }

  void seek(int seconds) {
    if (current == null) return;
    position = seconds.clamp(0, current!.seconds);
    if (video != null && video!.value.isInitialized) {
      unawaited(video!.seekTo(Duration(seconds: position)));
      if (position == current!.seconds) unawaited(video!.pause());
    }
    if (audio?.initialized == true) {
      audio!.seek(Duration(seconds: position));
      if (position == current!.seconds) audio!.pause();
    }
    _fraction = 0;
    if (position == current!.seconds) playing = false;
    _storeListening();
    notifyListeners();
  }

  void setSpeed(double rate) {
    if (![1.0, 1.25, 1.5, 1.75, 2.0].contains(rate)) return;
    speed = rate;
    if (video != null && video!.value.isInitialized) {
      unawaited(video!.setPlaybackSpeed(rate));
    }
    audio?.setSpeed(rate);
    unawaited(preferences.setDouble('playbackSpeed', rate));
    notifyListeners();
  }

  void cycleSpeed() {
    const rates = [1.0, 1.25, 1.5, 2.0];
    setSpeed(rates[(rates.indexOf(speed) + 1) % rates.length]);
  }

  void setSleep(int? minutes) {
    _sleep?.cancel();
    sleepMinutes = minutes;
    if (minutes != null) {
      _sleep = Timer(Duration(minutes: minutes), () {
        playing = false;
        if (video != null) unawaited(video!.pause());
        audio?.pause();
        sleepMinutes = null;
        _storeListening();
        notifyListeners();
      });
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _closeVideo();
    _closeAudio();
    _storeListening();
    _ticker?.cancel();
    _sleep?.cancel();
    super.dispose();
    playbackTick.dispose();
  }

  Future<void> pauseForDataChange() async {
    SessionAudioFiles.clear();
    _closeVideo();
    _closeAudio();
    _ticker?.cancel();
    _ticker = null;
    _sleep?.cancel();
    _sleep = null;
    playing = false;
    sleepMinutes = null;
    if (current != null) {
      listeningProgress[current!.id] = position;
      await preferences.setString(
        'listeningProgress',
        jsonEncode(listeningProgress),
      );
      await preferences.setStringList('recentPlayed', recentPlayed);
    }
    current = null;
    position = 0;
    _fraction = 0;
    notifyListeners();
  }

  void reloadLocalData() {
    final fresh = AppState(preferences);
    checkoutStates
      ..clear()
      ..addAll(fresh.checkoutStates);
    queue
      ..clear()
      ..addAll(fresh.queue);
    for (final pair in [
      (saved, fresh.saved),
      (followed, fresh.followed),
      (memberships, fresh.memberships),
      (likedEpisodes, fresh.likedEpisodes),
      (dislikedEpisodes, fresh.dislikedEpisodes),
    ]) {
      pair.$1
        ..clear()
        ..addAll(pair.$2);
    }
    transactions
      ..clear()
      ..addAll(fresh.transactions);
    _comments
      ..clear()
      ..addAll(fresh._comments);
    recentSearches
      ..clear()
      ..addAll(fresh.recentSearches);
    recentPlayed
      ..clear()
      ..addAll(fresh.recentPlayed);
    listeningProgress
      ..clear()
      ..addAll(fresh.listeningProgress);
    displayName = fresh.displayName;
    isLoggedIn = fresh.isLoggedIn;
    userEmail = fresh.userEmail;
    userPhone = fresh.userPhone;
    speed = fresh.speed;
    fresh.dispose();
    notifyListeners();
  }
}
