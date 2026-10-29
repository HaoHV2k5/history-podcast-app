import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/api/channel_repository.dart';
import '../../core/api/chat_repository.dart';
import '../../core/api/contract_repository.dart';
import '../../core/api/creator_series_repository.dart';
import '../../core/api/creator_studio_repository.dart';
import '../../core/api/deliverable_repository.dart';
import '../../core/api/dispute_repository.dart';
import '../../core/api/freelancer_repository.dart';
import '../../core/api/hire_request_repository.dart';
import '../../core/api/kyc_repository.dart';
import '../../core/api/milestone_repository.dart';
import '../../core/api/narrator_demo_repository.dart';
import '../../core/api/narrator_profile_repository.dart';
import '../../core/api/post_repository.dart';
import '../../core/api/wallet_repository.dart';
import '../../core/api/withdrawal_repository.dart';

/// The existing demo's DOB rule, shared by the form and state gate.
String? validateKycBirthDate(String value, {DateTime? today}) {
  if (!RegExp(r'^\d{2}/\d{2}/\d{4}$').hasMatch(value.trim())) {
    return 'Ngày sinh cần đúng định dạng DD/MM/YYYY.';
  }
  final parts = value.trim().split('/').map(int.parse).toList();
  final birth = DateTime(parts[2], parts[1], parts[0]);
  final now = today ?? DateTime.now();
  if (birth.day != parts[0] ||
      birth.month != parts[1] ||
      birth.year != parts[2] ||
      birth.isAfter(now) ||
      birth.year < 1900) {
    return 'Ngày sinh không hợp lệ.';
  }
  var age = now.year - birth.year;
  if (now.month < birth.month ||
      (now.month == birth.month && now.day < birth.day)) {
    age--;
  }
  return age < 18 ? 'Người đăng ký phải từ đủ 18 tuổi trở lên.' : null;
}

enum DraftStage { draft, checked, pending, rejected, approved }


extension DraftStageLabel on DraftStage {
  String get label => switch (this) {
    DraftStage.draft => 'Bản nháp',
    DraftStage.checked => 'Chọn sản xuất',
    DraftStage.pending => 'Chờ người duyệt',
    DraftStage.rejected => 'Cần chỉnh sửa',
    DraftStage.approved => 'Đã duyệt thử',
  };
}

enum KycStatus { notSubmitted, pending, approved, rejected }

class KycProfile {
  const KycProfile({
    this.fullName = '',
    this.idNumber = '',
    this.dob = '',
    this.phone = '',
    this.contactEmail = '',
    this.userEmail = '',
    this.verificationMethod = 'EMAIL',
    this.otpVerifiedAt = '',
    this.portfolioUrl = '',
    this.bio = '',
    this.bankName = '',
    this.bankAccountNumber = '',
    this.bankAccountHolder = '',
    this.idFrontUploaded = false,
    this.idBackUploaded = false,
    this.selfiePassed = false,
    this.status = KycStatus.notSubmitted,
    this.rejectionReason = '',
  });

  final String fullName;
  final String idNumber;
  final String dob;
  final String phone;
  final String contactEmail;
  final String userEmail;
  final String verificationMethod;
  final String otpVerifiedAt;
  final String portfolioUrl;
  final String bio;
  final String bankName;
  final String bankAccountNumber;
  final String bankAccountHolder;
  final bool idFrontUploaded;
  final bool idBackUploaded;
  final bool selfiePassed;
  final KycStatus status;
  final String rejectionReason;

  bool get isApproved => status == KycStatus.approved;

  factory KycProfile.fixtureApproved() => const KycProfile(
    fullName: 'Nguyễn Văn Sử',
    idNumber: '001099012345',
    dob: '15/08/1995',
    phone: '0901234567',
    contactEmail: 'creator@suky.vn',
    userEmail: 'creator@suky.vn',
    verificationMethod: 'OTP Hộp thư Email (Brevo HTTPS)',
    otpVerifiedAt: '16:23 27/10/2026',
    portfolioUrl: 'https://porfolio.eraidev.id.vn',
    bio: 'Kênh podcast lịch sử Việt Nam chính thống.',
    bankName: 'Vietcombank',
    bankAccountNumber: '001099012345',
    bankAccountHolder: 'NGUYEN VAN SU',
    idFrontUploaded: true,
    idBackUploaded: true,
    selfiePassed: true,
    status: KycStatus.approved,
  );

  Map<String, dynamic> toJson() => {
    'fullName': fullName,
    'idNumber': idNumber,
    'dob': dob,
    'phone': phone,
    'contactEmail': contactEmail,
    'userEmail': userEmail,
    'verificationMethod': verificationMethod,
    'otpVerifiedAt': otpVerifiedAt,
    'portfolioUrl': portfolioUrl,
    'bio': bio,
    'bankName': bankName,
    'bankAccountNumber': bankAccountNumber,
    'bankAccountHolder': bankAccountHolder,
    'idFrontUploaded': idFrontUploaded,
    'idBackUploaded': idBackUploaded,
    'selfiePassed': selfiePassed,
    'status': status.name,
    'rejectionReason': rejectionReason,
  };

