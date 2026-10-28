import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_state.dart';
import 'components.dart';
import 'creator_state.dart';
import 'design.dart';
import 'artwork_image.dart';
import 'artwork_state.dart';
import 'episode.dart';
import 'studio_pages.dart';

class PublicationState extends ChangeNotifier {
  PublicationState(this.creator) {
    jobs = jsonDecode(
      creator.preferences.getString('productionJobsV1') ?? '{}',
    ) as Map<String, dynamic>;
  }
  final CreatorState creator;
  late Map<String, dynamic> jobs;
  Future<void> buildDemo(String id, {bool fail = false}) async {
    final draft = creator.drafts.firstWhere((d) => d.id == id);
    if (!creator.kyc.isApproved || draft.stage != DraftStage.approved) {
      throw StateError('Cần KYC và artifact đã duyệt cuối.');
    }
    jobs[id] = fail ? 'failed' : 'ready';
    if (!await creator.preferences.setString(
      'productionJobsV1',
      jsonEncode(jobs),
    )) {
      throw StateError('Chưa lưu được artifact thử.');
    }
    notifyListeners();
  }

  Future<void> publish(
    String id, {
    required bool membersOnly,
    AppState? app,
  }) async {
    final draft = creator.drafts.firstWhere((d) => d.id == id);
    if (!creator.kyc.isApproved ||
        draft.stage != DraftStage.approved ||
        jobs[id] != 'ready' ||
        creator.channel.isEmpty) {
      throw StateError('Cần kênh, KYC và artifact đã duyệt/sẵn sàng.');
    }
    final items = jsonDecode(
      creator.preferences.getString('publishedEpisodesV1') ?? '[]',
    ) as List;
    final publicId = 'published-$id';
    if (items.any((e) => e['id'] == publicId)) {
      throw StateError('Tập đã phát hành trên thiết bị.');
    }
    if (app != null && app.isLiveBackend) {
      try {
        if (id.startsWith('video-') && creator.creatorStudioRepository != null) {
          final contentId = int.tryParse(id.substring('video-'.length));
          if (contentId != null) {
            await creator.creatorStudioRepository!.submitVideoForPublish(
              contentId,
            );
          }
        } else if (app.contentRepository != null) {
          final chId =
              creator.channelModel?.id ??
              (remoteChannels.isNotEmpty
                  ? (remoteChannels.first.id ?? 1)
                  : 1);
          await app.contentRepository!.createContent(
            channelId: chId,
            title: draft.title,
            textBody: draft.script,
            status: 'PUBLISHED',
            isExclusive: membersOnly,
          );
        }
        await app.refreshCatalog();
      } catch (_) {}
    }
    final video = draft.format == 'video';
    final episode = Episode(
      id: publicId,
      title: draft.title,
      channel: creator.channel,
      image: artworkReference(draftArtworkTarget(draft.id, draft.format)),
      channelImage: artworkReference('channel'),
      category: 'Việt Nam',
      seconds: video ? 12 : 24,
      description: creator.isLiveBackend
          ? draft.script
          : '${video ? 'Video kiểm tra kỹ thuật 12 giây, không phải phim của kịch bản.' : 'Audio kỹ thuật 24 giây, không phải giọng đọc của kịch bản.'}\n\n${draft.script}',
      chapters: [
        Chapter(creator.isLiveBackend ? 'Mở đầu' : 'Bắt đầu bản thử', 0),
      ],
      membersOnly: membersOnly,
      isVideo: video,
      mediaAsset: video
          ? 'assets/mock/video/playback-demo.mp4'
          : 'assets/mock/audio/playback-demo.mp3',
      sources: draft.sources,
    );
    items.add(episodeToJson(episode));
    if (!await creator.preferences.setString(
      'publishedEpisodesV1',
      jsonEncode(items),
    )) {
      throw StateError('Chưa phát hành được bản thử.');
    }
    notifyListeners();
  }

  Future<void> unpublish(String id) async {
    final items = jsonDecode(
      creator.preferences.getString('publishedEpisodesV1') ?? '[]',
    ) as List;
    items.removeWhere((e) => e['id'] == 'published-$id');
    if (!await creator.preferences.setString(
      'publishedEpisodesV1',
      jsonEncode(items),
    )) {
      throw StateError('Chưa gỡ được bản thử.');
    }
    notifyListeners();
  }

  bool isPublished(String id) => (jsonDecode(
    creator.preferences.getString('publishedEpisodesV1') ?? '[]',
  ) as List).any((e) => e['id'] == 'published-$id');
}

