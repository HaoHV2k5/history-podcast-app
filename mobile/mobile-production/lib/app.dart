import 'dart:ui' as ui;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'app_state.dart';
import 'brand_header.dart';
import 'discovery_carousel.dart';
import 'components.dart';
import 'audience_pages.dart';
import 'design.dart';
import 'artwork_image.dart';
import 'episode.dart';
import 'motion.dart';
import 'home_navigation.dart';
import 'livestream_page.dart';
import 'creator_studio_extensions.dart';
import 'narrator_marketplace.dart';
import 'paper_surface.dart';
import 'listening_widgets.dart';
import 'video_surface.dart';

void openChannel(BuildContext context, Channel channel, AppState state) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => ChannelPage(
        channel: channel,
        state: state,
        onEpisode: (e) => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => EpisodePage(episode: e, state: state),
          ),
        ),
      ),
    ),
  );
}

class SuKyApp extends StatelessWidget {
  const SuKyApp({super.key, required this.state});
  final AppState state;
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Sử Ký · Nghe chuyện lịch sử',
    debugShowCheckedModeBanner: false,
    theme: appTheme(),
    themeMode: ThemeMode.light,
    builder: (context, child) => ColoredBox(
      color: const Color(0xFFE8E6E1),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: child!,
        ),
      ),
    ),
    home: HomeShell(state: state),
  );
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.state});
  final AppState state;
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;
  String libraryFilter = 'Đã lưu';

  void detail(Episode e) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => EpisodePage(episode: e, state: widget.state),
      ),
    );
  }

  void selectTab(int value) {
    if (value == index) return;
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() => index = value);
  }

  void _showServerConfigDialog() {
    final currentUrl = widget.state.apiClient?.baseUrl ?? 'http://10.87.31.229:8080';
    final controller = TextEditingController(text: currentUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Palette.paper,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Cấu hình máy chủ API', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Nhập địa chỉ máy chủ backend Sử Ký:',
              style: TextStyle(fontSize: 13, color: Palette.muted),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                filled: true,
                fillColor: Palette.soft,
                hintText: 'http://10.87.31.229:8080',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Gợi ý kết nối nhanh:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: const Text('Máy tính Wi-Fi (10.87.31.229)', style: TextStyle(fontSize: 11)),
                  onPressed: () => controller.text = 'http://10.87.31.229:8080',
                ),
                ActionChip(
                  label: const Text('Giả lập Android (10.0.2.2)', style: TextStyle(fontSize: 11)),
                  onPressed: () => controller.text = 'http://10.0.2.2:8080',
                ),
                ActionChip(
                  label: const Text('Localhost (Web)', style: TextStyle(fontSize: 11)),
                  onPressed: () => controller.text = 'http://localhost:8080',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Palette.red),
            onPressed: () {
              final newUrl = controller.text.trim();
              if (newUrl.isNotEmpty) {
                widget.state.updateApiBaseUrl(newUrl);
              }
              Navigator.pop(ctx);
            },
            child: const Text('Lưu & Kết nối'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.state,
    builder: (context, _) => Scaffold(
      extendBody: true,
      appBar: BrandHeader.adaptive(context),
      body: PaperSurface(
        child: Padding(
          padding: EdgeInsets.only(
            bottom:
                HomeTabBar.heightOf(context) +
                MediaQuery.paddingOf(context).bottom,
          ),
          child: RetainedHomeTabs(
            index: index,
            child: KeyedSubtree(
              key: ValueKey(index),
              child: switch (index) {
                0 => discover(),
                1 => LivestreamExploreView(state: widget.state),
                2 => AiWhiteboardPipelinePage(state: widget.state.creatorState),
                3 => RecruitmentMarketplaceView(state: widget.state),
                _ => ProfileContent(
                  state: widget.state,
                  onChannel: (c) => openChannel(context, c, widget.state),
                ),
              },
            ),
          ),
        ),
      ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (MediaQuery.disableAnimationsOf(context))
            if (widget.state.current != null)
              MiniPlayer(state: widget.state)
            else
              const SizedBox.shrink()
          else
            AnimatedSize(
              duration: motionDuration(context, 220),
              curve: Curves.easeOutCubic,
              alignment: Alignment.bottomCenter,
              child: widget.state.current != null
                  ? MiniPlayer(state: widget.state)
                  : const SizedBox(width: double.infinity),
            ),
          HomeTabBar(index: index, onSelected: selectTab),
        ],
      ),
    ),
  );

  Widget discover() => RefreshIndicator(
    color: Palette.red,
    backgroundColor: Palette.paper,
    onRefresh: widget.state.refreshCatalog,
    child: ListView(
      key: const PageStorageKey('discover-scroll'),
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(
        24,
        4,
        24,
        widget.state.current == null ? 28 : 118,
      ),
      children: [
        Row(
          children: [
            Expanded(child: Text('Khám phá', style: editorial(31))),
            CircleAction(
              icon: CupertinoIcons.search,
              label: 'Tìm câu chuyện',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => SearchPage(state: widget.state),
                ),
              ),
            ),
          ],
        ),
        if (widget.state.isLoadingCatalog) ...[
          const SizedBox(height: 12),
          const LinearProgressIndicator(
            key: Key('catalog-loading-indicator'),
            minHeight: 2,
            color: Palette.red,
            backgroundColor: Palette.soft,
          ),
        ],
        if (widget.state.catalogError != null) ...[
          const SizedBox(height: 14),
          Container(
            key: const Key('catalog-error-banner'),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Palette.line),
            ),
            child: Row(
              children: [
                const Icon(
                  CupertinoIcons.wifi_slash,
                  size: 16,
                  color: Palette.red,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    widget.state.catalogError!,
                    style: const TextStyle(fontSize: 12, color: Palette.ink),
                  ),
                ),
                TextButton(
                  key: const Key('retry-catalog-btn'),
                  onPressed: widget.state.refreshCatalog,
                  child: const Text('Thử lại'),
                ),
                IconButton(
                  tooltip: 'Cài đặt IP máy chủ',
                  icon: const Icon(CupertinoIcons.gear, size: 16),
                  onPressed: _showServerConfigDialog,
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 22),
        ContinueListening(
          state: widget.state,
          onPlay: (e) {
            if (widget.state.play(e)) {
              Navigator.of(context)
                  .push(playerRoute(context, PlayerPage(state: widget.state)));
            }
          },
        ),
        DiscoveryCarousel(
          onCollection: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => CollectionPage(state: widget.state),
            ),
          ),
          onEpisode: detail,
        ),
        if (remoteEpisodes.isNotEmpty) ...[
          const SizedBox(height: 28),
          SectionTitle(
            title: 'Tập mới xuất bản',
            trailing: Text(
              '${remoteEpisodes.length} tập',
              style: const TextStyle(fontSize: 12, color: Palette.muted),
            ),
          ),
          const SizedBox(height: 12),
          ...remoteEpisodes.map(
            (e) => EpisodeRow(episode: e, onTap: () => detail(e)),
          ),
        ],
        if (remoteChannels.isNotEmpty) ...[
          const SizedBox(height: 24),
          const SectionTitle(title: 'Kênh kể chuyện'),
          const SizedBox(height: 8),
          ...remoteChannels.map(
            (c) => ChannelListItem(
              channel: c,
              subtitle: '${c.content.length} câu chuyện',
              onTap: () => openChannel(context, c, widget.state),
            ),
          ),
        ],
        const SizedBox(height: 28),
        Builder(
          builder: (context) {
            final featuredPool =
                remoteEpisodes.isNotEmpty
                ? remoteEpisodes
                : episodes;
            final featured = featuredPool.first;
            final subFeatured = featuredPool.skip(1).take(2).toList();
            final videoPool =
                remoteEpisodes.isNotEmpty
                ? remoteEpisodes.where((e) => e.isVideo).toList()
                : videoEpisodes;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SectionTitle(
                  title: 'Chọn nghe hôm nay',
                  trailing: Text(
                    '01 — 0${(1 + subFeatured.length).clamp(1, 3)}',
                    style: const TextStyle(fontSize: 12, color: Palette.muted),
                  ),
                ),
                const SizedBox(height: 14),
                InkWell(
                  key: const Key('featured-episode'),
                  borderRadius: BorderRadius.circular(8),
                  onTap: () => detail(featured),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Cover(episode: featured, height: 188),
                      const SizedBox(height: 14),
                      Eyebrow(featured.category.toUpperCase()),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              featured.title,
                              style: const TextStyle(
                                fontSize: 17,
                                height: 1.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Icon(CupertinoIcons.arrow_up_right, size: 20),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        '${featured.channel} · ${featured.duration}',
                        style: const TextStyle(
                          color: Palette.muted,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
                ...subFeatured.map(
                  (e) => EpisodeRow(episode: e, onTap: () => detail(e)),
                ),
                if (videoPool.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionTitle(title: 'Câu chuyện qua khung hình'),
                  ...videoPool.map(
                    (e) => EpisodeRow(episode: e, onTap: () => detail(e)),
                  ),
                ],
              ],
            );
          },
        ),
        if (!widget.state.isLiveBackend) ...[
          const SizedBox(height: 24),
          const SectionTitle(title: 'Thử trình nghe'),
          const Text(
            'Audio kỹ thuật để test, chưa phải giọng kể.',
            style: TextStyle(color: Palette.muted, fontSize: 12),
          ),
          ...audioEpisodes.map(
            (e) => EpisodeRow(episode: e, onTap: () => detail(e)),
          ),
        ],
        if (publishedEpisodes.isNotEmpty) ...[
          const SizedBox(height: 24),
          const SectionTitle(title: 'Vừa phát hành trên thiết bị'),
          ...publishedEpisodes.map(
            (e) => EpisodeRow(episode: e, onTap: () => detail(e)),
          ),
        ],
        if (!widget.state.isLiveBackend) ...[
          const SizedBox(height: 24),
          const DemoNote(),
        ],
      ],
    ),
  );

  Widget library() {
    final items =
        allEpisodes.where((e) => widget.state.saved.contains(e.id)).toList()
          ..sort(
            (a, b) => widget.state.saved
                .toList()
                .indexOf(b.id)
                .compareTo(widget.state.saved.toList().indexOf(a.id)),
          );
    final followed = channels
        .where((c) => widget.state.followed.contains(c.name))
        .toList();
    final history = widget.state.listeningHistory;
    return ListView(
      key: const PageStorageKey('library-scroll'),
      padding: EdgeInsets.fromLTRB(
        24,
        4,
        24,
        widget.state.current == null ? 28 : 118,
      ),
      children: [
        Text('Thư viện', style: editorial(31)),
        const SizedBox(height: 10),
        const Text(
          'Những câu chuyện bạn muốn giữ lại.',
          style: TextStyle(color: Palette.muted, fontSize: 13),
        ),
        const SizedBox(height: 20),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ['Đã lưu', 'Kênh', 'Đã nghe']
              .map(
                (f) => ChoiceChip(
                  key: ValueKey('library-filter-$f'),
                  label: Text(f),
                  selected: libraryFilter == f,
                  showCheckmark: false,
                  selectedColor: Palette.soft,
                  backgroundColor: Palette.paper,
                  onSelected: (_) => setState(() => libraryFilter = f),
                  side: BorderSide(
                    color: libraryFilter == f ? Palette.ink : Palette.line,
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 24),
        SectionTitle(
          title: libraryFilter == 'Đã lưu'
              ? 'Tập đã lưu'
              : libraryFilter == 'Kênh'
              ? 'Kênh đang theo dõi'
              : 'Nghe gần đây',
          trailing: Text(
            libraryFilter == 'Kênh'
                ? '${followed.length} kênh'
                : '${libraryFilter == 'Đã lưu' ? items.length : history.length} tập',
            style: const TextStyle(color: Palette.muted, fontSize: 12),
          ),
        ),
        const SizedBox(height: 16),
        if (libraryFilter == 'Đã lưu') ...[
          if (items.isEmpty)
            EmptyMessage(
              title: 'Chưa có tập đã lưu',
              message: 'Lưu một tập để dành nghe lúc rảnh.',
              action: 'Khám phá câu chuyện',
              onAction: () => selectTab(0),
            ),
          ...items.map(
            (e) => EpisodeRow(
              episode: e,
              onTap: () => detail(e),
              trailing: IconButton(
                tooltip: 'Bỏ lưu ${e.title}',
                onPressed: () => widget.state.toggleSaved(e),
                icon: const Icon(
                  CupertinoIcons.bookmark_fill,
                  color: Palette.red,
                  size: 20,
                ),
              ),
            ),
          ),
        ],
        if (libraryFilter == 'Kênh') ...[
          if (followed.isEmpty)
            EmptyMessage(
              title: 'Chưa theo dõi kênh nào',
              message:
                  'Theo dõi những người kể bạn yêu thích để tìm lại ở đây.',
              action: 'Tìm kênh kể chuyện',
              onAction: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => SearchPage(state: widget.state),
                ),
              ),
            ),
          ...followed.map(
            (c) => ChannelListItem(
              channel: c,
              subtitle: '${c.content.length} câu chuyện',
              onTap: () => openChannel(context, c, widget.state),
            ),
          ),
        ],
        if (libraryFilter == 'Đã nghe') ...[
          if (history.isEmpty)
            EmptyMessage(
              title: 'Câu chuyện đầu tiên đang chờ',
              message: 'Các tập đã mở nghe sẽ xuất hiện ở đây cùng vị trí nghe gần nhất.',
              action: 'Chọn một câu chuyện',
              onAction: () => selectTab(0),
            ),
          ...history.map(
            (e) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                EpisodeRow(episode: e, onTap: () => detail(e)),
                Padding(
                  padding: const EdgeInsets.only(left: 70, bottom: 14),
                  child: Text(
                    widget.state.progressFor(e) >= e.seconds
                        ? 'Đã nghe hết'
                        : 'Đã nghe ${clockLabel(widget.state.progressFor(e))} · Còn ${(e.seconds - widget.state.progressFor(e) + 59) ~/ 60} phút',
                    style: const TextStyle(fontSize: 11, color: Palette.muted),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class SearchPage extends StatefulWidget {
  const SearchPage({super.key, required this.state});
  final AppState state;

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  String query = '', category = 'Tất cả';
  final search = TextEditingController();

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  void detail(Episode e) {
    widget.state.rememberSearch(query);
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => EpisodePage(episode: e, state: widget.state),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final result = allEpisodes
        .where(
          (e) =>
              (category == 'Tất cả' || e.category == category) &&
              normalizeSearch('${e.title} ${e.channel}')
                  .contains(normalizeSearch(query)),
        )
        .toList();
    final matchingChannels = channels
        .where(
          (c) =>
              normalizeSearch('${c.name} ${c.description}')
                  .contains(normalizeSearch(query)),
        )
        .toList();
    return ListenableBuilder(
      listenable: widget.state,
      builder: (context, _) => Scaffold(
        appBar: AppBar(
          title: const Text('Tìm kiếm', style: TextStyle(fontSize: 16)),
        ),
        body: ListView(
          key: const PageStorageKey('search-scroll'),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.fromLTRB(
            24,
            12,
            24,
            widget.state.current == null ? 28 : 118,
          ),
          children: [
            TextField(
              key: const Key('search-input'),
              controller: search,
              autofocus: true,
              onChanged: (v) => setState(() => query = v),
              textInputAction: TextInputAction.search,
              onSubmitted: (v) {
                widget.state.rememberSearch(v);
                FocusManager.instance.primaryFocus?.unfocus();
              },
              decoration: InputDecoration(
                labelText: 'Tên tập hoặc kênh',
                hintText: 'Thăng Long, phố Hội…',
                prefixIcon: const Icon(CupertinoIcons.search, size: 20),
                suffixIcon: query.isEmpty
                    ? null
                    : IconButton(
                        tooltip: 'Xóa tìm kiếm',
                        onPressed: () {
                          search.clear();
                          setState(() => query = '');
                        },
                        icon: const Icon(CupertinoIcons.xmark, size: 18),
                      ),
              ),
            ),
            const SizedBox(height: 16),
            if (query.trim().isNotEmpty || category != 'Tất cả')
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: ['Tất cả', 'Việt Nam', 'Văn hóa', 'Con người']
                    .map(
                      (c) => ChoiceChip(
                        label: Text(c),
                        selected: category == c,
                        showCheckmark: false,
                        selectedColor: Palette.soft,
                        backgroundColor: Palette.paper,
                        onSelected: (_) => setState(() => category = c),
                        side: BorderSide(
                          color: category == c ? Palette.ink : Palette.line,
                        ),
                      ),
                    )
                    .toList(),
              ),
            const SizedBox(height: 24),
            if (query.trim().isEmpty && category == 'Tất cả') ...[
              if (widget.state.recentSearches.isNotEmpty) ...[
                SectionTitle(
                  title: 'Tìm gần đây',
                  trailing: TextButton(
                    onPressed: widget.state.clearRecentSearches,
                    child: const Text('Xóa'),
                  ),
                ),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: widget.state.recentSearches
                      .map(
                        (q) => ActionChip(
                          label: Text(q),
                          onPressed: () {
                            search.text = q;
                            setState(() => query = q);
                            FocusManager.instance.primaryFocus?.unfocus();
                          },
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 26),
              ],
              const SectionTitle(title: 'Duyệt theo chủ đề'),
              const SizedBox(height: 14),
              SearchTopics(onSelect: (c) => setState(() => category = c)),
            ] else ...[
              if (query.trim().isNotEmpty && matchingChannels.isNotEmpty) ...[
                const SectionTitle(title: 'Kênh kể chuyện'),
                const SizedBox(height: 8),
                ...matchingChannels.map(
                  (c) => ChannelListItem(
                    channel: c,
                    subtitle: '${c.content.length} câu chuyện',
                    onTap: () {
                      widget.state.rememberSearch(query);
                      openChannel(context, c, widget.state);
                    },
                  ),
                ),
                const SizedBox(height: 16),
              ],
              Text(
                '${result.length} tập phù hợp',
                style: const TextStyle(color: Palette.muted, fontSize: 12),
              ),
              const SizedBox(height: 12),
              if (result.isEmpty &&
                  (query.trim().isEmpty || matchingChannels.isEmpty))
                EmptyMessage(
                  title: 'Chưa tìm thấy câu chuyện',
                  message: 'Thử từ khóa khác hoặc bỏ bộ lọc chủ đề.',
                  action: 'Xóa bộ lọc',
                  onAction: () {
                    search.clear();
                    setState(() {
                      query = '';
                      category = 'Tất cả';
                    });
                  },
                ),
              ...result.map((e) => EpisodeRow(episode: e, onTap: () => detail(e))),
            ],
          ],
        ),
        bottomNavigationBar: widget.state.current != null
            ? MiniPlayer(state: widget.state)
            : null,
      ),
    );
  }
}

class CollectionPage extends StatelessWidget {
  const CollectionPage({super.key, required this.state});
  final AppState state;
  @override
  Widget build(BuildContext context) {
    final collectionItems =
        remoteEpisodes.isNotEmpty ? remoteEpisodes : episodes;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tuyển tập', style: TextStyle(fontSize: 14)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Eyebrow('TUYỂN TẬP / 01'),
          const SizedBox(height: 16),
          Text('Theo dấu\nnhững kinh đô.', style: editorial(35)),
          const SizedBox(height: 16),
          const Text(
            'Những nơi từng là trung tâm của một thời, qua những câu chuyện về di sản và đời sống.',
            style: TextStyle(color: Palette.muted),
          ),
          const SizedBox(height: 24),
          ...collectionItems.map(
            (e) => EpisodeRow(
              episode: e,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => EpisodePage(episode: e, state: state),
                ),
              ),
            ),
          ),
          if (!state.isLiveBackend) ...[
            const SizedBox(height: 24),
            const DemoNote(),
          ],
        ],
      ),
    );
  }
}

class EpisodePage extends StatefulWidget {
  const EpisodePage({super.key, required this.episode, required this.state});
  final Episode episode;
  final AppState state;
  @override
  State<EpisodePage> createState() => _EpisodePageState();
}

class _EpisodePageState extends State<EpisodePage> {
  int tab = 0;

  @override
  void initState() {
    super.initState();
    widget.state.loadEpisodeEngagement(widget.episode.id);
  }

  void openPlayer({int? at}) {
    if (!widget.state.play(widget.episode, startAt: at)) {
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => MembershipPage(
            channel: channelByName(widget.episode.channel),
            state: widget.state,
          ),
        ),
      );
      return;
    }
    Navigator.of(context)
        .push(playerRoute(context, PlayerPage(state: widget.state)));
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.episode;
    return ListenableBuilder(
      listenable: widget.state,
      builder: (context, _) => Scaffold(
        appBar: AppBar(
          title: const Text('Chi tiết tập', style: TextStyle(fontSize: 14)),
          actions: [
            IconButton(
              key: const Key('save-episode'),
              tooltip: widget.state.saved.contains(e.id)
                  ? 'Bỏ lưu tập'
                  : 'Lưu tập',
              onPressed: () => widget.state.toggleSaved(e),
              icon: Icon(
                widget.state.saved.contains(e.id)
                    ? CupertinoIcons.bookmark_fill
                    : CupertinoIcons.bookmark,
                color: Palette.red,
              ),
            ),
            const SizedBox(width: 12),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 28),
          children: [
            Cover(episode: e, height: 220),
            const SizedBox(height: 24),
            Eyebrow(
              '${e.category.toUpperCase()} / ${e.isVideo ? 'VIDEO' : 'PODCAST'}',
            ),
            const SizedBox(height: 10),
            Text(e.title, style: editorial(31)),
            const SizedBox(height: 18),
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 12,
              runSpacing: 8,
              children: [
                TextButton.icon(
                  key: const Key('open-channel'),
                  onPressed: () => openChannel(
                    context,
                    channelByName(e.channel),
                    widget.state,
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: Palette.ink,
                    padding: EdgeInsets.zero,
                  ),
                  icon: const Icon(CupertinoIcons.chevron_right, size: 14),
                  iconAlignment: IconAlignment.end,
                  label: Text(
                    '${e.channel}\n${e.duration}',
                    style: const TextStyle(fontSize: 12, height: 1.8),
                  ),
                ),
                OutlinedButton(
                  onPressed: () => widget.state.toggleFollow(e.channel),
                  child: Text(
                    widget.state.followed.contains(e.channel)
                        ? 'Đang theo dõi'
                        : 'Theo dõi',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                OutlinedButton.icon(
                  key: const Key('like-episode'),
                  onPressed: () => widget.state.toggleLike(e.id),
                  icon: Icon(
                    widget.state.isLiked(e.id)
                        ? CupertinoIcons.hand_thumbsup_fill
                        : CupertinoIcons.hand_thumbsup,
                    size: 15,
                    color: widget.state.isLiked(e.id)
                        ? Palette.red
                        : Palette.ink,
                  ),
                  label: Text(
                    '${widget.state.getLikeCount(e.id)} thích',
                    style: TextStyle(
                      fontSize: 12,
                      fontFeatures: const [ui.FontFeature.tabularFigures()],
                      color: widget.state.isLiked(e.id)
                          ? Palette.red
                          : Palette.ink,
                      fontWeight: widget.state.isLiked(e.id)
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  key: const Key('dislike-episode'),
                  tooltip: 'Không thích tập này',
                  onPressed: () => widget.state.toggleDislike(e.id),
                  icon: Icon(
                    widget.state.isDisliked(e.id)
                        ? CupertinoIcons.hand_thumbsdown_fill
                        : CupertinoIcons.hand_thumbsdown,
                    size: 18,
                    color: widget.state.isDisliked(e.id)
                        ? Palette.red
                        : Palette.muted,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              key: const Key('play-episode'),
              onPressed: () => openPlayer(),
              icon: Icon(
                widget.state.canPlay(e)
                    ? CupertinoIcons.play_fill
                    : CupertinoIcons.lock,
                size: 18,
              ),
              label: Text(
                widget.state.canPlay(e)
                    ? (widget.state.isLiveBackend
                          ? (e.isVideo ? 'Xem video' : 'Nghe tập này')
                          : (e.isVideo
                                ? 'Xem video thử'
                                : e.mediaAsset.isNotEmpty
                                ? 'Nghe audio thử'
                                : 'Nghe thử giao diện'))
                    : 'Mở với hội viên của kênh',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.state.canPlay(e)
                  ? (widget.state.isLiveBackend
                        ? 'Bản ghi âm & biên tập bởi kênh ${e.channel}'
                        : (e.isVideo
                              ? 'Clip kiểm tra 12 giây · Không có âm thanh'
                              : e.mediaAsset.isNotEmpty
                              ? 'Audio kỹ thuật 24 giây · Không phải giọng kể'
                              : 'Mô phỏng phát · Chưa có âm thanh'))
                  : (widget.state.isLiveBackend
                        ? 'Tập dành riêng cho hội viên kênh ${e.channel}'
                        : 'Tập dành riêng cho hội viên · Có chế độ thử'),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: Palette.muted),
            ),
            const SizedBox(height: 18),
            TextButton.icon(
              onPressed: widget.state.canPlay(e)
                  ? () => widget.state.addToQueue(e)
                  : null,
              icon: const Icon(CupertinoIcons.list_bullet, size: 18),
              label: Text(
                widget.state.queue.contains(e.id)
                    ? 'Đã thêm vào danh sách phát'
                    : 'Thêm vào danh sách phát',
              ),
            ),
            Builder(
              builder: (context) {
                final comments = widget.state.getComments(e.id);
                final transcript = widget.state.getTranscript(e.id);
                final tabTitles = [
                  'Giới thiệu',
                  'Nguồn tham khảo',
                  'Bình luận (${comments.length})',
                  'Bản chép lời',
                ];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      children: [
                        for (var i = 0; i < tabTitles.length; i++)
                          TextButton(
                            key: Key('episode-tab-$i'),
                            onPressed: () => setState(() => tab = i),
                            style: TextButton.styleFrom(
                              foregroundColor: tab == i
                                  ? Palette.red
                                  : Palette.muted,
                            ),
                            child: Text(
                              tabTitles[i],
                              style: TextStyle(
                                decoration: tab == i
                                    ? TextDecoration.underline
                                    : null,
                                decorationColor: Palette.red,
                                fontSize: 13,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const Divider(),
                    const SizedBox(height: 20),
                    if (tab == 0) ...[
                      Text(
                        e.description,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.8,
                          color: Palette.muted,
                        ),
                      ),
                      const SizedBox(height: 28),
                      const SectionTitle(title: 'Trong tập này'),
                      const SizedBox(height: 12),
                      ...e.chapters.map(
                        (c) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          onTap: () => openPlayer(at: c.seconds),
                          title: Text(
                            c.title,
                            style: const TextStyle(fontSize: 13),
                          ),
                          trailing: Text(
                            clockLabel(c.seconds),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Palette.muted,
                              fontFeatures: [ui.FontFeature.tabularFigures()],
                            ),
                          ),
                        ),
                      ),
                    ] else if (tab == 1) ...[
                      const Text(
                        'Nguồn của câu chuyện',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        e.sources.isNotEmpty
                            ? e.sources
                            : (widget.state.isLiveBackend
                                  ? 'Tư liệu được tổng hợp và đối chiếu bởi ban biên tập kênh ${e.channel}.'
                                  : 'Đây là tập mẫu để thử UI. Chưa có nội dung lịch sử đã kiểm duyệt hoặc tài liệu đối chiếu. Các nguồn sẽ được bổ sung khi có tập thật.'),
                        style: const TextStyle(
                          color: Palette.muted,
                          height: 1.8,
                        ),
                      ),
                      if (transcript.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        const Text(
                          'Trích lục bản chép lời',
                          style: TextStyle(fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          transcript,
                          style: const TextStyle(
                            color: Palette.ink,
                            height: 1.75,
                          ),
                        ),
                      ],
                      if (!widget.state.isLiveBackend) ...[
                        const SizedBox(height: 20),
                        const Text(
                          'Ảnh địa điểm: kho Vietnam Travel (techEdge3030). Xem ASSETS.md trong dự án để tra nguồn ảnh và phông chữ.',
                          style: TextStyle(color: Palette.muted, fontSize: 12),
                        ),
                      ],
                    ] else if (tab == 2) ...[
                      EpisodeCommentsSection(episode: e, state: widget.state),
                    ] else ...[
                      const Text(
                        'Bản chép lời (Transcript)',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Text(
                          transcript.isNotEmpty
                              ? transcript
                              : (e.description.isNotEmpty
                                    ? e.description
                                    : 'Bản chép lời chi tiết cho tập này đang được cập nhật.'),
                          key: const Key('episode-transcript-text'),
                          style: const TextStyle(
                            fontFamily: 'NotoSerif',
                            fontSize: 14,
                            height: 1.75,
                            color: Palette.ink,
                          ),
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
          ],
        ),
        bottomNavigationBar: widget.state.current == null
            ? null
            : SafeArea(top: false, child: MiniPlayer(state: widget.state)),
      ),
    );
  }
}

class EpisodeCommentsSection extends StatefulWidget {
  const EpisodeCommentsSection({
    super.key,
    required this.episode,
    required this.state,
  });
  final Episode episode;
  final AppState state;
  @override
  State<EpisodeCommentsSection> createState() => _EpisodeCommentsSectionState();
}

class _EpisodeCommentsSectionState extends State<EpisodeCommentsSection> {
  final controller = TextEditingController();
  bool submitting = false;
  String? error;
  String? success;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> send() async {
    if (submitting) return;
    final txt = controller.text.trim();
    setState(() {
      submitting = true;
      error = null;
      success = null;
    });
    try {
      final err = await widget.state.addComment(widget.episode.id, txt);
      if (!mounted) return;
      if (err != null) {
        setState(() => error = err);
      } else {
        controller.clear();
        FocusManager.instance.primaryFocus?.unfocus();
        setState(() => success = 'Đã lưu bình luận trên thiết bị.');
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => error = 'Chưa gửi được. Nội dung vẫn được giữ để bạn thử lại.',
        );
      }
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final comments = widget.state.getComments(widget.episode.id);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Palette.soft,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              const Icon(
                CupertinoIcons.chat_bubble_2,
                size: 18,
                color: Palette.red,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Bình luận được kiểm duyệt tự động & đồng bộ trực tiếp.',
                  style: TextStyle(color: Palette.muted, fontSize: 12),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),
        TextField(
          key: const Key('comment-input'),
          controller: controller,
          readOnly: submitting,
          onChanged: (_) => setState(() {
            error = null;
            success = null;
          }),
          maxLines: 3,
          minLines: 1,
          maxLength: 300,
          decoration: InputDecoration(
            labelText: 'Góc nhìn của bạn',
            hintText: 'Chia sẻ cảm nhận về tập này…',
            suffixIcon: IconButton(
              key: const Key('submit-comment-btn'),
              tooltip: 'Gửi bình luận',
              icon: submitting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(
                      CupertinoIcons.paperplane_fill,
                      size: 20,
                      color: Palette.red,
                    ),
              onPressed: submitting ? null : send,
            ),
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 6),
          Semantics(
            liveRegion: true,
            child: Text(
              error!,
              style: const TextStyle(color: Palette.red, fontSize: 12),
            ),
          ),
        ],
        if (success != null) ...[
          const SizedBox(height: 6),
          Semantics(
            liveRegion: true,
            child: Text(
              success!,
              style: const TextStyle(
                color: Palette.ink,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
        const SizedBox(height: 20),
        if (comments.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(
              child: Text(
                'Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ góc nhìn!',
                style: TextStyle(color: Palette.muted, fontSize: 13),
              ),
            ),
          )
        else
          ...comments.map(
            (c) => Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Palette.paper,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Palette.line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          c.authorName.isNotEmpty
                              ? c.authorName.characters.first.toUpperCase()
                              : 'N',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              c.authorName,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              c.timeAgo,
                              style: const TextStyle(
                                color: Palette.muted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (c.isFlagged)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Palette.soft,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Đang kiểm duyệt',
                            style: TextStyle(fontSize: 10, color: Palette.red),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    c.content,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.6,
                      color: c.isFlagged ? Palette.muted : Palette.ink,
                      fontStyle: c.isFlagged
                          ? FontStyle.italic
                          : FontStyle.normal,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton.icon(
                        onPressed: () => widget.state.toggleLikeComment(
                          widget.episode.id,
                          c.id,
                        ),
                        icon: Icon(
                          c.isLiked
                              ? CupertinoIcons.hand_thumbsup_fill
                              : CupertinoIcons.hand_thumbsup,
                          size: 14,
                          color: c.isLiked ? Palette.red : Palette.muted,
                        ),
                        label: Text(
                          '${c.likes}',
                          style: TextStyle(
                            fontSize: 11,
                            color: c.isLiked ? Palette.red : Palette.muted,
                          ),
                        ),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: const Size(40, 28),
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () {
                          widget.state.reportComment(widget.episode.id, c.id);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Đã gửi báo cáo bình luận tới kiểm duyệt viên.',
                              ),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: const Size(40, 28),
                        ),
                        child: const Text(
                          'Báo cáo',
                          style: TextStyle(fontSize: 11, color: Palette.muted),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class PlayerPage extends StatefulWidget {
  const PlayerPage({super.key, required this.state});
  final AppState state;

  @override
  State<PlayerPage> createState() => _PlayerPageState();
}

class _PlayerPageState extends State<PlayerPage> {
  void speedSheet(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: ListView(
        shrinkWrap: true,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: Text('Tốc độ phát', style: editorial(24)),
          ),
          for (final rate in [1.0, 1.25, 1.5, 1.75, 2.0])
            ListTile(
              key: ValueKey('speed-$rate'),
              title: Text(rate == 1 ? '1× · Bình thường' : '$rate×'),
              trailing: widget.state.speed == rate
                  ? const Icon(CupertinoIcons.check_mark, color: Palette.red)
                  : null,
              selected: widget.state.speed == rate,
              onTap: () {
                widget.state.setSpeed(rate);
                Navigator.pop(context);
              },
            ),
        ],
      ),
    ),
  );

  void sleepSheet(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: ListView(
        shrinkWrap: true,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Hẹn giờ dừng', style: editorial(24)),
          ),
          for (final minutes in [15, 30, 45])
            ListTile(
              title: Text('$minutes phút'),
              onTap: () {
                widget.state.setSleep(minutes);
                Navigator.pop(context);
              },
            ),
          ListTile(
            title: const Text('Tắt hẹn giờ'),
            onTap: () {
              widget.state.setSleep(null);
              Navigator.pop(context);
            },
          ),
        ],
      ),
    ),
  );

  void transcriptSheet(BuildContext context, Episode e, Chapter chapter) {
    final transcript = widget.state.getTranscript(e.id);
    final hasTranscript = transcript.trim().isNotEmpty;
    final displayContent = hasTranscript
        ? transcript
        : (e.description.isNotEmpty
            ? e.description
            : chapter.title);

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.82,
        minChildSize: 0.45,
        maxChildSize: 0.96,
        expand: false,
        builder: (ctx, scrollController) => SafeArea(
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 36),
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: Palette.red.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'BẢN THẢO & NỘI DUNG SỬ LIỆU',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.0,
                        color: Palette.red,
                      ),
                    ),
                  ),
                  Text(
                    '${e.channel} · ${e.duration}',
                    style: const TextStyle(fontSize: 12, color: Palette.muted),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(e.title, style: editorial(22)),
              const SizedBox(height: 6),
              Text(
                'Chương: ${chapter.title}',
                style: const TextStyle(
                  fontSize: 13,
                  color: Palette.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              const Divider(color: Palette.line),
              const SizedBox(height: 14),
              SelectableText(
                displayContent,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.68,
                  color: Palette.ink,
                  fontFamily: 'BeVietnam',
                ),
              ),
              if (e.description.isNotEmpty && hasTranscript) ...[
                const SizedBox(height: 20),
                const Divider(color: Palette.line),
                const SizedBox(height: 12),
                Text('Tóm tắt & Giới thiệu tập', style: editorial(17)),
                const SizedBox(height: 6),
                SelectableText(
                  e.description,
                  style: const TextStyle(
                    fontSize: 13.5,
                    height: 1.6,
                    color: Palette.muted,
                  ),
                ),
              ],
              if (e.chapters.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Divider(color: Palette.line),
                const SizedBox(height: 12),
                Text('Các mốc thời gian trong tập', style: editorial(17)),
                const SizedBox(height: 8),
                for (final c in e.chapters)
                  InkWell(
                    onTap: () {
                      widget.state.seek(c.seconds);
                      Navigator.pop(ctx);
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: 8,
                        horizontal: 4,
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            CupertinoIcons.play_circle,
                            size: 16,
                            color: Palette.red,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              c.title,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Palette.ink,
                              ),
                            ),
                          ),
                          Text(
                            clockLabel(c.seconds),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Palette.muted,
                              fontFeatures: [ui.FontFeature.tabularFigures()],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
              if (e.sources.trim().isNotEmpty) ...[
                const SizedBox(height: 20),
                const Divider(color: Palette.line),
                const SizedBox(height: 12),
                Text('Nguồn sử liệu & Thư tịch tham khảo', style: editorial(17)),
                const SizedBox(height: 6),
                SelectableText(
                  e.sources,
                  style: const TextStyle(
                    fontSize: 12.5,
                    height: 1.5,
                    color: Palette.muted,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    return ListenableBuilder(
    listenable: Listenable.merge([state, state.playbackTick]),
    builder: (context, _) {
      final e = state.current;
      if (e == null) {
        return Scaffold(
          appBar: AppBar(title: const Text('Trình nghe')),
          body: Padding(
            padding: const EdgeInsets.all(24),
            child: EmptyMessage(
              title: 'Tập nghe đã đóng',
              message: 'Quyền hội viên thử đã thay đổi. Bạn có thể tiếp tục với các tập công khai.',
              action: 'Quay lại',
              onAction: () => Navigator.pop(context),
            ),
          ),
        );
      }
      final chapter = e.chapters.lastWhere(
        (c) => c.seconds <= state.position,
        orElse: () => e.chapters.first,
      );
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            tooltip: 'Thu nhỏ trình nghe',
            icon: const Icon(CupertinoIcons.chevron_down),
            onPressed: () => Navigator.pop(context),
          ),
          centerTitle: true,
          title: Eyebrow(e.isVideo ? 'TRÌNH XEM' : 'TRÌNH NGHE'),
          actions: [
            IconButton(
              tooltip: state.saved.contains(e.id) ? 'Bỏ lưu tập' : 'Lưu tập',
              onPressed: () => state.toggleSaved(e),
              icon: Icon(
                state.saved.contains(e.id)
                    ? CupertinoIcons.bookmark_fill
                    : CupertinoIcons.bookmark,
                color: Palette.red,
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(28, 20, 28, 28),
            children: [
              if (e.isVideo)
                VideoSurface(state: state)
              else
                Hero(
                  tag: 'player-cover-${e.id}',
                  child: Center(
                    child: SizedBox(
                      width: MediaQuery.sizeOf(context).height < 500
                          ? 132
                          : 220,
                      height: MediaQuery.sizeOf(context).height < 500
                          ? 132
                          : 220,
                      child: Cover(episode: e),
                    ),
                  ),
                ),
              const SizedBox(height: 20),
              Eyebrow(e.channel.toUpperCase()),
              const SizedBox(height: 12),
              Text(e.title, style: editorial(29)),
              const SizedBox(height: 22),
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: Text('Tiếp theo (${state.queue.length})'),
                children: [
                  if (state.queue.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(12),
                      child: Text(
                        'Thêm tập ở trang chi tiết để nghe / xem tiếp.',
                      ),
                    ),
                  for (final id in state.queue)
                    if (allEpisodes.any((item) => item.id == id))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          allEpisodes.firstWhere((item) => item.id == id).title,
                        ),
                        subtitle: Text(
                          state.canPlay(
                                allEpisodes.firstWhere((item) => item.id == id),
                              )
                              ? 'Chờ phát'
                              : 'Quyền hội viên đã thay đổi · Sẽ bỏ qua',
                        ),
                        trailing: IconButton(
                          tooltip: 'Bỏ khỏi danh sách phát',
                          icon: const Icon(CupertinoIcons.xmark),
                          onPressed: () => state.removeFromQueue(id),
                        ),
                      ),
                  TextButton(
                    onPressed: state.queue.isEmpty ? null : state.playNext,
                    child: const Text('Phát tập tiếp theo'),
                  ),
                ],
              ),
              Slider(
                key: const Key('playback-slider'),
                value: state.position.toDouble(),
                min: 0,
                max: e.seconds.toDouble(),
                label: clockLabel(state.position),
                semanticFormatterCallback: (v) =>
                    '${v ~/ 60} phút ${v.toInt() % 60} giây',
                onChanged: (v) => state.seek(v.toInt()),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    clockLabel(state.position),
                    style: const TextStyle(
                      fontSize: 12,
                      color: Palette.muted,
                      fontFeatures: [ui.FontFeature.tabularFigures()],
                    ),
                  ),
                  Text(
                    clockLabel(e.seconds),
                    style: const TextStyle(
                      fontSize: 12,
                      color: Palette.muted,
                      fontFeatures: [ui.FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    tooltip: 'Lùi 15 giây',
                    icon: const Icon(CupertinoIcons.gobackward_15, size: 28),
                    onPressed: () => state.seek(state.position - 15),
                  ),
                  const SizedBox(width: 28),
                  SizedBox(
                    width: 72,
                    height: 72,
                    child: FilledButton(
                      key: const Key('player-toggle'),
                      style: FilledButton.styleFrom(
                        shape: const CircleBorder(),
                        padding: EdgeInsets.zero,
                      ),
                      onPressed: state.togglePlaying,
                      child: MotionIcon(
                        icon: state.playing
                            ? CupertinoIcons.pause_fill
                            : CupertinoIcons.play_fill,
                        size: 30,
                        label: state.playing
                            ? 'Tạm dừng'
                            : (state.isLiveBackend ? 'Phát' : 'Phát thử'),
                      ),
                    ),
                  ),
                  const SizedBox(width: 28),
                  IconButton(
                    tooltip: 'Tiến 15 giây',
                    icon: const Icon(CupertinoIcons.goforward_15, size: 28),
                    onPressed: () => state.seek(state.position + 15),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Wrap(
                alignment: WrapAlignment.spaceEvenly,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  IconButton(
                    key: const Key('player-like-btn'),
                    tooltip: state.isLiked(e.id) ? 'Bỏ thích' : 'Thích tập này',
                    icon: Icon(
                      state.isLiked(e.id)
                          ? CupertinoIcons.hand_thumbsup_fill
                          : CupertinoIcons.hand_thumbsup,
                      size: 20,
                      color: state.isLiked(e.id) ? Palette.red : Palette.ink,
                    ),
                    onPressed: () => state.toggleLike(e.id),
                  ),
                  TextButton(
                    onPressed: () => speedSheet(context),
                    child: Text(
                      '${state.speed}×',
                      style: const TextStyle(
                        color: Palette.ink,
                        fontFeatures: [ui.FontFeature.tabularFigures()],
                      ),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => sleepSheet(context),
                    icon: const Icon(
                      CupertinoIcons.moon,
                      size: 18,
                      color: Palette.ink,
                    ),
                    label: Text(
                      state.sleepMinutes == null
                          ? 'Hẹn giờ'
                          : '${state.sleepMinutes} phút',
                      style: const TextStyle(color: Palette.ink, fontSize: 12),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Danh sách chương',
                    icon: const Icon(CupertinoIcons.list_bullet, size: 22),
                    onPressed: () => showModalBottomSheet<void>(
                      context: context,
                      showDragHandle: true,
                      builder: (context) => SafeArea(
                        child: ListView(
                          shrinkWrap: true,
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(20),
                              child: Text(
                                'Trong tập này',
                                style: editorial(24),
                              ),
                            ),
                            ...e.chapters.map(
                              (c) => ListTile(
                                title: Text(
                                  c.title,
                                  style: const TextStyle(fontSize: 14),
                                ),
                                trailing: Text(
                                  clockLabel(c.seconds),
                                  style: const TextStyle(
                                    fontFeatures: [
                                      ui.FontFeature.tabularFigures(),
                                    ],
                                  ),
                                ),
                                onTap: () {
                                  state.seek(c.seconds);
                                  Navigator.pop(context);
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              InkWell(
                key: const Key('player-transcript-card'),
                onTap: () => transcriptSheet(context, e, chapter),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Palette.soft,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Palette.line.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      IconButton(
                        key: const Key('player-transcript-icon-btn'),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        tooltip: 'Xem toàn bộ thông tin & lời thoại',
                        icon: const Icon(
                          CupertinoIcons.text_alignleft,
                          size: 20,
                          color: Palette.red,
                        ),
                        onPressed: () => transcriptSheet(context, e, chapter),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          state.getTranscript(e.id).isNotEmpty
                              ? state.getTranscript(e.id)
                              : chapter.title,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, height: 1.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              if (state.audioLoading)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text('Đang mở audio…', textAlign: TextAlign.center),
                ),
              if (state.audioError != null) ...[
                Semantics(
                  liveRegion: true,
                  child: Text(
                    state.audioError!,
                    style: const TextStyle(color: Palette.red),
                  ),
                ),
                TextButton(
                  onPressed: state.retryAudio,
                  child: const Text('Thử lại audio'),
                ),
              ],
              Text(
                state.isLiveBackend
                    ? 'Đang phát từ kênh ${e.channel}'
                    : (e.isVideo
                          ? 'Clip kỹ thuật không có âm thanh'
                          : state.hasRealAudio
                          ? 'Audio kỹ thuật · Không phải giọng kể lịch sử'
                          : 'Tập biên tập mẫu · Vị trí mô phỏng, chưa có audio'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 11, color: Palette.muted),
              ),
            ],
          ),
        ),
      );
    },
  );
  }
}

class MiniPlayer extends StatelessWidget {
  const MiniPlayer({super.key, required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: state,
    builder: (context, _) {
      final e = state.current;
      if (e == null) return const SizedBox.shrink();
      return Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Palette.ink.withValues(alpha: .10),
                blurRadius: 18,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: PlayerContainer(
            key: const Key('mini-player-container'),
            page: PlayerPage(state: state),
            closedBuilder: (context, open) => _MiniGlass(
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      key: const Key('mini-player-open'),
                      borderRadius: BorderRadius.circular(24),
                      onTap: open,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(10, 10, 4, 10),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(13),
                              child: ArtworkImage(
                                e.image,
                                width: 48,
                                height: 48,
                                fit: BoxFit.cover,
                                excludeFromSemantics: true,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    e.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    state.playing
                                        ? (state.isLiveBackend
                                              ? (e.isVideo
                                                    ? 'Đang xem video'
                                                    : 'Đang phát · ${e.channel}')
                                              : (e.isVideo
                                                    ? 'Đang xem video thử'
                                                    : state.hasRealAudio
                                                    ? 'Đang nghe audio thử'
                                                    : 'Đang phát mô phỏng'))
                                        : 'Đã tạm dừng',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: Palette.muted,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  _MiniProgress(state: state),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    key: const Key('mini-player-toggle'),
                    tooltip: state.playing
                        ? 'Tạm dừng'
                        : (state.isLiveBackend ? 'Phát' : 'Phát thử'),
                    onPressed: state.togglePlaying,
                    style: IconButton.styleFrom(
                      minimumSize: const Size(48, 48),
                    ),
                    icon: MotionIcon(
                      icon: state.playing
                          ? CupertinoIcons.pause_fill
                          : CupertinoIcons.play_fill,
                      size: 20,
                    ),
                  ),
                  IconButton(
                    key: const Key('mini-player-skip'),
                    tooltip: 'Tiến 15 giây',
                    onPressed: () => state.seek(state.position + 15),
                    style: IconButton.styleFrom(
                      minimumSize: const Size(48, 48),
                    ),
                    icon: const Icon(CupertinoIcons.goforward_15, size: 22),
                  ),
                  const SizedBox(width: 4),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}

/// Bounded frosted material, not a shader or a full-screen blur.
class _MiniGlass extends StatelessWidget {
  const _MiniGlass({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final highContrast = MediaQuery.highContrastOf(context);
    final surface = Material(
      color: Palette.paper.withValues(alpha: highContrast ? 1 : .82),
      child: DecoratedBox(
        key: const Key('mini-player-glass'),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: highContrast
                ? Palette.muted
                : Colors.white.withValues(alpha: .85),
          ),
        ),
        child: child,
      ),
    );
    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: highContrast
            ? surface
            : BackdropFilter(
                filter: ui.ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                child: surface,
              ),
      ),
    );
  }
}

class _MiniProgress extends StatelessWidget {
  const _MiniProgress({required this.state});
  final AppState state;
  @override
  Widget build(BuildContext context) => ValueListenableBuilder<int>(
    valueListenable: state.playbackTick,
    builder: (context, _, _) {
      final e = state.current;
      final progress = e == null ? 0.0 : state.position / e.seconds;
      return ExcludeSemantics(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: TweenAnimationBuilder<double>(
            tween: Tween(end: progress),
            duration: motionDuration(context, 220),
            curve: Curves.easeOut,
            builder: (_, value, _) => LinearProgressIndicator(
              value: value,
              minHeight: 2,
              color: Palette.red,
              backgroundColor: Palette.ink.withValues(alpha: .10),
            ),
          ),
        ),
      );
    },
  );
}