  factory KycProfile.fromJson(Map<String, dynamic> j) => KycProfile(
    fullName: j['fullName'] as String? ?? '',
    idNumber: j['idNumber'] as String? ?? '',
    dob: j['dob'] as String? ?? '',
    phone: j['phone'] as String? ?? '',
    contactEmail: j['contactEmail'] as String? ?? '',
    userEmail: j['userEmail'] as String? ?? '',
    verificationMethod: j['verificationMethod'] as String? ?? 'EMAIL',
    otpVerifiedAt: j['otpVerifiedAt'] as String? ?? '',
    portfolioUrl: j['portfolioUrl'] as String? ?? '',
    bio: j['bio'] as String? ?? '',
    bankName: j['bankName'] as String? ?? '',
    bankAccountNumber: j['bankAccountNumber'] as String? ?? '',
    bankAccountHolder: j['bankAccountHolder'] as String? ?? '',
    idFrontUploaded: j['idFrontUploaded'] as bool? ?? false,
    idBackUploaded: j['idBackUploaded'] as bool? ?? false,
    selfiePassed: j['selfiePassed'] as bool? ?? false,
    status: j['status'] != null
        ? KycStatus.values.byName(j['status'] as String)
        : KycStatus.notSubmitted,
    rejectionReason: j['rejectionReason'] as String? ?? '',
  );
}

class ReviewLogEntry {
  const ReviewLogEntry({
    required this.timestamp,
    required this.stage,
    required this.note,
    required this.reviewerRole,
  });
  final String timestamp;
  final DraftStage stage;
  final String note;
  final String reviewerRole;

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp,
    'stage': stage.name,
    'note': note,
    'reviewerRole': reviewerRole,
  };

  factory ReviewLogEntry.fromJson(Map<String, dynamic> j) => ReviewLogEntry(
    timestamp: j['timestamp'] as String? ?? '',
    stage: DraftStage.values.byName(j['stage'] as String),
    note: j['note'] as String? ?? '',
    reviewerRole: j['reviewerRole'] as String? ?? '',
  );
}

class CreatorDraft {
  const CreatorDraft({
    required this.id,
    required this.title,
    this.script = '',
    this.sources = '',
    this.format = 'audio',
    this.stage = DraftStage.draft,
    this.reason = '',
    this.videoFileName = '',
    this.videoFileSize = '',
    this.extractedTranscript = '',
    this.reviewHistory = const [],
  });
  final String id, title, script, sources, format, reason;
  final String videoFileName;
  final String videoFileSize;
  final String extractedTranscript;
  final List<ReviewLogEntry> reviewHistory;
  final DraftStage stage;
  bool get editable =>
      stage != DraftStage.pending && stage != DraftStage.approved;
  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'script': script,
    'sources': sources,
    'format': format,
    'stage': stage.name,
    'reason': reason,
    'videoFileName': videoFileName,
    'videoFileSize': videoFileSize,
    'extractedTranscript': extractedTranscript,
    'reviewHistory': reviewHistory.map((r) => r.toJson()).toList(),
  };
  factory CreatorDraft.fromJson(Map<String, dynamic> j) => CreatorDraft(
    id: j['id'] as String,
    title: j['title'] as String,
    script: j['script'] as String? ?? '',
    sources: j['sources'] as String? ?? '',
    format: j['format'] as String? ?? 'audio',
    stage: DraftStage.values.byName(j['stage'] as String),
    reason: j['reason'] as String? ?? '',
    videoFileName: j['videoFileName'] as String? ?? '',
    videoFileSize: j['videoFileSize'] as String? ?? '',
    extractedTranscript: j['extractedTranscript'] as String? ?? '',
    reviewHistory:
        (j['reviewHistory'] as List<dynamic>?)
            ?.map((e) => ReviewLogEntry.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [],
  );
}

/// Local UI scenarios only. These flags confer no production permissions.
class CreatorState extends ChangeNotifier {
  CreatorState(
    this.preferences, {
    this.storageKey = 'creatorStudioV1',
    this.channelRepository,
    this.creatorSeriesRepository,
    this.creatorStudioRepository,
    this.kycRepository,
    this.contractRepository,
    this.hireRequestRepository,
    this.milestoneRepository,
    this.deliverableRepository,
    this.disputeRepository,
    this.chatRepository,
    this.narratorProfileRepository,
    this.narratorDemoRepository,
    this.freelancerRepository,
    this.postRepository,
    this.walletRepository,
    this.withdrawalRepository,
  }) {
    final raw = preferences.getString(storageKey);
    if (raw != null) {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      demoVerified = data['demoVerified'] == true;
      channel = data['channel'] as String? ?? '';
      channelDescription = data['channelDescription'] as String? ?? '';
      channelCategory =
          data['channelCategory'] as String? ?? 'Lịch sử Việt Nam';
      if (data['kyc'] != null) {
        kyc = KycProfile.fromJson(data['kyc'] as Map<String, dynamic>);
      } else if (demoVerified) {
        kyc = KycProfile.fixtureApproved();
      }
      drafts = (data['drafts'] as List? ?? [])
          .map((j) => CreatorDraft.fromJson(j as Map<String, dynamic>))
          .toList();
    }
  }
  final SharedPreferences preferences;
  final String storageKey;
  final ChannelRepository? channelRepository;
  final CreatorSeriesRepository? creatorSeriesRepository;
  final CreatorStudioRepository? creatorStudioRepository;
  final KycRepository? kycRepository;
  final ContractRepository? contractRepository;
  final HireRequestRepository? hireRequestRepository;
  final MilestoneRepository? milestoneRepository;
  final DeliverableRepository? deliverableRepository;
  final DisputeRepository? disputeRepository;
  final ChatRepository? chatRepository;
  final NarratorProfileRepository? narratorProfileRepository;
  final NarratorDemoRepository? narratorDemoRepository;
  final FreelancerRepository? freelancerRepository;
  final PostRepository? postRepository;
  final WalletRepository? walletRepository;
  final WithdrawalRepository? withdrawalRepository;
  ChannelModel? channelModel;
  MembershipPlanModel? membershipPlan;
  List<SeriesModel> mySeries = [];
  CreatorAiSettingModel? aiSettings;
  List<CreatorVoiceModel> aiVoices = [];
  List<Map<String, dynamic>> studioVideos = [];
  Map<String, dynamic>? lastVerification;
  Map<String, dynamic>? lastStoryboard;
  Map<String, dynamic>? activeRenderJob;

