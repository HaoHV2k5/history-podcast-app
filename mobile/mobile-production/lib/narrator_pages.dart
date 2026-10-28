import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'components.dart';
import 'contract_chat_sheet.dart';
import 'core/api/chat_repository.dart';
import 'core/api/contract_repository.dart';
import 'core/api/deliverable_repository.dart';
import 'core/api/dispute_repository.dart';
import 'core/api/freelancer_repository.dart';
import 'core/api/hire_request_repository.dart';
import 'core/api/kyc_repository.dart';
import 'core/api/milestone_repository.dart';
import 'core/api/narrator_demo_repository.dart';
import 'core/api/narrator_profile_repository.dart';
import 'creator_state.dart';
import 'design.dart';
import 'narrator_profile.dart';
import 'narrator_state.dart';
import 'contract_terms.dart';
import 'contract_pdf.dart';
import 'local_file.dart';
import 'audio_playback.dart';
import 'studio_pages.dart';
import 'workspace_components.dart';

const narratorDemoNote =
    'Bản thử trên thiết bị · Có thể nghe file vừa chọn trong phiên này. KYC, hồ sơ và bàn giao chỉ lưu metadata; chưa upload, chữ ký pháp lý hoặc chuyển tiền.';

class NarratorHome extends StatefulWidget {
  const NarratorHome({
    super.key,
    required this.preferences,
    this.contractRepository,
    this.hireRequestRepository,
    this.milestoneRepository,
    this.deliverableRepository,
    this.disputeRepository,
    this.chatRepository,
    this.narratorProfileRepository,
    this.narratorDemoRepository,
    this.freelancerRepository,
    this.kycRepository,
  });
  final SharedPreferences preferences;
  final ContractRepository? contractRepository;
  final HireRequestRepository? hireRequestRepository;
  final MilestoneRepository? milestoneRepository;
  final DeliverableRepository? deliverableRepository;
  final DisputeRepository? disputeRepository;
  final ChatRepository? chatRepository;
  final NarratorProfileRepository? narratorProfileRepository;
  final NarratorDemoRepository? narratorDemoRepository;
  final FreelancerRepository? freelancerRepository;
  final KycRepository? kycRepository;
  @override
  State<NarratorHome> createState() => _NarratorHomeState();
}

class _NarratorHomeState extends State<NarratorHome> {
  late final profile = NarratorProfileState(
    widget.preferences,
    narratorProfileRepository: widget.narratorProfileRepository,
    narratorDemoRepository: widget.narratorDemoRepository,
    freelancerRepository: widget.freelancerRepository,
    kycRepository: widget.kycRepository,
  );
  late final creator = CreatorState(
    widget.preferences,
    kycRepository: widget.kycRepository,
    contractRepository: widget.contractRepository,
    hireRequestRepository: widget.hireRequestRepository,
    milestoneRepository: widget.milestoneRepository,
    deliverableRepository: widget.deliverableRepository,
    disputeRepository: widget.disputeRepository,
    chatRepository: widget.chatRepository,
    narratorProfileRepository: widget.narratorProfileRepository,
    narratorDemoRepository: widget.narratorDemoRepository,
    freelancerRepository: widget.freelancerRepository,
  );
  late final jobs = NarratorState(creator);
  String filter = 'Lời mời';
  bool busy = false;
  String? error;

  @override
  void initState() {
    super.initState();
    if (widget.narratorProfileRepository != null ||
        widget.freelancerRepository != null ||
        widget.kycRepository != null) {
      profile.syncFromBackend();
    }
    if (jobs.isLiveBackend) {
      jobs.syncMarketplaceBackend();
    }
  }
  @override
  void dispose() {
    jobs.dispose();
    creator.dispose();
    profile.dispose();
    super.dispose();
  }

  Future<void> run(Future<void> Function() action) async {
    if (busy) return;
    setState(() => busy = true);
    try {
      await action();
      if (mounted) setState(() => error = null);
    } catch (e) {
      if (mounted) {
        setState(
          () => error = e is StateError
              ? e.message
              : 'Không lưu được. Vui lòng thử lại.',
        );
      }
    }
    if (mounted) setState(() => busy = false);
  }

