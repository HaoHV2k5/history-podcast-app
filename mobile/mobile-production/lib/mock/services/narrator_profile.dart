import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/api/freelancer_repository.dart';
import '../../core/api/kyc_repository.dart';
import '../../core/api/narrator_demo_repository.dart';
import '../../core/api/narrator_profile_repository.dart';
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

/// Separate narrator verification and profile. Supports live backend + local fallback.
class NarratorProfileState extends ChangeNotifier {
  NarratorProfileState(
    this.preferences, {
    this.narratorProfileRepository,
    this.narratorDemoRepository,
    this.freelancerRepository,
    this.kycRepository,
  }) {
    verification = CreatorState(
      preferences,
      storageKey: 'narratorVerificationV1',
      kycRepository: kycRepository,
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
    final rawFreelancer = preferences.getString('narratorFreelancerProfileV1');
    if (rawFreelancer != null) {
      try {
        final jf = jsonDecode(rawFreelancer) as Map<String, dynamic>;
        headline = jf['headline'] as String? ?? '';
        skills = jf['skills'] as String? ?? '';
        serviceTypes = jf['serviceTypes'] as String? ?? 'VOICEOVER';
        voiceDemoUrl = jf['voiceDemoUrl'] as String? ?? '';
        referencePrice = (jf['referencePrice'] as num?)?.toDouble();
        portfolioUrl = jf['portfolioUrl'] as String? ?? '';
        status = jf['status'] as String? ?? 'ACTIVE';
        if (headline.isNotEmpty && name.isEmpty) {
          name = headline;
        }
      } catch (_) {}
    }
  }
  final SharedPreferences preferences;
  final NarratorProfileRepository? narratorProfileRepository;
  final NarratorDemoRepository? narratorDemoRepository;
  final FreelancerRepository? freelancerRepository;
  final KycRepository? kycRepository;
  late final CreatorState verification;
  FreelancerProfileModel? remoteFreelancerProfile;
  NarratorProfileModel? remoteNarratorProfile;
  List<NarratorDemoModel> remoteDemos = [];
  String id = 'nar-local',
      name = '',
      bio = '',
      region = 'Bắc',
      transcript = '',
      sample = '',
      reason = '';
  String headline = '';
  String skills = '';
  String serviceTypes = 'VOICEOVER';
  String voiceDemoUrl = '';
  double? referencePrice;
  String portfolioUrl = '';
  String status = 'INACTIVE';
  NarratorReview review = NarratorReview.draft;
  bool get isLiveBackend =>
      narratorProfileRepository != null ||
      narratorDemoRepository != null ||
      freelancerRepository != null ||
      kycRepository != null;
  bool get canReceiveJobs =>
      (remoteFreelancerProfile != null &&
          remoteFreelancerProfile!.status == 'ACTIVE') ||
      (status == 'ACTIVE' &&
          preferences.getBool('isFreelancerActiveV1') == true) ||
      (verification.kyc.isApproved && review == NarratorReview.approved);
  bool get editable =>
      freelancerRepository != null ||
      [NarratorReview.draft, NarratorReview.rejected].contains(review);

  Future<void> syncFromBackend() async {
    await verification.initStudioBackend();
    if (freelancerRepository != null) {
      try {
        final f = await freelancerRepository!.getMyProfile();
        remoteFreelancerProfile = f;
        headline = f.headline;
        if ((f.bio ?? '').isNotEmpty) bio = f.bio!;
        skills = f.skills ?? '';
        serviceTypes = f.serviceTypes ?? 'VOICEOVER';
        voiceDemoUrl = f.voiceDemoUrl ?? '';
        referencePrice = f.referencePrice;
        portfolioUrl = f.portfolioUrl ?? '';
        status = f.status;
        if (name.isEmpty && (f.userFullName ?? '').isNotEmpty) {
          name = f.userFullName!;
        } else if (name.isEmpty && headline.isNotEmpty) {
          name = headline;
        }
        review = NarratorReview.approved;
        if (transcript.isEmpty && bio.isNotEmpty) {
          transcript = bio;
        }
        if (sample.isEmpty && voiceDemoUrl.isNotEmpty) {
          sample = voiceDemoUrl;
        }
      } catch (_) {}
    }
    if (narratorProfileRepository != null) {
      try {
        final profiles = await narratorProfileRepository!.getAll();
        if (profiles.isNotEmpty) {
          remoteNarratorProfile = profiles.first;
        }
      } catch (_) {}
    }
    if (narratorDemoRepository != null) {
      try {
        remoteDemos = await narratorDemoRepository!.getAll();
      } catch (_) {}
    }
    notifyListeners();
  }

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
    if (freelancerRepository != null) {
      try {
        remoteFreelancerProfile = await freelancerRepository!.becomeFreelancer(
          headline: 'Giọng đọc miền $region · ${name.trim()}',
          bio: bio.trim(),
          skills: 'Thu âm lịch sử, Kể chuyện tư liệu ($region)',
          serviceTypes: 'VOICEOVER',
          voiceDemoUrl: sample,
          referencePrice: 300000,
        );
      } catch (_) {}
    }
    if (narratorProfileRepository != null) {
      try {
        remoteNarratorProfile = await narratorProfileRepository!.create(
          userId: remoteFreelancerProfile?.userId ?? 1,
          bio: bio.trim(),
          languages: 'Tiếng Việt ($region)',
          baseRate: 300000,
        );
      } catch (_) {}
    }
    if (narratorDemoRepository != null && remoteNarratorProfile != null) {
      try {
        final demo = await narratorDemoRepository!.create(
          narratorProfileId: remoteNarratorProfile!.id,
          title: 'Demo ${name.trim()} ($region)',
          fileUrl: sample,
        );
        remoteDemos = [demo, ...remoteDemos];
      } catch (_) {}
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

  Future<void> saveFreelancerProfile({
    required String headline,
    String? bio,
    String? skills,
    String? serviceTypes,
    String? voiceDemoUrl,
    double? referencePrice,
    String? portfolioUrl,
  }) async {
    if (headline.trim().isEmpty) {
      throw StateError('Tiêu đề chuyên môn không được để trống.');
    }

    if (freelancerRepository != null) {
      if (remoteFreelancerProfile != null) {
        remoteFreelancerProfile = await freelancerRepository!.updateMyProfile(
          headline: headline.trim(),
          bio: bio?.trim(),
          skills: skills?.trim(),
          serviceTypes: serviceTypes?.trim().isNotEmpty == true
              ? serviceTypes!.trim()
              : 'VOICEOVER',
          voiceDemoUrl: voiceDemoUrl?.trim(),
          referencePrice: referencePrice,
          portfolioUrl: portfolioUrl?.trim(),
        );
      } else {
        remoteFreelancerProfile = await freelancerRepository!.becomeFreelancer(
          headline: headline.trim(),
          bio: bio?.trim(),
          skills: skills?.trim(),
          serviceTypes: serviceTypes?.trim().isNotEmpty == true
              ? serviceTypes!.trim()
              : 'VOICEOVER',
          voiceDemoUrl: voiceDemoUrl?.trim(),
          referencePrice: referencePrice,
          portfolioUrl: portfolioUrl?.trim(),
        );
      }
      status = remoteFreelancerProfile!.status;
      review = NarratorReview.approved;
      await preferences.setBool('isFreelancerActiveV1', true);
    }

    this.headline = headline.trim();
    if (bio != null) this.bio = bio.trim();
    this.skills = skills?.trim() ?? '';
    this.serviceTypes = serviceTypes?.trim().isNotEmpty == true
        ? serviceTypes!.trim()
        : 'VOICEOVER';
    this.voiceDemoUrl = voiceDemoUrl?.trim() ?? '';
    this.referencePrice = referencePrice;
    this.portfolioUrl = portfolioUrl?.trim() ?? '';
    if (this.name.isEmpty) {
      this.name = headline.trim();
    }

    await preferences.setString(
      'narratorFreelancerProfileV1',
      jsonEncode({
        'headline': this.headline,
        'bio': this.bio,
        'skills': this.skills,
        'serviceTypes': this.serviceTypes,
        'voiceDemoUrl': this.voiceDemoUrl,
        'referencePrice': this.referencePrice,
        'portfolioUrl': this.portfolioUrl,
        'status': this.status,
      }),
    );
    await _save({
      ...json,
      'name': this.name,
      'bio': this.bio,
      'transcript': this.bio.isNotEmpty ? this.bio : transcript,
      'sample': this.voiceDemoUrl.isNotEmpty ? this.voiceDemoUrl : sample,
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
