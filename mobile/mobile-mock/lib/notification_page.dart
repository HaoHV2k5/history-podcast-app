import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'app_state.dart';
import 'components.dart';
import 'creator_state.dart';
import 'design.dart';
import 'narrator_pages.dart';
import 'narrator_profile.dart';
import 'narrator_state.dart';
import 'publication_page.dart';
import 'studio_pages.dart';
import 'wallet_page.dart';
import 'audience_pages.dart';
import 'episode.dart';

class NotificationPage extends StatefulWidget {
  const NotificationPage({super.key, required this.state});
  final AppState state;
  @override
  State<NotificationPage> createState() => _NotificationPageState();
}

class _NotificationPageState extends State<NotificationPage> {
  bool unreadOnly = false;
  late final seen =
      (widget.state.preferences.getStringList('seenUpdatesV1') ?? []).toSet();
  Future<void> open(Map<String, String> item) async {
    seen.add(item['id']!);
    await widget.state.preferences.setStringList(
      'seenUpdatesV1',
      seen.toList(),
    );
    if (!mounted) return;
    setState(() {});
    final Widget page = switch (item['kind']) {
      'membership' => MembershipPage(
        channel: channelByName(item['title']!),
        state: widget.state,
      ),
      'narrator' => NarratorHome(preferences: widget.state.preferences),
      'wallet' => WalletPage(preferences: widget.state.preferences),
      'publish' => PublicationPage(
        preferences: widget.state.preferences,
        app: widget.state,
      ),
      _ => CreatorStudio(preferences: widget.state.preferences),
    };
    await Navigator.push(
      context,
      MaterialPageRoute<void>(builder: (_) => page),
    );
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final c = CreatorState(widget.state.preferences),
        n = NarratorProfileState(widget.state.preferences),
        jobs = NarratorState(c);
    final items = <Map<String, String>>[
      if (n.review.name != 'draft')
        {
          'id': 'profile:${n.id}:${n.review.name}:${n.reason}',
          'title': 'Hồ sơ giọng đọc',
          'detail':
              '${n.review.label}${n.reason.isEmpty ? '' : ' · ${n.reason}'}',
          'kind': 'narrator',
        },
      for (final d in c.drafts.where(
        (d) => [
          DraftStage.rejected,
          DraftStage.approved,
          DraftStage.pending,
        ].contains(d.stage),
      ))
        {
          'id': '${d.id}:${d.stage.name}:${d.reviewHistory.length}',
          'title': d.title,
          'detail':
              '${d.stage.label}${d.reason.isEmpty ? '' : ' · ${d.reason}'}',
          'kind': d.stage == DraftStage.approved ? 'publish' : 'studio',
        },
      for (final o in jobs.orders.where((o) => o.narratorId == n.id))
        {
          'id': '${o.id}:${o.status.name}:${o.history.length}',
          'title': o.draftTitle,
          'detail': '${o.status.label} · Người đọc ${o.narratorName}',
          'kind': 'narrator',
        },
      for (final tx in widget.state.transactions)
        {
          'id': tx.id,
          'title': tx.channelName,
          'detail': '${tx.type} · ${tx.status}',
          'kind': channels.any((c) => c.name == tx.channelName)
              ? 'membership'
              : 'studio',
        },
    ];
    final finance = jsonDecode(
      widget.state.preferences.getString('walletDemoV1') ?? '{"events":[]}',
    ) as Map;
    for (final event in finance['events'] as List) {
      items.add({
        'id': event as String,
        'title': 'Sổ ví mẫu',
        'detail': event,
        'kind': 'wallet',
      });
    }
    c.dispose();
    n.dispose();
    jobs.dispose();
    final filtered = items
        .where((i) => !unreadOnly || !seen.contains(i['id']))
        .toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Cập nhật trên thiết bị')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        children: [
          Text('Câu chuyện\nđang tiếp diễn.', style: editorial(30)),
          const SizedBox(height: 12),
          const Text(
            'Lời mời, duyệt nội dung và sổ ví từ dữ liệu local. Chưa có push notification hoặc đồng bộ tài khoản.',
            style: TextStyle(color: Palette.muted, height: 1.7),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('Tất cả'),
                selected: !unreadOnly,
                onSelected: (_) => setState(() => unreadOnly = false),
              ),
              ChoiceChip(
                label: const Text('Chưa đọc'),
                selected: unreadOnly,
                onSelected: (_) => setState(() => unreadOnly = true),
              ),
            ],
          ),
          TextButton(
            onPressed: () async {
              seen.addAll(items.map((i) => i['id']!));
              await widget.state.preferences.setStringList(
                'seenUpdatesV1',
                seen.toList(),
              );
              if (mounted) setState(() {});
            },
            child: const Text('Đánh dấu tất cả đã đọc'),
          ),
          if (filtered.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Text('Chưa có cập nhật trong mục này.'),
            ),
          for (final item in filtered)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(
                seen.contains(item['id'])
                    ? CupertinoIcons.check_mark
                    : CupertinoIcons.circle_fill,
                size: 16,
                color: Palette.red,
              ),
              title: Text(item['title']!),
              subtitle: Text(item['detail']!),
              trailing: const Icon(CupertinoIcons.chevron_right, size: 16),
              onTap: () => open(item),
            ),
          const SizedBox(height: 20),
          const DemoNote(),
        ],
      ),
    );
  }
}
