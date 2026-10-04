import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'design.dart';
import 'artwork_image.dart';
import 'episode.dart';

class Cover extends StatelessWidget {
  const Cover({super.key, required this.episode, this.height});
  final Episode episode;
  final double? height;
  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(7),
    child: ArtworkImage(
      episode.image,
      width: double.infinity,
      height: height,
      fit: BoxFit.cover,
      semanticLabel: 'Ảnh địa điểm minh họa: ${episode.title}',
      errorBuilder: (_, _, _) => Container(
        height: height ?? 220,
        color: Palette.soft,
        alignment: Alignment.center,
        child: const Icon(CupertinoIcons.photo, color: Palette.muted),
      ),
    ),
  );
}

class EpisodeRow extends StatelessWidget {
  const EpisodeRow({
    super.key,
    required this.episode,
    required this.onTap,
    this.trailing,
  });
  final Episode episode;
  final VoidCallback onTap;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      const Divider(),
      Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: ArtworkImage(
                        episode.image,
                        width: 56,
                        height: 66,
                        fit: BoxFit.cover,
                        excludeFromSemantics: true,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (episode.membersOnly) ...[
                            const Row(
                              children: [
                                Icon(
                                  CupertinoIcons.lock,
                                  size: 12,
                                  color: Palette.red,
                                ),
                                SizedBox(width: 5),
                                Flexible(
                                  child: Text(
                                    'Hội viên',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Palette.red,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 5),
                          ],
                          Text(
                            episode.title,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            '${episode.channel}\n${episode.isVideo ? 'Video · ' : ''}${episode.duration}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Palette.muted,
                              height: 1.7,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (trailing == null)
                      const Padding(
                        padding: EdgeInsets.only(left: 8),
                        child: Icon(CupertinoIcons.arrow_up_right, size: 18),
                      ),
                  ],
                ),
              ),
            ),
          ),
          ?trailing,
        ],
      ),
    ],
  );
}

class CircleAction extends StatelessWidget {
  const CircleAction({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => IconButton.outlined(
    tooltip: label,
    onPressed: onTap,
    style: IconButton.styleFrom(
      side: const BorderSide(color: Palette.line),
      minimumSize: const Size(48, 48),
    ),
    icon: Icon(icon, size: 20),
  );
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key, this.color = Palette.muted});
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      fontSize: 10,
      fontWeight: FontWeight.w500,
      letterSpacing: 1.5,
      color: color,
      height: 1.6,
    ),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({super.key, required this.title, this.trailing});
  final String title;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(child: Text(title, style: editorial(21))),
      if (trailing != null) ...[const SizedBox(width: 12), trailing!],
    ],
  );
}

class EmptyMessage extends StatelessWidget {
  const EmptyMessage({
    super.key,
    required this.title,
    required this.message,
    required this.action,
    required this.onAction,
  });
  final String title, message, action;
  final VoidCallback onAction;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 32),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(CupertinoIcons.book, color: Palette.muted, size: 28),
        const SizedBox(height: 20),
        Text(title, style: editorial(23)),
        const SizedBox(height: 12),
        Text(message, style: const TextStyle(color: Palette.muted)),
        const SizedBox(height: 20),
        OutlinedButton(onPressed: onAction, child: Text(action)),
      ],
    ),
  );
}

class DemoNote extends StatelessWidget {
  const DemoNote({super.key});
  @override
  Widget build(BuildContext context) => const Text(
    'Bản thử giao diện · Tên kênh và tập là dữ liệu mẫu.',
    style: TextStyle(fontSize: 11, color: Palette.muted),
  );
}
