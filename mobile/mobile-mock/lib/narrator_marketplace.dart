import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'creator_state.dart';
import 'design.dart';
import 'motion.dart';
import 'narrator_state.dart';
import 'narrator_profile.dart';
import 'contract_terms.dart';
import 'episode.dart';
import 'contract_pdf.dart';
import 'audio_playback.dart';
import 'local_file.dart';

part 'mock/fixtures/narrators.dart';

class NarratorVoice {
  const NarratorVoice({
    required this.id,
    required this.name,
    required this.region,
    required this.tone,
    required this.sampleQuote,
    this.rating = 4.9,
    this.completedProjects = 12,
    this.suggestedFee = 'Thỏa thuận theo tập',
  });

  final String id;
  final String name;
  final String region;
  final String tone;
  final String sampleQuote;
  final double rating;
  final int completedProjects;
  final String suggestedFee;
}

class NarratorMarketplacePage extends StatefulWidget {
  const NarratorMarketplacePage({
    super.key,
    required this.state,
    this.preselectedDraft,
  });
  final CreatorState state;
  final CreatorDraft? preselectedDraft;
  @override
  State<NarratorMarketplacePage> createState() =>
      _NarratorMarketplacePageState();
}

class _NarratorMarketplacePageState extends State<NarratorMarketplacePage> {
  late final contracts = NarratorState(widget.state);
  late final profile = NarratorProfileState(widget.state.preferences);
  List<NarratorVoice> get voices => [
    ...sampleNarrators,
    if (profile.canReceiveJobs &&
        !sampleNarrators.any((v) => v.id == profile.id))
      NarratorVoice(
        id: profile.id,
        name: profile.name,
        region: profile.region,
        tone: profile.bio,
        sampleQuote: profile.transcript,
        rating: 0,
        completedProjects: 0,
      ),
  ];
  String selectedRegion = 'Tất cả';
  String voiceQuery = '';
  int activeTab = 0;
  @override
  void dispose() {
    contracts.dispose();
    profile.dispose();
    super.dispose();
  }

