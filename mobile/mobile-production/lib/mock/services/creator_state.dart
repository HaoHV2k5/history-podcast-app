import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  CreatorState(this.preferences, {this.storageKey = 'creatorStudioV1'}) {
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
  bool demoVerified = false;
  KycProfile kyc = const KycProfile();
  String channel = '';
  String channelDescription = '';
  String channelCategory = 'Lịch sử Việt Nam';
  List<CreatorDraft> drafts = [];

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
    required String idNumber,
    required String dob,
    required String phone,
    String otp = '',
    required bool idFront,
    required bool idBack,
    required bool selfie,
  }) async {
    if (fullName.trim().isEmpty) {
      throw StateError('Vui lòng nhập họ và tên thật.');
    }
    if (!RegExp(r'^\d{12}$').hasMatch(idNumber.trim())) {
      throw StateError('Số CCCD phải đủ 12 chữ số.');
    }
    if (!idFront || !idBack) {
      throw StateError('Cần cung cấp ảnh CCCD cả mặt trước và mặt sau.');
    }
    if (!selfie) {
      throw StateError('Cần xác thực khuôn mặt (liveness check).');
    }

    final birthError = validateKycBirthDate(dob);
    if (birthError != null) throw StateError(birthError);
    if (!RegExp(r'^0[35789]\d{8}$').hasMatch(phone.trim())) {
      throw StateError('Nhập số điện thoại Việt Nam hợp lệ.');
    }
    if (_otpPhone != phone.trim() || otp.trim() != '889900') {
      throw StateError('Gửi và nhập mã OTP thử nghiệm cho số điện thoại này.');
    }

    final newKyc = KycProfile(
      fullName: fullName.trim(),
      idNumber: idNumber.trim(),
      dob: dob.trim(),
      phone: phone.trim(),
      idFrontUploaded: idFront,
      idBackUploaded: idBack,
      selfiePassed: selfie,
      status: KycStatus.pending,
    );
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
    await _commit(
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
    );
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
}