  Future<void> kyc() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      useSafeArea: true,
      builder: (ctx) => KycSheet(
        state: profile.verification,
        title: 'Xác thực KYC người đọc',
        onSubmitted: () => Navigator.pop(ctx),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([profile, jobs]),
    builder: (context, _) {
      final own = jobs.orders
          .where(
            (o) =>
                o.narratorId == profile.id ||
                jobs.remoteContracts.any((rc) => 'HD-${rc.id}' == o.id),
          )
          .toList();
      final selected = own
          .where(
            (o) => switch (filter) {
              'Lời mời' => [
                ContractStatus.invited,
                ContractStatus.negotiating,
                ContractStatus.pendingSign,
              ].contains(o.status),
              'Đang làm' => [
                ContractStatus.inProduction,
                ContractStatus.delivered,
                ContractStatus.disputed,
              ].contains(o.status),
              _ => [
                ContractStatus.completed,
                ContractStatus.rejected,
                ContractStatus.cancelled,
                ContractStatus.refunded,
              ].contains(o.status),
            },
          )
          .toList();
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'Không gian người đọc',
            style: TextStyle(fontSize: 14),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          children: [
            const Eyebrow('GIỌNG KỂ / NARRATOR'),
            const SizedBox(height: 12),
            Text(
              profile.headline.isNotEmpty
                  ? profile.headline
                  : (profile.name.isEmpty
                      ? 'Để câu chuyện có một giọng kể.'
                      : profile.name),
              style: editorial(31),
            ),
            const SizedBox(height: 14),
            Text(
              profile.canReceiveJobs
                  ? (profile.serviceTypes.isNotEmpty
                      ? '${profile.serviceTypes} · Hồ sơ Freelancer đang hoạt động.'
                      : 'Hồ sơ Freelancer đang hoạt động · Sẵn sàng nhận việc.')
                  : 'Đăng ký hồ sơ Freelancer để bắt đầu nhận lời mời và ứng tuyển.',
              style: const TextStyle(color: Palette.muted, height: 1.7),
            ),
            const SizedBox(height: 24),
            if (profile.canReceiveJobs) ...[
              Card(
                margin: const EdgeInsets.only(bottom: 16),
                color: Palette.paper,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Palette.line),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2E7D32).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'FREELANCER · HOẠT ĐỘNG',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF2E7D32),
                              ),
                            ),
                          ),
                          TextButton.icon(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute<void>(
                                builder: (_) =>
                                    NarratorProfilePage(state: profile),
                              ),
                            ),
                            icon: const Icon(CupertinoIcons.pencil, size: 13),
                            label: const Text(
                              'Cập nhật hồ sơ',
                              style: TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        profile.headline.isNotEmpty
                            ? profile.headline
                            : (profile.name.isNotEmpty
                                ? profile.name
                                : 'Chưa đặt tiêu đề chuyên môn'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (profile.bio.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          profile.bio,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Palette.muted,
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 12,
                        runSpacing: 6,
                        children: [
                          if (profile.referencePrice != null &&
                              profile.referencePrice! > 0)
                            Text(
                              'Giá tham khảo: ${profile.referencePrice!.toInt()}đ/tập',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Palette.red,
                              ),
                            ),
                          if (profile.serviceTypes.isNotEmpty)
                            Text(
                              'Dịch vụ: ${profile.serviceTypes}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Palette.muted,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              ListTile(
                key: const Key('narrator-account'),
                contentPadding: EdgeInsets.zero,
                leading: const Icon(
                  CupertinoIcons.person_crop_circle,
                  size: 24,
                ),
                title: const Text(
                  'Hồ sơ giọng đọc',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                ),
                subtitle: const Text(
                  'Đã kích hoạt Freelancer · Xem hồ sơ & tài khoản',
                  style: TextStyle(fontSize: 12),
                ),
                trailing: const Icon(CupertinoIcons.chevron_right, size: 16),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => NarratorAccountPage(profile: profile),
                  ),
                ),
              ),
            ] else
              _NarratorSetup(profile: profile, busy: busy, kyc: kyc, run: run),
            if (error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Semantics(
                  liveRegion: true,
                  child: Text(
                    error!,
                    style: const TextStyle(color: Palette.red),
                  ),
                ),
              ),
            const SizedBox(height: 28),
            Text('Công việc của bạn', style: editorial(24)),
            const SizedBox(height: 16),
            if (!profile.canReceiveJobs) ...[
              const Text(
                'Kích hoạt hồ sơ Freelancer để nhận việc và ứng tuyển.',
                style: TextStyle(color: Palette.muted, height: 1.7),
              ),
            ] else ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final f in ['Lời mời', 'Đang làm', 'Lịch sử'])
                    ChoiceChip(
                      label: Text(f),
                      selected: filter == f,
                      showCheckmark: false,
                      selectedColor: Palette.soft,
                      backgroundColor: Palette.paper,
                      onSelected: (_) => setState(() => filter = f),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              if (selected.isEmpty)
                EmptyMessage(
                  title: 'Chưa có ${filter.toLowerCase()}',
                  message: 'Công việc thuộc hồ sơ này sẽ xuất hiện tại đây.',
                  action: 'Xem hồ sơ',
                  onAction: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => NarratorProfilePage(state: profile),
                    ),
                  ),
                ),
              for (final o in selected) ...[
                const Divider(),
                WorkListItem(
                  key: ValueKey('narrator-job-${o.id}'),
                  title: o.draftTitle,
                  icon: CupertinoIcons.mic,
                  meta: '${o.channelName} · ${o.feeProposal}',
                  status: o.status.label,
                  needsAttention: [
                    ContractStatus.invited,
                    ContractStatus.pendingSign,
                    ContractStatus.disputed,
                  ].contains(o.status),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => NarratorJobPage(
                        profile: profile,
                        jobs: jobs,
                        creator: creator,
                        id: o.id,
                      ),
                    ),
                  ),
                ),
              ],
            ],
            if (!jobs.isLiveBackend && !profile.isLiveBackend) ...[
              const SizedBox(height: 28),
              const Text(
                'Bản thử · Công việc và hồ sơ lưu trên thiết bị.',
                style: TextStyle(fontSize: 11, color: Palette.muted),
              ),
              _NarratorReviewTools(profile: profile, busy: busy, run: run),
            ],
          ],
        ),
      );
    },
  );
}

