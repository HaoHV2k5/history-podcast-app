import 'dart:async';

import 'kyc_form.dart';
export 'kyc_form.dart' show KycSheet;
export 'creator_studio_extensions.dart';
import 'app_state.dart';
import 'components.dart';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/api/channel_repository.dart';
import 'core/api/chat_repository.dart';
import 'core/api/contract_repository.dart';
import 'core/api/creator_series_repository.dart';
import 'core/api/creator_studio_repository.dart';
import 'core/api/deliverable_repository.dart';
import 'core/api/dispute_repository.dart';
import 'core/api/freelancer_repository.dart';
import 'core/api/hire_request_repository.dart';
import 'core/api/kyc_repository.dart';
import 'core/api/milestone_repository.dart';
import 'core/api/narrator_demo_repository.dart';
import 'core/api/narrator_profile_repository.dart';
import 'core/api/post_repository.dart';
import 'core/api/wallet_repository.dart';
import 'core/api/withdrawal_repository.dart';
import 'creator_state.dart';
import 'creator_studio_extensions.dart';
import 'design.dart';
import 'artwork_editor.dart';
import 'artwork_state.dart';
import 'artwork_image.dart';
import 'narrator_marketplace.dart';
import 'local_file.dart';
import 'workspace_components.dart';
import 'wallet_page.dart';

part 'mock/fixtures/studio_videos.dart';

class CreatorStudio extends StatefulWidget {
  const CreatorStudio({
    super.key,
    required this.preferences,
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
  });
  final SharedPreferences preferences;
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
  @override
  State<CreatorStudio> createState() => _CreatorStudioState();
}

class _CreatorStudioState extends State<CreatorStudio> {
  late final CreatorState state = CreatorState(
    widget.preferences,
    channelRepository: widget.channelRepository,
    creatorSeriesRepository: widget.creatorSeriesRepository,
    creatorStudioRepository: widget.creatorStudioRepository,
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
    postRepository: widget.postRepository,
    walletRepository: widget.walletRepository,
    withdrawalRepository: widget.withdrawalRepository,
  );
  final name = TextEditingController();
  final desc = TextEditingController();
  final form = GlobalKey<FormState>();
  bool busy = false;
  String? error;
  String draftFilter = 'Cần làm';

  @override
  void initState() {
    super.initState();
    if (state.isLiveBackend) {
      state.initStudioBackend();
    }
  }

  List<CreatorDraft> draftsFor(String filter) => state.drafts
      .where(
        (d) => switch (filter) {
          'Cần làm' => [
            DraftStage.draft,
            DraftStage.checked,
            DraftStage.rejected,
          ].contains(d.stage),
          'Chờ duyệt' => d.stage == DraftStage.pending,
          'Đã duyệt' => d.stage == DraftStage.approved,
          _ => true,
        },
      )
      .toList();

  void openChannelManagement() => Navigator.push(
    context,
    MaterialPageRoute<void>(
      builder: (_) =>
          ChannelManagementPage(state: state, preferences: widget.preferences),
    ),
  );

  void openKycManagement() => Navigator.push(
    context,
    MaterialPageRoute<void>(
      builder: (_) =>
          KycManagementPage(state: state, kycRepository: widget.kycRepository),
    ),
  );

  void openWallet() => Navigator.push(
    context,
    MaterialPageRoute<void>(
      builder: (_) => WalletPage(
        preferences: widget.preferences,
        walletRepository: widget.walletRepository,
        withdrawalRepository: widget.withdrawalRepository,
        contractRepository: widget.contractRepository,
        kycRepository: widget.kycRepository,
      ),
    ),
  );

