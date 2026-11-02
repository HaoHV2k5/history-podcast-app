import 'dart:async';
import 'dart:math';
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

class HistoricalTopicData {
  final String id;
  final String dynasty;
  final String dynastyName;
  final String title;
  final String shortTitle;
  final String cardSubtitle;
  final String figure;
  final String desc;
  final String era;
  final String sourceBook;
  final String excerpt;
  final int suggestedDuration;
  final List<String> tags;

  const HistoricalTopicData({
    required this.id,
    required this.dynasty,
    required this.dynastyName,
    required this.title,
    required this.shortTitle,
    required this.cardSubtitle,
    required this.figure,
    required this.desc,
    required this.era,
    required this.sourceBook,
    required this.excerpt,
    required this.suggestedDuration,
    required this.tags,
  });
}

const List<HistoricalTopicData> kHistoricalTopicSuggestions = [
  HistoricalTopicData(
    id: 'doi-do-1010',
    dynasty: 'ly',
    dynastyName: 'Triều Lý (1009 – 1225)',
    title: 'Đại Lễ Dời Đô Năm 1010 (Lý Thái Tổ)',
    shortTitle: 'Đại Lễ Dời Đô 1010',
    cardSubtitle: 'Lý Thái Tổ • 1009 – 1225',
    figure: 'Vua Lý Thái Tổ (Lý Công Uẩn)',
    desc:
        'Mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ ban Chiếu dời đô từ cố đô Hoa Lư ra thành Đại La. Thuyền ngự vừa đỗ dưới chân thành thì có rồng vàng bay vút lên trời xanh, nhân đó đổi tên Đại La thành Thăng Long.',
    era: 'Năm Canh Tuất 1010',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư • Quyển II',
    excerpt:
        'Vua thấy thành cũ Đại La ở giữa khu vực trời đất, có thế rồng cuộn hổ ngồi, chính giữa nam bắc đông tây, tiện nghi núi sông sau trước... Muôn vật hết sức tươi tốt phồn thịnh.',
    suggestedDuration: 60,
    tags: ['Chiếu Dời Đô', 'Thăng Long', 'Rồng Vàng', 'Định Đô'],
  ),
  HistoricalTopicData(
    id: 'nhu-nguyet-1077',
    dynasty: 'ly',
    dynastyName: 'Triều Lý (1009 – 1225)',
    title: 'Phòng Tuyến Sông Như Nguyệt Năm 1077',
    shortTitle: 'Sông Như Nguyệt 1077',
    cardSubtitle: 'Lý Thường Kiệt • 1009 – 1225',
    figure: 'Thái úy Lý Thường Kiệt',
    desc:
        'Thái úy Lý Thường Kiệt lãnh đạo cuộc kháng chiến chống 30 vạn quân Tống xâm lược. Đêm trên sông Như Nguyệt vang vọng bài thơ thần Nam Quốc Sơn Hà, khẳng định chủ quyền độc lập của giang sơn Đại Việt.',
    era: 'Năm Đinh Tỵ 1077',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư • Quyển III',
    excerpt:
        'Nam quốc sơn hà Nam đế cư / Tiệt nhiên định phận tại thiên thư / Như hà nghịch lỗ lai xâm phạm / Nhữ đẳng hành khan thủ bại hư.',
    suggestedDuration: 60,
    tags: ['Sông Như Nguyệt', 'Nam Quốc Sơn Hà', 'Kháng Tống', 'Thơ Thần'],
  ),
  HistoricalTopicData(
    id: 'bach-dang-1288',
    dynasty: 'tran',
    dynastyName: 'Triều Trần (1225 – 1400)',
    title: 'Đại Thắng Bạch Đằng Năm 1288 (Trần Quốc Tuấn)',
    shortTitle: 'Trận Bạch Đằng 1288',
    cardSubtitle: 'Trần Quốc Tuấn • 1225 – 1400',
    figure: 'Hưng Đạo Đại Vương Trần Quốc Tuấn',
    desc:
        'Trận thủy chiến cọc ngầm lịch sử trên sông Bạch Đằng, Hưng Đạo Vương đón thủy triều rút, đại phá thủy binh Mông - Nguyên do Ô Mã Nhi chỉ huy, bắt sống tướng giặc, giữ vững non sông Đại Việt.',
    era: 'Tháng 3 năm Mậu Tý 1288',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư • Quyển V',
    excerpt:
        'Hưng Đạo Vương đón đánh quân Nguyên, giả cách thua chạy. Quân giặc đuổi theo, thuyền giặc xô vào cọc nhọn bị vỡ đắm... Bắt sống Ô Mã Nhi, Phàn Tiếp dâng lên Thượng hoàng.',
    suggestedDuration: 60,
    tags: ['Trận Bạch Đằng', 'Cọc Ngầm', 'Ô Mã Nhi', 'Thủy Chiến'],
  ),
  HistoricalTopicData(
    id: 'dien-hong-1285',
    dynasty: 'tran',
    dynastyName: 'Triều Trần (1225 – 1400)',
    title: 'Hội Nghị Diên Hồng & Hịch Tướng Sĩ (1285)',
    shortTitle: 'Hội Nghị Diên Hồng 1285',
    cardSubtitle: 'Trần Thánh Tông • 1225 – 1400',
    figure: 'Thượng hoàng Trần Thánh Tông & Hưng Đạo Vương',
    desc:
        'Trước họa xâm lược của 50 vạn quân Thoát Hoan, triều đình mở hội nghị Diên Hồng hỏi ý muôn dân, muôn người đồng thanh hô Đánh. Tinh thần Sát Thát quật khởi chỉ huy quân dân 3 lần toàn thắng giặc Nguyên.',
    era: 'Năm Ất Dậu 1285',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư • Quyển V',
    excerpt:
        'Thượng hoàng triệu các phụ lão trong cả nước về điện Diên Hồng ban yến và hỏi kế đánh giặc. Các phụ lão đều hô to: Đánh! Tiếng vang như sấm dậy trời đất.',
    suggestedDuration: 60,
    tags: ['Hội Nghị Diên Hồng', 'Sát Thát', 'Hịch Tướng Sĩ', 'Ý Đảng Lòng Dân'],
  ),
];