class _NarratorSetup extends StatelessWidget {
  const _NarratorSetup({
    required this.profile,
    required this.busy,
    required this.kyc,
    required this.run,
  });
  final NarratorProfileState profile;
  final bool busy;
  final VoidCallback kyc;
  final Future<void> Function(Future<void> Function()) run;
  @override
  Widget build(BuildContext context) {
    if (profile.isLiveBackend) {
      return Material(
        color: Palette.soft,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Palette.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      CupertinoIcons.briefcase,
                      color: Palette.red,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Đăng ký hồ sơ Freelancer', style: editorial(20)),
                        const SizedBox(height: 2),
                        const Text(
                          'Kích hoạt vai trò Freelancer để nhận việc',
                          style: TextStyle(fontSize: 12, color: Palette.muted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const Text(
                'Thiết lập tiêu đề chuyên môn, kỹ năng, mức giá tham khảo và liên kết portfolio để bắt đầu nhận lời mời từ Nhà sáng tạo và ứng tuyển các bài đăng Booking.',
                style: TextStyle(fontSize: 13, color: Palette.muted, height: 1.5),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  key: const Key('narrator-onboard-btn'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Palette.red,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: busy
                      ? null
                      : () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) =>
                                  NarratorProfilePage(state: profile),
                            ),
                          ),
                  icon: const Icon(CupertinoIcons.person_badge_plus, size: 18),
                  label: const Text(
                    'Đăng ký trở thành Freelancer',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final status = profile.verification.kyc.status;
    return Material(
      color: Palette.soft,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('01 / Xác thực danh tính', style: editorial(21)),
            const SizedBox(height: 8),
            Text(switch (status) {
              KycStatus.notSubmitted => 'Chưa gửi KYC người đọc',
              KycStatus.pending => 'KYC đang chờ duyệt thử',
              KycStatus.approved => 'KYC người đọc đã duyệt thử',
              KycStatus.rejected => profile.verification.kyc.rejectionReason,
            }, style: const TextStyle(color: Palette.muted)),
            if ([KycStatus.notSubmitted, KycStatus.rejected].contains(status))
              TextButton(
                onPressed: busy ? null : kyc,
                child: const Text('Điền KYC người đọc'),
              ),
            const SizedBox(height: 18),
            const Divider(),
            const SizedBox(height: 18),
            Text('02 / Hồ sơ và demo giọng', style: editorial(21)),
            const SizedBox(height: 8),
            Text(
              profile.review.label,
              style: const TextStyle(color: Palette.muted),
            ),
            if (profile.reason.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  profile.reason,
                  style: const TextStyle(color: Palette.red),
                ),
              ),
            TextButton(
              onPressed: busy
                  ? null
                  : () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => NarratorProfilePage(state: profile),
                      ),
                    ),
              child: Text(
                profile.editable
                    ? 'Soạn hồ sơ giọng đọc'
                    : 'Xem hồ sơ giọng đọc',
              ),
            ),
            if (profile.editable)
              OutlinedButton(
                onPressed: busy ? null : () => run(profile.submit),
                child: const Text('Gửi hồ sơ giọng đọc'),
              ),
          ],
        ),
      ),
    );
  }
}

class _NarratorReviewTools extends StatelessWidget {
  const _NarratorReviewTools({
    required this.profile,
    required this.busy,
    required this.run,
  });
  final NarratorProfileState profile;
  final bool busy;
  final Future<void> Function(Future<void> Function()) run;
  @override
  Widget build(BuildContext context) {
    final status = profile.verification.kyc.status;
    if (status != KycStatus.pending &&
        profile.review != NarratorReview.pending) {
      return const SizedBox.shrink();
    }
    return ExpansionTile(
      tilePadding: EdgeInsets.zero,
      title: const Text('Điều khiển bản thử', style: TextStyle(fontSize: 13)),
      children: [
        if (status == KycStatus.pending)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              TextButton(
                onPressed: busy
                    ? null
                    : () => run(
                        () => profile.verification.simulateKycDecision(true),
                      ),
                child: const Text('Thử duyệt KYC người đọc'),
              ),
              TextButton(
                onPressed: busy
                    ? null
                    : () => run(
                        () => profile.verification.simulateKycDecision(
                          false,
                          reason: 'Ảnh giấy tờ mẫu cần chụp lại rõ nét.',
                        ),
                      ),
                child: const Text('Thử từ chối KYC người đọc'),
              ),
            ],
          ),
        if (profile.review == NarratorReview.pending)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              TextButton(
                onPressed: busy
                    ? null
                    : () => run(() => profile.reviewDemo(true)),
                child: const Text('Thử duyệt hồ sơ giọng đọc'),
              ),
              TextButton(
                onPressed: busy
                    ? null
                    : () => run(
                        () => profile.reviewDemo(
                          false,
                          reason: 'Bổ sung trích đoạn đọc rõ tên nhân vật và niên đại.',
                        ),
                      ),
                child: const Text('Thử yêu cầu sửa demo giọng'),
              ),
            ],
          ),
      ],
    );
  }
}

