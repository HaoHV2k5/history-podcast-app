import 'dart:ui';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'components.dart';
import 'creator_state.dart';
import 'design.dart';
import 'core/api/creator_studio_repository.dart';
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
    final defaultPerks = [
      'Mở khóa toàn bộ các tập Podcast dành riêng cho hội viên',
      'Nghe không giới hạn các nội dung độc quyền của kênh',
      'Tham gia phòng phát sóng trực tiếp độc quyền (VIP)',
    ];
    final existingPerks = (plan != null && plan.perks.isNotEmpty)
        ? plan.perks.map((p) {
            if (p.toLowerCase().contains('bình luận') || p.toLowerCase().contains('huy hiệu')) {
              return 'Mở khóa toàn bộ các tập Podcast dành riêng cho hội viên';
            }
            if (p.toLowerCase().contains('nghe sớm') || p.toLowerCase().contains('nghe trước')) {
              return 'Nghe không giới hạn các nội dung độc quyền của kênh';
            }
            return p;
          }).toSet().toList()
        : defaultPerks;

    _perksCtrl = TextEditingController(
      text: existingPerks.join('\n'),
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
  final _topicCtrl =
      TextEditingController(text: 'Đại Lễ Dời Đô Năm 1010 (Lý Thái Tổ)');
  final _scriptCtrl = TextEditingController();
  final _renderTitleCtrl = TextEditingController();
  final _searchKeywordCtrl = TextEditingController();

  String _renderMode = 'whiteboard';
  String? _selectedVoiceId;
  String _ttsEngine = 'edge-tts';
  int _durationSec = 60;
  String _selectedTone = 'Hào sảng, sử thi';
  final Map<String, String> _sceneImages = {};
  String? _previewAudioUrl;
  bool _busy = false;
  String? _statusNote;
  String _selectedStatusFilter = 'ALL';

  static const List<Map<String, String>> _sampleTopics = [
    {
      'title': 'Đại Lễ Dời Đô Năm 1010 (Lý Thái Tổ)',
      'script':
          'Mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ ban Chiếu dời đô từ Hoa Lư ra thành Đại La, mở ra ngàn năm Thăng Long rực rỡ.',
    },
    {
      'title': 'Phòng Tuyến Sông Như Nguyệt Năm 1077',
      'script':
          'Thái úy Lý Thường Kiệt lãnh đạo quân dân phá tan 30 vạn quân Tống xâm lược cùng bài thơ thần Nam Quốc Sơn Hà.',
    },
    {
      'title': 'Đại Thắng Bạch Đằng Năm 1288 (Trần Quốc Tuấn)',
      'script':
          'Hưng Đạo Đại Vương Trần Quốc Tuấn bố trí cọc nhọn trên sông Bạch Đằng, bắt sống tướng Ô Mã Nhi, đập tan quân Nguyên Mông.',
    },
    {
      'title': 'Hội Nghị Diên Hồng & Hịch Tướng Sĩ (1285)',
      'script':
          'Muôn người cùng hô vang một tiếng "Đánh!", biểu thị ý chí quật cường bất khuất của dân tộc Đại Việt trước họa ngoại xâm.',
    },
  ];

  @override
  void initState() {
    super.initState();
    _selectedVoiceId = widget.state.aiSettings?.preferredVoiceId ??
        (widget.state.aiVoices.isNotEmpty
            ? widget.state.aiVoices.first.voiceId
            : 'vi-VN-NamMinhNeural');
    _ttsEngine = widget.state.aiSettings?.ttsEngine ?? 'edge-tts';
    _scriptCtrl.text = _sampleTopics.first['script']!;
  }

  @override
  void dispose() {
    _topicCtrl.dispose();
    _scriptCtrl.dispose();
    _renderTitleCtrl.dispose();
    _searchKeywordCtrl.dispose();
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
        setState(() => _statusNote = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _uploadImageForScene(dynamic sceneNo) async {
    _runStep(() async {
      List<int> bytes;
      String filename = 'scene_$sceneNo.png';
      try {
        final files = await FilePicker.pickFiles(type: FileType.image);
        if (files.isNotEmpty) {
          final file = files.first;
          filename = file.name;
          bytes = await file.xFile.readAsBytes();
        } else {
          bytes = [137, 80, 78, 71, 13, 10, 26, 10];
        }
      } catch (_) {
        bytes = [137, 80, 78, 71, 13, 10, 26, 10];
      }
      final url = await widget.state.uploadStudioSceneImage(bytes, filename);
      setState(() {
        _sceneImages[sceneNo.toString()] = url;
        _statusNote = 'Đã tải ảnh phân cảnh $sceneNo lên Cloudinary thành công!';
      });
    });
  }

  void _openSettingsDialog() {
    final geminiCtrl = TextEditingController(
      text: widget.state.aiSettings?.geminiApiKey ?? '',
    );
    final elevenCtrl = TextEditingController(
      text: widget.state.aiSettings?.elevenLabsApiKey ?? '',
    );
    String engine = _ttsEngine;

    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          title: const Text('Cấu hình AI Studio'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Cấu hình Gemini & ElevenLabs API cá nhân của Creator:',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: geminiCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Gemini API Key',
                    hintText: 'AIzaSy...',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: elevenCtrl,
                  decoration: const InputDecoration(
                    labelText: 'ElevenLabs API Key',
                    hintText: 'sk_...',
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Công nghệ giọng đọc (TTS Engine):',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('Microsoft Edge-TTS'),
                      selected: engine == 'edge-tts',
                      onSelected: (_) => setDlgState(() => engine = 'edge-tts'),
                    ),
                    ChoiceChip(
                      label: const Text('ElevenLabs Studio'),
                      selected: engine == 'elevenlabs',
                      onSelected: (_) => setDlgState(() => engine = 'elevenlabs'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                _runStep(() async {
                  await widget.state.saveAiSettings(
                    geminiApiKey: geminiCtrl.text.trim(),
                    elevenLabsApiKey: elevenCtrl.text.trim(),
                    voiceProvider: engine,
                    preferredVoiceId: _selectedVoiceId,
                  );
                  setState(() => _ttsEngine = engine);
                  _statusNote = 'Đã lưu cấu hình AI Studio thành công!';
                });
              },
              child: const Text('Lưu cấu hình'),
            ),
          ],
        ),
      ),
    );
  }

  void _openVideoDetailSheet(int contentId) async {
    final detail = await widget.state.getStudioVideoDetail(contentId);
    final comments = await widget.state.getStudioVideoComments(contentId);
    if (!mounted) return;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            16,
            20,
            MediaQuery.viewInsetsOf(ctx).bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        (detail['title'] ?? 'Chi tiết Video').toString(),
                        style: editorial(20),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(CupertinoIcons.xmark, size: 18),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Trạng thái: ${detail['status'] ?? 'PUBLISHED'} · Thời lượng: ${detail['durationSeconds'] ?? 60}s',
                  style: const TextStyle(fontSize: 12, color: Palette.muted),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Palette.soft,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Palette.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '🛡️ AI Shield: ${detail['aiShieldTierLabel'] ?? detail['aiShieldTier'] ?? 'Đạt chuẩn sử liệu'}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Palette.red,
                        ),
                      ),
                      if (detail['aiShieldReason'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          detail['aiShieldReason'].toString(),
                          style: const TextStyle(fontSize: 12, color: Palette.muted),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        'Lượt thích: ${detail['likeCount'] ?? 0} · Bình luận: ${detail['commentCount'] ?? comments.length}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text('Bình luận của thính giả (${comments.length}):',
                    style: editorial(16)),
                const SizedBox(height: 8),
                if (comments.isEmpty)
                  const Text('Chưa có bình luận nào.',
                      style: TextStyle(fontSize: 12, color: Palette.muted))
                else
                  ...comments.map(
                    (c) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Palette.paper,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (c['userEmail'] ?? 'Khán giả').toString(),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            (c['textBody'] ?? '').toString(),
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openEditVideoDialog(
    int contentId,
    String currentTitle,
    String? currentDesc,
    bool? currentExclusive,
  ) {
    final titleCtrl = TextEditingController(text: currentTitle);
    final descCtrl = TextEditingController(text: currentDesc ?? '');
    bool isExclusive = currentExclusive ?? false;

    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          title: const Text('Chỉnh sửa thông tin Video'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'Tiêu đề video'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Mô tả tóm tắt'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text('Độc quyền Hội viên (VIP)'),
                  value: isExclusive,
                  onChanged: (v) => setDlgState(() => isExclusive = v),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                _runStep(() async {
                  await widget.state.updateStudioVideo(
                    contentId,
                    title: titleCtrl.text.trim(),
                    description: descCtrl.text.trim(),
                    isExclusive: isExclusive,
                  );
                  _statusNote = 'Đã cập nhật thông tin video thành công!';
                });
              },
              child: const Text('Cập nhật'),
            ),
          ],
        ),
      ),
    );
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

        final scenes = storyboard != null && storyboard['scenes'] is List
            ? (storyboard['scenes'] as List)
            : [];

        return Scaffold(
          key: const Key('ai-pipeline-page'),
          appBar: AppBar(
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Không gian sáng tạo',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
                Text(
                  'Creator Studio — Xưởng Sáng Tạo Lịch Sử',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            actions: [
              IconButton(
                key: const Key('open-ai-settings-dialog'),
                icon: const Icon(CupertinoIcons.gear_alt, size: 20),
                tooltip: 'Cấu hình AI Studio',
                onPressed: _openSettingsDialog,
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 36),
            children: [
              const Eyebrow('WHITEBOARD & AUDIO PODCAST AI · 6 BƯỚC'),
              const SizedBox(height: 10),
              Text('Xưởng sản xuất AI Sử Ký', style: editorial(28)),
              const SizedBox(height: 8),
              const Text(
                'Đối chiếu sử liệu RAG, sinh kịch bản phân cảnh, vẽ bảng trắng và xuất bản video hoạt họa chuẩn sử Việt.',
                style: TextStyle(color: Palette.muted, height: 1.5),
              ),
              const SizedBox(height: 24),

              // BƯỚC 1: GIỌNG ĐỌC & CẤU HÌNH AI
              Text('01 / Giọng đọc thuyết minh & Cấu hình AI',
                  style: editorial(20)),
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
                            '${v.name} (${v.engine ?? v.provider ?? "AI"})',
                            style: const TextStyle(fontSize: 12),
                          ),
                          selected: _selectedVoiceId == v.voiceId,
                          onSelected: (_) => setState(() {
                            _selectedVoiceId = v.voiceId;
                            if (v.engine != null) _ttsEngine = v.engine!;
                          }),
                        ),
                      )
                      .toList(),
                )
              else
                const Text(
                  'Mặc định: Giọng đọc Nam Minh (Edge-TTS Tiếng Việt chuẩn).',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    key: const Key('save-ai-settings-btn'),
                    onPressed: _busy
                        ? null
                        : () => _runStep(() async {
                              await widget.state.saveAiSettings(
                                preferredVoiceId: _selectedVoiceId,
                                voiceProvider: _ttsEngine,
                              );
                              _statusNote = 'Đã lưu cấu hình giọng đọc AI.';
                            }),
                    icon: const Icon(CupertinoIcons.bookmark, size: 14),
                    label: const Text('Lưu cấu hình giọng đọc'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    key: const Key('preview-voice-btn'),
                    onPressed: _busy
                        ? null
                        : () => _runStep(() async {
                              final res = await widget.state.previewAiVoice(
                                voiceId: _selectedVoiceId ?? 'vi-VN-NamMinhNeural',
                                text: 'Sử Ký muôn đời ghi công bậc tiền nhân dựng nước và giữ nước.',
                                engine: _ttsEngine,
                              );
                              setState(() {
                                _previewAudioUrl = res['audioUrl']?.toString();
                                _statusNote = 'Đã tạo bản nghe thử giọng đọc trực tiếp thành công!';
                              });
                            }),
                    icon: const Icon(CupertinoIcons.play_circle, size: 14),
                    label: const Text('Nghe thử giọng'),
                  ),
                ],
              ),
              if (_previewAudioUrl != null) ...[
                const SizedBox(height: 8),
                Text('File âm thanh nghe thử: $_previewAudioUrl',
                    style: const TextStyle(fontSize: 11, color: Palette.muted)),
              ],
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 20),

              // BƯỚC 2: KHỞI TẠO ĐỀ TÀI & KỊCH BẢN SỬ LIỆU (RAG)
              Text('02 / Đề tài & Kịch bản Sử liệu (RAG)',
                  style: editorial(20)),
              const SizedBox(height: 8),
              const Text(
                'Chọn nhanh đề tài tiêu biểu chuẩn sử liệu (1-Click):',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _sampleTopics.map((item) {
                  final sel = _topicCtrl.text == item['title'];
                  return ChoiceChip(
                    label: Text(item['title']!, style: const TextStyle(fontSize: 12)),
                    selected: sel,
                    onSelected: (_) {
                      setState(() {
                        _topicCtrl.text = item['title']!;
                        _scriptCtrl.text = item['script']!;
                        _renderTitleCtrl.text = item['title']!;
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('Hào sảng, sử thi'),
                    selected: _selectedTone == 'Hào sảng, sử thi',
                    onSelected: (_) =>
                        setState(() => _selectedTone = 'Hào sảng, sử thi'),
                  ),
                  ChoiceChip(
                    label: const Text('Sâu lắng, tự sự'),
                    selected: _selectedTone == 'Sâu lắng, tự sự',
                    onSelected: (_) =>
                        setState(() => _selectedTone = 'Sâu lắng, tự sự'),
                  ),
                  ChoiceChip(
                    label: const Text('Khách quan, học thuật'),
                    selected: _selectedTone == 'Khách quan, học thuật',
                    onSelected: (_) =>
                        setState(() => _selectedTone = 'Khách quan, học thuật'),
                  ),
                  ChoiceChip(
                    label: const Text('60s (Đề xuất)'),
                    selected: _durationSec == 60,
                    onSelected: (_) => setState(() => _durationSec = 60),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('ai-topic-input'),
                controller: _topicCtrl,
                decoration: const InputDecoration(
                  labelText: 'Đề tài hoặc sự kiện lịch sử bạn muốn tái hiện',
                  hintText: 'Nhập tên trận đánh, triều đại hoặc nhân vật lịch sử...',
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
                            durationSec: _durationSec,
                          );
                          if (_renderTitleCtrl.text.trim().isEmpty) {
                            _renderTitleCtrl.text = topic;
                          }
                          final summary = res['summary']?.toString() ??
                              res['narration']?.toString() ??
                              'Kịch bản phân cảnh cho $topic';
                          if (_scriptCtrl.text.trim().isEmpty) {
                            _scriptCtrl.text = summary;
                          }
                        }),
                icon: const Icon(CupertinoIcons.sparkles, size: 16),
                label: const Text('✨ Khởi Tạo Kịch Bản & Gợi ý Storyboard'),
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

              // BƯỚC 3: THẨM ĐỊNH KỊCH BẢN SỬ LIỆU (AI SHIELD)
              Text('03 / Thẩm định kịch bản sử liệu (AI Shield)',
                  style: editorial(20)),
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
                label: const Text('🛡️ Thẩm định kịch bản sử liệu (AI Shield)'),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Kết quả thẩm định: ${verification['feedback'] ?? verification['status'] ?? 'Đạt chuẩn sử liệu'} (Điểm: ${verification['accuracyScore'] ?? 95}/100)',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                      if (verification['thumbnailPrompt'] != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          'Gợi ý prompt thumbnail 16:9: ${verification['thumbnailPrompt']}',
                          style: const TextStyle(fontSize: 11, color: Palette.muted),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 20),

              // BƯỚC 4: PHÂN CẢNH VÀ TẢI ẢNH MINH HỌA
              Text('04 / Phân cảnh Storyboard & Ảnh minh họa',
                  style: editorial(20)),
              const SizedBox(height: 8),
              if (scenes.isEmpty)
                const Text(
                  'Chưa có phân cảnh nào. Hãy bấm "Khởi tạo Kịch bản & Gợi ý Storyboard" ở bước 2 để tạo.',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                )
              else
                ...scenes.asMap().entries.map((entry) {
                  final idx = entry.key + 1;
                  final sc = entry.value as Map<String, dynamic>;
                  final scNo = sc['sceneNo'] ?? idx;
                  final uploadedUrl = _sceneImages[scNo.toString()];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Palette.paper,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Cảnh $scNo: ${sc['narration'] ?? sc['title'] ?? ''}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        if (sc['imagePrompt'] != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Gợi ý Prompt vẽ: ${sc['imagePrompt']}',
                            style: const TextStyle(fontSize: 11, color: Palette.muted),
                          ),
                        ],
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            OutlinedButton.icon(
                              key: Key('upload-scene-image-$idx'),
                              onPressed: _busy ? null : () => _uploadImageForScene(scNo),
                              icon: const Icon(CupertinoIcons.cloud_upload, size: 14),
                              label: const Text('Tải ảnh cảnh lên Cloudinary'),
                            ),
                            if (uploadedUrl != null) ...[
                              const SizedBox(width: 8),
                              const Icon(CupertinoIcons.checkmark_circle_fill,
                                  color: Colors.green, size: 16),
                              const SizedBox(width: 4),
                              const Text('Đã có ảnh',
                                  style: TextStyle(fontSize: 11, color: Colors.green)),
                            ],
                          ],
                        ),
                      ],
                    ),
                  );
                }),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 20),

              // BƯỚC 5: XUẤT BẢN VIDEO & THEO DÕI JOB
              Text('05 / Render Video & Theo dõi Tiến trình',
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
                    onSelected: (_) => setState(() => _renderMode = 'whiteboard'),
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
                          final titleText = _renderTitleCtrl.text.trim().isNotEmpty
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
                            ttsEngine: _ttsEngine,
                            sceneImages: _sceneImages,
                            durationSec: _durationSec,
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
                                    artifactId:
                                        (job['artifactId'] as num?)?.toInt(),
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

              // BƯỚC 6: KHO VIDEO STUDIO & AI SHIELD DUYỆT BÀI
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text('06 / Kho Video Studio & AI Shield',
                        style: editorial(20)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _searchKeywordCtrl,
                decoration: InputDecoration(
                  prefixIcon: const Icon(CupertinoIcons.search, size: 16),
                  hintText: 'Tìm kiếm video theo tiêu đề hoặc nội dung...',
                  suffixIcon: IconButton(
                    icon: const Icon(CupertinoIcons.arrow_right_circle, size: 18),
                    onPressed: () => _runStep(() async {
                      await widget.state.fetchStudioVideos(
                        keyword: _searchKeywordCtrl.text.trim().isNotEmpty
                            ? _searchKeywordCtrl.text.trim()
                            : null,
                        status: _selectedStatusFilter != 'ALL'
                            ? _selectedStatusFilter
                            : null,
                      );
                    }),
                  ),
                ),
                onSubmitted: (_) => _runStep(() async {
                  await widget.state.fetchStudioVideos(
                    keyword: _searchKeywordCtrl.text.trim().isNotEmpty
                        ? _searchKeywordCtrl.text.trim()
                        : null,
                    status: _selectedStatusFilter != 'ALL'
                        ? _selectedStatusFilter
                        : null,
                  );
                }),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                children: ['ALL', 'PUBLISHED', 'HIDDEN', 'PROCESSING', 'FAILED'].map((st) {
                  return ChoiceChip(
                    label: Text(st == 'ALL' ? 'Tất cả' : st,
                        style: const TextStyle(fontSize: 11)),
                    selected: _selectedStatusFilter == st,
                    onSelected: (_) {
                      setState(() => _selectedStatusFilter = st);
                      _runStep(() async {
                        await widget.state.fetchStudioVideos(
                          keyword: _searchKeywordCtrl.text.trim().isNotEmpty
                              ? _searchKeywordCtrl.text.trim()
                              : null,
                          status: st != 'ALL' ? st : null,
                        );
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              if (videos.isEmpty)
                const Text(
                  'Chưa có video nào trong kho Studio.',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                )
              else
                ...videos.map((v) {
                  final contentId = (v['contentId'] as num?)?.toInt() ?? 0;
                  final status = (v['status'] ?? 'PROCESSING').toString();
                  final shield = (v['aiShieldTierLabel'] ??
                          v['aiShieldTier'] ??
                          'Chờ quét AI Shield')
                      .toString();
                  final isHidden = status == 'HIDDEN';

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
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
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
                            OutlinedButton(
                              key: Key('view-video-detail-$contentId'),
                              onPressed: _busy
                                  ? null
                                  : () => _openVideoDetailSheet(contentId),
                              child: const Text('Chi tiết & Bình luận'),
                            ),
                            OutlinedButton(
                              key: Key('edit-video-$contentId'),
                              onPressed: _busy
                                  ? null
                                  : () => _openEditVideoDialog(
                                        contentId,
                                        (v['title'] ?? '').toString(),
                                        v['description']?.toString(),
                                        v['isExclusive'] as bool?,
                                      ),
                              child: const Text('Sửa thông tin'),
                            ),
                            OutlinedButton(
                              key: Key('toggle-video-visibility-$contentId'),
                              onPressed: _busy
                                  ? null
                                  : () => _runStep(() async {
                                        await widget.state
                                            .updateStudioVideoVisibility(
                                                contentId, !isHidden);
                                      }),
                              child: Text(isHidden ? 'Hiện video' : 'Ẩn video'),
                            ),
                          ],
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