const String kSampleHistoricalScript =
    'Mùa thu tháng 7 năm Canh Tuất 1010, vua Lý Thái Tổ khởi sự dời đô từ cố đô Hoa Lư ra thành Đại La.\n'
    'Nhà vua nhận thấy đất Hoa Lư núi non hiểm trở chỉ thích hợp phòng thủ thời loạn lạc, việc hai nhà Đinh và Tiền Lê đóng mãi ở đây khiến thế đại không bền, vận số ngắn ngủi.\n'
    'Để mưu nghiệp lớn cho muôn đời con cháu, nhà vua ban Chiếu dời đô, chọn Đại La vì đây là nơi trung tâm trời đất, thế đất rồng cuộn hổ ngồi, cao ráo sáng sủa, trăm họ không khổ vì ngập lụt.\n'
    'Khi thuyền ngự vừa tạm đỗ dưới chân thành Đại La, có điềm lành rồng vàng hiện lên ở thuyền ngự bay vút lên trời xanh. Nhân đó, vua đổi tên Đại La thành Thăng Long, mở ra thời kỳ thái bình thịnh trị cho non sông Đại Việt.';

class AiWhiteboardPipelinePage extends StatefulWidget {
  const AiWhiteboardPipelinePage({super.key, required this.state});
  final CreatorState state;

  @override
  State<AiWhiteboardPipelinePage> createState() =>
      _AiWhiteboardPipelinePageState();
}

class _AiWhiteboardPipelinePageState extends State<AiWhiteboardPipelinePage> {
  // Stepper State: 0: Kịch bản, 1: Phân cảnh, 2: Giọng đọc, 3: Kết xuất
  int _currentStep = 0;

  // Format & Mode
  String _renderMode = 'audio_podcast'; // 'audio_podcast' | 'whiteboard'
  String _creationMode = 'ai_prompt'; // 'ai_prompt' | 'manual_script'

  // Step 1: Script Input
  final _topicCtrl =
      TextEditingController(text: 'Đại Lễ Dời Đô Năm 1010 (Lý Thái Tổ)');
  final _scriptCtrl = TextEditingController(text: kSampleHistoricalScript);
  String _selectedTone = 'Hào sảng, sử thi';
  int _durationSec = 60;
  String _selectedDynasty = 'all';

  // Step 2: Storyboard & Scenes Images
  final Map<String, String> _sceneImages = {};
  String? _coverImageUrl;
  String? _thumbnailUrl;

  // Step 3: Voice Selection
  String? _selectedVoiceId;
  String _ttsEngine = 'edge-tts';
  String _selectedVoiceEngine = 'all';
  String _selectedVoiceGender = 'all';
  String _selectedVoiceRegion = 'all';
  String? _previewAudioUrl;
  bool _isPlayingVoice = false;

  // Step 4: Render & Job
  final _renderTitleCtrl = TextEditingController();
  final _searchKeywordCtrl = TextEditingController();
  String _selectedStatusFilter = 'ALL';
  bool _busy = false;
  String? _statusNote;
  Timer? _jobPollTimer;

  @override
  void initState() {
    super.initState();
    _selectedVoiceId = widget.state.aiSettings?.preferredVoiceId ??
        (widget.state.aiVoices.isNotEmpty
            ? widget.state.aiVoices.first.voiceId
            : 'vi-VN-NamMinhNeural');
    _ttsEngine = widget.state.aiSettings?.ttsEngine ?? 'edge-tts';
    _renderTitleCtrl.text = _topicCtrl.text;
  }