class NarratorAccountPage extends StatefulWidget {
  const NarratorAccountPage({super.key, required this.profile});
  final NarratorProfileState profile;
  @override
  State<NarratorAccountPage> createState() => _NarratorAccountPageState();
}

class _NarratorAccountPageState extends State<NarratorAccountPage> {
  bool busy = false;
  String? error;
  Future<void> run(Future<void> Function() action) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    String? failure;
    try {
      await action();
    } catch (e) {
      failure = e is StateError ? e.message : 'Không lưu được. Hãy thử lại.';
    }
    if (mounted) {
      setState(() {
        busy = false;
        error = failure;
      });
    }
  }

  Future<void> kyc() => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    isDismissible: false,
    enableDrag: false,
    useSafeArea: true,
    builder: (ctx) => KycSheet(
      state: widget.profile.verification,
      title: 'Xác thực KYC người đọc',
      onSubmitted: () => Navigator.pop(ctx),
    ),
  );
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.profile,
    builder: (context, _) => Scaffold(
      appBar: AppBar(title: const Text('Hồ sơ Freelancer & Giọng đọc')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        children: [
          if (widget.profile.isLiveBackend) ...[
            Material(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2E7D32).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'FREELANCER · HOẠT ĐỘNG',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF2E7D32),
                            ),
                          ),
                        ),
                        FilledButton.icon(
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) =>
                                  NarratorProfilePage(state: widget.profile),
                            ),
                          ),
                          icon: const Icon(CupertinoIcons.pencil, size: 14),
                          label: const Text('Cập nhật', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      widget.profile.headline.isNotEmpty
                          ? widget.profile.headline
                          : (widget.profile.name.isNotEmpty
                              ? widget.profile.name
                              : 'Chưa đặt tiêu đề chuyên môn'),
                      style: editorial(22),
                    ),
                    if (widget.profile.bio.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        widget.profile.bio,
                        style: const TextStyle(fontSize: 14, height: 1.6),
                      ),
                    ],
                    const Divider(height: 28),
                    if (widget.profile.skills.isNotEmpty) ...[
                      const Text(
                        'Kỹ năng chuyên môn:',
                        style: TextStyle(fontSize: 12, color: Palette.muted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.profile.skills,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (widget.profile.serviceTypes.isNotEmpty) ...[
                      const Text(
                        'Loại dịch vụ:',
                        style: TextStyle(fontSize: 12, color: Palette.muted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.profile.serviceTypes,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (widget.profile.referencePrice != null &&
                        widget.profile.referencePrice! > 0) ...[
                      const Text(
                        'Mức giá tham khảo:',
                        style: TextStyle(fontSize: 12, color: Palette.muted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${widget.profile.referencePrice!.toInt()} VNĐ / tập',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Palette.red,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (widget.profile.voiceDemoUrl.isNotEmpty) ...[
                      const Text(
                        'Voice Demo URL / File:',
                        style: TextStyle(fontSize: 12, color: Palette.muted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.profile.voiceDemoUrl,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Palette.muted,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (widget.profile.portfolioUrl.isNotEmpty) ...[
                      const Text(
                        'Portfolio URL:',
                        style: TextStyle(fontSize: 12, color: Palette.muted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.profile.portfolioUrl,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Palette.muted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ] else ...[
            _NarratorSetup(
              profile: widget.profile,
              busy: busy,
              kyc: kyc,
              run: run,
            ),
            const SizedBox(height: 24),
            _NarratorReviewTools(profile: widget.profile, busy: busy, run: run),
            const SizedBox(height: 16),
            const Text(
              narratorDemoNote,
              style: TextStyle(fontSize: 12, color: Palette.muted),
            ),
          ],
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Semantics(
                liveRegion: true,
                child: Text(error!, style: const TextStyle(color: Palette.red)),
              ),
            ),
        ],
      ),
    ),
  );
}

class NarratorProfilePage extends StatefulWidget {
  const NarratorProfilePage({super.key, required this.state});
  final NarratorProfileState state;
  @override
  State<NarratorProfilePage> createState() => _NarratorProfilePageState();
}

class _NarratorProfilePageState extends State<NarratorProfilePage> {
  final form = GlobalKey<FormState>();
  late final headline = TextEditingController(
    text: widget.state.headline.isNotEmpty
        ? widget.state.headline
        : (widget.state.name.isNotEmpty ? widget.state.name : ''),
  );
  late final bio = TextEditingController(text: widget.state.bio);
  late final skills = TextEditingController(text: widget.state.skills);
  late final serviceTypes = TextEditingController(
    text: widget.state.serviceTypes.isNotEmpty
        ? widget.state.serviceTypes
        : 'VOICEOVER',
  );
  late final referencePrice = TextEditingController(
    text: widget.state.referencePrice != null &&
            widget.state.referencePrice! > 0
        ? widget.state.referencePrice!.toInt().toString()
        : '',
  );
  late final voiceDemoUrl = TextEditingController(
    text: widget.state.voiceDemoUrl.isNotEmpty
        ? widget.state.voiceDemoUrl
        : widget.state.sample,
  );
  late final portfolioUrl = TextEditingController(
    text: widget.state.portfolioUrl,
  );
  LocalAudioFile? preview;
  bool dirty = false, busy = false;
  String? error;

  @override
  void dispose() {
    headline.dispose();
    bio.dispose();
    skills.dispose();
    serviceTypes.dispose();
    referencePrice.dispose();
    voiceDemoUrl.dispose();
    portfolioUrl.dispose();
    super.dispose();
  }

  Future<void> save() async {
    if (!form.currentState!.validate()) return;
    setState(() => busy = true);
    try {
      final price = double.tryParse(
        referencePrice.text.replaceAll(RegExp(r'[^0-9.]'), ''),
      );
      await widget.state.saveFreelancerProfile(
        headline: headline.text,
        bio: bio.text,
        skills: skills.text,
        serviceTypes: serviceTypes.text,
        voiceDemoUrl: voiceDemoUrl.text,
        referencePrice: price,
        portfolioUrl: portfolioUrl.text,
      );
      if (mounted) {
        setState(() {
          dirty = false;
          busy = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hồ sơ Freelancer đã được lưu thành công!'),
          ),
        );
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) Navigator.pop(context);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => error = e is StateError ? e.message : 'Không lưu được hồ sơ.',
        );
      }
    }
    if (mounted) setState(() => busy = false);
  }

  Future<void> discard() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Bỏ thay đổi hồ sơ?'),
        content: const Text('Những nội dung chưa lưu sẽ bị bỏ.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Tiếp tục sửa'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Bỏ thay đổi'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      setState(() => dirty = false);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.pop(context);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final editable = widget.state.editable;
    return PopScope(
      canPop: !dirty && !busy,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && !busy) discard();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Hồ sơ Freelancer & Giọng đọc',
            style: TextStyle(fontSize: 14),
          ),
        ),
        body: Form(
          key: form,
          onChanged: () => setState(() => dirty = true),
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text('Hồ sơ chuyên môn & Năng lực', style: editorial(28)),
              const SizedBox(height: 10),
              const Text(
                'Thiết lập thông tin hiển thị công khai để nhận lời mời diễn đọc và ứng tuyển vào các bài đăng booking.',
                style: TextStyle(color: Palette.muted, height: 1.6),
              ),
              const SizedBox(height: 24),

              // 1. Headline (Bắt buộc)
              TextFormField(
                controller: headline,
                readOnly: !editable,
                maxLength: 255,
                decoration: const InputDecoration(
                  labelText: 'Tiêu đề chuyên môn (Headline) *',
                  hintText: 'VD: Nghệ sĩ diễn đọc lịch sử · Giọng kể truyền cảm',
                ),
                validator: (v) => (v?.trim().length ?? 0) < 2
                    ? 'Nhập ít nhất 2 ký tự cho tiêu đề chuyên môn.'
                    : null,
              ),
              const SizedBox(height: 16),

              // 2. Bio
              TextFormField(
                controller: bio,
                readOnly: !editable,
                minLines: 3,
                maxLines: 6,
                maxLength: 2000,
                decoration: const InputDecoration(
                  labelText: 'Giới thiệu bản thân & phong cách kể (Bio)',
                  hintText: 'Kinh nghiệm thu âm, các dự án lịch sử từng thực hiện...',
                ),
                validator: (v) =>
                    (v != null && v.isNotEmpty && v.trim().length < 5)
                        ? 'Giới thiệu ít nhất 5 ký tự nếu có.'
                        : null,
              ),
              const SizedBox(height: 16),

              // 3. Skills
              TextFormField(
                controller: skills,
                readOnly: !editable,
                maxLength: 500,
                decoration: const InputDecoration(
                  labelText: 'Kỹ năng chuyên môn (Skills)',
                  hintText: 'VD: Diễn đọc truyền cảm, Lồng tiếng nhân vật, Thu âm podcast',
                ),
              ),
              const SizedBox(height: 16),

              // 4. Service Types
              TextFormField(
                controller: serviceTypes,
                readOnly: !editable,
                maxLength: 100,
                decoration: const InputDecoration(
                  labelText: 'Loại dịch vụ (Service Types)',
                  hintText: 'VOICEOVER',
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final st in [
                    'VOICEOVER',
                    'AUDIO_EDITING',
                    'PODCAST_HOST',
                    'SCRIPT_WRITING',
                  ])
                    ActionChip(
                      label: Text(st, style: const TextStyle(fontSize: 11)),
                      onPressed: editable
                          ? () {
                              serviceTypes.text = st;
                              setState(() => dirty = true);
                            }
                          : null,
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // 5. Reference Price
              TextFormField(
                controller: referencePrice,
                readOnly: !editable,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Mức giá tham khảo (VNĐ/tập)',
                  hintText: 'VD: 300000',
                  suffixText: 'VNĐ',
                ),
              ),
              const SizedBox(height: 16),

              // 6. Voice Demo URL
              TextFormField(
                controller: voiceDemoUrl,
                readOnly: !editable,
                maxLength: 1000,
                decoration: const InputDecoration(
                  labelText: 'Đường dẫn Voice Demo (URL / File audio)',
                  hintText: 'https://... hoặc tên file audio demo',
                ),
              ),
              const SizedBox(height: 8),
              if (editable)
                OutlinedButton.icon(
                  onPressed: busy
                      ? null
                      : () async {
                          try {
                            final picked = await pickLocalAudio();
                            if (picked != null && mounted) {
                              setState(() {
                                voiceDemoUrl.text = picked.name;
                                preview = picked;
                                dirty = true;
                              });
                            }
                          } on StateError catch (e) {
                            if (mounted) setState(() => error = e.message);
                          } catch (_) {
                            if (mounted) {
                              setState(
                                () =>
                                    error = 'Chưa chọn được file. Hãy thử lại.',
                              );
                            }
                          }
                        },
                  icon: const Icon(CupertinoIcons.waveform, size: 16),
                  label: const Text('Chọn file demo từ máy & nghe thử'),
                ),
              if (preview != null)
                LocalAudioPreview(bytes: preview!.bytes, name: preview!.name),
              const SizedBox(height: 16),

              // 7. Portfolio URL
              TextFormField(
                controller: portfolioUrl,
                readOnly: !editable,
                maxLength: 1000,
                decoration: const InputDecoration(
                  labelText: 'Đường dẫn Portfolio / Sản phẩm mẫu',
                  hintText: 'VD: https://youtube.com/@channel hoặc liên kết drive',
                ),
              ),
              if (error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    error!,
                    style: const TextStyle(color: Palette.red),
                  ),
                ),
              const SizedBox(height: 24),
              if (editable)
                FilledButton(
                  onPressed: busy ? null : save,
                  child: Text(busy ? 'Đang lưu…' : 'Lưu hồ sơ giọng đọc'),
                )
              else
                Text(
                  widget.state.review.label,
                  style: const TextStyle(color: Palette.red),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

String jobDeadline(String value) {
  final date = DateTime.tryParse(value);
  if (date == null) return 'Chưa có ngày hợp lệ';
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}

class NarratorJobPage extends StatefulWidget {
  const NarratorJobPage({
    super.key,
    required this.profile,
    required this.jobs,
    required this.creator,
    required this.id,
  });
  final NarratorProfileState profile;
  final NarratorState jobs;
  final CreatorState creator;
  final String id;
  @override
  State<NarratorJobPage> createState() => _NarratorJobPageState();
}

class _NarratorJobPageState extends State<NarratorJobPage> {
  final file = TextEditingController();
  bool busy = false;
  LocalAudioFile? preview;
  String? error;
  @override
  void dispose() {
    file.dispose();
    super.dispose();
  }

  Future<void> act(String action, {String value = ''}) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      if (action == 'cancel' || action == 'reject') {
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(
              action == 'cancel' ? 'Hủy công việc?' : 'Từ chối lời mời?',
            ),
            content: const Text(
              'Công việc sẽ chuyển sang lịch sử. Bạn không thể tiếp tục thu âm từ lời mời này.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Giữ công việc'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(
                  action == 'cancel' ? 'Xác nhận hủy' : 'Xác nhận từ chối',
                ),
              ),
            ],
          ),
        );
        if (confirmed != true || !mounted) return;
      }
      if (action == 'narratorSign') {
        final otp = await showDemoSigning(
          context,
          widget.jobs.order(widget.id),
          'Narrator',
        );
        if (otp == null || !mounted) return;
        value = otp;
      }
      if (action == 'deliver' && value.trim().isEmpty) {
        throw StateError(
          'Chọn bản thu, hoặc nhập tên file trong mục thử bàn giao.',
        );
      }
      await widget.jobs.actAsNarrator(
        widget.id,
        action,
        widget.profile,
        value: value,
      );
      if (action == 'deliver') {
        SessionAudioFiles.deliver(
          widget.id,
          preview?.name == value.trim() ? preview : null,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(
          () =>
              error = e is StateError ? e.message : 'Không lưu được thao tác.',
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> requestValue(String action) async {
    if (busy) return;
    final controller = TextEditingController();
    final form = GlobalKey<FormState>();
    bool saving = false;
    String? message;
    await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, update) => PopScope(
          canPop: !saving,
          child: AlertDialog(
            title: Text(
              action == 'counter' ? 'Đề xuất thù lao' : 'Yêu cầu phân xử',
            ),
            content: SingleChildScrollView(
              child: Form(
                key: form,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      key: const Key('job-request-value'),
                      controller: controller,
                      enabled: !saving,
                      minLines: action == 'counter' ? 1 : 3,
                      maxLines: 5,
                      maxLength: 1000,
                      decoration: InputDecoration(
                        labelText: action == 'counter'
                            ? 'Thù lao đề xuất'
                            : 'Lý do cần phân xử',
                        hintText: action == 'counter'
                            ? 'Ví dụ: 350.000đ / tập'
                            : 'Ghi rõ vấn đề cần hai bên đối chiếu.',
                      ),
                      validator: (v) =>
                          (v ?? '').trim().length <
                              (action == 'counter' ? 1 : 5)
                          ? action == 'counter'
                                ? 'Nhập đề xuất của bạn.'
                                : 'Ghi ít nhất 5 ký tự.'
                          : null,
                    ),
                    if (message != null)
                      Semantics(
                        liveRegion: true,
                        child: Text(
                          message!,
                          style: const TextStyle(color: Palette.red),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: saving ? null : () => Navigator.pop(ctx, false),
                child: const Text('Hủy'),
              ),
              FilledButton(
                onPressed: saving
                    ? null
                    : () async {
                        if (!form.currentState!.validate()) return;
                        update(() {
                          saving = true;
                          message = null;
                        });
                        try {
                          await widget.jobs.actAsNarrator(
                            widget.id,
                            action,
                            widget.profile,
                            value: controller.text,
                          );
                          if (ctx.mounted) Navigator.pop(ctx, true);
                        } catch (e) {
                          if (ctx.mounted) {
                            update(() {
                              saving = false;
                              message = e is StateError
                                  ? e.message
                                  : 'Chưa lưu được. Hãy thử lại.';
                            });
                          }
                        }
                      },
                child: Text(saving ? 'Đang gửi…' : 'Gửi yêu cầu mẫu'),
              ),
            ],
          ),
        ),
      ),
    );
    await Future<void>.delayed(const Duration(milliseconds: 250));
    controller.dispose();
  }

  Future<void> chooseAudio() async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final picked = await pickLocalAudio();
      if (picked != null && mounted) {
        setState(() {
          file.text = picked.name;
          preview = picked;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => error = e is StateError ? e.message : 'Chưa chọn được file.',
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.jobs,
    builder: (context, _) {
      final o = widget.jobs.order(widget.id),
          drafts = widget.creator.drafts
              .where((d) => d.id == o.draftId)
              .toList();
      final d = drafts.isEmpty ? null : drafts.first;
      final awaiting = [
        ContractStatus.invited,
        ContractStatus.negotiating,
      ].contains(o.status);
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'Chi tiết công việc',
            style: TextStyle(fontSize: 14),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Eyebrow(o.status.label.toUpperCase()),
            const SizedBox(height: 12),
            Text(o.draftTitle, style: editorial(29)),
            const SizedBox(height: 16),
            Text(o.channelName, style: const TextStyle(color: Palette.muted)),
            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 20),
            Text('Thù lao đề xuất: ${o.feeProposal}'),
            const SizedBox(height: 10),
            Text('Hạn bàn giao: ${jobDeadline(o.deadline)}'),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              key: const Key('narrator-open-chat-btn'),
              onPressed: busy
                  ? null
                  : () => showModalBottomSheet<void>(
                        context: context,
                        isScrollControlled: true,
                        showDragHandle: true,
                        backgroundColor: Palette.paper,
                        builder: (_) => ContractChatSheet(
                          contracts: widget.jobs,
                          order: o,
                          senderName: widget.profile.name.isEmpty
                              ? o.narratorName
                              : widget.profile.name,
                          senderRole: 'NARRATOR',
                        ),
                      ),
              icon: const Icon(CupertinoIcons.chat_bubble_2, size: 16),
              label: const Text('Trao đổi với Người sáng tạo'),
            ),
            const SizedBox(height: 16),
            if (o.notes.isNotEmpty)
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: const Text('Yêu cầu từ người kể'),
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(o.notes, style: const TextStyle(height: 1.7)),
                  ),
                ],
              ),
            if (d != null)
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: const Text('Kịch bản và nguồn tham khảo'),
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      '${d.script}\n\nNguồn: ${d.sources}',
                      style: const TextStyle(height: 1.8),
                    ),
                  ),
                ],
              ),
            if (o.revisionNotes.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'Yêu cầu sửa: ${o.revisionNotes}',
                  style: const TextStyle(color: Palette.red),
                ),
              ),
            const SizedBox(height: 22),
            if (awaiting) ...[
              FilledButton(
                onPressed: busy ? null : () => act('accept'),
                child: Text(
                  widget.jobs.isLiveBackend
                      ? 'Chấp nhận lời mời'
                      : 'Chấp nhận lời mời mẫu',
                ),
              ),
              const SizedBox(height: 12),
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: const Text('Thương lượng hoặc từ chối'),
                children: [
                  OutlinedButton(
                    onPressed: busy ? null : () => requestValue('counter'),
                    child: const Text('Đề xuất thù lao khác'),
                  ),
                  TextButton(
                    onPressed: busy ? null : () => act('reject'),
                    child: Text(
                      widget.jobs.isLiveBackend
                          ? 'Từ chối lời mời'
                          : 'Từ chối lời mời mẫu',
                    ),
                  ),
                ],
              ),
            ],
            if (o.status == ContractStatus.pendingSign)
              if (o.creatorSigned)
                FilledButton(
                  onPressed: busy ? null : () => act('narratorSign'),
                  child: Text(
                    widget.jobs.isLiveBackend
                        ? 'Người đọc: ký xác nhận'
                        : 'Người đọc: xác nhận mẫu',
                  ),
                )
              else
                const Text(
                  'Chờ người sáng tạo xác nhận thỏa thuận. Chưa được bắt đầu thu âm.',
                  style: TextStyle(color: Palette.muted, height: 1.7),
                ),
            if (o.status == ContractStatus.inProduction) ...[
              if (preview == null)
                FilledButton(
                  onPressed: busy ? null : chooseAudio,
                  child: const Text('Chọn bản thu và nghe thử'),
                )
              else
                OutlinedButton(
                  onPressed: busy ? null : chooseAudio,
                  child: const Text('Chọn bản thu và nghe thử'),
                ),
              if (preview != null) ...[
                const SizedBox(height: 12),
                Text(
                  preview!.name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (!widget.jobs.isLiveBackend)
                  const Text(
                    'File chỉ được nghe trên thiết bị trong phiên này, chưa upload.',
                    style: TextStyle(color: Palette.muted, fontSize: 12),
                  ),
                FilledButton(
                  onPressed: busy
                      ? null
                      : () => act('deliver', value: preview!.name),
                  child: Text(
                    widget.jobs.isLiveBackend
                        ? 'Bàn giao bản thu'
                        : 'Bàn giao bản thu mẫu',
                  ),
                ),
              ],
              if (!widget.jobs.isLiveBackend)
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  title: const Text('Thử bàn giao bằng tên file'),
                  children: [
                    const Text(
                      'Chỉ thử trạng thái công việc, không có bản thu để nghe.',
                    ),
                    TextField(
                      controller: file,
                      enabled: !busy,
                      decoration: const InputDecoration(
                        labelText: 'Tên file bàn giao mẫu',
                        hintText: 'ban-thu.wav',
                      ),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: busy
                          ? null
                          : () => act('deliver', value: file.text),
                      child: const Text('Bàn giao tên file mẫu'),
                    ),
                  ],
                ),
            ],
            if (preview != null)
              LocalAudioPreview(bytes: preview!.bytes, name: preview!.name),
            if (o.status == ContractStatus.delivered)
              Text(
                widget.jobs.isLiveBackend
                    ? '${o.deliveredAudioName}\nĐã bàn giao bản thu. Chờ người sáng tạo nghiệm thu hoặc yêu cầu chỉnh sửa.'
                    : '${o.deliveredAudioName}\nĐã bàn giao mẫu. Chờ người sáng tạo nghiệm thu hoặc yêu cầu sửa.',
                style: const TextStyle(height: 1.8),
              ),
            if (o.status == ContractStatus.completed)
              Text(
                widget.jobs.isLiveBackend
                    ? 'Đã nghiệm thu hoàn tất. Thù lao đã được quyết toán vào Ví người đọc.'
                    : 'Đã nghiệm thu. Nếu có ký quỹ mẫu, tiền hư cấu đã vào số dư chờ giữ của Narrator. Xem Ví & rút tiền.',
                style: const TextStyle(height: 1.8),
              ),
            if ([
              ContractStatus.invited,
              ContractStatus.negotiating,
              ContractStatus.pendingSign,
            ].contains(o.status))
              TextButton(
                onPressed: busy ? null : () => act('cancel'),
                child: const Text('Hủy trước sản xuất'),
              ),
            if ([
              ContractStatus.inProduction,
              ContractStatus.delivered,
            ].contains(o.status)) ...[
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: const Text('Cần hỗ trợ công việc?'),
                children: [
                  TextButton(
                    onPressed: busy ? null : () => requestValue('dispute'),
                    child: Text(
                      widget.jobs.isLiveBackend
                          ? 'Gửi yêu cầu phân xử'
                          : 'Gửi yêu cầu phân xử mẫu',
                    ),
                  ),
                ],
              ),
            ],
            if (o.status == ContractStatus.disputed)
              Text(
                '${widget.jobs.isLiveBackend ? 'Đang chờ hội đồng phân xử' : 'Chờ kết quả phân xử mẫu'}.\n${o.revisionNotes}',
                style: const TextStyle(height: 1.7),
              ),
            if (error != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Semantics(
                  liveRegion: true,
                  child: Text(
                    error!,
                    style: const TextStyle(color: Palette.red),
                  ),
                ),
              ),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: const Text('Thỏa thuận & tài liệu'),
              children: [
                TextButton(
                  onPressed: busy
                      ? null
                      : () async {
                          try {
                            await downloadContract(o);
                          } catch (_) {
                            if (mounted) {
                              setState(
                                () => error =
                                    'Chưa xuất được PDF mẫu. Hãy thử lại.',
                              );
                            }
                          }
                        },
                  child: Text(
                    widget.jobs.isLiveBackend
                        ? 'Tải hợp đồng PDF'
                        : 'Tải thỏa thuận PDF mẫu',
                  ),
                ),
              ],
            ),
            if (!widget.jobs.isLiveBackend) ...[
              const SizedBox(height: 24),
              const Text(
                narratorDemoNote,
                style: TextStyle(
                  color: Palette.muted,
                  fontSize: 12,
                  height: 1.7,
                ),
              ),
            ],
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: const Text('Lịch sử công việc'),
              children: [
                for (final h in o.history)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        h,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Palette.muted,
                          height: 1.7,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      );
    },
  );
}