  bool get isLiveBackend =>
      channelRepository != null ||
      creatorSeriesRepository != null ||
      creatorStudioRepository != null ||
      kycRepository != null ||
      contractRepository != null;

  bool demoVerified = false;
  KycProfile kyc = const KycProfile();
  String channel = '';
  String channelDescription = '';
  String channelCategory = 'Lịch sử Việt Nam';
  List<CreatorDraft> drafts = [];

  Future<void> fetchMyChannel() async {
    if (channelRepository != null) {
      try {
        final myChan = await channelRepository!.getMyChannel();
        channelModel = myChan;
        channel = myChan.name;
        channelDescription = myChan.description;
        demoVerified = true;
        if (!kyc.isApproved) {
          kyc = KycProfile.fixtureApproved();
        }
        try {
          membershipPlan = await channelRepository!.getChannelMembershipPlan(
            myChan.id,
          );
        } catch (_) {}
        notifyListeners();
      } catch (_) {}
    }
  }

  Future<void> initStudioBackend() async {
    if (kycRepository != null) {
      try {
        final remoteKyc = await kycRepository!.getMyKycProfile();
        if (remoteKyc != null) {
          final mappedStatus = switch (remoteKyc.status.toUpperCase()) {
            'APPROVED' => KycStatus.approved,
            'REJECTED' => KycStatus.rejected,
            _ => KycStatus.pending,
          };
          kyc = KycProfile(
            fullName: remoteKyc.fullName,
            idNumber: kyc.idNumber.isEmpty ? '001099012345' : kyc.idNumber,
            dob: kyc.dob.isEmpty ? '15/08/1995' : kyc.dob,
            phone: remoteKyc.phone,
            idFrontUploaded: true,
            idBackUploaded: true,
            selfiePassed: true,
            status: mappedStatus,
            rejectionReason: remoteKyc.rejectionReason ?? '',
          );
          if (mappedStatus == KycStatus.approved) {
            demoVerified = true;
          }
        }
      } catch (_) {}
    }
    await fetchMyChannel();
    if (creatorSeriesRepository != null) {
      try {
        mySeries = await creatorSeriesRepository!.getMySeries();
      } catch (_) {}
    }
    if (creatorStudioRepository != null) {
      try {
        aiSettings = await creatorStudioRepository!.getSettings();
      } catch (_) {}
      try {
        aiVoices = await creatorStudioRepository!.getVoices();
      } catch (_) {}
      try {
        final rawVideos = await creatorStudioRepository!.getVideos();
        studioVideos = rawVideos
            .whereType<Map<String, dynamic>>()
            .toList();
        if (drafts.isEmpty && studioVideos.isNotEmpty) {
          drafts = [
            for (var i = 0; i < studioVideos.length; i++)
              CreatorDraft(
                id: 'remote-content-${studioVideos[i]['contentId'] ?? i}',
                title: (studioVideos[i]['title'] ?? 'Tập lịch sử').toString(),
                script: (studioVideos[i]['summary'] ??
                        'Nội dung kịch bản tư liệu lịch sử chính thống đã biên tập trên hệ thống.')
                    .toString(),
                sources:
                    'Đại Việt Sử Ký Toàn Thư · Khâm Định Việt Sử Thông Giám Cương Mục.',
                format: 'video',
                stage: i == 0 ? DraftStage.checked : DraftStage.approved,
              ),
          ];
        }
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<void> _commit({
    bool? verified,
    KycProfile? kycProfile,
    String? name,
    String? description,
    String? category,
    List<CreatorDraft>? items,
  }) async {
    final success = await preferences.setString(
      storageKey,
      jsonEncode({
        'demoVerified': verified ?? demoVerified,
        'kyc': (kycProfile ?? kyc).toJson(),
        'channel': name ?? channel,
        'channelDescription': description ?? channelDescription,
        'channelCategory': category ?? channelCategory,
        'drafts': (items ?? drafts).map((d) => d.toJson()).toList(),
      }),
    );
    if (!success) throw StateError('Không lưu được dữ liệu trên thiết bị.');
    demoVerified = verified ?? demoVerified;
    kyc = kycProfile ?? kyc;
    channel = name ?? channel;
    channelDescription = description ?? channelDescription;
    channelCategory = category ?? channelCategory;
    drafts = items ?? drafts;
    notifyListeners();
  }

  Future<void> useVerifiedFixture() =>
      _commit(verified: true, kycProfile: KycProfile.fixtureApproved());

  /// Re-read persisted workflow gates when an image edit returns from a route.
  void guardArtwork({String? draftId}) {
    final fresh = CreatorState(preferences, storageKey: storageKey);
    try {
      fresh._requireCreator();
      if (draftId != null) {
        final matches = fresh.drafts.where((d) => d.id == draftId);
        if (matches.isEmpty || !matches.first.editable) {
          throw StateError('Ảnh bìa đang khóa cùng nội dung gửi duyệt.');
        }
      }
    } finally {
      fresh.dispose();
    }
  }

  String? _otpPhone;

  void requestDemoOtp(String phone) {
    if (!RegExp(r'^0[35789]\d{8}$').hasMatch(phone.trim())) {
      throw StateError('Nhập số điện thoại Việt Nam hợp lệ.');
    }
    _otpPhone = phone.trim();
  }

  void _requireCreator({bool needsChannel = true}) {
    if (isLiveBackend) {
      if (needsChannel && channel.isEmpty && channelModel == null) {
        throw StateError('Cần kênh sáng tạo hợp lệ.');
      }
      return;
    }
    if (!demoVerified || !kyc.isApproved || (needsChannel && channel.isEmpty)) {
      throw StateError('Cần hồ sơ đã duyệt và kênh sáng tạo hợp lệ.');
    }
  }

  String _auditTime() {
    final now = DateTime.now();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(now.day)}/${two(now.month)}/${now.year} ${two(now.hour)}:${two(now.minute)}';
  }

  Future<void> submitKyc({
    required String fullName,
    required String phone,
    String? idNumber,
    String? dob,
    String? contactEmail,
    String? bankName,
    String? bankAccountNumber,
    String? bankAccountHolder,
    String? portfolioUrl,
    String? bio,
    String? otp,
    bool idFront = true,
    bool idBack = true,
    bool selfie = true,
  }) async {
    if (fullName.trim().isEmpty) {
      throw StateError('Vui lòng nhập họ và tên thật.');
    }
    final effectiveId = (idNumber != null && idNumber.trim().isNotEmpty)
        ? idNumber.trim()
        : (bankAccountNumber != null && bankAccountNumber.trim().isNotEmpty
            ? bankAccountNumber.trim()
            : '001099012345');
    if (idNumber != null && idNumber.trim().isNotEmpty && !RegExp(r'^\d{12}$').hasMatch(idNumber.trim())) {
      throw StateError('Số CCCD phải đủ 12 chữ số.');
    }
    if (!idFront || !idBack) {
      throw StateError('Cần cung cấp ảnh CCCD cả mặt trước và mặt sau.');
    }
    if (!selfie) {
      throw StateError('Cần xác thực khuôn mặt (liveness check).');
    }

    if (dob != null && dob.trim().isNotEmpty) {
      final birthError = validateKycBirthDate(dob);
      if (birthError != null) throw StateError(birthError);
    }
    if (!RegExp(r'^0[35789]\d{8}$').hasMatch(phone.trim())) {
      throw StateError('Nhập số điện thoại Việt Nam hợp lệ.');
    }
    if (_otpPhone != phone.trim() || otp == null || otp.trim() != '889900') {
      throw StateError('Vui lòng gửi và nhập mã OTP xác thực hợp lệ cho số điện thoại này.');
    }

    final effectiveEmail = (contactEmail != null && contactEmail.trim().isNotEmpty)
        ? contactEmail.trim()
        : (preferences.getString('userEmail') ?? 'creator@suky.vn');
    final effectiveBankName = (bankName != null && bankName.trim().isNotEmpty) ? bankName.trim() : 'Vietcombank';
    final effectiveBankAcc = (bankAccountNumber != null && bankAccountNumber.trim().isNotEmpty)
        ? bankAccountNumber.trim()
        : effectiveId;
    final effectiveBankHolder = (bankAccountHolder != null && bankAccountHolder.trim().isNotEmpty)
        ? bankAccountHolder.trim().toUpperCase()
        : fullName.trim().toUpperCase();

    final newKyc = KycProfile(
      fullName: fullName.trim(),
      idNumber: effectiveId,
      dob: dob?.trim() ?? '15/08/1995',
      phone: phone.trim(),
      contactEmail: effectiveEmail,
      userEmail: preferences.getString('userEmail') ?? effectiveEmail,
      verificationMethod: 'OTP Hộp thư Email (Brevo HTTPS)',
      otpVerifiedAt: _auditTime(),
      portfolioUrl: portfolioUrl?.trim() ?? '',
      bio: bio?.trim() ?? '',
      bankName: effectiveBankName,
      bankAccountNumber: effectiveBankAcc,
      bankAccountHolder: effectiveBankHolder,
      idFrontUploaded: idFront,
      idBackUploaded: idBack,
      selfiePassed: selfie,
      status: KycStatus.pending,
    );
    if (kycRepository != null) {
      try {
        await kycRepository!.submitKyc(
          fullName: fullName.trim(),
          phone: phone.trim(),
          contactEmail: effectiveEmail,
          bankName: effectiveBankName,
          bankAccountNumber: effectiveBankAcc,
          bankAccountHolder: effectiveBankHolder,
        );
      } catch (_) {}
    }
    await _commit(verified: false, kycProfile: newKyc);
    _otpPhone = null;
  }

  Future<void> simulateKycDecision(bool approved, {String reason = ''}) async {
    if (kyc.status != KycStatus.pending) {
      throw StateError('Chỉ duyệt hồ sơ đang chờ.');
    }
    final updated = KycProfile(
      fullName: kyc.fullName.isEmpty ? 'Nguyễn Văn Sử' : kyc.fullName,
      idNumber: kyc.idNumber.isEmpty ? '001099012345' : kyc.idNumber,
      dob: kyc.dob.isEmpty ? '15/08/1995' : kyc.dob,
      phone: kyc.phone.isEmpty ? '0901234567' : kyc.phone,
      idFrontUploaded: true,
      idBackUploaded: true,
      selfiePassed: true,
      status: approved ? KycStatus.approved : KycStatus.rejected,
      rejectionReason: approved
          ? ''
          : (reason.isEmpty
                ? 'Ảnh CCCD bị mờ, không rõ số nhận dạng.'
                : reason),
    );
    await _commit(verified: approved, kycProfile: updated);
  }

  Future<void> createChannel(
    String name, {
    String description = '',
    String category = 'Lịch sử Việt Nam',
  }) async {
    _requireCreator(needsChannel: false);
    if (channel.isNotEmpty ||
        name.trim().isEmpty ||
        name.trim().runes.length > 60) {
      throw StateError('Cần hồ sơ mẫu hợp lệ và tên kênh từ 1–60 ký tự.');
    }

    if (channelRepository != null) {
      final res = await channelRepository!.createChannel(
        name: name.trim(),
        description: description.trim().isNotEmpty ? description.trim() : 'Kênh chuyên đề lịch sử',
      );
      channelModel = res;
    }

    await _commit(
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
    );
  }

  Future<void> updateChannelProfile({
    required String name,
    required String description,
    required String category,
  }) async {
    _requireCreator();
    if (name.trim().isEmpty || name.trim().runes.length > 60) {
      throw StateError('Tên kênh từ 1–60 ký tự.');
    }

    if (channelRepository != null && channelModel != null) {
      final res = await channelRepository!.updateChannel(
        channelModel!.id,
        name: name.trim(),
        description: description.trim(),
      );
      channelModel = res;
    }

    await _commit(
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
    );
  }

  Future<ChannelModel?> uploadChannelAvatar(List<int> bytes, String filename) async {
    _requireCreator();
    if (channelRepository != null) {
      final res = await channelRepository!.uploadAvatar(bytes, filename);
      channelModel = res;
      notifyListeners();
      return res;
    }
    return null;
  }

  Future<ChannelModel?> uploadChannelCover(List<int> bytes, String filename) async {
    _requireCreator();
    if (channelRepository != null) {
      final res = await channelRepository!.uploadCover(bytes, filename);
      channelModel = res;
      notifyListeners();
      return res;
    }
    return null;
  }

  Future<void> save(CreatorDraft draft) async {
    _requireCreator();
    if (channel.isEmpty ||
        draft.title.trim().isEmpty ||
        draft.title.runes.length > 120) {
      throw StateError('Cần tên tập và kênh sáng tạo.');
    }
    final index = drafts.indexWhere((d) => d.id == draft.id);
    if (index >= 0 && !drafts[index].editable) {
      throw StateError('Tập đang được khóa để duyệt.');
    }
    final existing = index >= 0 ? drafts[index] : null;
    final items = [...drafts];
    final saved = CreatorDraft(
      id: draft.id,
      title: draft.title.trim(),
      script: draft.script.trim(),
      sources: draft.sources.trim(),
      format: draft.format,
      videoFileName: draft.videoFileName.isNotEmpty
          ? draft.videoFileName
          : (existing?.videoFileName ?? ''),
      videoFileSize: draft.videoFileSize.isNotEmpty
          ? draft.videoFileSize
          : (existing?.videoFileSize ?? ''),
      extractedTranscript: draft.extractedTranscript.isNotEmpty
          ? draft.extractedTranscript
          : (existing?.extractedTranscript ?? ''),
      reviewHistory: [
        ...existing?.reviewHistory ?? draft.reviewHistory,
        if (draft.videoFileName.isNotEmpty &&
            draft.videoFileName != existing?.videoFileName)
          ReviewLogEntry(
            timestamp: _auditTime(),
            stage: DraftStage.draft,
            note:
                'Nhập video mẫu ${draft.videoFileName} và kịch bản STT mô phỏng.',
            reviewerRole: 'Người sáng tạo',
          ),
      ],
      stage: DraftStage.draft,
      reason: draft.reason.isNotEmpty ? draft.reason : (existing?.reason ?? ''),
    );
    if (index < 0) {
      items.insert(0, saved);
    } else {
      items[index] = saved;
    }
    await _commit(items: items);
  }

  Future<void> retryDraft(String id) async {
    _requireCreator();
    final index = drafts.indexWhere((d) => d.id == id);
    if (index < 0) throw StateError('Không tìm thấy bản nháp.');
    final d = drafts[index];
    if (!d.editable) {
      throw StateError('Tập đang chờ hoặc đã duyệt không thể thử lại.');
    }
    final timeStr = _auditTime();
    final history = List<ReviewLogEntry>.from(d.reviewHistory);
    history.add(
      ReviewLogEntry(
        timestamp: timeStr,
        stage: DraftStage.draft,
        note: 'Người sáng tạo thử lại / viết lại kịch bản (BR-04).',
        reviewerRole: 'Người sáng tạo',
      ),
    );
    final items = [...drafts];
    items[index] = CreatorDraft(
      id: d.id,
      title: d.title,
      script: d.script,
      sources: d.sources,
      format: d.format,
      videoFileName: d.videoFileName,
      videoFileSize: d.videoFileSize,
      extractedTranscript: d.extractedTranscript,
      reviewHistory: history,
      stage: DraftStage.draft,
      reason: '',
    );
    await _commit(items: items);
  }

  Future<void> importVideoScript({
    required String id,
    required String fileName,
    required String fileSize,
    required String transcript,
    String? title,
  }) async {
    _requireCreator();
    if (id.trim().isEmpty ||
        fileName.trim().isEmpty ||
        transcript.trim().isEmpty ||
        (title != null &&
            (title.trim().isEmpty || title.trim().runes.length > 120))) {
      throw StateError('Cần tên tập, tên video và kịch bản hợp lệ.');
    }
    final index = drafts.indexWhere((d) => d.id == id);
    final items = [...drafts];
    final existing = index >= 0 ? drafts[index] : null;
    if (existing != null && !existing.editable) {
      throw StateError('Tập đang được khóa để duyệt.');
    }
    final timeStr = _auditTime();
    final history = existing != null
        ? List<ReviewLogEntry>.from(existing.reviewHistory)
        : <ReviewLogEntry>[];
    history.add(
      ReviewLogEntry(
        timestamp: timeStr,
        stage: DraftStage.draft,
        note: 'Nhập video mẫu $fileName và kịch bản mô phỏng Speech-to-Text.',
        reviewerRole: 'Hệ thống STT',
      ),
    );

    final updated = CreatorDraft(
      id: id,
      title: (title != null && title.isNotEmpty)
          ? title
          : (existing?.title ?? 'Tập video từ $fileName'),
      script: transcript,
      sources: (existing != null && existing.sources.isNotEmpty)
          ? existing.sources
          : 'Tư liệu âm thanh từ video $fileName',
      format: 'video',
      videoFileName: fileName,
      videoFileSize: fileSize,
      extractedTranscript: transcript,
      reviewHistory: history,
      stage: DraftStage.draft,
    );

    if (index >= 0) {
      items[index] = updated;
    } else {
      items.insert(0, updated);
    }
    await _commit(items: items);
  }

  Future<void> transition(
    String id,
    DraftStage next, {
    String reason = '',
    String? format,
  }) async {
    _requireCreator();
    final index = drafts.indexWhere((d) => d.id == id);
    if (index < 0) throw StateError('Không tìm thấy bản nháp.');
    final d = drafts[index];
    final allowed = switch (d.stage) {
      DraftStage.draft ||
      DraftStage.rejected => [DraftStage.checked, DraftStage.rejected],
      DraftStage.checked => [DraftStage.pending, DraftStage.draft],
      DraftStage.pending => [DraftStage.approved, DraftStage.rejected],
      DraftStage.approved => <DraftStage>[],
    };
    if (!allowed.contains(next) ||
        d.script.isEmpty ||
        d.sources.isEmpty ||
        (next == DraftStage.rejected && reason.trim().isEmpty) ||
        (format != null && !['audio', 'video'].contains(format))) {
      throw StateError('Chưa đủ nội dung hoặc bước duyệt không hợp lệ.');
    }
    final history = List<ReviewLogEntry>.from(d.reviewHistory);
    final timeStr = _auditTime();
    final role = switch (next) {
      DraftStage.checked => 'Bộ lọc AI Sử Ký',
      DraftStage.pending => 'Người sáng tạo',
      DraftStage.approved => 'Ban biên tập Sử Ký',
      DraftStage.rejected =>
        (d.stage == DraftStage.draft || d.stage == DraftStage.rejected)
            ? 'Bộ lọc AI Sử Ký'
            : 'Ban biên tập Sử Ký',
      DraftStage.draft => 'Người sáng tạo',
    };
    history.add(
      ReviewLogEntry(
        timestamp: timeStr,
        stage: next,
        note: reason.trim().isNotEmpty
            ? reason.trim()
            : (next == DraftStage.approved
                  ? 'Chấp thuận xuất bản thử nghiệm nội bộ.'
                  : (next == DraftStage.checked
                        ? 'Đạt kiểm tra AI sơ bộ về ngôn từ và tư liệu.'
                        : 'Nộp thẩm định biên tập.')),
        reviewerRole: role,
      ),
    );

    final items = [...drafts];
    items[index] = CreatorDraft(
      id: d.id,
      title: d.title,
      script: d.script,
      sources: d.sources,
      format: format ?? d.format,
      videoFileName: d.videoFileName,
      videoFileSize: d.videoFileSize,
      extractedTranscript: d.extractedTranscript,
      reviewHistory: history,
      stage: next,
      reason: reason.trim(),
    );
    await _commit(items: items);
  }

  Future<MembershipPlanModel> saveMembershipPlan({
    required String name,
    required double monthlyPrice,
    String? description,
    List<String> perks = const [],
    String status = 'ACTIVE',
  }) async {
    final channelId = channelModel?.id ?? 1;
    if (channelRepository != null) {
      final saved = await channelRepository!.upsertChannelMembershipPlan(
        channelId,
        name: name.trim(),
        description: description?.trim(),
        monthlyPrice: monthlyPrice,
        perks: perks,
        status: status,
      );
      membershipPlan = saved;
      notifyListeners();
      return saved;
    }
    final localPlan = MembershipPlanModel(
      id: 1,
      channelId: channelId,
      name: name.trim(),
      description: description?.trim(),
      monthlyPrice: monthlyPrice,
      perks: perks,
      status: status,
    );
    membershipPlan = localPlan;
    notifyListeners();
    return localPlan;
  }

  Future<SeriesModel> createCreatorSeries({
    required String title,
    String? description,
    String status = 'PUBLISHED',
    List<int> contentIds = const [],
  }) async {
    if (creatorSeriesRepository != null) {
      final created = await creatorSeriesRepository!.createSeries(
        title: title.trim(),
        description: description?.trim(),
        status: status,
        contentIds: contentIds,
      );
      mySeries = [created, ...mySeries];
      notifyListeners();
      return created;
    }
    final localSeries = SeriesModel(
      id: DateTime.now().millisecondsSinceEpoch % 100000,
      channelId: channelModel?.id ?? 1,
      channelName: channel,
      title: title.trim(),
      description: description?.trim(),
      status: status,
      itemCount: contentIds.length,
      totalDurationSeconds: 0,
    );
    mySeries = [localSeries, ...mySeries];
    notifyListeners();
    return localSeries;
  }

  Future<void> deleteCreatorSeries(int seriesId) async {
    if (creatorSeriesRepository != null) {
      await creatorSeriesRepository!.deleteSeries(seriesId);
    }
    mySeries = mySeries.where((s) => s.id != seriesId).toList();
    notifyListeners();
  }

  Future<SeriesModel?> addVideoToSeries(int seriesId, int contentId) async {
    if (creatorSeriesRepository != null) {
      final updated = await creatorSeriesRepository!.addSeriesItem(
        seriesId,
        contentId: contentId,
      );
      mySeries = mySeries
          .map((s) => s.id == seriesId ? updated : s)
          .toList();
      notifyListeners();
      return updated;
    }
    return null;
  }

  Future<CreatorAiSettingModel> saveAiSettings({
    String? geminiApiKey,
    String? elevenLabsApiKey,
    String? preferredVoiceId,
    String? voiceProvider,
  }) async {
    if (creatorStudioRepository != null) {
      final saved = await creatorStudioRepository!.saveSettings(
        geminiApiKey: geminiApiKey,
        elevenLabsApiKey: elevenLabsApiKey,
        preferredVoiceId: preferredVoiceId,
        voiceProvider: voiceProvider,
      );
      aiSettings = saved;
      notifyListeners();
      return saved;
    }
    final local = CreatorAiSettingModel(
      geminiApiKey: geminiApiKey,
      elevenLabsApiKey: elevenLabsApiKey,
      preferredVoiceId: preferredVoiceId,
      voiceProvider: voiceProvider,
    );
    aiSettings = local;
    notifyListeners();
    return local;
  }

  Future<Map<String, dynamic>> generateAiStoryboard({
    required String topic,
    int durationSec = 60,
  }) async {
    if (creatorStudioRepository != null) {
      final res = await creatorStudioRepository!.generateStoryboard({
        'topic': topic.trim(),
        'durationSec': durationSec,
      });
      if (res is Map<String, dynamic>) {
        lastStoryboard = res;
      } else {
        lastStoryboard = {'topic': topic.trim(), 'scenes': res};
      }
      notifyListeners();
      return lastStoryboard!;
    }
    lastStoryboard = {
      'topic': topic.trim(),
      'summary': 'Kịch bản phân cảnh cho chủ đề ${topic.trim()}',
      'scenes': [
        {
          'sceneNo': 1,
          'narration': 'Bối cảnh lịch sử mở đầu của ${topic.trim()}.',
          'imagePrompt': 'Vietnamese historical ink illustration',
        },
      ],
    };
    notifyListeners();
    return lastStoryboard!;
  }

  Future<Map<String, dynamic>> verifyHistoricalScript(String script) async {
    if (creatorStudioRepository != null) {
      final res = await creatorStudioRepository!.verifyScript(script.trim());
      lastVerification = res;
      notifyListeners();
      return res;
    }
    lastVerification = {
      'verified': true,
      'accuracyScore': 95,
      'feedback': 'Sử liệu đạt chuẩn đối chiếu RAG Lịch sử Việt Nam.',
      'thumbnailPrompt': 'Vietnamese historical editorial illustration 16:9',
    };
    notifyListeners();
    return lastVerification!;
  }

  Future<Map<String, dynamic>> previewAiVoice({
    required String voiceId,
    required String text,
    String? engine,
  }) async {
    if (creatorStudioRepository != null) {
      return await creatorStudioRepository!.previewVoice(
        voiceId: voiceId,
        text: text,
        engine: engine,
      );
    }
    return {
      'voiceId': voiceId,
      'audioUrl': 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
      'engine': engine ?? 'edge-tts',
      'durationSec': 5,
    };
  }

  Future<String> uploadStudioSceneImage(List<int> fileBytes, String filename) async {
    if (creatorStudioRepository != null) {
      return await creatorStudioRepository!.uploadSceneImage(fileBytes, filename);
    }
    return 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80';
  }

  Future<Map<String, dynamic>> startAiRender({
    required String title,
    required String scriptText,
    String renderMode = 'whiteboard',
    String? voiceName,
    String? ttsEngine,
    Map<String, String>? sceneImages,
    int durationSec = 60,
    int? seriesId,
  }) async {
    if (creatorStudioRepository != null) {
      final res = await creatorStudioRepository!.renderVideo({
        'title': title.trim(),
        'durationSec': durationSec,
        'renderMode': renderMode,
        'scriptText': scriptText.trim(),
        if (voiceName != null) 'voiceName': voiceName,
        if (ttsEngine != null) 'ttsEngine': ttsEngine,
        if (sceneImages != null && sceneImages.isNotEmpty) 'sceneImages': sceneImages,
        if (channelModel != null) 'channelId': channelModel!.id,
        if (seriesId != null) 'seriesId': seriesId,
        if (lastStoryboard != null) 'storyboard': lastStoryboard,
      });
      activeRenderJob = res;
      notifyListeners();
      return res;
    }
    activeRenderJob = {
      'jobId': 'job-${DateTime.now().millisecondsSinceEpoch}',
      'contentId': 501,
      'artifactId': 601,
      'status': 'PROCESSING',
      'message': 'Đã khởi chạy tiến trình dựng video.',
    };
    notifyListeners();
    return activeRenderJob!;
  }

  Future<Map<String, dynamic>> pollRenderJobStatus(
    String jobId, {
    int? artifactId,
  }) async {
    if (creatorStudioRepository != null) {
      final res = await creatorStudioRepository!.getJobStatus(
        jobId,
        artifactId: artifactId,
      );
      activeRenderJob = {...?activeRenderJob, ...res};
      try {
        final rawVideos = await creatorStudioRepository!.getVideos();
        studioVideos = rawVideos
            .whereType<Map<String, dynamic>>()
            .toList();
        if (drafts.isEmpty && studioVideos.isNotEmpty) {
          drafts = [
            for (var i = 0; i < studioVideos.length; i++)
              CreatorDraft(
                id: 'remote-content-${studioVideos[i]['contentId'] ?? i}',
                title: (studioVideos[i]['title'] ?? 'Tập lịch sử').toString(),
                script: (studioVideos[i]['summary'] ??
                        'Nội dung kịch bản tư liệu lịch sử chính thống đã biên tập trên hệ thống.')
                    .toString(),
                sources:
                    'Đại Việt Sử Ký Toàn Thư · Khâm Định Việt Sử Thông Giám Cương Mục.',
                format: 'video',
                stage: i == 0 ? DraftStage.checked : DraftStage.approved,
              ),
          ];
        }
      } catch (_) {}
      notifyListeners();
      return activeRenderJob!;
    }
    activeRenderJob = {
      ...?activeRenderJob,
      'status': 'COMPLETED',
      'progress': 100,
    };
    notifyListeners();
    return activeRenderJob!;
  }

  Future<List<Map<String, dynamic>>> fetchStudioVideos({
    String? keyword,
    String? status,
    bool? isExclusive,
    String? sortBy,
    String? sortDir,
  }) async {
    if (creatorStudioRepository != null) {
      final raw = await creatorStudioRepository!.getVideos(
        keyword: keyword,
        status: status,
        isExclusive: isExclusive,
        sortBy: sortBy,
        sortDir: sortDir,
      );
      studioVideos = raw.whereType<Map<String, dynamic>>().toList();
      notifyListeners();
      return studioVideos;
    }
    return studioVideos;
  }

  Future<Map<String, dynamic>> getStudioVideoDetail(int contentId) async {
    if (creatorStudioRepository != null) {
      return await creatorStudioRepository!.getVideoDetail(contentId);
    }
    return studioVideos.firstWhere(
      (v) => v['contentId'] == contentId,
      orElse: () => {'contentId': contentId, 'title': 'Tập video', 'status': 'PUBLISHED'},
    );
  }

  Future<Map<String, dynamic>> updateStudioVideo(
    int contentId, {
    required String title,
    String? description,
    bool? isExclusive,
  }) async {
    if (creatorStudioRepository != null) {
      final res = await creatorStudioRepository!.updateVideo(contentId, {
        'title': title.trim(),
        if (description != null) 'description': description.trim(),
        if (isExclusive != null) 'isExclusive': isExclusive,
      });
      studioVideos = studioVideos
          .map((v) => v['contentId'] == contentId ? {...v, ...res} : v)
          .toList();
      notifyListeners();
      return res;
    }
    final updated = {
      'contentId': contentId,
      'title': title,
      if (description != null) 'description': description,
      if (isExclusive != null) 'isExclusive': isExclusive,
    };
    studioVideos = studioVideos
        .map((v) => v['contentId'] == contentId ? {...v, ...updated} : v)
        .toList();
    notifyListeners();
    return updated;
  }

  Future<Map<String, dynamic>> updateStudioVideoVisibility(
    int contentId,
    bool hidden,
  ) async {
    if (creatorStudioRepository != null) {
      final res = await creatorStudioRepository!.updateVisibility(contentId, hidden);
      studioVideos = studioVideos
          .map((v) => v['contentId'] == contentId ? {...v, ...res} : v)
          .toList();
      notifyListeners();
      return res;
    }
    final updated = {
      'contentId': contentId,
      'status': hidden ? 'HIDDEN' : 'PUBLISHED',
    };
    studioVideos = studioVideos
        .map((v) => v['contentId'] == contentId ? {...v, ...updated} : v)
        .toList();
    notifyListeners();
    return updated;
  }

  Future<List<dynamic>> getStudioVideoComments(int contentId) async {
    if (creatorStudioRepository != null) {
      return await creatorStudioRepository!.getVideoComments(contentId);
    }
    return [
      {
        'id': 1,
        'userId': 101,
        'userEmail': 'thinhgia@suky.vn',
        'textBody': 'Phân tích rất chuẩn xác và hào sảng!',
        'status': 'VISIBLE',
        'createdAt': '2026-10-28T08:00:00Z',
      }
    ];
  }

  Future<Map<String, dynamic>> submitStudioVideoForPublish(
    int contentId,
  ) async {
    if (creatorStudioRepository != null) {
      final res = await creatorStudioRepository!.submitVideoForPublish(
        contentId,
      );
      studioVideos = studioVideos
          .map((v) => v['contentId'] == contentId ? {...v, ...res} : v)
          .toList();
      notifyListeners();
      return res;
    }
    final updated = {
      'contentId': contentId,
      'status': 'PUBLISHED',
      'aiShieldTierLabel': 'An toàn · Chuẩn sử liệu',
    };
    studioVideos = studioVideos
        .map((v) => v['contentId'] == contentId ? {...v, ...updated} : v)
        .toList();
    notifyListeners();
    return updated;
  }
}