  Future<void> openInviteSheet(NarratorVoice narrator) async {
    final drafts = widget.state.drafts
        .where(
          (d) =>
              d.editable &&
              d.script.trim().isNotEmpty &&
              d.sources.trim().isNotEmpty,
        )
        .toList();
    if (drafts.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Lưu bản thảo có kịch bản và nguồn tham khảo trước khi mời người đọc.',
          ),
        ),
      );
      return;
    }
    var draftId = drafts.any((d) => d.id == widget.preselectedDraft?.id)
        ? widget.preselectedDraft!.id
        : drafts.first.id;
    var deadline = DateTime.now().add(const Duration(days: 7));
    final fee = TextEditingController(text: '300.000đ / tập');
    final notes = TextEditingController(
      text: 'Giọng kể chậm rãi, phát âm rõ tên nhân vật và niên đại.',
    );
    String? error;
    bool busy = false;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, update) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            24,
            20,
            24,
            MediaQuery.viewInsetsOf(ctx).bottom + 28,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _SheetTitle(title: 'Mời ${narrator.name} thu âm'),
              const SizedBox(height: 12),
              const Text(
                'Lời mời thử nghiệm · Chỉ lưu trên thiết bị',
                style: TextStyle(color: Palette.muted, fontSize: 12),
              ),
              const SizedBox(height: 20),
              DropdownButtonFormField<String>(
                initialValue: draftId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Bản thảo'),
                items: [
                  for (final d in drafts)
                    DropdownMenuItem(
                      value: d.id,
                      child: Text(
                        d.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: busy ? null : (id) => update(() => draftId = id!),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: fee,
                enabled: !busy,
                decoration: const InputDecoration(labelText: 'Thù lao đề xuất'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: notes,
                enabled: !busy,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Yêu cầu thu âm'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: busy
                    ? null
                    : () async {
                        final date = await showDatePicker(
                          context: ctx,
                          initialDate: deadline,
                          firstDate: DateTime.now().add(
                            const Duration(days: 1),
                          ),
                          lastDate: DateTime.now().add(
                            const Duration(days: 365),
                          ),
                        );
                        if (date != null && ctx.mounted) {
                          update(() => deadline = date);
                        }
                      },
                icon: const Icon(CupertinoIcons.calendar, size: 18),
                label: Text('Bàn giao trước ${_date(deadline)}'),
              ),
              if (error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    error!,
                    style: const TextStyle(color: Palette.red),
                  ),
                ),
              const SizedBox(height: 16),
              FilledButton(
                key: const Key('confirm-send-invite'),
                onPressed: busy
                    ? null
                    : () async {
                        update(() {
                          busy = true;
                          error = null;
                        });
                        try {
                          await contracts.invite(
                            draftId: draftId,
                            narratorId: narrator.id,
                            narratorName: narrator.name,
                            fee: fee.text,
                            notes: notes.text,
                            deadline: deadline,
                          );
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (mounted) setState(() => activeTab = 1);
                        } on StateError catch (e) {
                          if (ctx.mounted) {
                            update(() {
                              error = e.message;
                              busy = false;
                            });
                          }
                        } catch (_) {
                          if (ctx.mounted) {
                            update(() {
                              error =
                                  'Không lưu được lời mời. Vui lòng thử lại.';
                              busy = false;
                            });
                          }
                        }
                      },
                child: Text(busy ? 'Đang lưu…' : 'Gửi lời mời mẫu'),
              ),
            ],
          ),
        ),
      ),
    );
    // Modal route retains fields through its closing transition.
    await Future<void>.delayed(const Duration(milliseconds: 300));
    fee.dispose();
    notes.dispose();
  }

  Future<void> openContractDetail(ContractOrder selected) async {
    final input = TextEditingController();
    String? error;
    bool busy = false;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, update) {
          final o = contracts.order(selected.id);
          Future<void> act(String action, {String value = ''}) async {
            if (action == 'creatorSign' || action == 'narratorSign') {
              final otp = await showDemoSigning(
                ctx,
                o,
                action == 'creatorSign' ? 'Creator' : 'Narrator',
              );
              if (otp == null || !ctx.mounted) return;
              value = otp;
            }
            update(() {
              busy = true;
              error = null;
            });
            try {
              await contracts.act(o.id, action, value: value);
            } on StateError catch (e) {
              error = e.message;
            } catch (_) {
              error = 'Không lưu được thay đổi. Vui lòng thử lại.';
            }
            if (ctx.mounted) update(() => busy = false);
          }

          final awaiting = [
            ContractStatus.invited,
            ContractStatus.negotiating,
          ].contains(o.status);
          return SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              24,
              20,
              24,
              MediaQuery.viewInsetsOf(ctx).bottom + 28,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SheetTitle(title: 'Thỏa thuận thu âm'),
                const SizedBox(height: 16),
                Text(o.draftTitle, style: editorial(24)),
                const SizedBox(height: 8),
                Text(
                  o.status.label,
                  style: const TextStyle(color: Palette.red, fontSize: 13),
                ),
                const SizedBox(height: 24),
                Text('${o.narratorName} · ${o.channelName}'),
                const SizedBox(height: 8),
                Text('Thù lao: ${o.feeProposal}'),
                TextButton(
                  onPressed: busy
                      ? null
                      : () async {
                          try {
                            await downloadContract(o);
                          } catch (_) {
                            if (ctx.mounted) {
                              update(
                                () => error =
                                    'Chưa xuất được PDF mẫu. Hãy thử lại.',
                              );
                            }
                          }
                        },
                  child: const Text('Tải thỏa thuận PDF mẫu'),
                ),
                Text('Hạn bàn giao: ${_date(DateTime.parse(o.deadline))}'),
                const SizedBox(height: 12),
                Text(
                  o.notes,
                  style: const TextStyle(height: 1.7, color: Palette.muted),
                ),
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 20),
                const Text(
                  'Mô phỏng hợp tác trên thiết bị. Có sổ ký quỹ hư cấu; xác nhận không phải chữ ký pháp lý, không chuyển tiền thật.',
                  style: TextStyle(
                    color: Palette.muted,
                    fontSize: 12,
                    height: 1.7,
                  ),
                ),
                const SizedBox(height: 20),
                if (awaiting) ...[
                  Text(
                    o.status == ContractStatus.negotiating
                        ? 'Xem đề xuất mới'
                        : 'Phản hồi lời mời',
                    style: editorial(20),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: input,
                    enabled: !busy,
                    decoration: const InputDecoration(
                      labelText: 'Đề xuất thù lao khác',
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: busy
                        ? null
                        : () => act('counter', value: input.text),
                    child: const Text('Thử người đọc: đề xuất lại'),
                  ),
                  FilledButton(
                    key: const Key('narrator-accept-invite'),
                    onPressed: busy ? null : () => act('accept'),
                    child: Text(
                      o.status == ContractStatus.negotiating
                          ? 'Chấp thuận đề xuất mẫu'
                          : 'Thử người đọc: đồng ý',
                    ),
                  ),
                  TextButton(
                    onPressed: busy ? null : () => act('reject'),
                    child: const Text('Từ chối lời mời mẫu'),
                  ),
                ],
                if (o.status == ContractStatus.pendingSign) ...[
                  Text('Xác nhận thỏa thuận', style: editorial(20)),
                  const SizedBox(height: 12),
                  const Text(
                    'Người đọc bàn giao bản thu cho tập đã chọn. Quyền sử dụng, số lần chỉnh sửa và điều khoản thanh toán cần được thống nhất trong hợp đồng thật.',
                  ),
                  const SizedBox(height: 16),
                  if (!o.creatorSigned)
                    FilledButton(
                      key: const Key('creator-sign-btn'),
                      onPressed: busy ? null : () => act('creatorSign'),
                      child: const Text('Người sáng tạo: xác nhận mẫu'),
                    ),
                  if (o.creatorSigned) ...[
                    const Text(
                      'Người sáng tạo đã xác nhận',
                      style: TextStyle(color: Palette.red),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      key: const Key('narrator-sign-btn'),
                      onPressed: busy ? null : () => act('narratorSign'),
                      child: const Text('Thử người đọc: xác nhận mẫu'),
                    ),
                  ],
                ],
                if (o.status == ContractStatus.inProduction) ...[
                  Text('Đang thu âm', style: editorial(20)),
                  if (o.revisionNotes.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text('Cần sửa: ${o.revisionNotes}'),
                    ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    key: const Key('simulate-delivery-btn'),
                    onPressed: busy ? null : () => act('deliver'),
                    icon: const Icon(CupertinoIcons.cloud_upload, size: 18),
                    label: const Text('Thử người đọc: bàn giao file mẫu'),
                  ),
                ],
                if (o.status == ContractStatus.delivered) ...[
                  Text('Nghiệm thu bản thu', style: editorial(20)),
                  const SizedBox(height: 12),
                  Text(o.deliveredAudioName),
                  const SizedBox(height: 6),
                  if (SessionAudioFiles.delivery(o.id, o.deliveredAudioName)
                      case final audio?)
                    LocalAudioPreview(bytes: audio.bytes, name: audio.name)
                  else
                    const Text(
                      'Chỉ có tên file mẫu · Chọn và bàn giao file trong cùng phiên để nghe thử; chưa upload.',
                      style: TextStyle(color: Palette.muted, fontSize: 12),
                    ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: input,
                    enabled: !busy,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Chi tiết cần chỉnh sửa',
                    ),
                  ),
                  OutlinedButton(
                    key: const Key('request-revision-btn'),
                    onPressed: busy
                        ? null
                        : () => act('revise', value: input.text),
                    child: const Text('Yêu cầu chỉnh sửa'),
                  ),
                  FilledButton(
                    key: const Key('accept-delivery-btn'),
                    onPressed: busy ? null : () => act('complete'),
                    child: const Text('Nghiệm thu mẫu'),
                  ),
                ],
                if (o.status == ContractStatus.completed) ...[
                  Text('Đã hoàn tất nghiệm thu', style: editorial(20)),
                  const SizedBox(height: 12),
                  const Text(
                    'Tiến độ đã lưu trên thiết bị. Chưa phát hành tập hoặc chuyển tiền.',
                  ),
                ],
                if ([
                  ContractStatus.invited,
                  ContractStatus.negotiating,
                  ContractStatus.pendingSign,
                ].contains(o.status))
                  TextButton(
                    onPressed: busy ? null : () => act('cancel'),
                    child: const Text('Hủy trước sản xuất'),
                  ),
                if ([
                  ContractStatus.inProduction,
                  ContractStatus.delivered,
                ].contains(o.status)) ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: input,
                    decoration: const InputDecoration(
                      labelText: 'Lý do cần phân xử (mẫu)',
                    ),
                  ),
                  TextButton(
                    onPressed: busy
                        ? null
                        : () => act('dispute', value: input.text),
                    child: const Text('Gửi yêu cầu phân xử mẫu'),
                  ),
                ],
                if (o.status == ContractStatus.disputed)
                  ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    title: const Text('Thử kết quả phân xử'),
                    children: [
                      Text(o.revisionNotes),
                      OutlinedButton(
                        onPressed: busy ? null : () => act('demoRelease'),
                        child: const Text('Thử giải ngân cho Narrator'),
                      ),
                      TextButton(
                        onPressed: busy ? null : () => act('demoRefund'),
                        child: const Text('Thử hoàn lại cho Creator'),
                      ),
                      const Text(
                        'Chỉ diễn tập kết quả. Quyền Admin thực nằm trong web riêng.',
                      ),
                    ],
                  ),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      error!,
                      style: const TextStyle(color: Palette.red),
                    ),
                  ),
                const SizedBox(height: 20),
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  title: const Text('Lịch sử hợp tác'),
                  children: [
                    for (final line in o.history)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            line,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Palette.muted,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
    await Future<void>.delayed(const Duration(milliseconds: 300));
    input.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: contracts,
    builder: (context, _) => Scaffold(
      appBar: AppBar(
        title: const Text('Giọng đọc', style: TextStyle(fontSize: 16)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
        children: [
          Text('Một giọng kể,\nmột góc nhìn.', style: editorial(32)),
          const SizedBox(height: 12),
          const Text(
            'Tìm người đồng hành cho câu chuyện của bạn.',
            style: TextStyle(color: Palette.muted, height: 1.7),
          ),
          const SizedBox(height: 20),
          const Text(
            'Danh sách và đánh giá dưới đây là dữ liệu mẫu.',
            style: TextStyle(fontSize: 12, color: Palette.muted),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            children: [
              ChoiceChip(
                label: const Text('Tìm giọng đọc'),
                selected: activeTab == 0,
                onSelected: (_) => setState(() => activeTab = 0),
              ),
              ChoiceChip(
                label: Text('Hợp tác (${contracts.orders.length})'),
                selected: activeTab == 1,
                onSelected: (_) => setState(() => activeTab = 1),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TabMotion(
            child: KeyedSubtree(
              key: ValueKey(activeTab),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: activeTab == 0
                    ? [
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final region in [
                              'Tất cả',
                              'Bắc',
                              'Trung',
                              'Nam',
                            ])
                              ChoiceChip(
                                label: Text(region),
                                selected: selectedRegion == region,
                                onSelected: (_) =>
                                    setState(() => selectedRegion = region),
                              ),
                          ],
                        ),
                        TextField(
                          decoration: const InputDecoration(
                            labelText: 'Tìm tên hoặc chất giọng',
                          ),
                          onChanged: (v) => setState(
                            () => voiceQuery = normalizeSearch(v.trim()),
                          ),
                        ),
                        const SizedBox(height: 24),
                        for (final voice in voices.where(
                          (v) =>
                              (selectedRegion == 'Tất cả' ||
                                  v.region == selectedRegion) &&
                              normalizeSearch('${v.name} ${v.tone}')
                                  .contains(voiceQuery),
                        )) ...[
                          const Divider(),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                alignment: Alignment.center,
                                decoration: const BoxDecoration(
                                  color: Palette.soft,
                                  shape: BoxShape.circle,
                                ),
                                child: Text(
                                  voice.name.substring(0, 1),
                                  style: editorial(24),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(voice.name, style: editorial(22)),
                                    Text(
                                      'Giọng miền ${voice.region} · ${voice.rating} / 5',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Palette.muted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            voice.tone,
                            style: const TextStyle(fontSize: 13),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '“${voice.sampleQuote}”',
                            style: editorial(16).copyWith(height: 1.7),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Trích đoạn kịch bản mẫu · Chưa có audio',
                            style: TextStyle(
                              fontSize: 11,
                              color: Palette.muted,
                            ),
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton.icon(
                            key: Key('invite-${voice.id}'),
                            onPressed: () => openInviteSheet(voice),
                            icon: const Icon(
                              CupertinoIcons.arrow_up_right,
                              size: 16,
                            ),
                            label: const Text('Mời thu âm'),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ]
                    : [
                        if (contracts.orders.isEmpty) ...[
                          Text('Chưa có lời mời nào.', style: editorial(24)),
                          const SizedBox(height: 12),
                          const Text(
                            'Chọn giọng đọc và bản thảo để bắt đầu hợp tác.',
                            style: TextStyle(color: Palette.muted),
                          ),
                          TextButton(
                            onPressed: () => setState(() => activeTab = 0),
                            child: const Text('Tìm giọng đọc'),
                          ),
                        ],
                        for (final o in contracts.orders) ...[
                          const Divider(),
                          ListTile(
                            key: Key('contract-${o.id}'),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 12,
                            ),
                            title: Text(o.draftTitle, style: editorial(20)),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                '${o.narratorName}\n${o.status.label}',
                                style: const TextStyle(
                                  height: 1.8,
                                  color: Palette.muted,
                                ),
                              ),
                            ),
                            trailing: const Icon(
                              CupertinoIcons.chevron_right,
                              size: 16,
                            ),
                            onTap: () => openContractDetail(o),
                          ),
                        ],
                      ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

String _date(DateTime date) =>
    '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

class _SheetTitle extends StatelessWidget {
  const _SheetTitle({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(child: Text(title, style: editorial(21))),
      IconButton(
        tooltip: 'Đóng',
        onPressed: () => Navigator.pop(context),
        icon: const Icon(CupertinoIcons.xmark, size: 18),
      ),
    ],
  );
}
