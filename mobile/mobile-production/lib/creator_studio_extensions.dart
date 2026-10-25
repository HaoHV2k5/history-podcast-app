import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'components.dart';
import 'creator_state.dart';
import 'design.dart';

class ChannelMembershipPlanSheet extends StatefulWidget {
  const ChannelMembershipPlanSheet({super.key, required this.state});
  final CreatorState state;

  @override
  State<ChannelMembershipPlanSheet> createState() =>
      _ChannelMembershipPlanSheetState();
}

class _ChannelMembershipPlanSheetState
    extends State<ChannelMembershipPlanSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _priceCtrl;
  late final TextEditingController _descCtrl;
  late final TextEditingController _perksCtrl;
  bool _isActive = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final plan = widget.state.membershipPlan;
    _nameCtrl = TextEditingController(
      text: plan?.name ?? 'Tri Âm ${widget.state.channel}',
    );
    _priceCtrl = TextEditingController(
      text: plan != null ? plan.monthlyPrice.round().toString() : '39000',
    );
    _descCtrl = TextEditingController(
      text: plan?.description ??
          'Mở khóa toàn bộ tập chuyên sâu và phòng phát sóng trực tiếp độc quyền.',
    );
    _perksCtrl = TextEditingController(
      text: (plan != null && plan.perks.isNotEmpty)
          ? plan.perks.join('\n')
          : 'Nghe sớm 48 giờ các tập chuyên đề\nTham gia phòng Livestream VIP',
    );
    _isActive = plan?.isActive ?? true;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _priceCtrl.dispose();
    _descCtrl.dispose();
    _perksCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final price = double.tryParse(_priceCtrl.text.trim()) ?? 39000;
      final perks = _perksCtrl.text
          .split('\n')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
      await widget.state.saveMembershipPlan(
        name: _nameCtrl.text,
        monthlyPrice: price,
        description: _descCtrl.text,
        perks: perks,
        status: _isActive ? 'ACTIVE' : 'INACTIVE',
      );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          24,
          16,
          24,
          MediaQuery.viewInsetsOf(context).bottom + 28,
        ),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Eyebrow('CẤU HÌNH HỘI VIÊN KÊNH · CREATOR'),
              const SizedBox(height: 10),
              Text('Gói hội viên tháng', style: editorial(24)),
              const SizedBox(height: 16),
              TextFormField(
                key: const Key('plan-name-input'),
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Tên gói hội viên',
                ),
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'Nhập tên gói hội viên'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                key: const Key('plan-price-input'),
                controller: _priceCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Mức phí hàng tháng (VNĐ)',
                  helperText: 'Tối thiểu 1.000 VNĐ / tháng',
                ),
                validator: (v) {
                  final parsed = double.tryParse(v?.trim() ?? '');
                  if (parsed == null || parsed < 1000) {
                    return 'Mức giá tối thiểu là 1.000 VNĐ';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              TextFormField(
                key: const Key('plan-desc-input'),
                controller: _descCtrl,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Mô tả gói hội viên',
                ),
              ),
              const SizedBox(height: 14),
              TextFormField(
                key: const Key('plan-perks-input'),
                controller: _perksCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Quyền lợi hội viên (mỗi dòng 1 quyền lợi)',
                ),
              ),
              const SizedBox(height: 10),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text(
                  'Đang mở đăng ký gói hội viên',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                ),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: const TextStyle(color: Palette.red, fontSize: 12),
                ),
              ],
              const SizedBox(height: 18),
              FilledButton(
                key: const Key('save-membership-plan-btn'),
                onPressed: _busy ? null : _save,
                child: Text(_busy ? 'Đang lưu gói…' : 'Lưu cấu hình gói hội viên'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CreatorSeriesManagerPage extends StatefulWidget {
  const CreatorSeriesManagerPage({super.key, required this.state});
  final CreatorState state;

  @override
  State<CreatorSeriesManagerPage> createState() =>
      _CreatorSeriesManagerPageState();
}

class _CreatorSeriesManagerPageState extends State<CreatorSeriesManagerPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _createSeries() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.state.createCreatorSeries(
        title: _titleCtrl.text,
        description: _descCtrl.text,
      );
      _titleCtrl.clear();
      _descCtrl.clear();
      if (mounted) {
        setState(() => _busy = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.state,
      builder: (context, _) {
        final seriesList = widget.state.mySeries;
        return Scaffold(
          appBar: AppBar(title: const Text('Quản lý Tuyển tập Series')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            children: [
              const Eyebrow('TUYỂN TẬP CHUYÊN ĐỀ · CREATOR'),
              const SizedBox(height: 10),
              Text('Series của kênh', style: editorial(28)),
              const SizedBox(height: 8),
              const Text(
                'Nhóm các tập kể chuyện theo từng triều đại, chiến dịch hoặc nhân vật lịch sử để thính giả nghe liền mạch.',
                style: TextStyle(color: Palette.muted, height: 1.5),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.line),
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Tạo Series mới', style: editorial(19)),
                      const SizedBox(height: 12),
                      TextFormField(
                        key: const Key('series-title-input'),
                        controller: _titleCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Tên Series chuyên đề',
                          hintText: 'Ví dụ: Tam Quốc Đại Việt · Khúc tráng ca nhà Trần',
                        ),
                        validator: (v) => v == null || v.trim().isEmpty
                            ? 'Nhập tiêu đề Series'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        key: const Key('series-desc-input'),
                        controller: _descCtrl,
                        maxLines: 2,
                        decoration: const InputDecoration(
                          labelText: 'Mô tả chuyên đề',
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          _error!,
                          style: const TextStyle(
                            color: Palette.red,
                            fontSize: 12,
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        key: const Key('submit-create-series-btn'),
                        onPressed: _busy ? null : _createSeries,
                        icon: const Icon(CupertinoIcons.add, size: 16),
                        label: Text(
                          _busy ? 'Đang tạo Series…' : 'Tạo Series chuyên đề',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Danh sách Series (${seriesList.length})',
                style: editorial(21),
              ),
              const SizedBox(height: 12),
              if (seriesList.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Text(
                    'Chưa có Series nào. Hãy tạo Series đầu tiên ở biểu mẫu phía trên.',
                    style: TextStyle(color: Palette.muted, fontSize: 13),
                  ),
                )
              else
                ...seriesList.map(
                  (s) => Container(
                    key: Key('creator-series-item-${s.id}'),
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Palette.paper,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(s.title, style: editorial(18)),
                              if (s.description != null &&
                                  s.description!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  s.description!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Palette.muted,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 6),
                              Text(
                                '${s.itemCount} tập · ${s.status}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Palette.red,
                                  fontFeatures: [FontFeature.tabularFigures()],
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          key: Key('delete-series-${s.id}'),
                          tooltip: 'Xóa Series',
                          icon: const Icon(
                            CupertinoIcons.trash,
                            size: 18,
                            color: Palette.red,
                          ),
                          onPressed: () =>
                              widget.state.deleteCreatorSeries(s.id),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class AiWhiteboardPipelinePage extends StatefulWidget {
  const AiWhiteboardPipelinePage({super.key, required this.state});
  final CreatorState state;

  @override
  State<AiWhiteboardPipelinePage> createState() =>
      _AiWhiteboardPipelinePageState();
}

class _AiWhiteboardPipelinePageState extends State<AiWhiteboardPipelinePage> {
  final _topicCtrl = TextEditingController();
  final _scriptCtrl = TextEditingController();
  final _renderTitleCtrl = TextEditingController();
  String _renderMode = 'whiteboard';
  String? _selectedVoiceId;
  bool _busy = false;
  String? _statusNote;

  @override
  void initState() {
    super.initState();
    _selectedVoiceId = widget.state.aiSettings?.preferredVoiceId ??
        (widget.state.aiVoices.isNotEmpty
            ? widget.state.aiVoices.first.voiceId
            : 'vi-VN-NamMinhNeural');
  }

  @override
  void dispose() {
    _topicCtrl.dispose();
    _scriptCtrl.dispose();
    _renderTitleCtrl.dispose();
    super.dispose();
  }

  Future<void> _runStep(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _statusNote = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) {
        setState(() => _statusNote = e.toString());
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.state,
      builder: (context, _) {
        final voices = widget.state.aiVoices;
        final storyboard = widget.state.lastStoryboard;
        final verification = widget.state.lastVerification;
        final job = widget.state.activeRenderJob;
        final videos = widget.state.studioVideos;

        return Scaffold(
          key: const Key('ai-pipeline-page'),
          appBar: AppBar(title: const Text('AI Studio · Dựng Video Sử Việt')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 36),
            children: [
              const Eyebrow('WHITEBOARD & AUDIO PODCAST AI · 6 BƯỚC'),
              const SizedBox(height: 10),
              Text('Xưởng sản xuất AI Sử Ký', style: editorial(28)),
              const SizedBox(height: 8),
              const Text(
                'Đối chiếu sử liệu RAG, sinh kịch bản phân cảnh, thẩm định AI Shield và xuất bản video hoạt họa bảng trắng hoặc podcast âm thanh.',
                style: TextStyle(color: Palette.muted, height: 1.5),
              ),
              const SizedBox(height: 24),

              // BƯỚC 1: GIỌNG ĐỌC & CẤU HÌNH AI
              Text('01 / Giọng đọc thuyết minh AI', style: editorial(20)),
              const SizedBox(height: 10),
              if (voices.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: voices
                      .map(
                        (v) => ChoiceChip(
                          key: Key('ai-voice-${v.voiceId}'),
                          label: Text(
                            v.name,
                            style: const TextStyle(fontSize: 12),
                          ),
                          selected: _selectedVoiceId == v.voiceId,
                          onSelected: (_) =>
                              setState(() => _selectedVoiceId = v.voiceId),
                        ),
                      )
                      .toList(),
                )
              else
                const Text(
                  'Mặc định: Giọng đọc Nam Minh (Edge-TTS Tiếng Việt chuẩn).',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton(
                  key: const Key('save-ai-settings-btn'),
                  onPressed: _busy
                      ? null
                      : () => _runStep(() async {
                            await widget.state.saveAiSettings(
                              preferredVoiceId: _selectedVoiceId,
                              voiceProvider: 'EDGE_TTS',
                            );
                            _statusNote = 'Đã lưu cấu hình giọng đọc AI.';
                          }),
                  child: const Text('Lưu cấu hình giọng đọc'),
                ),
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 20),

              // BƯỚC 2: SINH STORYBOARD RAG
              Text('02 / Sinh kịch bản phân cảnh (Storyboard RAG)',
                  style: editorial(20)),
              const SizedBox(height: 10),
              TextField(
                key: const Key('ai-topic-input'),
                controller: _topicCtrl,
                decoration: const InputDecoration(
                  labelText: 'Chủ đề hoặc sự kiện lịch sử cần biên tập',
                  hintText: 'Ví dụ: Chiến dịch Chi Lăng - Xương Giang năm 1427',
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                key: const Key('generate-storyboard-btn'),
                onPressed: _busy
                    ? null
                    : () => _runStep(() async {
                          final topic = _topicCtrl.text.trim().isNotEmpty
                              ? _topicCtrl.text.trim()
                              : 'Chiến thắng Bạch Đằng 938';
                          final res = await widget.state.generateAiStoryboard(
                            topic: topic,
                          );
                          if (_renderTitleCtrl.text.trim().isEmpty) {
                            _renderTitleCtrl.text = topic;
                          }
                          final summary =
                              res['summary']?.toString() ??
                              res['narration']?.toString() ??
                              'Kịch bản phân cảnh cho $topic';
                          if (_scriptCtrl.text.trim().isEmpty) {
                            _scriptCtrl.text = summary;
                          }
                        }),
                icon: const Icon(CupertinoIcons.sparkles, size: 16),
                label: const Text('Sinh Storyboard từ RAG Lịch sử'),
              ),
              if (storyboard != null) ...[
                const SizedBox(height: 12),
                Container(
                  key: const Key('storyboard-preview-box'),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Palette.soft,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Palette.line),
                  ),
                  child: Text(
                    'Đã sinh Storyboard: ${storyboard['summary'] ?? storyboard['topic'] ?? 'Hoàn tất phân cảnh'}',
                    style: const TextStyle(fontSize: 12, height: 1.5),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 20),

              // BƯỚC 3: THẨM ĐỊNH KỊCH BẢN SỬ LIỆU
              Text('03 / Thẩm định kịch bản sử liệu', style: editorial(20)),
              const SizedBox(height: 10),
              TextField(
                key: const Key('ai-script-input'),
                controller: _scriptCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Kịch bản thuyết minh lịch sử',
                  hintText: 'Nội dung kịch bản sẽ được đối chiếu với sử liệu…',
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                key: const Key('verify-script-btn'),
                onPressed: _busy
                    ? null
                    : () => _runStep(() async {
                          final text = _scriptCtrl.text.trim().isNotEmpty
                              ? _scriptCtrl.text.trim()
                              : 'Năm 938, Ngô Quyền bày trận cọc trên sông Bạch Đằng.';
                          await widget.state.verifyHistoricalScript(text);
                        }),
                icon: const Icon(CupertinoIcons.checkmark_shield, size: 16),
                label: const Text('Thẩm định kịch bản với kho sử liệu'),
              ),
              if (verification != null) ...[
                const SizedBox(height: 12),
                Container(
                  key: const Key('verification-result-box'),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Palette.soft,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Palette.line),
                  ),
                  child: Text(
                    'Kết quả thẩm định: ${verification['feedback'] ?? verification['status'] ?? 'Đạt chuẩn sử liệu'} (Điểm: ${verification['accuracyScore'] ?? 95}/100)',
                    style: const TextStyle(
                      fontSize: 12,
                      height: 1.5,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 20),

              // BƯỚC 4 & 5: DỰNG VIDEO & KIỂM TRA TIẾN ĐỘ RENDER
              Text('04 / Khởi chạy Render & Theo dõi Job',
                  style: editorial(20)),
              const SizedBox(height: 10),
              TextField(
                key: const Key('ai-render-title-input'),
                controller: _renderTitleCtrl,
                decoration: const InputDecoration(
                  labelText: 'Tiêu đề tập xuất bản',
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('Hoạt họa Bảng trắng (Whiteboard)'),
                    selected: _renderMode == 'whiteboard',
                    onSelected: (_) =>
                        setState(() => _renderMode = 'whiteboard'),
                  ),
                  ChoiceChip(
                    label: const Text('Audio Podcast kèm phụ đề'),
                    selected: _renderMode == 'audio_podcast',
                    onSelected: (_) =>
                        setState(() => _renderMode = 'audio_podcast'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                key: const Key('start-render-btn'),
                onPressed: _busy
                    ? null
                    : () => _runStep(() async {
                          final titleText =
                              _renderTitleCtrl.text.trim().isNotEmpty
                              ? _renderTitleCtrl.text.trim()
                              : 'Hải chiến Bạch Đằng 938';
                          final scriptText = _scriptCtrl.text.trim().isNotEmpty
                              ? _scriptCtrl.text.trim()
                              : 'Năm 938, Ngô Quyền đại phá quân Nam Hán trên sông Bạch Đằng.';
                          await widget.state.startAiRender(
                            title: titleText,
                            scriptText: scriptText,
                            renderMode: _renderMode,
                            voiceName: _selectedVoiceId,
                          );
                        }),
                icon: const Icon(CupertinoIcons.film, size: 16),
                label: const Text('Khởi chạy Render Video / Podcast'),
              ),
              if (job != null) ...[
                const SizedBox(height: 14),
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
                      Text(
                        'Mã tiến trình: ${job['jobId']} · Trạng thái: ${job['status']}',
                        key: const Key('render-job-status'),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        key: const Key('poll-render-job-btn'),
                        onPressed: _busy
                            ? null
                            : () => _runStep(() async {
                                  await widget.state.pollRenderJobStatus(
                                    job['jobId'].toString(),
                                    artifactId: (job['artifactId'] as num?)
                                        ?.toInt(),
                                  );
                                }),
                        child: const Text('Cập nhật tiến độ Render'),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 20),

              // BƯỚC 6: DANH SÁCH VIDEO STUDIO & SUBMIT AI SHIELD PUBLISH
              Text('05 / Kiểm duyệt AI Shield & Xuất bản',
                  style: editorial(20)),
              const SizedBox(height: 10),
              if (videos.isEmpty)
                const Text(
                  'Chưa có video nào trong kho Studio.',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                )
              else
                ...videos.map((v) {
                  final contentId = (v['contentId'] as num?)?.toInt() ?? 0;
                  final status = (v['status'] ?? 'PROCESSING').toString();
                  final shield =
                      (v['aiShieldTierLabel'] ?? v['aiShieldTier'] ?? 'Chờ quét AI Shield')
                          .toString();
                  return Container(
                    key: Key('studio-video-card-$contentId'),
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Palette.paper,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (v['title'] ?? 'Tập video').toString(),
                          style: editorial(18),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Trạng thái: $status · AI Shield: $shield',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Palette.muted,
                          ),
                        ),
                        const SizedBox(height: 10),
                        FilledButton.tonal(
                          key: Key('submit-publish-video-$contentId'),
                          onPressed: _busy
                              ? null
                              : () => _runStep(() async {
                                    await widget.state
                                        .submitStudioVideoForPublish(contentId);
                                  }),
                          child: const Text('Gửi duyệt AI Shield & Xuất bản'),
                        ),
                      ],
                    ),
                  );
                }),
              if (_statusNote != null) ...[
                const SizedBox(height: 12),
                Text(
                  _statusNote!,
                  style: const TextStyle(fontSize: 12, color: Palette.red),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
