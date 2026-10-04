import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'design.dart';
import 'artwork_image.dart';
import 'episode.dart';
import 'motion.dart';

/// Editorial picks, independent from playback and the recommendation backend.
class DiscoveryCarousel extends StatefulWidget {
  const DiscoveryCarousel({
    super.key,
    required this.onCollection,
    required this.onEpisode,
  });
  final VoidCallback onCollection;
  final ValueChanged<Episode> onEpisode;
  @override
  State<DiscoveryCarousel> createState() => _DiscoveryCarouselState();
}

class _DiscoveryCarouselState extends State<DiscoveryCarousel>
    with WidgetsBindingObserver {
  static const interval = Duration(seconds: 7);
  final pages = PageController(initialPage: 3000, viewportFraction: .97);
  Timer? timer;
  int page = 3000;
  bool paused = false, hovering = false, reduced = false;
  bool foreground = true;
  bool tabActive = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    reduced =
        MediaQuery.disableAnimationsOf(context) ||
        MediaQuery.accessibleNavigationOf(context);
    tabActive = TickerMode.valuesOf(context).enabled;
    restartTimer();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    foreground = state == AppLifecycleState.resumed;
    restartTimer();
  }

  @override
  void dispose() {
    timer?.cancel();
    pages.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  bool get visible {
    if (!mounted || !tabActive || ModalRoute.of(context)?.isCurrent == false) {
      return false;
    }
    final box = context.findRenderObject();
    final viewport = Scrollable.maybeOf(context)?.context.findRenderObject();
    if (box is! RenderBox || !box.hasSize) return false;
    final rect = box.localToGlobal(Offset.zero) & box.size;
    final area = viewport is RenderBox && viewport.hasSize
        ? viewport.localToGlobal(Offset.zero) & viewport.size
        : Offset.zero & MediaQuery.sizeOf(context);
    final overlap = rect.intersect(area);
    return overlap.height > rect.height * .65 && overlap.width > 0;
  }

  void restartTimer() {
    timer?.cancel();
    if (paused || reduced || !foreground || !tabActive) return;
    timer = Timer.periodic(interval, (_) {
      if (!hovering &&
          visible &&
          pages.hasClients &&
          !pages.position.isScrollingNotifier.value) {
        go(1, manual: false);
      }
    });
  }

  void stop() {
    if (paused) return;
    setState(() => paused = true);
    restartTimer();
  }

  void go(int direction, {bool manual = true}) {
    if (manual) stop();
    if (!pages.hasClients) return;
    final target = (pages.page ?? page.toDouble()).round() + direction;
    if (reduced) {
      pages.jumpToPage(target);
      return;
    }
    pages.animateToPage(
      target,
      duration: motionDuration(context, 600),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final cards = [
        _Pick(
          'TUYỂN TẬP / 01',
          'Theo dấu\nnhững kinh đô.',
          '3 câu chuyện để bắt đầu.',
          'Mở tuyển tập',
          episodes.first.image,
          Palette.red,
          Palette.white,
          widget.onCollection,
        ),
        _Pick(
          'GỢI Ý / VĂN HÓA',
          'Một thời\nthương cảng.',
          'Những miền ký ức · 36 phút',
          'Khám phá tập',
          episodes[1].image,
          Palette.ink,
          Palette.paper,
          () => widget.onEpisode(episodes[1]),
        ),
        _Pick(
          'GỢI Ý / CON NGƯỜI',
          'Phố cũ,\nchuyện chưa cũ.',
          'Chuyện người xưa · 24 phút',
          'Khám phá tập',
          episodes[2].image,
          Palette.soft,
          Palette.ink,
          () => widget.onEpisode(episodes[2]),
        ),
      ];
      final cardWidth = constraints.maxWidth * .97 - 8;
      final showImage =
          cardWidth >= 300 && MediaQuery.textScalerOf(context).scale(1) < 1.4;
      final imageWidth = showImage ? cardWidth * .22 : 0.0;
      final textWidth = cardWidth - imageWidth - 36;
      double measure(String text, TextStyle style) {
        final painter = TextPainter(
          text: TextSpan(
            text: text,
            style: Theme.of(context).textTheme.bodyMedium?.merge(style),
          ),
          textDirection: Directionality.of(context),
          textScaler: MediaQuery.textScalerOf(context),
        )..layout(maxWidth: textWidth);
        final height = painter.height;
        painter.dispose();
        return height;
      }

      final titleStyle = editorial(27);
      const captionStyle = TextStyle(fontSize: 12, height: 1.6);
      final titleHeight = cards
          .map((c) => measure(c.title, titleStyle))
          .reduce((a, b) => a > b ? a : b);
      final captionHeight = cards
          .map((c) => measure(c.caption, captionStyle))
          .reduce((a, b) => a > b ? a : b);
      final labelHeight = cards
          .map(
            (c) => measure(
              c.label,
              const TextStyle(fontSize: 10, height: 1.5, letterSpacing: 1.1),
            ),
          )
          .reduce((a, b) => a > b ? a : b);
      final actionHeight =
          (measure('Khám phá tập', const TextStyle(fontSize: 12, height: 1.5)) +
                  20)
              .clamp(48.0, double.infinity);
      final height =
          36 +
          labelHeight +
          14 +
          titleHeight +
          12 +
          captionHeight +
          10 +
          actionHeight;
      final current = page % cards.length;
      return Focus(
        onFocusChange: (focused) {
          if (focused &&
              FocusManager.instance.highlightMode ==
                  FocusHighlightMode.traditional) {
            stop();
          }
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MouseRegion(
              onEnter: (_) => hovering = true,
              onExit: (_) => hovering = false,
              child: Listener(
                onPointerDown: (_) => stop(),
                child: SizedBox(
                  height: height,
                  child: PageView.builder(
                    key: const Key('discovery-carousel'),
                    controller: pages,
                    padEnds: false,
                    onPageChanged: (value) => setState(() => page = value),
                    itemBuilder: (context, index) {
                      final card = cards[index % cards.length];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Semantics(
                          label:
                              'Đề xuất ${index % cards.length + 1} trên ${cards.length}',
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Material(
                              color: card.background,
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.all(18),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            card.label,
                                            style: TextStyle(
                                              fontSize: 10,
                                              height: 1.5,
                                              letterSpacing: 1.1,
                                              fontWeight: FontWeight.w500,
                                              color: card.foreground,
                                            ),
                                          ),
                                          const SizedBox(height: 14),
                                          SizedBox(
                                            height: titleHeight,
                                            child: Text(
                                              card.title,
                                              style: titleStyle.copyWith(
                                                color: card.foreground,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 12),
                                          SizedBox(
                                            height: captionHeight,
                                            child: Text(
                                              card.caption,
                                              style: captionStyle.copyWith(
                                                color: card.foreground
                                                    .withValues(alpha: .85),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 10),
                                          SizedBox(
                                            height: actionHeight,
                                            child: TextButton(
                                              onPressed: () {
                                                stop();
                                                card.open();
                                              },
                                              style: TextButton.styleFrom(
                                                foregroundColor:
                                                    card.foreground,
                                                padding: EdgeInsets.zero,
                                                alignment: Alignment.centerLeft,
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Flexible(
                                                    child: Text(
                                                      card.action,
                                                      style: const TextStyle(
                                                        fontSize: 12,
                                                        height: 1.5,
                                                      ),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  const Icon(
                                                    CupertinoIcons.arrow_right,
                                                    size: 17,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  if (showImage)
                                    SizedBox(
                                      width: imageWidth,
                                      height: height,
                                      child: ArtworkImage(
                                        card.image,
                                        fit: BoxFit.cover,
                                        excludeFromSemantics: true,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: Semantics(
                    label: 'Đề xuất ${current + 1} trên ${cards.length}',
                    child: ExcludeSemantics(
                      child: Row(
                        children: [
                          for (var i = 0; i < cards.length; i++)
                            Padding(
                              padding: const EdgeInsets.only(right: 5),
                              child: AnimatedContainer(
                                duration: motionDuration(context, 200),
                                width: i == current ? 22 : 8,
                                height: 3,
                                decoration: BoxDecoration(
                                  color: i == current
                                      ? Palette.red
                                      : Palette.line,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            ),
                          const SizedBox(width: 7),
                          Flexible(
                            child: Text(
                              '${(current + 1).toString().padLeft(2, '0')} / 03',
                              style: const TextStyle(
                                fontSize: 10,
                                color: Palette.muted,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Đề xuất trước',
                  onPressed: () => go(-1),
                  style: IconButton.styleFrom(minimumSize: const Size(44, 44)),
                  icon: const Icon(CupertinoIcons.chevron_left, size: 16),
                ),
                IconButton(
                  key: const Key('carousel-auto-toggle'),
                  tooltip: reduced
                      ? 'Tự chuyển đã tắt theo cài đặt trợ năng'
                      : paused
                      ? 'Bật tự chuyển đề xuất'
                      : 'Tạm dừng tự chuyển đề xuất',
                  onPressed: reduced
                      ? null
                      : () {
                          setState(() => paused = !paused);
                          restartTimer();
                        },
                  style: IconButton.styleFrom(minimumSize: const Size(44, 44)),
                  icon: Icon(
                    paused || reduced
                        ? CupertinoIcons.play_fill
                        : CupertinoIcons.pause_fill,
                    size: 14,
                  ),
                ),
                IconButton(
                  tooltip: 'Đề xuất tiếp theo',
                  onPressed: () => go(1),
                  style: IconButton.styleFrom(minimumSize: const Size(44, 44)),
                  icon: const Icon(CupertinoIcons.chevron_right, size: 16),
                ),
              ],
            ),
          ],
        ),
      );
    },
  );
}

class _Pick {
  const _Pick(
    this.label,
    this.title,
    this.caption,
    this.action,
    this.image,
    this.background,
    this.foreground,
    this.open,
  );
  final String label, title, caption, action, image;
  final Color background, foreground;
  final VoidCallback open;
}
