import 'package:flutter/material.dart';

import 'design.dart';

/// A draft has no cover image yet; use a document/media symbol rather than
/// assigning unrelated editorial artwork to it.
class WorkListItem extends StatelessWidget {
  const WorkListItem({
    super.key,
    required this.title,
    required this.meta,
    required this.status,
    required this.icon,
    required this.onTap,
    this.needsAttention = false,
  });
  final String title, meta, status;
  final IconData icon;
  final VoidCallback onTap;
  final bool needsAttention;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(vertical: 12),
    leading: Container(
      width: 44,
      height: 56,
      decoration: BoxDecoration(
        color: Palette.soft,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Icon(icon, size: 22, color: Palette.muted),
    ),
    title: Text(
      title,
      style: editorial(18),
      maxLines: 3,
      overflow: TextOverflow.ellipsis,
    ),
    subtitle: Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            meta,
            style: const TextStyle(color: Palette.muted, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            status,
            style: TextStyle(
              color: needsAttention ? Palette.red : Palette.muted,
              fontSize: 12,
              fontWeight: needsAttention ? FontWeight.w500 : FontWeight.w400,
            ),
          ),
        ],
      ),
    ),
    trailing: const Icon(Icons.chevron_right, size: 20),
    onTap: onTap,
  );
}
