import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'app_state.dart';
import 'design.dart';
import 'artwork_image.dart';
import 'episode.dart';

class ContinueListening extends StatelessWidget {
  const ContinueListening({
    super.key,
    required this.state,
    required this.onPlay,
  });
  final AppState state;
  final ValueChanged<Episode> onPlay;
  @override
  Widget build(BuildContext context) {
    final e = state.resumableEpisode;
    if (e == null) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          container: true,
          child: const Text(
            'NGHE TIẾP',
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 1.4,
              color: Palette.muted,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(height: 10),
        Semantics(
          key: const Key('continue-listening'),
          button: true,
          container: true,
          child: Material(
            color: Palette.soft,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: () => onPlay(e),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(7),
                      child: ArtworkImage(
                        e.image,
                        width: 56,
                        height: 64,
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
                            e.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 7),
                          ValueListenableBuilder<int>(
                            valueListenable: state.playbackTick,
                            builder: (context, _, _) {
                              final progress = state.progressFor(e);
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Còn ${(e.seconds - progress + 59) ~/ 60} phút · ${clockLabel(progress)}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Palette.muted,
                                    ),
                                  ),
                                  const SizedBox(height: 7),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(2),
                                    child: ExcludeSemantics(
                                      child: LinearProgressIndicator(
                                        value: progress / e.seconds,
                                        minHeight: 2,
                                        color: Palette.red,
                                        backgroundColor: Palette.line,
                                      ),
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(
                      CupertinoIcons.play_circle_fill,
                      size: 32,
                      color: Palette.red,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 26),
      ],
    );
  }
}

class SearchTopics extends StatelessWidget {
  const SearchTopics({super.key, required this.onSelect});
  final ValueChanged<String> onSelect;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (final entry in [
        ('Việt Nam', 'Di sản và những vùng đất', episodes[0]),
        ('Văn hóa', 'Nếp sống qua từng thời', episodes[1]),
        ('Con người', 'Chuyện kể từ đời thường', episodes[2]),
      ])
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Material(
            color: Palette.soft,
            borderRadius: BorderRadius.circular(10),
            child: InkWell(
              key: ValueKey('search-topic-${entry.$1}'),
              onTap: () => onSelect(entry.$1),
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(entry.$1, style: editorial(22)),
                          const SizedBox(height: 5),
                          Text(
                            entry.$2,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Palette.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: ArtworkImage(
                        entry.$3.image,
                        width: 64,
                        height: 64,
                        fit: BoxFit.cover,
                        excludeFromSemantics: true,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
    ],
  );
}
