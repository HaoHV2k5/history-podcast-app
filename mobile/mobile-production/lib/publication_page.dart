import 'dart:convert';

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

  Future<void> publish(String id, {required bool membersOnly}) async {
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
    final video = draft.format == 'video';
    final episode = Episode(
      id: publicId,
      title: draft.title,
      channel: creator.channel,
      image: artworkReference(draftArtworkTarget(draft.id, draft.format)),
      channelImage: artworkReference('channel'),
      category: 'Việt Nam',
      seconds: video ? 12 : 24,
      description:
          '${video ? 'Video kiểm tra kỹ thuật 12 giây, không phải phim của kịch bản.' : 'Audio kỹ thuật 24 giây, không phải giọng đọc của kịch bản.'}\n\n${draft.script}',
      chapters: [const Chapter('Bắt đầu bản thử', 0)],
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
  late CreatorState creator = CreatorState(widget.preferences);
  late PublicationState production = PublicationState(creator);
  bool published = false;

  @override
  void dispose() {
    production.dispose();
    creator.dispose();
    super.dispose();
  }

  Future<void> openStudio() async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (_) => CreatorStudio(preferences: widget.preferences),
      ),
    );
    if (!mounted) return;
    production.dispose();
    creator.dispose();
    setState(() {
      creator = CreatorState(widget.preferences);
      production = PublicationState(creator);
    });
  }

  @override
  Widget build(BuildContext context) {
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
          const SizedBox(height: 20),
          const Text(
            'Bản thử · Phát hành trên thiết bị này.',
            style: TextStyle(fontSize: 11, color: Palette.muted),
          ),
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
              child: const Text('Gỡ khỏi danh mục thử'),
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
                        ? 'Bản phát thử đã sẵn sàng'
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
                    : 'Chuẩn bị bản phát thử',
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
                          () => widget.production.buildDemo(d.id, fail: true),
                        ),
                  child: const Text('Giả lập lỗi chuẩn bị'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
