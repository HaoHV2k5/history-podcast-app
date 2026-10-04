import 'dart:async';

import 'kyc_form.dart';
export 'kyc_form.dart' show KycSheet;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'creator_state.dart';
import 'design.dart';
import 'artwork_editor.dart';
import 'artwork_state.dart';
import 'artwork_image.dart';
import 'narrator_marketplace.dart';
import 'local_file.dart';
import 'workspace_components.dart';

part 'mock/fixtures/studio_videos.dart';

class CreatorStudio extends StatefulWidget {
  const CreatorStudio({super.key, required this.preferences});
  final SharedPreferences preferences;
  @override
  State<CreatorStudio> createState() => _CreatorStudioState();
}

class _CreatorStudioState extends State<CreatorStudio> {
  late final CreatorState state = CreatorState(widget.preferences);
  final name = TextEditingController();
  final desc = TextEditingController();
  final form = GlobalKey<FormState>();
  bool busy = false;
  String? error;
  String draftFilter = 'Cần làm';

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
    itemBuilder: (_) => const [
      PopupMenuItem(value: 'edit', child: Text('Sửa kênh')),
      PopupMenuItem(value: 'artwork', child: Text('Ảnh kênh')),
      PopupMenuItem(value: 'preview', child: Text('Xem trang kênh')),
      PopupMenuItem(
        key: Key('open-marketplace-btn'),
        value: 'narrator',
        child: Text('Thuê Narrator'),
      ),
      PopupMenuItem(
        key: Key('upload-video-stt'),
        value: 'video',
        child: Text('Nhập video mẫu'),
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
          if (!state.demoVerified) ...[
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
            const Text(
              'Kênh thật cần người sáng tạo đủ 18 tuổi và đã được duyệt KYC. Dùng hồ sơ giả lập đáp ứng hai điều kiện này để xem tiếp giao diện.',
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
                    const Row(
                      children: [
                        Icon(
                          CupertinoIcons.hourglass,
                          size: 16,
                          color: Palette.red,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Hồ sơ KYC đang chờ thẩm định (Mô phỏng · UC-01)',
                            style: TextStyle(
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
                              : () =>
                                    act(() => state.simulateKycDecision(true)),
                          child: const Text(
                            'Mô phỏng duyệt: Đạt',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                        OutlinedButton(
                          onPressed: busy
                              ? null
                              : () =>
                                    act(() => state.simulateKycDecision(false)),
                          child: const Text(
                            'Mô phỏng: Từ chối',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
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
                FilledButton(
                  onPressed: busy ? null : () => act(state.useVerifiedFixture),
                  child: const Text('Dùng hồ sơ mẫu đã duyệt'),
                ),
                OutlinedButton.icon(
                  onPressed: busy ? null : openKycSheet,
                  icon: const Icon(CupertinoIcons.person_badge_plus, size: 16),
                  label: const Text('Điền hồ sơ KYC thử nghiệm'),
                ),
              ],
            ),
          ] else if (state.channel.isEmpty) ...[
            Text('02 / Đặt tên kênh', style: editorial(23)),
            const SizedBox(height: 10),
            const Row(
              children: [
                Icon(
                  CupertinoIcons.checkmark_seal_fill,
                  size: 14,
                  color: Palette.red,
                ),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Hồ sơ thử nghiệm · Đã duyệt',
                    style: TextStyle(color: Palette.muted, fontSize: 12),
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
              child: const Text('Tạo kênh thử'),
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
          const SizedBox(height: 24),
          const Text(
            'Studio thử nghiệm · Nội dung lưu trên thiết bị.',
            style: TextStyle(fontSize: 11, color: Palette.muted),
          ),
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
                  StudioNotice('Góp ý mô phỏng\n${d.reason}'),
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
                    'Mở Phát hành nội dung để đưa tập vào danh mục thử.',
                  _ => 'Kiểm tra kịch bản đã lưu trước khi sản xuất.',
                }, style: const TextStyle(height: 1.7)),
                const SizedBox(height: 12),
                const Text(
                  'Các kết quả bên dưới là mô phỏng trên thiết bị; chưa chạy AI hoặc gửi duyệt thật.',
                  style: TextStyle(color: Palette.muted, fontSize: 12),
                ),
                const SizedBox(height: 20),
                if (d == null || dirty || !ready)
                  const Text(
                    'Lưu tên tập, kịch bản và nguồn tham khảo để thử bước kiểm tra nội dung.',
                    style: TextStyle(color: Palette.muted, fontSize: 12),
                  ),
                if (ready &&
                    (d.stage == DraftStage.draft ||
                        d.stage == DraftStage.rejected)) ...[
                  OutlinedButton(
                    onPressed: busy ? null : () => step(DraftStage.checked),
                    child: const Text('Thử kết quả AI: đạt'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: busy
                        ? null
                        : () => step(
                            DraftStage.rejected,
                            reason: 'AI mẫu: bổ sung nguồn cho các mốc thời gian và phân biệt tư liệu với nhận định.',
                          ),
                    child: const Text('Thử kết quả AI: cần sửa'),
                  ),
                ],
                if (ready && d.stage == DraftStage.checked) ...[
                  Text(
                    videoFileName.isNotEmpty
                        ? 'Video mẫu đã nhập · $videoFileSize'
                        : 'Chọn định dạng tập thử',
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
                          ? 'Gửi video mẫu để duyệt'
                          : 'Giả lập sản xuất & gửi duyệt',
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
                  const Text(
                    'Bản thử đang chờ người duyệt. AI đạt chưa đồng nghĩa với được xuất bản.',
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: busy
                        ? null
                        : () => step(
                            DraftStage.rejected,
                            reason: 'Biên tập viên mẫu: ghi rõ tác giả và số trang của nguồn được trích trong phần mở đầu.',
                          ),
                    child: const Text('Thử người duyệt: yêu cầu sửa'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: busy ? null : () => step(DraftStage.approved),
                    child: const Text('Thử người duyệt: chấp thuận'),
                  ),
                ],
                if (d?.stage == DraftStage.approved)
                  const Text(
                    'Đã hoàn thành luồng duyệt thử. Tập này chỉ nằm trong Studio trên thiết bị; chưa xuất bản lên Khám phá.',
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
