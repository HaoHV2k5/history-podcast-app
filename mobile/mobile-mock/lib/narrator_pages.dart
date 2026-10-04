import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'components.dart';
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
  const NarratorHome({super.key, required this.preferences});
  final SharedPreferences preferences;
  @override
  State<NarratorHome> createState() => _NarratorHomeState();
}

class _NarratorHomeState extends State<NarratorHome> {
  late final profile = NarratorProfileState(widget.preferences);
  late final creator = CreatorState(widget.preferences);
  late final jobs = NarratorState(creator);
  String filter = 'Lời mời';
  bool busy = false;
  String? error;
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
      final own = jobs.orders.where((o) => o.narratorId == profile.id).toList();
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
              profile.name.isEmpty
                  ? 'Để câu chuyện có một giọng kể.'
                  : profile.name,
              style: editorial(31),
            ),
            const SizedBox(height: 14),
            Text(
              profile.canReceiveJobs
                  ? 'Giọng ${profile.region.toLowerCase()} · Lời mời và bản thu của bạn.'
                  : 'Hoàn thiện hồ sơ để bắt đầu nhận lời mời.',
              style: TextStyle(color: Palette.muted, height: 1.7),
            ),
            const SizedBox(height: 24),
            if (profile.canReceiveJobs)
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
                  'Đã xác minh · Xem hồ sơ & danh tính',
                  style: TextStyle(fontSize: 12),
                ),
                trailing: const Icon(CupertinoIcons.chevron_right, size: 16),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => NarratorAccountPage(profile: profile),
                  ),
                ),
              )
            else
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
                'Hoàn tất KYC và duyệt hồ sơ giọng đọc để nhận việc.',
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
            const SizedBox(height: 28),
            const Text(
              'Bản thử · Công việc và hồ sơ lưu trên thiết bị.',
              style: TextStyle(fontSize: 11, color: Palette.muted),
            ),
            _NarratorReviewTools(profile: profile, busy: busy, run: run),
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
      appBar: AppBar(title: const Text('Hồ sơ người đọc')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        children: [
          _NarratorSetup(
            profile: widget.profile,
            busy: busy,
            kyc: kyc,
            run: run,
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Semantics(
                liveRegion: true,
                child: Text(error!, style: const TextStyle(color: Palette.red)),
              ),
            ),
          const SizedBox(height: 24),
          _NarratorReviewTools(profile: widget.profile, busy: busy, run: run),
          const SizedBox(height: 16),
          const Text(
            narratorDemoNote,
            style: TextStyle(fontSize: 12, color: Palette.muted),
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
  late final name = TextEditingController(text: widget.state.name);
  late final bio = TextEditingController(text: widget.state.bio);
  late final transcript = TextEditingController(text: widget.state.transcript);
  late String region = widget.state.region;
  late String sample = widget.state.sample;
  LocalAudioFile? preview;
  bool dirty = false, busy = false;
  String? error;
  @override
  void dispose() {
    name.dispose();
    bio.dispose();
    transcript.dispose();
    super.dispose();
  }

  Future<void> save() async {
    if (!form.currentState!.validate()) return;
    setState(() => busy = true);
    try {
      await widget.state.saveProfile(
        name: name.text,
        bio: bio.text,
        region: region,
        transcript: transcript.text,
        sample: sample,
      );
      if (mounted) {
        setState(() {
          dirty = false;
          busy = false;
        });
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
          title: const Text('Hồ sơ giọng đọc', style: TextStyle(fontSize: 14)),
        ),
        body: Form(
          key: form,
          onChanged: () => setState(() => dirty = true),
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text('Một giọng kể, một dấu ấn.', style: editorial(29)),
              const SizedBox(height: 12),
              const Text(
                'Giới thiệu cách bạn kể chuyện. File vừa chọn có thể nghe thử trên thiết bị; hồ sơ lưu tên file và trích đoạn, chưa upload audio.',
                style: TextStyle(color: Palette.muted, height: 1.7),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: name,
                readOnly: !editable,
                maxLength: 60,
                decoration: const InputDecoration(
                  labelText: 'Tên hiển thị người đọc',
                ),
                validator: (v) => (v?.trim().length ?? 0) < 2
                    ? 'Nhập ít nhất 2 ký tự.'
                    : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: bio,
                readOnly: !editable,
                minLines: 3,
                maxLines: 6,
                maxLength: 600,
                decoration: const InputDecoration(
                  labelText: 'Giới thiệu và phong cách kể',
                ),
                validator: (v) => (v?.trim().length ?? 0) < 20
                    ? 'Giới thiệu ít nhất 20 ký tự.'
                    : null,
              ),
              const SizedBox(height: 16),
              const Text('Giọng vùng miền'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final r in ['Bắc', 'Trung', 'Nam'])
                    ChoiceChip(
                      label: Text(r),
                      selected: region == r,
                      showCheckmark: false,
                      onSelected: editable
                          ? (_) => setState(() {
                              region = r;
                              dirty = true;
                            })
                          : null,
                    ),
                ],
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: transcript,
                readOnly: !editable,
                minLines: 3,
                maxLines: 6,
                maxLength: 1200,
                decoration: const InputDecoration(
                  labelText: 'Trích đoạn demo giọng',
                ),
                validator: (v) => (v?.trim().length ?? 0) < 20
                    ? 'Trích đoạn ít nhất 20 ký tự.'
                    : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                key: ValueKey(sample),
                initialValue: sample.isEmpty ? null : sample,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Tên bản thu mẫu'),
                items: [
                  if (sample.isNotEmpty &&
                      ![
                        'demo-tu-su.wav',
                        'demo-bien-khao.wav',
                      ].contains(sample))
                    DropdownMenuItem(
                      value: sample,
                      child: Text(sample, overflow: TextOverflow.ellipsis),
                    ),
                  DropdownMenuItem(
                    value: 'demo-tu-su.wav',
                    child: Text('Demo tự sự · WAV'),
                  ),
                  DropdownMenuItem(
                    value: 'demo-bien-khao.wav',
                    child: Text('Demo biên khảo · WAV'),
                  ),
                ],
                onChanged: editable
                    ? (v) => setState(() {
                        sample = v!;
                        preview = null;
                        dirty = true;
                      })
                    : null,
                validator: (v) => v == null ? 'Chọn bản thu mẫu.' : null,
              ),
              const SizedBox(height: 12),
              if (sample.isNotEmpty)
                Text(
                  '$sample · Lưu metadata, không lưu file sau khi rời trang.',
                  style: const TextStyle(color: Palette.muted, fontSize: 12),
                ),
              if (editable)
                OutlinedButton(
                  onPressed: busy
                      ? null
                      : () async {
                          try {
                            final picked = await pickLocalAudio();
                            if (picked != null && mounted) {
                              setState(() {
                                sample = picked.name;
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
                  child: const Text('Chọn file demo và nghe thử'),
                ),
              if (preview != null)
                LocalAudioPreview(bytes: preview!.bytes, name: preview!.name),
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
                child: const Text('Chấp nhận lời mời mẫu'),
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
                    child: const Text('Từ chối lời mời mẫu'),
                  ),
                ],
              ),
            ],
            if (o.status == ContractStatus.pendingSign)
              if (o.creatorSigned)
                FilledButton(
                  onPressed: busy ? null : () => act('narratorSign'),
                  child: const Text('Người đọc: xác nhận mẫu'),
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
                const Text(
                  'File chỉ được nghe trên thiết bị trong phiên này, chưa upload.',
                  style: TextStyle(color: Palette.muted, fontSize: 12),
                ),
                FilledButton(
                  onPressed: busy
                      ? null
                      : () => act('deliver', value: preview!.name),
                  child: const Text('Bàn giao bản thu mẫu'),
                ),
              ],
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
                '${o.deliveredAudioName}\nĐã bàn giao mẫu. Chờ người sáng tạo nghiệm thu hoặc yêu cầu sửa.',
                style: const TextStyle(height: 1.8),
              ),
            if (o.status == ContractStatus.completed)
              const Text(
                'Đã nghiệm thu. Nếu có ký quỹ mẫu, tiền hư cấu đã vào số dư chờ giữ của Narrator. Xem Ví & rút tiền.',
                style: TextStyle(height: 1.8),
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
                    child: const Text('Gửi yêu cầu phân xử mẫu'),
                  ),
                ],
              ),
            ],
            if (o.status == ContractStatus.disputed)
              Text(
                'Chờ kết quả phân xử mẫu.\n${o.revisionNotes}',
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
                  child: const Text('Tải thỏa thuận PDF mẫu'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text(
              narratorDemoNote,
              style: TextStyle(color: Palette.muted, fontSize: 12, height: 1.7),
            ),
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