  @override
  void dispose() {
    _jobPollTimer?.cancel();
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

  Future<void> _uploadCoverImage() async {
    _runStep(() async {
      List<int> bytes;
      String filename = 'cover_podcast.png';
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
        _coverImageUrl = url;
        _statusNote = 'Đã tải ảnh bìa Podcast lên Cloudinary thành công!';
      });
    });
  }

  Future<void> _uploadThumbnailImage() async {
    _runStep(() async {
      List<int> bytes;
      String filename = 'thumbnail_16_9.png';
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
        _thumbnailUrl = url;
        _statusNote = 'Đã tải ảnh Thumbnail 16:9 lên Cloudinary thành công!';
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
          title: Row(
            children: [
              const Icon(CupertinoIcons.gear_alt, color: Palette.red, size: 20),
              const SizedBox(width: 8),
              Text('Cài đặt API Key & AI Studio', style: editorial(18)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Cấu hình Google Gemini & ElevenLabs API cá nhân của Creator:',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: geminiCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Google Gemini API Key *',
                    hintText: 'AIzaSy...',
                    prefixIcon: Icon(CupertinoIcons.sparkles, size: 16),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: elevenCtrl,
                  decoration: const InputDecoration(
                    labelText: 'ElevenLabs API Key (Tùy chọn)',
                    hintText: 'sk_...',
                    prefixIcon: Icon(CupertinoIcons.waveform, size: 16),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Công nghệ giọng đọc mặc định:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('Edge-TTS (Miễn phí)'),
                      selected: engine == 'edge-tts',
                      onSelected: (_) => setDlgState(() => engine = 'edge-tts'),
                    ),
                    ChoiceChip(
                      label: const Text('ElevenLabs (Studio)'),
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
              child: const Text('Đóng'),
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

  void _openContentLibrarySheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final videos = widget.state.studioVideos;
          return SafeArea(
            child: SizedBox(
              height: MediaQuery.sizeOf(ctx).height * 0.85,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(CupertinoIcons.film,
                                color: Palette.red, size: 20),
                            const SizedBox(width: 8),
                            Text('Thư viện nội dung Creator',
                                style: editorial(20)),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(CupertinoIcons.xmark, size: 18),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _searchKeywordCtrl,
                      decoration: InputDecoration(
                        prefixIcon:
                            const Icon(CupertinoIcons.search, size: 16),
                        hintText: 'Tìm kiếm video theo tiêu đề hoặc nội dung...',
                        suffixIcon: IconButton(
                          icon: const Icon(CupertinoIcons.arrow_right_circle,
                              size: 18),
                          onPressed: () async {
                            await widget.state.fetchStudioVideos(
                              keyword: _searchKeywordCtrl.text.trim().isNotEmpty
                                  ? _searchKeywordCtrl.text.trim()
                                  : null,
                              status: _selectedStatusFilter != 'ALL'
                                  ? _selectedStatusFilter
                                  : null,
                            );
                            setSheetState(() {});
                          },
                        ),
                      ),
                      onSubmitted: (_) async {
                        await widget.state.fetchStudioVideos(
                          keyword: _searchKeywordCtrl.text.trim().isNotEmpty
                              ? _searchKeywordCtrl.text.trim()
                              : null,
                          status: _selectedStatusFilter != 'ALL'
                              ? _selectedStatusFilter
                              : null,
                        );
                        setSheetState(() {});
                      },
                    ),
                    const SizedBox(height: 10),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          'ALL',
                          'PUBLISHED',
                          'HIDDEN',
                          'PROCESSING',
                          'FAILED'
                        ].map((st) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ChoiceChip(
                              label: Text(
                                st == 'ALL' ? 'Tất cả' : st,
                                style: const TextStyle(fontSize: 11),
                              ),
                              selected: _selectedStatusFilter == st,
                              onSelected: (_) async {
                                setState(() => _selectedStatusFilter = st);
                                setSheetState(
                                    () => _selectedStatusFilter = st);
                                await widget.state.fetchStudioVideos(
                                  keyword:
                                      _searchKeywordCtrl.text.trim().isNotEmpty
                                          ? _searchKeywordCtrl.text.trim()
                                          : null,
                                  status: st != 'ALL' ? st : null,
                                );
                                setSheetState(() {});
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: videos.isEmpty
                          ? const Center(
                              child: Text(
                                'Chưa có video nào trong kho Studio.',
                                style: TextStyle(
                                    fontSize: 12, color: Palette.muted),
                              ),
                            )
                          : ListView.builder(
                              itemCount: videos.length,
                              itemBuilder: (c, idx) {
                                final v = videos[idx];
                                final contentId =
                                    (v['contentId'] as num?)?.toInt() ?? 0;
                                final status =
                                    (v['status'] ?? 'PROCESSING').toString();
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
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        (v['title'] ?? 'Tập video').toString(),
                                        style: editorial(17),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Trạng thái: $status · AI Shield: $shield',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Palette.muted,
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 6,
                                        children: [
                                          FilledButton.tonal(
                                            key: Key(
                                                'submit-publish-video-$contentId'),
                                            onPressed: _busy
                                                ? null
                                                : () => _runStep(() async {
                                                      await widget.state
                                                          .submitStudioVideoForPublish(
                                                              contentId);
                                                      setSheetState(() {});
                                                    }),
                                            child: const Text(
                                                'Gửi duyệt AI Shield',
                                                style: TextStyle(fontSize: 11)),
                                          ),
                                          OutlinedButton(
                                            key: Key(
                                                'view-video-detail-$contentId'),
                                            onPressed: _busy
                                                ? null
                                                : () => _openVideoDetailSheet(
                                                    contentId),
                                            child: const Text('Chi tiết',
                                                style: TextStyle(fontSize: 11)),
                                          ),
                                          OutlinedButton(
                                            key: Key('edit-video-$contentId'),
                                            onPressed: _busy
                                                ? null
                                                : () => _openEditVideoDialog(
                                                      contentId,
                                                      (v['title'] ?? '')
                                                          .toString(),
                                                      v['description']
                                                          ?.toString(),
                                                      v['isExclusive'] as bool?,
                                                    ),
                                            child: const Text('Sửa',
                                                style: TextStyle(fontSize: 11)),
                                          ),
                                          OutlinedButton(
                                            key: Key(
                                                'toggle-video-visibility-$contentId'),
                                            onPressed: _busy
                                                ? null
                                                : () => _runStep(() async {
                                                      await widget.state
                                                          .updateStudioVideoVisibility(
                                                              contentId,
                                                              !isHidden);
                                                      setSheetState(() {});
                                                    }),
                                            child: Text(
                                              isHidden ? 'Hiện' : 'Ẩn',
                                              style:
                                                  const TextStyle(fontSize: 11),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
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
        },
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
                          style:
                              const TextStyle(fontSize: 12, color: Palette.muted),
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
        final settings = widget.state.aiSettings;
        final hasGeminiKey = settings?.geminiApiKey != null &&
            settings!.geminiApiKey!.trim().isNotEmpty;

        return Scaffold(
          key: const Key('ai-pipeline-page'),
          appBar: AppBar(
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Tạo nội dung mới',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Creator Studio — Xưởng Sáng Tạo Lịch Sử',
                  style: TextStyle(fontSize: 11, color: Palette.muted),
                ),
              ],
            ),
            actions: [
              OutlinedButton.icon(
                key: const Key('open-content-library-btn'),
                onPressed: _openContentLibrarySheet,
                icon: const Icon(CupertinoIcons.film, size: 14),
                label: const Text('Thư viện', style: TextStyle(fontSize: 11)),
                style: OutlinedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  visualDensity: VisualDensity.compact,
                ),
              ),
              const SizedBox(width: 6),
              IconButton(
                key: const Key('open-ai-settings-dialog'),
                icon: const Icon(CupertinoIcons.gear_alt, size: 19),
                tooltip: 'Cài đặt API Key & AI Studio',
                onPressed: _openSettingsDialog,
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 36),
            children: [
              // 1. HEADER BANNER
              Text('Tạo nội dung mới', style: editorial(26)),
              const SizedBox(height: 6),
              const Text(
                'Biến ý tưởng lịch sử thành podcast hoặc video giàu giá trị, dựa trên tư liệu chính thống.',
                style: TextStyle(color: Palette.muted, fontSize: 13, height: 1.45),
              ),
              const SizedBox(height: 14),

              // 2. GEMINI API KEY WARNING BANNER (nếu chưa có API key)
              if (!hasGeminiKey) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Palette.red.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: Palette.red.withValues(alpha: 0.25)),
                  ),
                  child: Row(
                    children: [
                      const Icon(CupertinoIcons.exclamationmark_triangle_fill,
                          color: Palette.red, size: 18),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Lưu ý: Bạn chưa thiết lập Google Gemini API Key cá nhân. Hãy thêm API Key để tự động viết kịch bản sử liệu qua RAG và sinh phân cảnh.',
                          style: TextStyle(fontSize: 11, height: 1.4),
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: _openSettingsDialog,
                        style: FilledButton.styleFrom(
                          backgroundColor: Palette.red,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 6),
                          visualDensity: VisualDensity.compact,
                        ),
                        child: const Text('Nhập Key',
                            style: TextStyle(fontSize: 11)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],

              // 3. WORKFLOW STEPPER (4 BƯỚC)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: Palette.paper,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Palette.line),
                ),
                child: Row(
                  children: [
                    _buildStepTab(
                      stepIndex: 0,
                      label: 'Kịch bản',
                      icon: CupertinoIcons.doc_text,
                      active: _currentStep == 0,
                      completed: _currentStep > 0,
                    ),
                    const Icon(CupertinoIcons.chevron_forward,
                        size: 14, color: Palette.line),
                    _buildStepTab(
                      stepIndex: 1,
                      label: 'Phân cảnh',
                      icon: CupertinoIcons.layers,
                      active: _currentStep == 1,
                      completed: _currentStep > 1,
                    ),
                    const Icon(CupertinoIcons.chevron_forward,
                        size: 14, color: Palette.line),
                    _buildStepTab(
                      stepIndex: 2,
                      label: 'Giọng đọc',
                      icon: CupertinoIcons.mic,
                      active: _currentStep == 2,
                      completed: _currentStep > 2,
                    ),
                    const Icon(CupertinoIcons.chevron_forward,
                        size: 14, color: Palette.line),
                    _buildStepTab(
                      stepIndex: 3,
                      label: 'Kết xuất',
                      icon: CupertinoIcons.film,
                      active: _currentStep == 3,
                      completed: job?['status'] == 'COMPLETED',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 4. FORMAT SELECTOR
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _renderMode == 'audio_podcast'
                          ? 'Định dạng nội dung: Kể chuyện truyền cảm • Chỉ cần 1 ảnh bìa dọc/vuông'
                          : 'Định dạng nội dung: Khung hình 16:9 • Tải ảnh từng phân cảnh',
                      style: const TextStyle(
                          fontSize: 11,
                          color: Palette.muted,
                          fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () =>
                                setState(() => _renderMode = 'audio_podcast'),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 8),
                              decoration: BoxDecoration(
                                color: _renderMode == 'audio_podcast'
                                    ? Palette.red.withValues(alpha: 0.12)
                                    : Palette.paper,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: _renderMode == 'audio_podcast'
                                      ? Palette.red
                                      : Palette.line,
                                  width:
                                      _renderMode == 'audio_podcast' ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    CupertinoIcons.waveform,
                                    size: 15,
                                    color: _renderMode == 'audio_podcast'
                                        ? Palette.red
                                        : Palette.muted,
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Text(
                                      'Video Podcast (Khuyên dùng)',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight:
                                            _renderMode == 'audio_podcast'
                                                ? FontWeight.bold
                                                : FontWeight.normal,
                                        color: _renderMode == 'audio_podcast'
                                            ? Palette.red
                                            : Palette.ink,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: InkWell(
                            onTap: () =>
                                setState(() => _renderMode = 'whiteboard'),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 8),
                              decoration: BoxDecoration(
                                color: _renderMode == 'whiteboard'
                                    ? Palette.red.withValues(alpha: 0.12)
                                    : Palette.paper,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: _renderMode == 'whiteboard'
                                      ? Palette.red
                                      : Palette.line,
                                  width:
                                      _renderMode == 'whiteboard' ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    CupertinoIcons.film,
                                    size: 15,
                                    color: _renderMode == 'whiteboard'
                                        ? Palette.red
                                        : Palette.muted,
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Text(
                                      'Bảng Trắng 16:9',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight:
                                            _renderMode == 'whiteboard'
                                                ? FontWeight.bold
                                                : FontWeight.normal,
                                        color: _renderMode == 'whiteboard'
                                            ? Palette.red
                                            : Palette.ink,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // 5. CURRENT STEP CONTENT
              if (_currentStep == 0)
                _buildStep1Script(storyboard, verification)
              else if (_currentStep == 1)
                _buildStep2Storyboard(storyboard)
              else if (_currentStep == 2)
                _buildStep3Voices(voices)
              else
                _buildStep4Render(storyboard, job),

              if (_statusNote != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Palette.soft,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Palette.line),
                  ),
                  child: Text(
                    _statusNote!,
                    style: const TextStyle(fontSize: 12, color: Palette.red),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildStepTab({
    required int stepIndex,
    required String label,
    required IconData icon,
    required bool active,
    required bool completed,
  }) {
    return Expanded(
      child: InkWell(
        key: Key('step-tab-$stepIndex'),
        onTap: () => setState(() => _currentStep = stepIndex),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: active
                      ? Palette.red
                      : completed
                          ? Palette.red.withValues(alpha: 0.15)
                          : Palette.soft,
                ),
                alignment: Alignment.center,
                child: completed && !active
                    ? const Icon(CupertinoIcons.checkmark,
                        size: 13, color: Palette.red)
                    : Text(
                        '${stepIndex + 1}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: active ? Colors.white : Palette.muted,
                        ),
                      ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: active ? FontWeight.bold : FontWeight.normal,
                  color: active ? Palette.red : Palette.muted,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── STEP 1: KỊCH BẢN ────────────────────────────────────────────────────────
  Widget _buildStep1Script(
    Map<String, dynamic>? storyboard,
    Map<String, dynamic>? verification,
  ) {
    final activeHistorical = kHistoricalTopicSuggestions.firstWhere(
      (item) =>
          item.title == _topicCtrl.text ||
          item.shortTitle == _topicCtrl.text ||
          _topicCtrl.text.contains(item.shortTitle),
      orElse: () => kHistoricalTopicSuggestions.first,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Eyebrow('BƯỚC 1/4 · TẠO KỊCH BẢN LỊCH SỬ'),
        const SizedBox(height: 6),
        Text('Tạo kịch bản lịch sử', style: editorial(22)),
        const SizedBox(height: 4),
        const Text(
          'Chọn cách bắt đầu và nhập chủ đề lịch sử bạn muốn kể.',
          style: TextStyle(fontSize: 12, color: Palette.muted),
        ),
        const SizedBox(height: 16),

        // Creation Mode Toggle
        Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: () => setState(() => _creationMode = 'ai_prompt'),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _creationMode == 'ai_prompt'
                        ? Palette.red.withValues(alpha: 0.08)
                        : Palette.paper,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _creationMode == 'ai_prompt'
                          ? Palette.red
                          : Palette.line,
                      width: _creationMode == 'ai_prompt' ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Text(
                              'AI hỗ trợ sáng tác',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 12),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (_creationMode == 'ai_prompt')
                            const Icon(CupertinoIcons.checkmark_circle_fill,
                                size: 15, color: Palette.red),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Nhập ý tưởng lịch sử để AI phát triển kịch bản cho bạn.',
                        style: TextStyle(fontSize: 10, color: Palette.muted),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: InkWell(
                onTap: () => setState(() => _creationMode = 'manual_script'),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _creationMode == 'manual_script'
                        ? Palette.red.withValues(alpha: 0.08)
                        : Palette.paper,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _creationMode == 'manual_script'
                          ? Palette.red
                          : Palette.line,
                      width: _creationMode == 'manual_script' ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Text(
                              'Kịch bản có sẵn',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 12),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (_creationMode == 'manual_script')
                            const Icon(CupertinoIcons.checkmark_circle_fill,
                                size: 15, color: Palette.red),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Tự viết hoặc dán nội dung kịch bản đã có của bạn.',
                        style: TextStyle(fontSize: 10, color: Palette.muted),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        if (_creationMode == 'ai_prompt') ...[
          // Topic Input
          TextField(
            key: const Key('ai-topic-input'),
            controller: _topicCtrl,
            maxLength: 200,
            decoration: InputDecoration(
              labelText: 'Chủ đề hoặc sự kiện lịch sử *',
              hintText: 'Ví dụ: Đại Lễ dời đô năm 1010 của vua Lý Thái Tổ...',
              prefixIcon: const Icon(CupertinoIcons.pencil, size: 16),
              helperText:
                  'Hệ thống hỗ trợ Lý – Trần (1009–1400), dựa trên Đại Việt Sử Ký Toàn Thư.',
            ),
            onChanged: (val) {
              if (_renderTitleCtrl.text.isEmpty ||
                  _renderTitleCtrl.text == _topicCtrl.text) {
                _renderTitleCtrl.text = val;
              }
              setState(() {});
            },
          ),
          const SizedBox(height: 12),

          // Suggested Topics Header & Dynasty Filter
          const Text('Gợi ý chủ đề phổ biến',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: [
              ChoiceChip(
                label: const Text('Tất cả', style: TextStyle(fontSize: 11)),
                selected: _selectedDynasty == 'all',
                onSelected: (_) =>
                    setState(() => _selectedDynasty = 'all'),
              ),
              ChoiceChip(
                label: const Text('Triều Lý (1009 – 1225)', style: TextStyle(fontSize: 11)),
                selected: _selectedDynasty == 'ly',
                onSelected: (_) => setState(() => _selectedDynasty = 'ly'),
              ),
              ChoiceChip(
                label: const Text('Triều Trần (1225 – 1400)', style: TextStyle(fontSize: 11)),
                selected: _selectedDynasty == 'tran',
                onSelected: (_) =>
                    setState(() => _selectedDynasty = 'tran'),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Suggested Topic Cards
          LayoutBuilder(
            builder: (ctx, constraints) {
              final cardW = max((constraints.maxWidth - 8) / 2, 120.0);
              return Wrap(
                spacing: 8,
                runSpacing: 8,
                children: kHistoricalTopicSuggestions
                    .where((item) =>
                        _selectedDynasty == 'all' ||
                        item.dynasty == _selectedDynasty)
                    .map((item) {
                  final sel = _topicCtrl.text == item.title ||
                      _topicCtrl.text == item.shortTitle;
                  return InkWell(
                    onTap: () {
                      setState(() {
                        _topicCtrl.text = item.title;
                        _renderTitleCtrl.text = item.title;
                        _durationSec = item.suggestedDuration;
                      });
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: cardW,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: sel
                            ? Palette.red.withValues(alpha: 0.08)
                            : Palette.paper,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: sel ? Palette.red : Palette.line,
                          width: sel ? 1.5 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.shortTitle,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: sel ? Palette.red : Palette.ink,
                              ),
                              overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 2),
                          Text(item.cardSubtitle,
                              style: const TextStyle(
                                  fontSize: 10, color: Palette.muted),
                              overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
          const SizedBox(height: 14),

          // Narrative Settings: Tone & Duration
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Phong cách kể chuyện (tùy chọn):',
                  style: TextStyle(fontSize: 11, color: Palette.muted)),
              const SizedBox(height: 4),
              DropdownButtonFormField<String>(
                isExpanded: true,
                value: _selectedTone,
                decoration: const InputDecoration(
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                style: const TextStyle(fontSize: 12, color: Palette.ink),
                items: const [
                  DropdownMenuItem(
                    value: 'Hào sảng, sử thi',
                    child: Text('Hào sảng, sử thi',
                        overflow: TextOverflow.ellipsis),
                  ),
                  DropdownMenuItem(
                    value: 'Điềm đạm, chiêm nghiệm',
                    child: Text('Điềm đạm, chiêm nghiệm',
                        overflow: TextOverflow.ellipsis),
                  ),
                  DropdownMenuItem(
                    value: 'Kịch tính, dồn dập',
                    child: Text('Kịch tính, dồn dập',
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
                onChanged: (v) {
                  if (v != null) setState(() => _selectedTone = v);
                },
              ),
              const SizedBox(height: 10),
              const Text('Thời lượng mục tiêu:',
                  style: TextStyle(fontSize: 11, color: Palette.muted)),
              const SizedBox(height: 4),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [30, 60, 90, 120].map((dur) {
                  return ChoiceChip(
                    label: Text('${dur}s',
                        style: const TextStyle(fontSize: 11)),
                    selected: _durationSec == dur,
                    onSelected: (_) =>
                        setState(() => _durationSec = dur),
                  );
                }).toList(),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // RAG Historical Scope Excerpt Box
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
                Row(
                  children: [
                    const Icon(CupertinoIcons.book_fill,
                        color: Palette.red, size: 14),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Tư liệu RAG: ${activeHistorical.sourceBook}',
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Palette.red),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  '“${activeHistorical.excerpt}”',
                  style: const TextStyle(
                      fontSize: 11, fontStyle: FontStyle.italic, height: 1.45),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Topic selection status
          if (_topicCtrl.text.trim().isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: Palette.soft,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Palette.line),
              ),
              child: const Row(
                children: [
                  Icon(CupertinoIcons.info_circle,
                      size: 14, color: Palette.muted),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text('Vui lòng nhập chủ đề hoặc chọn một thẻ gợi ý.',
                        style: TextStyle(fontSize: 11, color: Palette.muted),
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: Palette.red.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                    color: Palette.red.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(CupertinoIcons.checkmark_circle_fill,
                      size: 14, color: Palette.red),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Chủ đề: ${_topicCtrl.text.trim()}',
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Palette.red),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),

          // Action CTA: Generate Storyboard
          FilledButton.icon(
            key: const Key('generate-storyboard-btn'),
            onPressed: _busy || _topicCtrl.text.trim().isEmpty
                ? null
                : () => _runStep(() async {
                      final topic = _topicCtrl.text.trim();
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
                      if (_scriptCtrl.text.trim().isEmpty ||
                          _scriptCtrl.text == kSampleHistoricalScript) {
                        _scriptCtrl.text = summary;
                      }
                      setState(() {
                        _currentStep = 1;
                        _statusNote =
                            '✨ Đã tạo kịch bản AI thành công! Chuyển sang bước Phân cảnh.';
                      });
                    }),
            icon: const Icon(CupertinoIcons.sparkles, size: 16),
            label: Text(
              _busy
                  ? 'Đang tra cứu tư liệu & tạo kịch bản...'
                  : 'Tạo kịch bản với AI ->',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            style: FilledButton.styleFrom(
              backgroundColor: Palette.red,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ] else ...[
          // Manual Script Input
          TextField(
            key: const Key('ai-script-input'),
            controller: _scriptCtrl,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Nội dung kịch bản thuyết minh lịch sử *',
              hintText:
                  'Nhập hoặc dán toàn bộ nội dung kịch bản lịch sử (tối thiểu 100 ký tự)...',
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Số từ: ${_scriptCtrl.text.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).length} từ · ${_scriptCtrl.text.length} ký tự',
                  style: const TextStyle(fontSize: 11, color: Palette.muted),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() => _scriptCtrl.text = kSampleHistoricalScript);
                },
                child: const Text('Dùng kịch bản mẫu',
                    style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Verify Script button
          OutlinedButton.icon(
            key: const Key('verify-script-btn'),
            onPressed: _busy || _scriptCtrl.text.trim().isEmpty
                ? null
                : () => _runStep(() async {
                      await widget.state
                          .verifyHistoricalScript(_scriptCtrl.text.trim());
                    }),
            icon: const Icon(CupertinoIcons.checkmark_shield, size: 15),
            label: const Text('🛡️ Thẩm định kịch bản sử liệu (AI Shield)'),
          ),

          if (verification != null) ...[
            const SizedBox(height: 12),
            Container(
              key: const Key('verification-result-box'),
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
                    'Kết quả thẩm định: ${verification['feedback'] ?? verification['status'] ?? 'Đạt chuẩn sử liệu'} (Điểm: ${verification['accuracyScore'] ?? 95}/100)',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (verification['thumbnailPrompt'] != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Gợi ý prompt thumbnail 16:9: ${verification['thumbnailPrompt']}',
                      style:
                          const TextStyle(fontSize: 11, color: Palette.muted),
                    ),
                  ],
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),

          // Advance with manual script
          FilledButton.icon(
            key: const Key('generate-storyboard-btn'),
            onPressed: _busy || _scriptCtrl.text.trim().isEmpty
                ? null
                : () => _runStep(() async {
                      final topic = _topicCtrl.text.trim().isNotEmpty
                          ? _topicCtrl.text.trim()
                          : 'Kịch bản lịch sử tự biên tập';
                      await widget.state.generateAiStoryboard(
                        topic: topic,
                        durationSec: _durationSec,
                        keepOriginalScript: true,
                      );
                      setState(() {
                        _currentStep = 1;
                        _statusNote =
                            'Đã phân tích kịch bản và sinh phân cảnh thành công!';
                      });
                    }),
            icon: const Icon(CupertinoIcons.arrow_right_circle, size: 16),
            label: const Text('Chuyển sang phân cảnh ->',
                style: TextStyle(fontWeight: FontWeight.bold)),
            style: FilledButton.styleFrom(
              backgroundColor: Palette.red,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ],

        if (storyboard != null) ...[
          const SizedBox(height: 12),
          Container(
            key: const Key('storyboard-preview-box'),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Palette.line),
            ),
            child: Text(
              'Đã sinh Storyboard: ${storyboard['summary'] ?? storyboard['topic'] ?? 'Hoàn tất phân cảnh'}',
              style: const TextStyle(fontSize: 11, height: 1.45),
            ),
          ),
        ],
      ],
    );
  }

  // ─── STEP 2: PHÂN CẢNH ───────────────────────────────────────────────────────
  Widget _buildStep2Storyboard(Map<String, dynamic>? storyboard) {
    final scenes = storyboard != null && storyboard['scenes'] is List
        ? (storyboard['scenes'] as List)
        : [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Eyebrow('BƯỚC 2/4 · PHÂN CẢNH & HÌNH ẢNH'),
        const SizedBox(height: 6),
        Text('Phân cảnh & Hình ảnh', style: editorial(22)),
        const SizedBox(height: 4),
        Text(
          _renderMode == 'audio_podcast'
              ? 'Tải ảnh bìa Podcast đại diện và xem lại lời thuyết minh.'
              : 'Chỉnh sửa lời bình từng cảnh và tải ảnh bảng trắng 16:9.',
          style: const TextStyle(fontSize: 12, color: Palette.muted),
        ),
        const SizedBox(height: 16),

        if (_renderMode == 'audio_podcast') ...[
          // Podcast Cover Image Dropzone
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
                    Icon(CupertinoIcons.photo, color: Palette.red, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text('Ảnh bìa Video Podcast (Vuông 1:1 hoặc Dọc)',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 13),
                          overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Ảnh nền xuất hiện toàn bộ thời lượng phát sóng podcast âm thanh.',
                  style: TextStyle(fontSize: 11, color: Palette.muted),
                ),
                const SizedBox(height: 12),
                if (_coverImageUrl != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      _coverImageUrl!,
                      height: 140,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        height: 80,
                        color: Palette.soft,
                        alignment: Alignment.center,
                        child: const Text('Đã tải ảnh bìa',
                            style: TextStyle(
                                fontSize: 12, color: Colors.green)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                OutlinedButton.icon(
                  onPressed: _busy ? null : _uploadCoverImage,
                  icon: const Icon(CupertinoIcons.cloud_upload, size: 15),
                  label: Text(_coverImageUrl != null
                      ? 'Đổi ảnh bìa Podcast'
                      : 'Tải ảnh bìa Podcast lên Cloudinary'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 16:9 Poster Thumbnail
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
                    Icon(CupertinoIcons.tv, color: Palette.red, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text('Ảnh Thumbnail Card (Tỉ lệ 16:9)',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 13),
                          overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Hiển thị trên trang chủ và danh sách tập podcast của Sử Ký.',
                  style: TextStyle(fontSize: 11, color: Palette.muted),
                ),
                const SizedBox(height: 12),
                if (_thumbnailUrl != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      _thumbnailUrl!,
                      height: 100,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        height: 60,
                        color: Palette.soft,
                        alignment: Alignment.center,
                        child: const Text('Đã tải ảnh thumbnail',
                            style: TextStyle(
                                fontSize: 12, color: Colors.green)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                OutlinedButton.icon(
                  onPressed: _busy ? null : _uploadThumbnailImage,
                  icon: const Icon(CupertinoIcons.cloud_upload, size: 15),
                  label: Text(_thumbnailUrl != null
                      ? 'Đổi ảnh Thumbnail 16:9'
                      : 'Tải Thumbnail 16:9 lên Cloudinary'),
                ),
              ],
            ),
          ),
        ] else ...[
          // Whiteboard per-scene list
          if (scenes.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Palette.soft,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Palette.line),
              ),
              child: const Text(
                'Chưa có phân cảnh nào. Bạn có thể quay lại Bước 1 để AI tạo kịch bản phân cảnh.',
                style: TextStyle(fontSize: 12, color: Palette.muted),
              ),
            )
          else
            ...scenes.asMap().entries.map((entry) {
              final idx = entry.key + 1;
              final sc = entry.value as Map<String, dynamic>;
              final scNo = sc['sceneNo'] ?? idx;
              final uploadedUrl = _sceneImages[scNo.toString()];

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Palette.paper,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Cảnh $scNo',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: Palette.red)),
                        if (uploadedUrl != null)
                          const Row(
                            children: [
                              Icon(CupertinoIcons.checkmark_circle_fill,
                                  color: Colors.green, size: 14),
                              SizedBox(width: 4),
                              Text('Đã có ảnh',
                                  style: TextStyle(
                                      fontSize: 11, color: Colors.green)),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      sc['narration'] ?? sc['title'] ?? '',
                      style: const TextStyle(fontSize: 12, height: 1.4),
                    ),
                    if (sc['imagePrompt'] != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Prompt gợi ý: ${sc['imagePrompt']}',
                        style: const TextStyle(
                            fontSize: 10,
                            color: Palette.muted,
                            fontStyle: FontStyle.italic),
                      ),
                    ],
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      key: Key('upload-scene-image-$idx'),
                      onPressed: _busy ? null : () => _uploadImageForScene(scNo),
                      icon: const Icon(CupertinoIcons.cloud_upload, size: 14),
                      label: Text(uploadedUrl != null
                          ? 'Đổi ảnh phân cảnh'
                          : 'Tải ảnh cảnh lên Cloudinary'),
                    ),
                  ],
                ),
              );
            }),
        ],

        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep = 0),
                child: const Text('<- Quay lại Bước 1'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton(
                onPressed: () => setState(() => _currentStep = 2),
                style: FilledButton.styleFrom(backgroundColor: Palette.red),
                child: const Text('Tiếp tục: Chọn giọng ->'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ─── STEP 3: GIỌNG ĐỌC ───────────────────────────────────────────────────────
  Widget _buildStep3Voices(List<CreatorVoiceModel> voices) {
    // Filter voices
    final filteredVoices = voices.where((v) {
      if (_selectedVoiceEngine != 'all' &&
          (v.engine ?? v.provider ?? '') != _selectedVoiceEngine) {
        return false;
      }
      if (_selectedVoiceGender != 'all' &&
          (v.gender ?? '').toLowerCase() != _selectedVoiceGender) {
        return false;
      }
      return true;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Eyebrow('BƯỚC 3/4 · CHỌN GIỌNG THUYẾT MINH'),
        const SizedBox(height: 6),
        Text('Chọn giọng thuyết minh', style: editorial(22)),
        const SizedBox(height: 4),
        const Text(
          'Lựa chọn giọng đọc truyền cảm phù hợp với câu chuyện lịch sử.',
          style: TextStyle(fontSize: 12, color: Palette.muted),
        ),
        const SizedBox(height: 14),

        // Filter chips row
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            ChoiceChip(
              label: const Text('Tất cả engine', style: TextStyle(fontSize: 10)),
              selected: _selectedVoiceEngine == 'all',
              onSelected: (_) => setState(() => _selectedVoiceEngine = 'all'),
            ),
            ChoiceChip(
              label: const Text('Edge-TTS', style: TextStyle(fontSize: 10)),
              selected: _selectedVoiceEngine == 'edge-tts',
              onSelected: (_) =>
                  setState(() => _selectedVoiceEngine = 'edge-tts'),
            ),
            ChoiceChip(
              label: const Text('ElevenLabs', style: TextStyle(fontSize: 10)),
              selected: _selectedVoiceEngine == 'elevenlabs',
              onSelected: (_) =>
                  setState(() => _selectedVoiceEngine = 'elevenlabs'),
            ),
            ChoiceChip(
              label: const Text('Giọng Nam', style: TextStyle(fontSize: 10)),
              selected: _selectedVoiceGender == 'male',
              onSelected: (_) => setState(
                  () => _selectedVoiceGender = _selectedVoiceGender == 'male' ? 'all' : 'male'),
            ),
            ChoiceChip(
              label: const Text('Giọng Nữ', style: TextStyle(fontSize: 10)),
              selected: _selectedVoiceGender == 'female',
              onSelected: (_) => setState(
                  () => _selectedVoiceGender = _selectedVoiceGender == 'female' ? 'all' : 'female'),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Voices list
        if (filteredVoices.isNotEmpty)
          ...filteredVoices.map((v) {
            final sel = _selectedVoiceId == v.voiceId;
            return Container(
              key: Key('ai-voice-${v.voiceId}'),
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: sel
                    ? Palette.red.withValues(alpha: 0.08)
                    : Palette.paper,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: sel ? Palette.red : Palette.line,
                  width: sel ? 1.5 : 1,
                ),
              ),
              child: Row(
                children: [
                  Radio<String>(
                    value: v.voiceId,
                    groupValue: _selectedVoiceId,
                    activeColor: Palette.red,
                    onChanged: (val) {
                      setState(() {
                        _selectedVoiceId = val;
                        if (v.engine != null) _ttsEngine = v.engine!;
                      });
                    },
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(v.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13),
                                  overflow: TextOverflow.ellipsis),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Palette.soft,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                v.engine ?? v.provider ?? 'Edge-TTS',
                                style: const TextStyle(
                                    fontSize: 9, color: Palette.muted),
                              ),
                            ),
                          ],
                        ),
                        if (v.description != null &&
                            v.description!.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(v.description!,
                              style: const TextStyle(
                                  fontSize: 11, color: Palette.muted)),
                        ],
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      _previewAudioUrl != null && _selectedVoiceId == v.voiceId
                          ? CupertinoIcons.stop_circle
                          : CupertinoIcons.play_circle,
                      size: 22,
                      color: Palette.red,
                    ),
                    onPressed: () => _runStep(() async {
                      final res = await widget.state.previewAiVoice(
                        voiceId: v.voiceId,
                        text:
                            'Sử Ký muôn đời ghi công bậc tiền nhân dựng nước và giữ nước.',
                        engine: v.engine ?? _ttsEngine,
                      );
                      setState(() {
                        _previewAudioUrl = res['audioUrl']?.toString();
                        _selectedVoiceId = v.voiceId;
                        _statusNote =
                            'Đã tạo bản nghe thử giọng đọc thành công!';
                      });
                    }),
                  ),
                ],
              ),
            );
          })
        else
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Palette.paper,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Palette.line),
            ),
            child: const Text(
              'Mặc định: Giọng đọc Nam Minh (Edge-TTS Tiếng Việt chuẩn).',
              style: TextStyle(fontSize: 12, color: Palette.muted),
            ),
          ),
        const SizedBox(height: 12),

        // Quick Actions: Save voice settings & Preview voice
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
            OutlinedButton.icon(
              key: const Key('preview-voice-btn'),
              onPressed: _busy
                  ? null
                  : () => _runStep(() async {
                        final res = await widget.state.previewAiVoice(
                          voiceId: _selectedVoiceId ?? 'vi-VN-NamMinhNeural',
                          text:
                              'Sử Ký muôn đời ghi công bậc tiền nhân dựng nước và giữ nước.',
                          engine: _ttsEngine,
                        );
                        setState(() {
                          _previewAudioUrl = res['audioUrl']?.toString();
                          _statusNote =
                              'Đã tạo bản nghe thử giọng đọc trực tiếp thành công!';
                        });
                      }),
              icon: const Icon(CupertinoIcons.play_circle, size: 14),
              label: const Text('Nghe thử giọng'),
            ),
          ],
        ),

        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep = 1),
                child: const Text('<- Quay lại Bước 2'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton(
                onPressed: () => setState(() => _currentStep = 3),
                style: FilledButton.styleFrom(backgroundColor: Palette.red),
                child: const Text('Tiếp tục: Kết xuất video ->'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ─── STEP 4: KẾT XUẤT ────────────────────────────────────────────────────────
  Widget _buildStep4Render(
    Map<String, dynamic>? storyboard,
    Map<String, dynamic>? job,
  ) {
    final status = (job?['status'] ?? '').toString();
    final isProcessing = status == 'PROCESSING';
    final isCompleted = status == 'COMPLETED';
    final contentId = (job?['contentId'] as num?)?.toInt() ?? 701;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Eyebrow('BƯỚC 4/4 · KẾT XUẤT & XUẤT BẢN'),
        const SizedBox(height: 6),
        Text('Kết xuất & Xuất bản', style: editorial(22)),
        const SizedBox(height: 4),
        const Text(
          'Kiểm tra thông số kỹ thuật, bắt đầu render và theo dõi tiến trình dựng video.',
          style: TextStyle(fontSize: 12, color: Palette.muted),
        ),
        const SizedBox(height: 16),

        // Summary Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Palette.paper,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Palette.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Thông số video:',
                  style:
                      const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 8),
              Text(
                '• Định dạng: ${_renderMode == "audio_podcast" ? "Video Podcast Âm Thanh" : "Hoạt Họa Bảng Trắng 16:9"}',
                style: const TextStyle(fontSize: 12, color: Palette.ink),
              ),
              const SizedBox(height: 4),
              Text(
                '• Giọng đọc: ${_selectedVoiceId ?? "vi-VN-NamMinhNeural"} ($_ttsEngine)',
                style: const TextStyle(fontSize: 12, color: Palette.ink),
              ),
              const SizedBox(height: 4),
              Text(
                '• Thời lượng dự kiến: ${_durationSec}s',
                style: const TextStyle(fontSize: 12, color: Palette.ink),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Title Input
        TextField(
          key: const Key('ai-render-title-input'),
          controller: _renderTitleCtrl,
          decoration: const InputDecoration(
            labelText: 'Tiêu đề tập xuất bản *',
            hintText: 'Nhập tiêu đề xuất bản video/podcast...',
          ),
        ),
        const SizedBox(height: 14),

        // Render CTA
        FilledButton.icon(
          key: const Key('start-render-btn'),
          onPressed: _busy
              ? null
              : () => _runStep(() async {
                    final titleText = _renderTitleCtrl.text.trim().isNotEmpty
                        ? _renderTitleCtrl.text.trim()
                        : (_topicCtrl.text.trim().isNotEmpty
                            ? _topicCtrl.text.trim()
                            : 'Chiến thắng Bạch Đằng 938');
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
                      coverImage: _coverImageUrl,
                      thumbnailUrl: _thumbnailUrl,
                      storyboard: storyboard,
                    );

                    // Bắt đầu polling tiến trình render mỗi 2s
                    _jobPollTimer?.cancel();
                    _jobPollTimer =
                        Timer.periodic(const Duration(seconds: 2), (timer) async {
                      if (!mounted) {
                        timer.cancel();
                        return;
                      }
                      final j = widget.state.activeRenderJob;
                      if (j != null && j['jobId'] != null) {
                        final currentStatus =
                            (j['status'] ?? '').toString();
                        if (currentStatus == 'COMPLETED' ||
                            currentStatus == 'FAILED') {
                          timer.cancel();
                          return;
                        }
                        await widget.state.pollRenderJobStatus(
                          j['jobId'].toString(),
                          artifactId: (j['artifactId'] as num?)?.toInt(),
                        );
                      }
                    });
                  }),
          icon: const Icon(CupertinoIcons.film, size: 16),
          label: Text(
            _busy ? 'Đang khởi chạy...' : 'Khởi chạy Render Video / Podcast',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          style: FilledButton.styleFrom(
            backgroundColor: Palette.red,
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ),

        // Live Job Tracking & Polling
        if (job != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Palette.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'Mã tiến trình: ${job['jobId']} · Trạng thái: ${job['status']}',
                        key: const Key('render-job-status'),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                    ),
                    if (isProcessing)
                      const CupertinoActivityIndicator(radius: 8),
                  ],
                ),
                const SizedBox(height: 10),

                // 6-Step Pipeline Visualizer
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('Tiến trình dựng video (6 bước):',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Palette.muted)),
                    SizedBox(height: 6),
                    Text('1. Khởi tạo tác vụ & xác thực quyền',
                        style: TextStyle(fontSize: 10, color: Palette.ink)),
                    Text('2. Tải & tiền xử lý tư liệu ảnh Cloudinary',
                        style: TextStyle(fontSize: 10, color: Palette.ink)),
                    Text('3. Tổng hợp giọng đọc Edge-TTS / ElevenLabs',
                        style: TextStyle(fontSize: 10, color: Palette.ink)),
                    Text('4. Dựng đồ họa phân cảnh & hiệu ứng waveform',
                        style: TextStyle(fontSize: 10, color: Palette.ink)),
                    Text('5. Ghép video, âm thanh & phụ đề (FFmpeg)',
                        style: TextStyle(fontSize: 10, color: Palette.ink)),
                    Text('6. Hoàn tất kết xuất & tải lên lưu trữ',
                        style: TextStyle(fontSize: 10, color: Palette.ink)),
                  ],
                ),
                const SizedBox(height: 10),

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

                if (isCompleted) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                          color: Colors.green.withValues(alpha: 0.3)),
                    ),
                    child: const Row(
                      children: [
                        Icon(CupertinoIcons.checkmark_circle_fill,
                            color: Colors.green, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Video đã render thành công! Bạn có thể gửi duyệt AI Shield và xuất bản.',
                            style: TextStyle(
                                fontSize: 11,
                                color: Colors.green,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.tonal(
                    key: Key('submit-publish-video-$contentId'),
                    onPressed: _busy
                        ? null
                        : () => _runStep(() async {
                              await widget.state
                                  .submitStudioVideoForPublish(contentId);
                              setState(() {
                                _statusNote =
                                    'Đã duyệt AI Shield · Xuất bản video thành công!';
                              });
                            }),
                    child: const Text('Gửi duyệt AI Shield & Xuất bản'),
                  ),
                ],
              ],
            ),
          ),
        ],

        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep = 2),
                child: const Text('<- Quay lại Bước 3'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  setState(() {
                    _currentStep = 0;
                    _topicCtrl.text = '';
                    _scriptCtrl.text = '';
                    _renderTitleCtrl.text = '';
                    _sceneImages.clear();
                    _coverImageUrl = null;
                    _thumbnailUrl = null;
                  });
                },
                child: const Text('Tạo video mới'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