class PublicationPage extends StatefulWidget {
  const PublicationPage({
    super.key,
    required this.preferences,
    required this.app,
  });
  final SharedPreferences preferences;
  final AppState app;
  @override
  State<PublicationPage> createState() => _PublicationPageState();
}

class _PublicationPageState extends State<PublicationPage> {
  CreatorState _buildCreator() => CreatorState(
    widget.preferences,
    channelRepository: widget.app.channelRepository,
    creatorSeriesRepository: widget.app.creatorSeriesRepository,
    creatorStudioRepository: widget.app.creatorStudioRepository,
    kycRepository: widget.app.kycRepository,
    contractRepository: widget.app.contractRepository,
    hireRequestRepository: widget.app.hireRequestRepository,
    milestoneRepository: widget.app.milestoneRepository,
    deliverableRepository: widget.app.deliverableRepository,
    disputeRepository: widget.app.disputeRepository,
    chatRepository: widget.app.chatRepository,
    narratorProfileRepository: widget.app.narratorProfileRepository,
    narratorDemoRepository: widget.app.narratorDemoRepository,
    freelancerRepository: widget.app.freelancerRepository,
    postRepository: widget.app.postRepository,
    walletRepository: widget.app.walletRepository,
    withdrawalRepository: widget.app.withdrawalRepository,
  );

  late CreatorState creator = _buildCreator();
  late PublicationState production = PublicationState(creator);
  bool published = false;

  // Live content library state
  bool _loading = false;
  String _statusFilter = 'ALL';
  final _searchCtrl = TextEditingController();
  bool? _isExclusive;
  String _sortOption = 'createdAt_desc';
  String _statusNote = '';

  static const _statusTabs = [
    {'key': 'ALL', 'label': 'Tất cả'},
    {'key': 'PUBLISHED', 'label': 'Đã xuất bản'},
    {'key': 'PENDING_REVIEW', 'label': 'Chờ duyệt'},
    {'key': 'COMPLETED', 'label': 'Chờ gửi duyệt'},
    {'key': 'DRAFT', 'label': 'Bản nháp'},
    {'key': 'REJECTED', 'label': 'Bị từ chối'},
    {'key': 'HIDDEN', 'label': 'Đã ẩn'},
  ];

  static const _sortOptions = [
    {'value': 'createdAt_desc', 'label': 'Mới nhất trước'},
    {'value': 'createdAt_asc', 'label': 'Cũ nhất trước'},
    {'value': 'title_asc', 'label': 'Tiêu đề (A – Z)'},
    {'value': 'duration_desc', 'label': 'Thời lượng dài nhất'},
    {'value': 'likes_desc', 'label': 'Nhiều lượt thích nhất'},
    {'value': 'comments_desc', 'label': 'Nhiều bình luận nhất'},
  ];