  Widget channelMenu() => PopupMenuButton<String>(
    key: const Key('studio-options'),
    tooltip: 'Tùy chọn Studio',
    color: Palette.paper,
    surfaceTintColor: Colors.transparent,
    elevation: 3,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(10),
      side: const BorderSide(color: Palette.line),
    ),
    icon: const Icon(CupertinoIcons.ellipsis, size: 22),
    onSelected: (action) {
      switch (action) {
        case 'channel':
          openChannelManagement();
        case 'kyc':
          openKycManagement();
        case 'wallet':
          openWallet();
        case 'edit':
          openEditChannelDialog();
        case 'artwork':
          openChannelArtwork();
        case 'preview':
          openChannelPreview();
        case 'narrator':
          openMarketplace();
        case 'video':
          edit(const CreatorDraft(id: '', title: '', format: 'video'));
      }
    },
    itemBuilder: (_) => [
      const PopupMenuItem(
        value: 'kyc',
        child: Row(
          children: [
            Icon(CupertinoIcons.person_crop_circle_badge_checkmark, size: 18),
            SizedBox(width: 10),
            Text('Xác thực KYC'),
          ],
        ),
      ),
      const PopupMenuItem(
        value: 'channel',
        child: Row(
          children: [
            Icon(CupertinoIcons.dot_radiowaves_left_right, size: 18),
            SizedBox(width: 10),
            Text('Quản lý Kênh'),
          ],
        ),
      ),
      const PopupMenuItem(
        value: 'wallet',
        child: Row(
          children: [
            Icon(CupertinoIcons.creditcard, size: 18),
            SizedBox(width: 10),
            Text('Ví & Thu nhập'),
          ],
        ),
      ),
      const PopupMenuDivider(),
      const PopupMenuItem(value: 'edit', child: Text('Sửa nhanh tên kênh')),
      const PopupMenuItem(value: 'artwork', child: Text('Ảnh kênh')),
      const PopupMenuItem(value: 'preview', child: Text('Xem trang kênh')),
      const PopupMenuItem(
        key: Key('open-marketplace-btn'),
        value: 'narrator',
        child: Text('Thuê Narrator'),
      ),
      PopupMenuItem(
        key: const Key('upload-video-stt'),
        value: 'video',
        child: Text(
          state.isLiveBackend ? 'Nhập video & STT' : 'Nhập video mẫu',
        ),
      ),
    ],
  );

  @override
  void dispose() {
    state.dispose();
    name.dispose();
    desc.dispose();
    super.dispose();
  }

  Future<void> act(Future<void> Function() action) async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await action();
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

  void openMarketplace([CreatorDraft? draft]) => Navigator.push(
    context,
    MaterialPageRoute<void>(
      builder: (_) =>
          NarratorMarketplacePage(state: state, preselectedDraft: draft),
    ),
  );

  void edit([CreatorDraft? draft]) => Navigator.push(
    context,
    MaterialPageRoute<void>(
      builder: (_) => DraftEditor(state: state, draft: draft),
    ),
  );

  void openKycSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => KycSheet(
        state: state,
        onSubmitted: () {
          Navigator.pop(ctx);
          setState(() {});
        },
      ),
    );
  }

  void openEditChannelDialog() {
    final editName = TextEditingController(text: state.channel);
    final editDesc = TextEditingController(text: state.channelDescription);
    var category = state.channelCategory;
    final dialogKey = GlobalKey<FormState>();

    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDState) => AlertDialog(
          backgroundColor: Palette.paper,
          title: Text('Thông tin kênh', style: editorial(20)),
          content: SingleChildScrollView(
            child: Form(
              key: dialogKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: editName,
                    maxLength: 60,
                    decoration: const InputDecoration(labelText: 'Tên kênh'),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? 'Nhập tên kênh' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: editDesc,
                    maxLines: 3,
                    maxLength: 300,
                    decoration: const InputDecoration(
                      labelText: 'Giới thiệu kênh',
                      hintText: 'Mô tả góc nhìn, câu chuyện lịch sử của kênh…',
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Chủ đề chính',
                    style: TextStyle(fontSize: 12, color: Palette.muted),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children:
                        [
                              'Lịch sử Việt Nam',
                              'Văn hóa cổ truyền',
                              'Di sản & Danh nhân',
                              'Giai thoại kinh kỳ',
                            ]
                            .map(
                              (c) => ChoiceChip(
                                label: Text(
                                  c,
                                  style: const TextStyle(fontSize: 11),
                                ),
                                selected: category == c,
                                onSelected: (_) =>
                                    setDState(() => category = c),
                              ),
                            )
                            .toList(),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            FilledButton(
              onPressed: () {
                if (dialogKey.currentState!.validate()) {
                  act(
                    () => state.updateChannelProfile(
                      name: editName.text,
                      description: editDesc.text,
                      category: category,
                    ),
                  );
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Lưu thay đổi'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> openChannelArtwork() async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (_) => Scaffold(
          appBar: AppBar(title: const Text('Ảnh kênh')),
          body: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(state.channel, style: editorial(27)),
              const SizedBox(height: 20),
              ArtworkEditor(
                preferences: widget.preferences,
                target: 'channel',
                kind: ArtworkKind.channel,
                label: 'Ảnh kênh',
                guard: state.guardArtwork,
              ),
              const SizedBox(height: 24),
              const Text(
                'Ảnh xuất hiện trên trang kênh và trong danh mục sau khi có tập phát hành. Ảnh chỉ lưu trên thiết bị trong bản thử.',
                style: TextStyle(color: Palette.muted),
              ),
            ],
          ),
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  void openChannelPreview() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.85,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Text(
                      'XEM TRƯỚC TRANG KÊNH',
                      style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.5,
                        color: Palette.red,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(CupertinoIcons.xmark, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ArtworkImage(
                      artworkReference('channel'),
                      width: 72,
                      height: 72,
                      semanticLabel: 'Ảnh kênh',
                    ),
                    const SizedBox(height: 12),
                    Text(state.channel, style: editorial(24)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Palette.paper,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Text(
                        state.channelCategory,
                        style: const TextStyle(
                          fontSize: 11,
                          color: Palette.red,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      state.channelDescription.isNotEmpty
                          ? state.channelDescription
                          : 'Kênh kể chuyện lịch sử trên Sử Ký.',
                      style: const TextStyle(fontSize: 13, height: 1.6),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 16,
                      runSpacing: 4,
                      children: [
                        Text(
                          '${state.drafts.where((d) => d.stage == DraftStage.approved).length} tập đã duyệt',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Palette.muted,
                          ),
                        ),
                        const Text(
                          '0 người theo dõi',
                          style: TextStyle(fontSize: 12, color: Palette.muted),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text('Các tập của kênh', style: editorial(18)),
              const SizedBox(height: 12),
              Expanded(
                child: state.drafts.isEmpty
                    ? const Center(
                        child: Text(
                          'Chưa có tập nào được xuất bản.',
                          style: TextStyle(color: Palette.muted, fontSize: 13),
                        ),
                      )
                    : ListView.separated(
                        itemCount: state.drafts.length,
                        separatorBuilder: (_, _) => const Divider(),
                        itemBuilder: (ctx, i) {
                          final d = state.drafts[i];
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(d.title, style: editorial(16)),
                            subtitle: Text(
                              'Định dạng: ${d.format == 'video' ? 'Video' : 'Âm thanh'} · ${d.stage.label}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Palette.muted,
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: state,
    builder: (context, _) => Scaffold(
      appBar: AppBar(
        title: const Text('Studio', style: TextStyle(fontSize: 16)),
        actions: [
          if (state.demoVerified && state.channel.isNotEmpty) channelMenu(),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
        children: [
          const Text(
            'SỔ TAY NGƯỜI KỂ',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              color: Palette.red,
            ),
          ),
          const SizedBox(height: 12),
          if (state.channel.isNotEmpty &&
              ArtworkStore(widget.preferences)
                  .read()
                  .containsKey('channel')) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: ArtworkImage(
                  artworkReference('channel'),
                  width: 64,
                  height: 64,
                  semanticLabel: 'Ảnh kênh ${state.channel}',
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          Text(
            state.channel.isEmpty
                ? 'Mỗi câu chuyện,\nmột góc nhìn.'
                : state.channel,
            style: editorial(32),
          ),
          if (state.channel.isEmpty) ...[
            const SizedBox(height: 16),
            Text(
              state.channel.isEmpty
                  ? 'Từ trang tư liệu đến một tập kể. Bắt đầu với kênh của bạn.'
                  : 'Nơi những trang viết dần thành câu chuyện.',
              style: const TextStyle(color: Palette.muted),
            ),
          ],
          if (!state.demoVerified && !state.isLiveBackend) ...[
            const SizedBox(height: 24),
            const StudioNotice(
              'Studio thử nghiệm · Lưu trên thiết bị\nHồ sơ, sản xuất và duyệt đều là mô phỏng. Không tải giấy tờ cá nhân lên bản thử.',
            ),
          ],
          const SizedBox(height: 24),

          // 1. KYC GATE (UC-01, BR-01, BR-02)
          if (!state.demoVerified) ...[
            Text('01 / Hồ sơ người sáng tạo', style: editorial(21)),
            const SizedBox(height: 12),
            Text(
              state.isLiveBackend
                  ? 'Kênh sáng tạo cần người đăng ký đủ 18 tuổi và hoàn tất xác thực danh tính (KYC).'
                  : 'Kênh thật cần người sáng tạo đủ 18 tuổi và đã được duyệt KYC. Dùng hồ sơ giả lập đáp ứng hai điều kiện này để xem tiếp giao diện.',
            ),
            const SizedBox(height: 16),

            if (state.kyc.status == KycStatus.pending) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          CupertinoIcons.hourglass,
                          size: 16,
                          color: Palette.red,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            state.isLiveBackend
                                ? 'Hồ sơ KYC đang chờ thẩm định'
                                : 'Hồ sơ KYC đang chờ thẩm định (Mô phỏng · UC-01)',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Họ tên: ${state.kyc.fullName}\nCCCD: ${state.kyc.idNumber}\nNgày sinh: ${state.kyc.dob}\nSĐT: ${state.kyc.phone}',
                      style: const TextStyle(
                        fontSize: 12,
                        height: 1.6,
                        color: Palette.muted,
                      ),
                    ),
                    if (!state.isLiveBackend) ...[
                      const SizedBox(height: 12),
                      const Text(
                        'Giả lập quyết định của quản trị viên:',
                        style: TextStyle(fontSize: 11, color: Palette.muted),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton(
                            onPressed: busy
                                ? null
                                : () => act(
                                    () => state.simulateKycDecision(true),
                                  ),
                            child: const Text(
                              'Mô phỏng duyệt: Đạt',
                              style: TextStyle(fontSize: 12),
                            ),
                          ),
                          OutlinedButton(
                            onPressed: busy
                                ? null
                                : () => act(
                                    () => state.simulateKycDecision(false),
                                  ),
                            child: const Text(
                              'Mô phỏng: Từ chối',
                              style: TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ] else if (state.kyc.status == KycStatus.rejected) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.red),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          CupertinoIcons.exclamationmark_circle,
                          size: 16,
                          color: Palette.red,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Hồ sơ KYC cần chỉnh sửa',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: Palette.red,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      state.kyc.rejectionReason.isNotEmpty
                          ? state.kyc.rejectionReason
                          : 'Ảnh chụp giấy tờ chưa đạt chuẩn hoặc thông tin chưa trùng khớp.',
                      style: const TextStyle(fontSize: 12, height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                if (!state.isLiveBackend)
                  FilledButton(
                    onPressed: busy
                        ? null
                        : () => act(state.useVerifiedFixture),
                    child: const Text('Dùng hồ sơ mẫu đã duyệt'),
                  ),
                OutlinedButton.icon(
                  onPressed: busy ? null : openKycSheet,
                  icon: const Icon(CupertinoIcons.person_badge_plus, size: 16),
                  label: Text(
                    state.isLiveBackend
                        ? 'Xác thực hồ sơ KYC'
                        : 'Điền hồ sơ KYC thử nghiệm',
                  ),
                ),
              ],
            ),
          ] else if (state.channel.isEmpty) ...[
            Text('02 / Đặt tên kênh', style: editorial(23)),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(
                  CupertinoIcons.checkmark_seal_fill,
                  size: 14,
                  color: Palette.red,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    state.isLiveBackend
                        ? 'Hồ sơ KYC · Đã xác thực'
                        : 'Hồ sơ thử nghiệm · Đã duyệt',
                    style: const TextStyle(color: Palette.muted, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Form(
              key: form,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: name,
                    maxLength: 60,
                    decoration: const InputDecoration(
                      labelText: 'Tên kênh',
                      hintText: 'Ví dụ: Những trang sử nhỏ',
                    ),
                    validator: (v) => v == null || v.trim().isEmpty
                        ? 'Nhập tên kênh của bạn.'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: desc,
                    maxLines: 2,
                    maxLength: 200,
                    decoration: const InputDecoration(
                      labelText: 'Mô tả kênh ngắn gọn (Tùy chọn)',
                      hintText: 'Góc nhìn lịch sử của kênh bạn…',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: busy
                  ? null
                  : () {
                      if (form.currentState!.validate()) {
                        act(
                          () => state.createChannel(
                            name.text,
                            description: desc.text,
                          ),
                        );
                      }
                    },
              child: Text(
                state.isLiveBackend ? 'Tạo kênh sáng tạo' : 'Tạo kênh thử',
              ),
            ),
          ] else ...[
            Text(
              state.channelCategory,
              style: const TextStyle(color: Palette.muted, fontSize: 12),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              key: const Key('new-draft'),
              onPressed: busy ? null : () => edit(),
              icon: const Icon(CupertinoIcons.pencil, size: 18),
              label: const Text('Viết một tập mới'),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  key: const Key('open-ai-pipeline-btn'),
                  onPressed: busy
                      ? null
                      : () => Navigator.push(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) =>
                                AiWhiteboardPipelinePage(state: state),
                          ),
                        ),
                  icon: const Icon(CupertinoIcons.sparkles, size: 15),
                  label: const Text('Tạo nội dung mới (AI Studio)'),
                ),
                OutlinedButton.icon(
                  key: const Key('open-series-manager-btn'),
                  onPressed: busy
                      ? null
                      : () => Navigator.push(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) =>
                                CreatorSeriesManagerPage(state: state),
                          ),
                        ),
                  icon: const Icon(CupertinoIcons.collections, size: 15),
                  label: Text(
                    state.mySeries.isEmpty
                        ? 'Quản lý Series'
                        : 'Series (${state.mySeries.length})',
                  ),
                ),
                OutlinedButton.icon(
                  key: const Key('open-membership-plan-btn'),
                  onPressed: busy
                      ? null
                      : () => showModalBottomSheet<void>(
                          context: context,
                          isScrollControlled: true,
                          showDragHandle: true,
                          builder: (_) =>
                              ChannelMembershipPlanSheet(state: state),
                        ),
                  icon: const Icon(CupertinoIcons.tickets, size: 15),
                  label: Text(
                    state.membershipPlan != null
                        ? 'Gói Hội viên · ${state.membershipPlan!.monthlyPrice.round()}đ'
                        : 'Cấu hình Gói Hội viên',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),
            Text('Bàn biên tập', style: editorial(24)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final f in ['Cần làm', 'Chờ duyệt', 'Đã duyệt', 'Tất cả'])
                  ChoiceChip(
                    key: Key('studio-filter-$f'),
                    label: Text('$f · ${draftsFor(f).length}'),
                    selected: draftFilter == f,
                    showCheckmark: false,
                    onSelected: (_) => setState(() => draftFilter = f),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (draftsFor(draftFilter).isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      CupertinoIcons.doc_text,
                      size: 28,
                      color: Palette.muted,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      state.drafts.isEmpty
                          ? 'Trang đầu còn để ngỏ.'
                          : 'Không có tập trong nhóm này.',
                      style: editorial(21),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      state.drafts.isEmpty
                          ? 'Bắt đầu từ một ý tưởng và nguồn tư liệu của bạn.'
                          : 'Chọn nhóm khác để xem các bản thảo.',
                      style: const TextStyle(color: Palette.muted),
                    ),
                  ],
                ),
              ),
            for (final d in draftsFor(draftFilter)) ...[
              const Divider(),
              WorkListItem(
                key: Key('studio-draft-${d.id}'),
                title: d.title,
                icon: d.format == 'video'
                    ? CupertinoIcons.video_camera
                    : CupertinoIcons.doc_text,
                meta: d.format == 'video' ? 'Video' : 'Audio',
                status: d.stage.label,
                needsAttention: d.stage == DraftStage.rejected,
                onTap: () => edit(d),
              ),
            ],
          ],
          if (!state.isLiveBackend) ...[
            const SizedBox(height: 24),
            const Text(
              'Studio thử nghiệm · Nội dung lưu trên thiết bị.',
              style: TextStyle(fontSize: 11, color: Palette.muted),
            ),
          ],
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(error!, style: const TextStyle(color: Palette.red)),
            ),
        ],
      ),
    ),
  );
}

class StudioNotice extends StatelessWidget {
  const StudioNotice(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: const BoxDecoration(
      color: Palette.soft,
      border: Border(left: BorderSide(color: Palette.red, width: 2)),
    ),
    child: Text(text, style: const TextStyle(fontSize: 12, height: 1.8)),
  );
}

class DraftEditor extends StatefulWidget {
  const DraftEditor({super.key, required this.state, this.draft});
  final CreatorState state;
  final CreatorDraft? draft;
  @override
  State<DraftEditor> createState() => _DraftEditorState();
}

class _DraftEditorState extends State<DraftEditor> {
  late final id = widget.draft?.id.isNotEmpty == true
      ? widget.draft!.id
      : DateTime.now().microsecondsSinceEpoch.toString();
  late final title = TextEditingController(text: widget.draft?.title ?? '');
  late final script = TextEditingController(text: widget.draft?.script ?? '');
  late final sources = TextEditingController(text: widget.draft?.sources ?? '');
  late String format = widget.draft?.format ?? 'audio';
  final scroll = ScrollController();
  final form = GlobalKey<FormState>();
  bool dirty = false, busy = false, leaving = false;
  String? error;
  bool isPlayingPreview = false;
  bool showHistory = false;
  Timer? previewTimer;
  int previewSeconds = 0;
  late String videoFileName = widget.draft?.videoFileName ?? '';
  late String videoFileSize = widget.draft?.videoFileSize ?? '';
  late String extractedTranscript = widget.draft?.extractedTranscript ?? '';

  CreatorDraft? get saved {
    for (final d in widget.state.drafts) {
      if (d.id == id) return d;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    if (widget.draft != null &&
        widget.draft!.id.isEmpty &&
        widget.draft!.format == 'video') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) openVideoUploadModal();
      });
    }
  }

  @override
  void dispose() {
    title.dispose();
    script.dispose();
    sources.dispose();
    scroll.dispose();
    previewTimer?.cancel();
    super.dispose();
  }

  Future<void> leave() async {
    if (busy) return;
    final discard =
        !dirty ||
        await showDialog<bool>(
              context: context,
              builder: (c) => AlertDialog(
                title: const Text('Rời bản thảo?'),
                content: const Text('Những thay đổi chưa lưu sẽ mất.'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(c, false),
                    child: const Text('Viết tiếp'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(c, true),
                    child: const Text('Bỏ thay đổi'),
                  ),
                ],
              ),
            ) ==
            true;
    if (discard && mounted) {
      setState(() => leaving = true);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.pop(context);
      });
    }
  }

  Future<void> run(Future<void> Function() action) async {
    previewTimer?.cancel();
    previewTimer = null;
    isPlayingPreview = false;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await action();
    } on StateError catch (e) {
      error = e.message;
    } catch (_) {
      error = 'Chưa lưu được thao tác. Vui lòng thử lại.';
    }
    if (mounted) setState(() => busy = false);
  }

  Future<void> save() async {
    if (!form.currentState!.validate()) {
      await scroll.animateTo(
        0,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
      return;
    }
    await run(() async {
      await widget.state.save(
        CreatorDraft(
          id: id,
          title: title.text,
          script: script.text,
          sources: sources.text,
          format: format,
          videoFileName: videoFileName,
          videoFileSize: videoFileSize,
          extractedTranscript: extractedTranscript,
        ),
      );
      dirty = false;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã lưu bản nháp trên thiết bị.')),
        );
      }
    });
  }

  Future<void> step(DraftStage stage, {String reason = ''}) => run(
    () => widget.state.transition(id, stage, reason: reason, format: format),
  );

  Future<void> openMarketplace() async {
    if (dirty || saved == null) {
      await save();
      if (!mounted || dirty || saved == null) return;
    }
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (_) => NarratorMarketplacePage(
          state: widget.state,
          preselectedDraft: saved,
        ),
      ),
    );
  }

  void togglePreview() {
    setState(() => isPlayingPreview = !isPlayingPreview);
    if (isPlayingPreview && previewSeconds >= 255) previewSeconds = 0;
    previewTimer ??= Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || !isPlayingPreview) return;
      setState(() {
        previewSeconds = (previewSeconds + 1).clamp(0, 255);
        if (previewSeconds == 255) isPlayingPreview = false;
      });
    });
  }

  void openVideoUploadModal() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => VideoUploadSttModal(
        onExtractComplete:
            (
              extractedTitle,
              extractedScript,
              extractedSources,
              fileName,
              fileSize,
            ) {
              Navigator.pop(ctx);
              setState(() {
                if (title.text.trim().isEmpty) title.text = extractedTitle;
                script.text = extractedScript;
                if (!sources.text.contains(extractedSources)) {
                  sources.text = [
                    sources.text.trim(),
                    extractedSources,
                  ].where((s) => s.isNotEmpty).join('\n');
                }
                format = 'video';
                videoFileName = fileName;
                videoFileSize = fileSize;
                extractedTranscript = extractedScript;
                dirty = true;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Đã nhập kịch bản và thông tin video mẫu.'),
                ),
              );
            },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final d = saved;
    final editable = d?.editable ?? true;
    final ready =
        d != null && !dirty && d.script.isNotEmpty && d.sources.isNotEmpty;
    final history = d?.reviewHistory ?? const [];

    return PopScope(
      canPop: leaving || (!dirty && !busy),
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) leave();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Bản thảo', style: TextStyle(fontSize: 16)),
          actions: [
            if (editable) ...[
              IconButton(
                key: const Key('editor-hire-narrator'),
                icon: const Icon(CupertinoIcons.mic_circle, size: 20),
                tooltip: 'Thuê Narrator thu âm tập này',
                onPressed: busy ? null : openMarketplace,
              ),
              IconButton(
                key: const Key('appbar-upload-video'),
                icon: const Icon(CupertinoIcons.video_camera, size: 20),
                tooltip: 'Tải video có sẵn (STT)',
                onPressed: busy ? null : openVideoUploadModal,
              ),
            ],
            if (history.isNotEmpty)
              IconButton(
                icon: const Icon(
                  CupertinoIcons.clock_fill,
                  size: 20,
                  color: Palette.red,
                ),
                tooltip: 'Lịch sử thẩm định',
                onPressed: () => setState(() => showHistory = !showHistory),
              ),
            const SizedBox(width: 8),
          ],
        ),
        body: Form(
          key: form,
          onChanged: () => setState(() => dirty = true),
          child: SingleChildScrollView(
            controller: scroll,
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 36),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  d?.stage.label.toUpperCase() ?? 'BẢN NHÁP MỚI',
                  style: const TextStyle(
                    color: Palette.red,
                    fontSize: 11,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  d == null ? 'Bắt đầu câu chuyện' : 'Biên tập nội dung',
                  style: editorial(27),
                ),
                const SizedBox(height: 8),
                Text(
                  editable
                      ? 'Lưu từng phần khi viết. Thêm kịch bản và nguồn trước bước kiểm tra.'
                      : 'Nội dung đã khóa ở bước duyệt. Xem trạng thái và lịch sử bên dưới.',
                  style: const TextStyle(color: Palette.muted),
                ),
                const SizedBox(height: 24),
                if (d != null && d.reason.isNotEmpty) ...[
                  StudioNotice(
                    '${widget.state.isLiveBackend ? 'Góp ý biên tập' : 'Góp ý mô phỏng'}\n${d.reason}',
                  ),
                  const SizedBox(height: 24),
                ],
                if (d != null) ...[
                  ArtworkEditor(
                    key: ValueKey(draftArtworkTarget(id, format)),
                    preferences: widget.state.preferences,
                    target: draftArtworkTarget(id, format),
                    kind: format == 'video'
                        ? ArtworkKind.video
                        : ArtworkKind.audio,
                    label: format == 'video'
                        ? 'Ảnh bìa video'
                        : 'Ảnh bìa audio',
                    enabled: editable && !busy,
                    guard: () => widget.state.guardArtwork(draftId: id),
                  ),
                  const SizedBox(height: 24),
                ] else ...[
                  const Text(
                    'Lưu bản nháp để thêm ảnh bìa.',
                    style: TextStyle(color: Palette.muted, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  key: const Key('draft-title'),
                  controller: title,
                  readOnly: !editable || busy,
                  maxLength: 120,
                  decoration: const InputDecoration(labelText: 'Tên tập'),
                  validator: (v) => v == null || v.trim().isEmpty
                      ? 'Đặt tên cho câu chuyện của bạn.'
                      : null,
                ),
                const SizedBox(height: 18),
                TextFormField(
                  key: const Key('draft-script'),
                  controller: script,
                  readOnly: !editable || busy,
                  minLines: 7,
                  maxLines: 14,
                  maxLength: 20000,
                  decoration: const InputDecoration(
                    labelText: 'Kịch bản',
                    alignLabelWithHint: true,
                    hintText: 'Bắt đầu từ một chi tiết đáng nhớ…',
                  ),
                ),
                const SizedBox(height: 18),
                TextFormField(
                  key: const Key('draft-sources'),
                  controller: sources,
                  readOnly: !editable || busy,
                  minLines: 3,
                  maxLines: 8,
                  maxLength: 4000,
                  decoration: const InputDecoration(
                    labelText: 'Nguồn tham khảo',
                    alignLabelWithHint: true,
                    hintText: 'Tên sách, tác giả, trang hoặc đường dẫn.',
                  ),
                ),
                const SizedBox(height: 16),
                if (editable) ...[
                  FilledButton(
                    key: const Key('save-draft'),
                    onPressed: busy ? null : save,
                    child: Text(busy ? 'Đang lưu…' : 'Lưu bản nháp'),
                  ),
                  const SizedBox(height: 10),
                ],

                // AUDIT LOG / REVIEW HISTORY (UC-05)
                if (history.isNotEmpty && showHistory) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              CupertinoIcons.doc_checkmark,
                              size: 16,
                              color: Palette.red,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Lịch sử thẩm định',
                                style: editorial(16),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ...history.map(
                          (h) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        h.timestamp,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Palette.muted,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${h.reviewerRole} · ${h.stage.label}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        h.note,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          height: 1.4,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 28),
                const Divider(),
                const SizedBox(height: 24),
                Text('Bước tiếp theo', style: editorial(23)),
                const SizedBox(height: 12),
                Text(switch (d?.stage) {
                  DraftStage.checked =>
                    'Chọn định dạng, nghe thử và gửi duyệt.',
                  DraftStage.pending => 'Chờ người kiểm duyệt xem nội dung.',
                  DraftStage.approved =>
                    widget.state.isLiveBackend
                        ? 'Mở Phát hành nội dung để xuất bản tập lên kênh.'
                        : 'Mở Phát hành nội dung để đưa tập vào danh mục thử.',
                  _ => 'Kiểm tra kịch bản đã lưu trước khi sản xuất.',
                }, style: const TextStyle(height: 1.7)),
                const SizedBox(height: 12),
                const Text(
                  'Kịch bản được thẩm định trực tiếp bởi hệ thống AI Shield (MarkItDown + RAG Lịch sử) để đảm bảo chuẩn mực tư liệu sử học.',
                  style: TextStyle(color: Palette.muted, fontSize: 12),
                ),
                const SizedBox(height: 20),
                if (d == null || dirty || !ready)
                  const Text(
                    'Lưu tên tập, kịch bản và nguồn tham khảo để tiến hành kiểm duyệt nội dung.',
                    style: TextStyle(color: Palette.muted, fontSize: 12),
                  ),
                if (ready &&
                    (d.stage == DraftStage.draft ||
                        d.stage == DraftStage.rejected)) ...[
                  OutlinedButton(
                    onPressed: busy ? null : () => step(DraftStage.checked),
                    child: Text(
                      widget.state.isLiveBackend
                          ? 'Thẩm định AI: Đạt yêu cầu sử liệu'
                          : 'Thử kết quả AI: đạt',
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: busy
                        ? null
                        : () => step(
                            DraftStage.rejected,
                            reason: widget.state.isLiveBackend
                                ? 'Hệ thống AI: Cần bổ sung nguồn tư liệu gốc và phân định niên đại lịch sử chuẩn.'
                                : 'AI mẫu: bổ sung nguồn cho các mốc thời gian và phân biệt tư liệu với nhận định.',
                          ),
                    child: Text(
                      widget.state.isLiveBackend
                          ? 'Thẩm định AI: Cần chỉnh sửa bổ sung'
                          : 'Thử kết quả AI: cần sửa',
                    ),
                  ),
                ],

                if (ready && d.stage == DraftStage.checked) ...[
                  Text(
                    videoFileName.isNotEmpty
                        ? '${widget.state.isLiveBackend ? 'Video đã tải lên' : 'Video mẫu đã nhập'} · $videoFileSize'
                        : (widget.state.isLiveBackend
                              ? 'Chọn định dạng tập'
                              : 'Chọn định dạng tập thử'),
                  ),
                  if (videoFileName.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        videoFileName,
                        style: const TextStyle(
                          color: Palette.muted,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      ChoiceChip(
                        label: const Text('Tập âm thanh'),
                        selected: format == 'audio',
                        onSelected: busy || videoFileName.isNotEmpty
                            ? null
                            : (_) => setState(() => format = 'audio'),
                      ),
                      ChoiceChip(
                        label: const Text('Video minh họa'),
                        selected: format == 'video',
                        onSelected: busy || videoFileName.isNotEmpty
                            ? null
                            : (_) => setState(() => format = 'video'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // PREVIEW PLAYER (UC-03)
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              format == 'video'
                                  ? CupertinoIcons.videocam_fill
                                  : CupertinoIcons.waveform,
                              size: 16,
                              color: Palette.red,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Bản dựng nghe thử (${format == 'video' ? 'Video' : 'Audio'} Preview)',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            IconButton(
                              key: const Key('studio-preview-play'),
                              tooltip: isPlayingPreview
                                  ? 'Tạm dừng mô phỏng'
                                  : 'Chạy mô phỏng',
                              icon: Icon(
                                isPlayingPreview
                                    ? CupertinoIcons.pause_circle_fill
                                    : CupertinoIcons.play_circle_fill,
                                size: 32,
                                color: Palette.red,
                              ),
                              onPressed: togglePreview,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title.text,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    '${previewSeconds ~/ 60}:${(previewSeconds % 60).toString().padLeft(2, '0')} / 4:15 · ${isPlayingPreview ? 'Đang chạy mô phỏng' : 'Tạm dừng · Không có âm thanh'}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Palette.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  FilledButton(
                    onPressed: busy ? null : () => step(DraftStage.pending),
                    child: Text(
                      videoFileName.isNotEmpty
                          ? (widget.state.isLiveBackend
                                ? 'Gửi video để duyệt'
                                : 'Gửi video mẫu để duyệt')
                          : (widget.state.isLiveBackend
                                ? 'Sản xuất & gửi duyệt'
                                : 'Giả lập sản xuất & gửi duyệt'),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // RETRY BUTTON (BR-04)
                  OutlinedButton.icon(
                    key: const Key('retry-draft-btn'),
                    onPressed: busy
                        ? null
                        : () => run(() => widget.state.retryDraft(id)),
                    icon: const Icon(
                      CupertinoIcons.arrow_counterclockwise,
                      size: 14,
                    ),
                    label: const Text('Trở lại chỉnh sửa kịch bản'),
                  ),
                ],
                if (d?.stage == DraftStage.pending) ...[
                  Text(
                    widget.state.isLiveBackend
                        ? 'Bản thảo đang chờ hội đồng biên tập duyệt nội dung.'
                        : 'Bản thử đang chờ người duyệt. AI đạt chưa đồng nghĩa với được xuất bản.',
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: busy
                        ? null
                        : () => step(
                            DraftStage.rejected,
                            reason: 'Biên tập viên: ghi rõ tác giả và số trang của nguồn được trích trong phần mở đầu.',
                          ),
                    child: Text(
                      widget.state.isLiveBackend
                          ? 'Hội đồng biên tập: yêu cầu sửa'
                          : 'Thử người duyệt: yêu cầu sửa',
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: busy ? null : () => step(DraftStage.approved),
                    child: Text(
                      widget.state.isLiveBackend
                          ? 'Hội đồng biên tập: chấp thuận'
                          : 'Thử người duyệt: chấp thuận',
                    ),
                  ),
                ],
                if (d?.stage == DraftStage.approved)
                  Text(
                    widget.state.isLiveBackend
                        ? 'Tập đã được duyệt nội dung. Mở Phát hành nội dung để xuất bản lên Khám phá.'
                        : 'Đã hoàn thành luồng duyệt thử. Tập này chỉ nằm trong Studio trên thiết bị; chưa xuất bản lên Khám phá.',
                  ),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Text(
                      error!,
                      style: const TextStyle(color: Palette.red),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class VideoUploadSttModal extends StatefulWidget {
  const VideoUploadSttModal({super.key, required this.onExtractComplete});
  final void Function(
    String title,
    String script,
    String sources,
    String fileName,
    String fileSize,
  )
  onExtractComplete;

  @override
  State<VideoUploadSttModal> createState() => _VideoUploadSttModalState();
}

class _VideoUploadSttModalState extends State<VideoUploadSttModal> {
  final customTranscript = TextEditingController();
  String? pickedName, pickedSize, pickError;
  @override
  void dispose() {
    customTranscript.dispose();
    super.dispose();
  }

  int selectedVideo = 0;
  bool processing = false;
  String currentStep = '';

  final sampleVideos = sampleStudioVideos;

  Future<void> startProcess() async {
    if (pickedName != null) {
      if (customTranscript.text.trim().length < 20) {
        setState(
          () => pickError = 'Nhập transcript từ 20 ký tự; chưa chạy STT thật.',
        );
        return;
      }
      widget.onExtractComplete(
        'Video từ $pickedName',
        customTranscript.text.trim(),
        'Nguồn do người dùng bổ sung trước khi gửi duyệt.',
        pickedName!,
        pickedSize!,
      );
      return;
    }
    setState(() {
      processing = true;
      currentStep = 'Đang tải file video lên máy chủ (Mô phỏng)...';
    });
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    setState(() {
      currentStep = 'Đang trích xuất audio stream (128 kbps stereo)...';
    });
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    setState(() {
      currentStep = 'Chạy Speech-to-Text nhận dạng giọng nói tiếng Việt...';
    });
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    final item = sampleVideos[selectedVideo];
    widget.onExtractComplete(
      item['title']!,
      item['transcript']!,
      item['sources']!,
      item['fileName']!,
      item['size']!,
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Tải video & Bóc tách kịch bản',
                      style: editorial(19),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Đóng nhập video',
                    icon: const Icon(CupertinoIcons.xmark, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Chọn video mẫu để thử luồng nhập kịch bản. Chưa tải file hoặc chạy nhận dạng giọng nói thật.',
                style: TextStyle(fontSize: 12, color: Palette.muted),
              ),
              const SizedBox(height: 16),
              ...List.generate(sampleVideos.length, (i) {
                final v = sampleVideos[i];
                final sel = selectedVideo == i;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Material(
                    color: sel ? Palette.soft : Palette.paper,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: BorderSide(color: sel ? Palette.ink : Palette.line),
                    ),
                    child: ListTile(
                      title: Text(
                        v['title']!,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      subtitle: Text(
                        '${v['fileName']} · ${v['size']} · ${v['duration']}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Palette.muted,
                        ),
                      ),
                      trailing: sel
                          ? const Icon(
                              CupertinoIcons.checkmark_circle_fill,
                              color: Palette.red,
                              size: 20,
                            )
                          : null,
                      onTap: processing
                          ? null
                          : () => setState(() {
                              selectedVideo = i;
                              pickedName = null;
                            }),
                    ),
                  ),
                );
              }),
              if (processing) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        currentStep,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Palette.red,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              OutlinedButton(
                onPressed: processing
                    ? null
                    : () async {
                        try {
                          final picked = await pickLocalMetadata(video: true);
                          if (picked != null && mounted) {
                            setState(() {
                              pickedName = picked.name;
                              pickedSize =
                                  '${(picked.size / 1024 / 1024).toStringAsFixed(2)} MB';
                              pickError = null;
                            });
                          }
                        } on StateError catch (e) {
                          if (mounted) setState(() => pickError = e.message);
                        } catch (_) {
                          if (mounted) {
                            setState(() => pickError = 'Chưa chọn được file.');
                          }
                        }
                      },
                child: const Text('Chọn video trên thiết bị (metadata)'),
              ),
              if (pickedName != null) ...[
                Text(
                  '$pickedName · $pickedSize · Chưa upload hoặc phát file này',
                ),
                TextField(
                  controller: customTranscript,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    labelText: 'Transcript nhập tay cho bản thử',
                    helperText: 'STT thật cần backend',
                  ),
                ),
              ],
              if (pickError != null)
                Text(pickError!, style: const TextStyle(color: Palette.red)),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: processing ? null : startProcess,
                child: Text(
                  processing
                      ? 'Đang xử lý bóc tách…'
                      : (pickedName != null
                            ? 'Lưu metadata và transcript nhập tay'
                            : 'Tiến hành bóc tách (Speech-to-Text)'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ChannelManagementPage extends StatefulWidget {
  const ChannelManagementPage({
    super.key,
    required this.state,
    required this.preferences,
    this.appState,
  });

  final CreatorState state;
  final SharedPreferences preferences;
  final AppState? appState;

  @override
  State<ChannelManagementPage> createState() => _ChannelManagementPageState();
}

class _ChannelManagementPageState extends State<ChannelManagementPage> {
  CreatorState get state => widget.state;

  void _editChannelDialog() {
    final editName = TextEditingController(text: state.channel);
    final editDesc = TextEditingController(text: state.channelDescription);
    var category = state.channelCategory;
    final formKey = GlobalKey<FormState>();

    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDState) => AlertDialog(
          backgroundColor: Palette.paper,
          title: Text('Thông tin kênh', style: editorial(20)),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: editName,
                    maxLength: 60,
                    decoration: const InputDecoration(labelText: 'Tên kênh'),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? 'Nhập tên kênh' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: editDesc,
                    maxLines: 3,
                    maxLength: 300,
                    decoration: const InputDecoration(
                      labelText: 'Giới thiệu kênh',
                      hintText: 'Mô tả góc nhìn, câu chuyện lịch sử của kênh…',
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Chủ đề chính',
                    style: TextStyle(fontSize: 12, color: Palette.muted),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children:
                        [
                              'Lịch sử Việt Nam',
                              'Văn hóa cổ truyền',
                              'Di sản & Danh nhân',
                              'Giai thoại kinh kỳ',
                            ]
                            .map(
                              (c) => ChoiceChip(
                                label: Text(
                                  c,
                                  style: const TextStyle(fontSize: 11),
                                ),
                                selected: category == c,
                                onSelected: (_) =>
                                    setDState(() => category = c),
                              ),
                            )
                            .toList(),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            FilledButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  Navigator.pop(ctx);
                  await state.updateChannelProfile(
                    name: editName.text,
                    description: editDesc.text,
                    category: category,
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Đã cập nhật thông tin kênh!'),
                      ),
                    );
                  }
                }
              },
              child: const Text('Lưu thay đổi'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openChannelArtwork() async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (_) => Scaffold(
          appBar: AppBar(title: const Text('Ảnh đại diện & Ảnh bìa')),
          body: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(state.channel, style: editorial(27)),
              const SizedBox(height: 8),
              const Text(
                'Ảnh xuất hiện trên trang kênh, thẻ podcast và phòng phát sóng trực tiếp.',
                style: TextStyle(fontSize: 13, color: Palette.muted),
              ),
              const SizedBox(height: 24),
              ArtworkEditor(
                preferences: widget.preferences,
                target: 'channel',
                kind: ArtworkKind.channel,
                label: 'Ảnh đại diện kênh',
                guard: state.guardArtwork,
              ),
            ],
          ),
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  void _openChannelPreview() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Eyebrow('XEM TRƯỚC TRANG KÊNH'),
                  IconButton(
                    icon: const Icon(CupertinoIcons.xmark, size: 18),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ArtworkImage(
                artworkReference('channel'),
                width: 72,
                height: 72,
                semanticLabel: 'Ảnh kênh',
              ),
              const SizedBox(height: 12),
              Text(state.channel, style: editorial(24)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  state.channelCategory,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Palette.red,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                state.channelDescription.isNotEmpty
                    ? state.channelDescription
                    : 'Kênh kể chuyện lịch sử trên Sử Ký.',
                style: const TextStyle(fontSize: 13, height: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final approvedDrafts = state.drafts
        .where((d) => d.stage == DraftStage.approved)
        .length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản lý Kênh'),
        actions: [
          IconButton(
            tooltip: 'Xem trước kênh',
            icon: const Icon(CupertinoIcons.eye),
            onPressed: _openChannelPreview,
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: state,
        builder: (context, _) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
          children: [
            // Channel Header Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Palette.soft,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Palette.line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: ArtworkImage(
                          artworkReference('channel'),
                          width: 64,
                          height: 64,
                          semanticLabel: 'Ảnh kênh',
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(state.channel, style: editorial(22)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Palette.red.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                state.channelCategory,
                                style: const TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w600,
                                  color: Palette.red,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    state.channelDescription.isNotEmpty
                        ? state.channelDescription
                        : 'Chưa có lời giới thiệu cho kênh. Hãy bổ sung để thu hút thính giả.',
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: Palette.muted,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: _openChannelArtwork,
                        icon: const Icon(CupertinoIcons.photo, size: 14),
                        label: const Text('Đổi ảnh kênh'),
                      ),
                      FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: Palette.red,
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: _editChannelDialog,
                        icon: const Icon(CupertinoIcons.pencil, size: 14),
                        label: const Text('Chỉnh sửa thông tin'),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Eyebrow('GÓI HỘI VIÊN KÊNH (VIP)'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Palette.paper,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Palette.line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Palette.red.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          CupertinoIcons.star_circle_fill,
                          color: Palette.red,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Gói Hội Viên Độc Quyền',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              '49.000 đ / tháng',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Palette.red,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Đang hoạt động',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: Palette.ink,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    '• Tham gia phòng phát sóng trực tiếp độc quyền (VIP)\n• Nghe trước các tập podcast mới ra mắt\n• Huy hiệu hội viên đặc biệt khi bình luận và tương tác',
                    style: TextStyle(
                      fontSize: 12,
                      height: 1.6,
                      color: Palette.muted,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Eyebrow('NỘI DUNG & THỐNG KÊ KÊNH'),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$approvedDrafts', style: editorial(26)),
                        const SizedBox(height: 4),
                        const Text(
                          'Tập đã duyệt',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Palette.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${state.drafts.length}', style: editorial(26)),
                        const SizedBox(height: 4),
                        const Text(
                          'Tổng bản thảo',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Palette.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class KycManagementPage extends StatefulWidget {
  const KycManagementPage({super.key, required this.state, this.kycRepository});

  final CreatorState state;
  final KycRepository? kycRepository;

  @override
  State<KycManagementPage> createState() => _KycManagementPageState();
}

class _KycManagementPageState extends State<KycManagementPage> {
  CreatorState get state => widget.state;
  bool _isEditing = false;

  void _openKycForm() {
    setState(() => _isEditing = true);
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) {
        final kyc = state.kyc;
        final isApproved = kyc.isApproved;
        final isPending = kyc.status == KycStatus.pending;
        final isRejected = kyc.status == KycStatus.rejected;
        final isNotSubmitted = kyc.status == KycStatus.notSubmitted;

        final shouldShowForm = isNotSubmitted || isRejected || _isEditing;

        if (shouldShowForm) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Xác thực KYC'),
              actions: [
                if (_isEditing && !isNotSubmitted && !isRejected)
                  TextButton(
                    onPressed: () => setState(() => _isEditing = false),
                    child: const Text('Xem hồ sơ'),
                  ),
              ],
            ),
            body: KycSheet(
              state: state,
              showHeader: false,
              onSubmitted: () {
                setState(() => _isEditing = false);
              },
            ),
          );
        }

        final badgeColor = isApproved
            ? const Color(0xFF2E7D32)
            : const Color(0xFFE65100);

        final badgeBg = isApproved
            ? const Color(0xFFE8F5E9)
            : const Color(0xFFFFF3E0);

        final statusText = isApproved
            ? 'HỒ SƠ ĐÃ ĐƯỢC XÁC THỰC'
            : 'HỒ SƠ ĐANG CHỜ THẨM ĐỊNH';

        return Scaffold(
          appBar: AppBar(title: const Text('Xác thực KYC')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
            children: [
              // Status Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: badgeColor.withValues(alpha: 0.35)),
                ),
                child: Row(
                  children: [
                    Icon(
                      isApproved
                          ? CupertinoIcons.checkmark_seal_fill
                          : CupertinoIcons.clock_fill,
                      color: badgeColor,
                      size: 32,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            statusText,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: badgeColor,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            isApproved
                                ? 'Định danh của bạn đã được kiểm duyệt và kích hoạt đầy đủ quyền hạn.'
                                : 'Hồ sơ đã gửi thành công và đang chờ chuyên viên đối soát đối chiếu.',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Palette.ink,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // CARD 1: THÔNG TIN ĐỊNH DANH ỨNG VIÊN
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.paper,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              CupertinoIcons.person_crop_circle_badge_checkmark,
                              size: 18,
                              color: Palette.red,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Thông tin định danh',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: Palette.ink,
                              ),
                            ),
                          ],
                        ),
                        const Text(
                          'User ID #6',
                          style: TextStyle(
                            fontSize: 11,
                            color: Palette.muted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _infoTile(
                      'HỌ VÀ TÊN ĐẦY ĐỦ',
                      kyc.fullName.isNotEmpty ? kyc.fullName : 'Chưa cung cấp',
                    ),
                    const SizedBox(height: 10),
                    _infoTile(
                      'EMAIL TÀI KHOẢN ĐĂNG NHẬP',
                      kyc.userEmail.isNotEmpty
                          ? kyc.userEmail
                          : (state.preferences.getString('userEmail') ??
                                'Chưa đăng nhập'),
                      isMono: true,
                    ),
                    const SizedBox(height: 10),
                    _infoTile(
                      'EMAIL LIÊN HỆ ĐÃ XÁC THỰC',
                      kyc.contactEmail.isNotEmpty
                          ? kyc.contactEmail
                          : (state.preferences.getString('userEmail') ??
                                'Chưa cung cấp'),
                      icon: CupertinoIcons.mail,
                      isMono: true,
                    ),
                    const SizedBox(height: 10),
                    _infoTile(
                      'SỐ ĐIỆN THOẠI ĐÃ BẢO MẬT',
                      _maskPhone(kyc.phone),
                      icon: CupertinoIcons.phone,
                      isMono: true,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // CARD 2: TRẠNG THÁI XÁC THỰC BẢO MẬT HAI LỚP
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.paper,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              CupertinoIcons.checkmark_shield_fill,
                              size: 18,
                              color: Colors.green[700],
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Xác thực bảo mật OTP',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: Palette.ink,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'ĐÃ XÁC THỰC OTP',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.green[800],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Phương thức xác minh',
                            style: TextStyle(
                              fontSize: 10.5,
                              color: Palette.muted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            kyc.verificationMethod.isNotEmpty
                                ? kyc.verificationMethod
                                : 'OTP Hộp thư Email (Brevo HTTPS)',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Thời điểm hoàn tất OTP',
                            style: TextStyle(
                              fontSize: 10.5,
                              color: Palette.muted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            kyc.otpVerifiedAt.isNotEmpty
                                ? kyc.otpVerifiedAt
                                : '16:23 27/10/2026',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // CARD 3: TIỂU SỬ & HỒ SƠ SÁNG TẠO
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.paper,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          CupertinoIcons.globe,
                          size: 18,
                          color: Palette.red,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Tiểu sử & Hồ sơ sáng tạo',
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.bold,
                              color: Palette.ink,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'ĐƯỜNG DẪN PORTFOLIO / KÊNH THAM CHIẾU:',
                      style: TextStyle(
                        fontSize: 10.5,
                        color: Palette.muted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      kyc.portfolioUrl.isNotEmpty
                          ? kyc.portfolioUrl
                          : 'https://porfolio.eraidev.id.vn',
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Palette.red,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'monospace',
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'TIỂU SỬ GIỚI THIỆU BẢN THÂN:',
                      style: TextStyle(
                        fontSize: 10.5,
                        color: Palette.muted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        kyc.bio.isNotEmpty
                            ? kyc.bio
                            : 'Kênh podcast lịch sử Việt Nam',
                        style: const TextStyle(
                          fontSize: 12.5,
                          height: 1.5,
                          color: Palette.ink,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  key: const Key('kyc-action-btn'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Palette.red,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                  ),
                  onPressed: _openKycForm,
                  icon: const Icon(CupertinoIcons.pencil, size: 16),
                  label: const Text(
                    'Cập nhật lại thông tin hồ sơ',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _infoTile(
    String label,
    String value, {
    IconData? icon,
    bool isMono = false,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Palette.soft,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Palette.muted,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 14, color: Palette.muted),
                const SizedBox(width: 6),
              ],
              Expanded(
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Palette.ink,
                    fontFamily: isMono ? 'monospace' : null,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _maskPhone(String? phone) {
    if (phone == null || phone.isEmpty) return 'Chưa liên kết';
    if (phone.length <= 6) return phone;
    return '${phone.substring(0, 3)}•••${phone.substring(phone.length - 3)}';
  }

  String _maskAccount(String? acc) {
    if (acc == null || acc.isEmpty) return 'Chưa liên kết';
    if (acc.length <= 4) return acc;
    return '•••• ${acc.substring(acc.length - 4)}';
  }

  Widget _kycRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: Palette.muted)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
