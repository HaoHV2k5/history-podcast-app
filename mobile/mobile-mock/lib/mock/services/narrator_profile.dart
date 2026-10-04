import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../creator_state.dart';

enum NarratorReview { draft, pending, approved, rejected }

extension NarratorReviewLabel on NarratorReview {
  String get label => switch (this) {
    NarratorReview.draft => 'Chưa gửi hồ sơ',
    NarratorReview.pending => 'Chờ duyệt giọng đọc',
    NarratorReview.approved => 'Hồ sơ đã duyệt thử',
    NarratorReview.rejected => 'Hồ sơ cần chỉnh sửa',
  };
}

/// Separate narrator verification and profile. All approvals are local fixtures.
class NarratorProfileState extends ChangeNotifier {
  NarratorProfileState(this.preferences) {
    verification = CreatorState(
      preferences,
      storageKey: 'narratorVerificationV1',
    );
    verification.addListener(notifyListeners);
    final raw = preferences.getString('narratorProfileV1');
    if (raw != null) {
      final j = jsonDecode(raw) as Map<String, dynamic>;
      id = j['id'] as String? ?? 'nar-local';
      name = j['name'] as String? ?? '';
      bio = j['bio'] as String? ?? '';
      region = j['region'] as String? ?? 'Bắc';
      transcript = j['transcript'] as String? ?? '';
      sample = j['sample'] as String? ?? '';
      reason = j['reason'] as String? ?? '';
      review = NarratorReview.values.byName(j['review'] as String? ?? 'draft');
    }
  }
  final SharedPreferences preferences;
  late final CreatorState verification;
  String id = 'nar-local',
      name = '',
      bio = '',
      region = 'Bắc',
      transcript = '',
      sample = '',
      reason = '';
  NarratorReview review = NarratorReview.draft;
  bool get canReceiveJobs =>
      verification.kyc.isApproved && review == NarratorReview.approved;
  bool get editable =>
      [NarratorReview.draft, NarratorReview.rejected].contains(review);

  Future<void> _save(Map<String, dynamic> j) async {
    final saved = await preferences.setString(
      'narratorProfileV1',
      jsonEncode(j),
    );
    if (!saved) throw StateError('Không lưu được hồ sơ người đọc.');
    name = j['name'];
    bio = j['bio'];
    region = j['region'];
    transcript = j['transcript'];
    sample = j['sample'];
    reason = j['reason'];
    review = NarratorReview.values.byName(j['review']);
    notifyListeners();
  }

  Map<String, dynamic> get json => {
    'id': id,
    'name': name,
    'bio': bio,
    'region': region,
    'transcript': transcript,
    'sample': sample,
    'reason': reason,
    'review': review.name,
  };

  Future<void> saveProfile({
    required String name,
    required String bio,
    required String region,
    required String transcript,
    required String sample,
  }) async {
    if (!editable) {
      throw StateError(
        'Hồ sơ đang chờ hoặc đã duyệt không được sửa trong bản thử.',
      );
    }
    if (name.trim().length < 2 ||
        bio.trim().length < 20 ||
        transcript.trim().length < 20 ||
        !['Bắc', 'Trung', 'Nam'].contains(region) ||
        !RegExp(
          r'^[^/\\]{1,100}\.(wav|mp3)$',
          caseSensitive: false,
        ).hasMatch(sample)) {
      throw StateError(
        'Điền tên, giới thiệu/trích đoạn ít nhất 20 ký tự và chọn bản demo mẫu.',
      );
    }
    await _save({
      ...json,
      'name': name.trim(),
      'bio': bio.trim(),
      'region': region,
      'transcript': transcript.trim(),
      'sample': sample,
    });
  }

  Future<void> submit() async {
    if (!verification.kyc.isApproved ||
        !editable ||
        name.trim().length < 2 ||
        bio.trim().length < 20 ||
        transcript.trim().length < 20 ||
        sample.isEmpty) {
      throw StateError('Cần KYC đã duyệt và hồ sơ giọng đọc đã lưu đầy đủ.');
    }
    await _save({...json, 'review': 'pending', 'reason': ''});
  }

  Future<void> reviewDemo(bool approved, {String reason = ''}) async {
    if (review != NarratorReview.pending || !verification.kyc.isApproved) {
      throw StateError('Chỉ duyệt hồ sơ đang chờ và có KYC hợp lệ.');
    }
    if (!approved && reason.trim().length < 5) {
      throw StateError('Cần lý do từ chối rõ ràng.');
    }
    await _save({
      ...json,
      'review': approved ? 'approved' : 'rejected',
      'reason': approved ? '' : reason.trim(),
    });
  }

  @override
  void dispose() {
    verification.removeListener(notifyListeners);
    verification.dispose();
    super.dispose();
  }
}