  @override
  void initState() {
    super.initState();
    if (creator.isLiveBackend) {
      creator.initStudioBackend().then((_) {
        if (mounted) _loadVideos();
      });
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    production.dispose();
    creator.dispose();
    super.dispose();
  }

  Future<void> _loadVideos() async {
    setState(() => _loading = true);
    final sortParts = _sortOption.split('_');
    final sortBy = sortParts.first;
    final sortDir = sortParts.length > 1 ? sortParts.last : 'desc';
    try {
      await creator.fetchStudioVideos(
        keyword: _searchCtrl.text.trim().isNotEmpty ? _searchCtrl.text.trim() : null,
        status: _statusFilter != 'ALL' ? _statusFilter : null,
        isExclusive: _isExclusive,
        sortBy: sortBy,
        sortDir: sortDir,
      );
    } catch (e) {
      if (mounted) {
        setState(() => _statusNote = 'Lỗi tải danh mục: ${e.toString().replaceFirst("Exception: ", "")}');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> openStudio() async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (_) => CreatorStudio(
          preferences: widget.preferences,
          channelRepository: widget.app.channelRepository,
          creatorSeriesRepository: widget.app.creatorSeriesRepository,
          creatorStudioRepository: widget.app.creatorStudioRepository,
          kycRepository: widget.app.kycRepository,
          contractRepository: widget.app.contractRepository,
          hireRequestRepository: widget.app.hireRequestRepository,
          milestoneRepository: widget.app.milestoneRepository,
          deliverableRepository: widget.app.deliverableRepository,
          disputeRepository: widget.app.disputeRepository,
          chatRepository: widget.app.chatRepository,
          narratorProfileRepository: widget.app.narratorProfileRepository,
          narratorDemoRepository: widget.app.narratorDemoRepository,
          freelancerRepository: widget.app.freelancerRepository,
          postRepository: widget.app.postRepository,
          walletRepository: widget.app.walletRepository,
          withdrawalRepository: widget.app.withdrawalRepository,
        ),
      ),
    );
    if (!mounted) return;
    production.dispose();
    creator.dispose();
    setState(() {
      creator = _buildCreator();
      production = PublicationState(creator);
    });
    if (creator.isLiveBackend) {
      await creator.initStudioBackend();
      if (mounted) _loadVideos();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (creator.isLiveBackend) {
      return _buildLiveContentLibrary(context);
    }
    return _buildMockPublicationView(context);
  }

  Widget _buildLiveContentLibrary(BuildContext context) {
    final videos = creator.studioVideos;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thư Viện Nội Dung'),
        actions: [
          IconButton(
            key: const Key('refresh-content-library-btn'),
            icon: const Icon(CupertinoIcons.arrow_clockwise, size: 20),
            tooltip: 'Làm mới',
            onPressed: _loadVideos,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadVideos,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
          children: [
            // 1. Header Masthead
            const Eyebrow('KHO TÁC PHẨM SỬ KÝ'),
            const SizedBox(height: 8),
            Text('Thư Viện Nội Dung', style: editorial(28)),
            const SizedBox(height: 6),
            const Text(
              'Quản lý toàn bộ danh mục podcast, video hoạt họa lịch sử và theo dõi tiến trình kiểm duyệt của kênh.',
              style: TextStyle(color: Palette.muted, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Chip(
                  label: Text(
                    'Tổng cộng: ${videos.length} tác phẩm',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
                FilledButton.icon(
                  key: const Key('create-new-content-btn'),
                  icon: const Icon(CupertinoIcons.plus, size: 16),
                  label: const Text('Tạo nội dung mới'),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => AiWhiteboardPipelinePage(state: creator),
                      ),
                    ).then((_) => _loadVideos());
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 2. Status Tabs (Horizontal Scroll)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _statusTabs.map((tab) {
                  final isSelected = _statusFilter == tab['key'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(tab['label']!, style: const TextStyle(fontSize: 12)),
                      selected: isSelected,
                      onSelected: (_) {
                        setState(() => _statusFilter = tab['key']!);
                        _loadVideos();
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // 3. Search & Sort Bar
            TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Tìm theo tiêu đề hoặc kịch bản...',
                prefixIcon: const Icon(CupertinoIcons.search, size: 18),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_searchCtrl.text.isNotEmpty)
                      IconButton(
                        icon: const Icon(CupertinoIcons.clear_circled, size: 18),
                        onPressed: () {
                          _searchCtrl.clear();
                          _loadVideos();
                        },
                      ),
                    IconButton(
                      icon: const Icon(CupertinoIcons.arrow_right_circle_fill, size: 22, color: Palette.red),
                      onPressed: _loadVideos,
                    ),
                  ],
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                filled: true,
                fillColor: Palette.soft,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Palette.line),
                ),
              ),
              onSubmitted: (_) => _loadVideos(),
            ),
            const SizedBox(height: 12),

            // VIP Filter & Sort Dropdown
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                FilterChip(
                  label: const Text('Chỉ VIP', style: TextStyle(fontSize: 12)),
                  selected: _isExclusive == true,
                  onSelected: (val) {
                    setState(() => _isExclusive = val ? true : null);
                    _loadVideos();
                  },
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Palette.line),
                    color: Palette.paper,
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _sortOption,
                      isDense: true,
                      style: const TextStyle(fontSize: 12, color: Palette.ink),
                      items: _sortOptions.map((opt) {
                        return DropdownMenuItem<String>(
                          value: opt['value'],
                          child: Text(opt['label']!),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() => _sortOption = val);
                          _loadVideos();
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_statusNote.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.line),
                ),
                child: Row(
                  children: [
                    const Icon(CupertinoIcons.info_circle, size: 16, color: Palette.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_statusNote, style: const TextStyle(fontSize: 12)),
                    ),
                    IconButton(
                      icon: const Icon(CupertinoIcons.xmark, size: 14),
                      onPressed: () => setState(() => _statusNote = ''),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // 4. Content List or Empty State
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (videos.isEmpty)
              Container(
                margin: const EdgeInsets.only(top: 16),
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  border: Border.all(color: Palette.line.withValues(alpha: 0.8), style: BorderStyle.solid),
                  borderRadius: BorderRadius.circular(16),
                  color: Palette.soft.withValues(alpha: 0.5),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Palette.paper,
                        shape: BoxShape.circle,
                        border: Border.all(color: Palette.line),
                      ),
                      child: const Icon(Icons.video_library_outlined, size: 28, color: Palette.muted),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Thư viện kênh hiện chưa có tác phẩm nào',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Kênh của bạn chưa có tác phẩm podcast hoặc video nào. Bạn có thể bắt đầu bằng cách nhấn "Tạo nội dung mới" để khởi tạo kịch bản và dựng hoạt họa trong Creator Studio.',
                      style: TextStyle(color: Palette.muted, fontSize: 12.5, height: 1.4),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    FilledButton.icon(
                      style: FilledButton.styleFrom(backgroundColor: Palette.red),
                      icon: const Icon(CupertinoIcons.sparkles, size: 16),
                      label: const Text('Tạo nội dung mới'),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AiWhiteboardPipelinePage(state: creator),
                          ),
                        ).then((_) => _loadVideos());
                      },
                    ),
                  ],
                ),
              )
            else
              ...videos.map((v) => _buildLiveVideoCard(context, v)),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveVideoCard(BuildContext context, Map<String, dynamic> v) {
    final contentId = v['contentId'] as int? ?? (int.tryParse(v['id']?.toString() ?? '') ?? 0);
    final title = (v['title'] ?? 'Tập video không tiêu đề').toString();
    final description = (v['description'] ?? v['textBody'] ?? '').toString();
    final status = (v['status'] ?? 'DRAFT').toString().toUpperCase();
    final isExclusive = v['isExclusive'] == true;
    final likeCount = v['likeCount'] ?? 0;
    final commentCount = v['commentCount'] ?? 0;
    final durationSeconds = v['durationSeconds'] as int? ?? (v['duration'] as int? ?? 0);
    final durationLabel = _formatDuration(durationSeconds);
    final createdAt = _formatDate(v['createdAt']?.toString());
    final thumbnailUrl = v['thumbnailUrl']?.toString() ?? '';
    final shieldLabel = (v['aiShieldTierLabel'] ?? v['aiShieldTier'] ?? 'Chờ quét AI Shield').toString();
    final shieldScore = v['aiShieldScore'];

    final isHidden = status == 'HIDDEN';
    final canSubmit = status == 'COMPLETED' || status == 'DRAFT';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Palette.line),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
            child: Stack(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: thumbnailUrl.isNotEmpty && thumbnailUrl.startsWith('http')
                      ? Image.network(
                          thumbnailUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildPlaceholderThumbnail(),
                        )
                      : _buildPlaceholderThumbnail(),
                ),
                Positioned.fill(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => _openQuickWatchModal(v),
                      child: Center(
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.55),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(CupertinoIcons.play_fill, color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      durationLabel,
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: editorial(17),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: const TextStyle(fontSize: 12.5, color: Palette.muted, height: 1.4),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _buildStatusBadge(status),
                    if (isExclusive)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD97706).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFD97706).withValues(alpha: 0.5)),
                        ),
                        child: const Text('HỘI VIÊN (VIP)', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: const Color(0xFFD97706))),
                      ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Text(
                        shieldScore != null
                            ? 'AI Shield: $shieldLabel ($shieldScore%)'
                            : 'AI Shield: $shieldLabel',
                        style: const TextStyle(fontSize: 10.5, color: Palette.ink, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(CupertinoIcons.heart_fill, size: 14, color: Palette.red),
                    const SizedBox(width: 4),
                    Text('$likeCount', style: const TextStyle(fontSize: 11.5, color: Palette.muted)),
                    const SizedBox(width: 14),
                    const Icon(CupertinoIcons.chat_bubble_fill, size: 14, color: Palette.muted),
                    const SizedBox(width: 4),
                    Text('$commentCount', style: const TextStyle(fontSize: 11.5, color: Palette.muted)),
                    const Spacer(),
                    if (createdAt.isNotEmpty) ...[
                      const Icon(CupertinoIcons.calendar, size: 13, color: Palette.muted),
                      const SizedBox(width: 4),
                      Text(createdAt, style: const TextStyle(fontSize: 11.5, color: Palette.muted)),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    OutlinedButton.icon(
                      key: Key('watch-video-$contentId'),
                      icon: const Icon(CupertinoIcons.play_circle, size: 16),
                      label: const Text('Xem thử'),
                      onPressed: () => _openQuickWatchModal(v),
                    ),
                    if (canSubmit)
                      FilledButton.tonalIcon(
                        key: Key('submit-publish-$contentId'),
                        icon: const Icon(CupertinoIcons.paperplane_fill, size: 14),
                        label: const Text('Gửi duyệt AI Shield & Xuất bản'),
                        onPressed: () => _submitPublish(contentId),
                      ),
                    OutlinedButton.icon(
                      key: Key('edit-video-$contentId'),
                      icon: const Icon(CupertinoIcons.pencil, size: 15),
                      label: const Text('Sửa thông tin'),
                      onPressed: () => _openEditVideoDialog(contentId, title, description, isExclusive),
                    ),
                    OutlinedButton.icon(
                      key: Key('toggle-visibility-$contentId'),
                      icon: Icon(isHidden ? CupertinoIcons.eye : CupertinoIcons.eye_slash, size: 15),
                      label: Text(isHidden ? 'Hiện video' : 'Ẩn video'),
                      onPressed: () => _toggleVisibility(contentId, isHidden),
                    ),
                    OutlinedButton.icon(
                      key: Key('view-comments-$contentId'),
                      icon: const Icon(CupertinoIcons.bubble_left_bubble_right, size: 15),
                      label: const Text('Bình luận'),
                      onPressed: () => _openVideoDetailCommentsSheet(contentId),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderThumbnail() {
    return Container(
      color: Palette.soft,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.movie_creation_outlined, size: 36, color: Palette.muted.withValues(alpha: 0.6)),
            const SizedBox(height: 6),
            const Text('Sử Ký Studio', style: TextStyle(fontSize: 11, color: Palette.muted)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    String label;
    switch (status) {
      case 'PUBLISHED':
        bg = Colors.green.shade50;
        fg = Colors.green.shade800;
        label = 'Đã xuất bản';
        break;
      case 'PENDING_REVIEW':
      case 'PENDING':
        bg = Colors.amber.shade50;
        fg = Colors.amber.shade900;
        label = 'Chờ duyệt';
        break;
      case 'COMPLETED':
        bg = Colors.blue.shade50;
        fg = Colors.blue.shade800;
        label = 'Chờ gửi duyệt';
        break;
      case 'DRAFT':
        bg = Palette.soft;
        fg = Palette.muted;
        label = 'Bản nháp';
        break;
      case 'REJECTED':
        bg = Colors.red.shade50;
        fg = Colors.red.shade800;
        label = 'Bị từ chối';
        break;
      case 'HIDDEN':
        bg = Colors.grey.shade200;
        fg = Colors.grey.shade700;
        label = 'Đã ẩn';
        break;
      case 'PROCESSING':
        bg = Colors.purple.shade50;
        fg = Colors.purple.shade800;
        label = 'Đang xử lý';
        break;
      case 'FAILED':
        bg = Colors.red.shade100;
        fg = Colors.red.shade900;
        label = 'Lỗi render';
        break;
      default:
        bg = Palette.soft;
        fg = Palette.ink;
        label = status;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: fg.withValues(alpha: 0.3)),
      ),
      child: Text(label, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: fg)),
    );
  }

  String _formatDuration(int seconds) {
    if (seconds <= 0) return '00:00';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, "0")}:${s.toString().padLeft(2, "0")}';
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    try {
      final d = DateTime.parse(raw);
      return '${d.day.toString().padLeft(2, "0")}/${d.month.toString().padLeft(2, "0")}/${d.year}';
    } catch (_) {
      return raw;
    }
  }

  void _openQuickWatchModal(Map<String, dynamic> item) {
    final title = (item['title'] ?? 'Xem tác phẩm').toString();
    final fileUrl = (item['fileUrl'] ?? '').toString();
    final description = (item['description'] ?? item['textBody'] ?? '').toString();
    final durationSeconds = item['durationSeconds'] as int? ?? 0;
    final durationLabel = _formatDuration(durationSeconds);

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(title, style: editorial(18), maxLines: 2, overflow: TextOverflow.ellipsis),
                ),
                IconButton(
                  icon: const Icon(CupertinoIcons.xmark),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(CupertinoIcons.play_circle_fill, size: 48, color: Colors.white70),
                    const SizedBox(height: 8),
                    Text(
                      fileUrl.isNotEmpty ? 'Tệp phương tiện: $durationLabel' : 'Chưa có file phương tiện hoàn tất',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    if (fileUrl.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        fileUrl,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white38, fontSize: 10),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text('Kịch bản / Nội dung:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
              const SizedBox(height: 4),
              Text(
                description,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: Palette.muted, height: 1.4),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Đóng'),
            ),
          ],
        ),
      ),
    );
  }

  void _openEditVideoDialog(int contentId, String currentTitle, String? currentDesc, bool? isEx) {
    final titleCtrl = TextEditingController(text: currentTitle);
    final descCtrl = TextEditingController(text: currentDesc ?? '');
    bool isExclusive = isEx ?? false;

    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          title: const Text('Chỉnh sửa tác phẩm'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'Tiêu đề tác phẩm *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Mô tả / Kịch bản'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Chỉ dành cho Hội viên VIP'),
                  value: isExclusive,
                  onChanged: (val) => setDlgState(() => isExclusive = val),
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
                final newTitle = titleCtrl.text.trim();
                if (newTitle.isEmpty) return;
                Navigator.pop(ctx);
                try {
                  await creator.updateStudioVideo(
                    contentId,
                    title: newTitle,
                    description: descCtrl.text.trim(),
                    isExclusive: isExclusive,
                  );
                  setState(() => _statusNote = 'Đã cập nhật tác phẩm thành công!');
                  _loadVideos();
                } catch (e) {
                  setState(() => _statusNote = 'Lỗi cập nhật: $e');
                }
              },
              child: const Text('Lưu thay đổi'),
            ),
          ],
        ),
      ),
    );
  }

  void _openVideoDetailCommentsSheet(int contentId) async {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => FutureBuilder<List<dynamic>>(
        future: creator.getStudioVideoComments(contentId),
        builder: (ctx, snapshot) {
          final comments = snapshot.data ?? [];
          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.6,
            minChildSize: 0.4,
            maxChildSize: 0.9,
            builder: (ctx, scroll) => Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Bình luận của khán giả',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(CupertinoIcons.xmark),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Divider(),
                  if (snapshot.connectionState == ConnectionState.waiting)
                    const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
                  else if (comments.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(child: Text('Chưa có bình luận nào cho tác phẩm này.', style: TextStyle(color: Palette.muted))),
                    )
                  else
                    Expanded(
                      child: ListView.separated(
                        controller: scroll,
                        itemCount: comments.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (ctx, i) {
                          final c = comments[i] as Map<String, dynamic>;
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Palette.soft,
                              child: Text(
                                ((c['userFullName'] ?? c['userEmail'] ?? 'U') as String).characters.first.toUpperCase(),
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Palette.red),
                              ),
                            ),
                            title: Text(
                              (c['userFullName'] ?? c['userEmail'] ?? 'Khán giả Sử Ký').toString(),
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            subtitle: Text((c['textBody'] ?? c['content'] ?? '').toString(), style: const TextStyle(fontSize: 12)),
                            trailing: Text(
                              _formatDate(c['createdAt']?.toString()),
                              style: const TextStyle(fontSize: 11, color: Palette.muted),
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _toggleVisibility(int contentId, bool currentlyHidden) async {
    try {
      await creator.updateStudioVideoVisibility(contentId, !currentlyHidden);
      setState(() => _statusNote = currentlyHidden ? 'Đã hiển thị video công khai.' : 'Đã ẩn video.');
      _loadVideos();
    } catch (e) {
      setState(() => _statusNote = 'Lỗi cập nhật hiển thị: $e');
    }
  }

  Future<void> _submitPublish(int contentId) async {
    try {
      await creator.submitStudioVideoForPublish(contentId);
      setState(() => _statusNote = 'Đã gửi video kiểm duyệt AI Shield & Đăng ký xuất bản!');
      _loadVideos();
    } catch (e) {
      setState(() => _statusNote = 'Lỗi gửi duyệt: $e');
    }
  }

  Widget _buildMockPublicationView(BuildContext context) {
    final ready = creator.drafts
        .where(
          (d) =>
              d.stage == DraftStage.approved && !production.isPublished(d.id),
        )
        .toList();
    final released = creator.drafts
        .where((d) => production.isPublished(d.id))
        .toList();
    final unfinished = creator.drafts
        .where((d) => d.stage != DraftStage.approved)
        .length;
    final items = published ? released : ready;
    return Scaffold(
      appBar: AppBar(title: const Text('Phát hành')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        children: [
          const Eyebrow('KHÔNG GIAN NGƯỜI KỂ'),
          const SizedBox(height: 10),
          Text('Đưa câu chuyện\nđến người nghe.', style: editorial(28)),
          const SizedBox(height: 24),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ChoiceChip(
                key: const Key('publication-ready'),
                label: Text('Chờ phát hành · ${ready.length}'),
                selected: !published,
                showCheckmark: false,
                onSelected: (_) => setState(() => published = false),
              ),
              ChoiceChip(
                key: const Key('publication-released'),
                label: Text('Đã phát hành · ${released.length}'),
                selected: published,
                showCheckmark: false,
                onSelected: (_) => setState(() => published = true),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.headphones_outlined,
                    size: 32,
                    color: Palette.muted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    published
                        ? 'Chưa có tập đã phát hành'
                        : 'Chưa có tập sẵn sàng',
                    style: editorial(21),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    published
                        ? 'Tập phát hành sẽ được lưu ở đây.'
                        : 'Hoàn thiện bản thảo và gửi duyệt trong Studio.',
                    style: const TextStyle(color: Palette.muted),
                  ),
                ],
              ),
            ),
          for (final d in items)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: InkWell(
                key: Key('publication-${d.id}'),
                borderRadius: BorderRadius.circular(12),
                onTap: () async {
                  await Navigator.push<void>(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PublicationReviewPage(
                        draft: d,
                        production: production,
                        app: widget.app,
                      ),
                    ),
                  );
                  if (mounted) setState(() {});
                },
                child: Ink(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Palette.line),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: ArtworkImage(
                          artworkReference(draftArtworkTarget(d.id, d.format)),
                          width: 76,
                          height: 100,
                          fit: BoxFit.cover,
                          excludeFromSemantics: true,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${d.format == 'video' ? 'VIDEO' : 'AUDIO'} · ${published ? 'ĐÃ PHÁT HÀNH' : 'ĐÃ DUYỆT'}',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                                color: Palette.muted,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              d.title,
                              style: editorial(18),
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    published
                                        ? 'Quản lý tập'
                                        : 'Chuẩn bị phát hành',
                                    style: const TextStyle(
                                      color: Palette.red,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                const Icon(
                                  Icons.arrow_forward,
                                  size: 16,
                                  color: Palette.red,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          const SizedBox(height: 12),
          const Divider(),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.edit_note_outlined),
            title: const Text('Bản thảo trong Studio'),
            subtitle: Text(
              '$unfinished tập đang hoàn thiện',
              style: const TextStyle(fontSize: 12),
            ),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: openStudio,
          ),
          if (!widget.app.isLiveBackend) ...[
            const SizedBox(height: 20),
            const Text(
              'Bản thử · Phát hành trên thiết bị này.',
              style: TextStyle(fontSize: 11, color: Palette.muted),
            ),
          ],
        ],
      ),
    );
  }
}


class PublicationReviewPage extends StatefulWidget {
  const PublicationReviewPage({
    super.key,
    required this.draft,
    required this.production,
    required this.app,
  });
  final CreatorDraft draft;
  final PublicationState production;
  final AppState app;
  @override
  State<PublicationReviewPage> createState() => _PublicationReviewPageState();
}

class _PublicationReviewPageState extends State<PublicationReviewPage> {
  bool busy = false, membersOnly = false;
  String? error;
  bool get published => widget.production.isPublished(widget.draft.id);
  bool get eligible =>
      widget.production.creator.kyc.isApproved &&
      widget.production.creator.channel.isNotEmpty &&
      widget.draft.stage == DraftStage.approved;
  bool get ready => widget.production.jobs[widget.draft.id] == 'ready';

  @override
  void initState() {
    super.initState();
    final entries = jsonDecode(
      widget.production.creator.preferences.getString('publishedEpisodesV1') ??
          '[]',
    ) as List;
    for (final e in entries) {
      if (e['id'] == 'published-${widget.draft.id}') {
        membersOnly = e['membersOnly'] == true;
      }
    }
  }

  Future<void> run(Future<void> Function() work) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    String? failure;
    try {
      await work();
      widget.app.reloadCatalog();
    } on StateError catch (e) {
      failure = e.message;
    } catch (_) {
      failure = 'Chưa lưu được. Hãy thử lại.';
    }
    if (mounted) {
      setState(() {
        busy = false;
        error = failure;
      });
    }
  }

  Future<void> remove() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Gỡ tập khỏi danh mục?'),
        content: const Text('Bản thảo vẫn được giữ trong Studio.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Giữ lại'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Gỡ tập'),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      await run(() => widget.production.unpublish(widget.draft.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.draft;
    final failed = widget.production.jobs[d.id] == 'failed';
    return Scaffold(
      appBar: AppBar(
        title: Text(published ? 'Quản lý tập' : 'Chuẩn bị phát hành'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: d.format == 'video' ? 16 / 9 : 1,
              child: ArtworkImage(
                artworkReference(draftArtworkTarget(d.id, d.format)),
                fit: BoxFit.cover,
                semanticLabel: 'Ảnh bìa ${d.title}',
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(d.title, style: editorial(24)),
          const SizedBox(height: 8),
          Text(
            '${d.format == 'video' ? 'Video' : 'Audio'} · ${widget.production.creator.channel}',
            style: const TextStyle(color: Palette.muted, fontSize: 12),
          ),
          const SizedBox(height: 24),
          if (published) ...[
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.check_circle_outline, color: Palette.red),
              title: Text('Đã có trong danh mục'),
              subtitle: Text('Người nghe có thể tìm tập trong Khám phá.'),
            ),
            Text(membersOnly ? 'Quyền xem: Hội viên' : 'Quyền xem: Mọi người'),
            const SizedBox(height: 16),
            OutlinedButton(
              key: const Key('unpublish-episode'),
              onPressed: busy ? null : remove,
              child: Text(
                widget.app.isLiveBackend
                    ? 'Gỡ khỏi danh mục'
                    : 'Gỡ khỏi danh mục thử',
              ),
            ),
          ] else ...[
            Text(
              'Ai có thể xem?',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ChoiceChip(
                  key: const Key('audience-public'),
                  label: const Text('Mọi người'),
                  selected: !membersOnly,
                  onSelected: busy
                      ? null
                      : (_) => setState(() => membersOnly = false),
                ),
                ChoiceChip(
                  key: const Key('audience-members'),
                  label: const Text('Hội viên'),
                  selected: membersOnly,
                  onSelected: busy
                      ? null
                      : (_) => setState(() => membersOnly = true),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  ready
                      ? Icons.check_circle_outline
                      : failed
                      ? Icons.error_outline
                      : Icons.audio_file_outlined,
                  size: 20,
                  color: failed ? Palette.red : Palette.muted,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    ready
                        ? (widget.app.isLiveBackend
                              ? 'Bản phát hành đã sẵn sàng'
                              : 'Bản phát thử đã sẵn sàng')
                        : failed
                        ? 'Chuẩn bị chưa thành công. Bạn có thể thử lại.'
                        : 'Chuẩn bị bản phát trước khi xác nhận.',
                    style: TextStyle(
                      color: failed ? Palette.red : Palette.muted,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            if (!eligible)
              const Padding(
                padding: EdgeInsets.only(top: 16),
                child: Text(
                  'Cần tạo kênh, xác minh danh tính và duyệt tập trong Studio.',
                  style: TextStyle(color: Palette.red),
                ),
              ),
            const SizedBox(height: 20),
            FilledButton(
              key: const Key('publication-primary'),
              onPressed: busy || !eligible
                  ? null
                  : () => run(
                      ready
                          ? () => widget.production.publish(
                              d.id,
                              membersOnly: membersOnly,
                              app: widget.app,
                            )
                          : () => widget.production.buildDemo(d.id),
                    ),
              child: Text(
                busy
                    ? 'Đang xử lý…'
                    : ready
                    ? 'Xác nhận phát hành'
                    : failed
                    ? 'Thử lại'
                    : (widget.app.isLiveBackend
                          ? 'Chuẩn bị bản phát hành'
                          : 'Chuẩn bị bản phát thử'),
              ),
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
          if (!widget.app.isLiveBackend) ...[
            const SizedBox(height: 20),
            const Text(
              'Ảnh bìa và bản phát là mẫu kỹ thuật. Chỉ lưu trên thiết bị này.',
              style: TextStyle(color: Palette.muted, fontSize: 11),
            ),
            if (!published) ...[
              const SizedBox(height: 16),
              ExpansionTile(
                title: const Text(
                  'Công cụ kiểm thử',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
                tilePadding: EdgeInsets.zero,
                children: [
                  TextButton(
                    onPressed: busy || !eligible
                        ? null
                        : () => run(
                            () =>
                                widget.production.buildDemo(d.id, fail: true),
                          ),
                    child: const Text('Giả lập lỗi chuẩn bị'),
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }
}
