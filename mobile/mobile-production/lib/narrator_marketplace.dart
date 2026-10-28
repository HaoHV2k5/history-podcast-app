import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'creator_state.dart';
import 'contract_chat_sheet.dart';
import 'design.dart';
import 'motion.dart';
import 'narrator_state.dart';
import 'narrator_profile.dart';
import 'contract_terms.dart';
import 'episode.dart';
import 'contract_pdf.dart';
import 'audio_playback.dart';
import 'local_file.dart';

import 'core/api/post_repository.dart';
import 'app_state.dart';

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
  late final profile = NarratorProfileState(
    widget.state.preferences,
    narratorProfileRepository: widget.state.narratorProfileRepository,
    narratorDemoRepository: widget.state.narratorDemoRepository,
    freelancerRepository: widget.state.freelancerRepository,
    kycRepository: widget.state.kycRepository,
  );
  List<NarratorVoice> get voices {
    final useOnlyRemote =
        contracts.isLiveBackend && contracts.remoteVoices.isNotEmpty;
    return [
      if (!useOnlyRemote) ...sampleNarrators,
      for (final rv in contracts.remoteVoices)
        if (useOnlyRemote ||
            !sampleNarrators.any((v) => v.id == 'nar-${rv.id}'))
          NarratorVoice(
            id: 'nar-${rv.id}',
            name: (rv.bio ?? '').contains('·')
                ? rv.bio!.split('·').first.trim()
                : 'Giọng kể #${rv.id}',
            region: (rv.languages ?? '').contains('Nam')
                ? 'Nam'
                : (rv.languages ?? '').contains('Trung')
                ? 'Trung'
                : 'Bắc',
            tone: (rv.bio ?? '').contains('·')
                ? rv.bio!.split('·').sublist(1).join('·').trim()
                : (rv.bio ?? 'Giọng đọc tư liệu lịch sử truyền cảm'),
            sampleQuote:
                'Tư liệu lịch sử được thể hiện rõ ràng, chuẩn mực niên đại · Mức phí tham khảo ${rv.baseRate.round()}đ / tập.',
            suggestedFee: '${rv.baseRate.round()}đ / tập',
            rating: 4.9,
            completedProjects: 12,
          ),
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
  }

  String selectedRegion = 'Tất cả';
  String voiceQuery = '';
  int activeTab = 0;

  @override
  void initState() {
    super.initState();
    if (contracts.isLiveBackend) {
      contracts.syncMarketplaceBackend();
    }
  }

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
              Text(
                contracts.isLiveBackend
                    ? 'Khởi tạo lời mời hợp tác & hợp đồng thu âm trực tiếp'
                    : 'Lời mời thử nghiệm · Chỉ lưu trên thiết bị',
                style: const TextStyle(color: Palette.muted, fontSize: 12),
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
                child: Text(
                  busy
                      ? 'Đang lưu…'
                      : (contracts.isLiveBackend
                            ? 'Gửi lời mời thu âm'
                            : 'Gửi lời mời mẫu'),
                ),
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
                  child: Text(
                    contracts.isLiveBackend
                        ? 'Tải hợp đồng PDF'
                        : 'Tải thỏa thuận PDF mẫu',
                  ),
                ),
                Text('Hạn bàn giao: ${_date(DateTime.parse(o.deadline))}'),
                const SizedBox(height: 12),
                Text(
                  o.notes,
                  style: const TextStyle(height: 1.7, color: Palette.muted),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  key: const Key('open-contract-chat-btn'),
                  onPressed: busy
                      ? null
                      : () => showModalBottomSheet<void>(
                          context: ctx,
                          isScrollControlled: true,
                          showDragHandle: true,
                          backgroundColor: Palette.paper,
                          builder: (_) => ContractChatSheet(
                            contracts: contracts,
                            order: o,
                            senderName: o.channelName,
                            senderRole: 'CREATOR',
                          ),
                        ),
                  icon: const Icon(CupertinoIcons.chat_bubble_2, size: 16),
                  label: const Text('Phòng trao đổi kịch bản & bản thu'),
                ),
                const SizedBox(height: 20),
                const Divider(),
                if (!contracts.isLiveBackend) ...[
                  const SizedBox(height: 20),
                  const Text(
                    'Mô phỏng hợp tác trên thiết bị. Có sổ ký quỹ hư cấu; xác nhận không phải chữ ký pháp lý, không chuyển tiền thật.',
                    style: TextStyle(
                      color: Palette.muted,
                      fontSize: 12,
                      height: 1.7,
                    ),
                  ),
                ],
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
                    child: Text(
                      contracts.isLiveBackend
                          ? 'Người đọc: đề xuất lại thù lao'
                          : 'Thử người đọc: đề xuất lại',
                    ),
                  ),
                  FilledButton(
                    key: const Key('narrator-accept-invite'),
                    onPressed: busy ? null : () => act('accept'),
                    child: Text(
                      o.status == ContractStatus.negotiating
                          ? (contracts.isLiveBackend
                                ? 'Chấp thuận đề xuất'
                                : 'Chấp thuận đề xuất mẫu')
                          : (contracts.isLiveBackend
                                ? 'Người đọc: đồng ý hợp tác'
                                : 'Thử người đọc: đồng ý'),
                    ),
                  ),
                  TextButton(
                    onPressed: busy ? null : () => act('reject'),
                    child: Text(
                      contracts.isLiveBackend
                          ? 'Từ chối lời mời'
                          : 'Từ chối lời mời mẫu',
                    ),
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
                      child: Text(
                        contracts.isLiveBackend
                            ? 'Người sáng tạo: ký xác nhận'
                            : 'Người sáng tạo: xác nhận mẫu',
                      ),
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
                      child: Text(
                        contracts.isLiveBackend
                            ? 'Người đọc: ký xác nhận'
                            : 'Thử người đọc: xác nhận mẫu',
                      ),
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
                    label: Text(
                      contracts.isLiveBackend
                          ? 'Người đọc: bàn giao bản thu'
                          : 'Thử người đọc: bàn giao file mẫu',
                    ),
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
                    Text(
                      contracts.isLiveBackend
                          ? 'Bản thu đã được nộp lên hệ thống nghiệm thu.'
                          : 'Chỉ có tên file mẫu · Chọn và bàn giao file trong cùng phiên để nghe thử; chưa upload.',
                      style: const TextStyle(
                        color: Palette.muted,
                        fontSize: 12,
                      ),
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
                    child: Text(
                      contracts.isLiveBackend
                          ? 'Nghiệm thu & giải ngân'
                          : 'Nghiệm thu mẫu',
                    ),
                  ),
                ],
                if (o.status == ContractStatus.completed) ...[
                  Text('Đã hoàn tất nghiệm thu', style: editorial(20)),
                  const SizedBox(height: 12),
                  Text(
                    contracts.isLiveBackend
                        ? 'Hợp đồng đã hoàn tất nghiệm thu và giải ngân qua hệ thống ký quỹ.'
                        : 'Tiến độ đã lưu trên thiết bị. Chưa phát hành tập hoặc chuyển tiền.',
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
                    decoration: InputDecoration(
                      labelText: contracts.isLiveBackend
                          ? 'Lý do yêu cầu phân xử'
                          : 'Lý do cần phân xử (mẫu)',
                    ),
                  ),
                  TextButton(
                    onPressed: busy
                        ? null
                        : () => act('dispute', value: input.text),
                    child: Text(
                      contracts.isLiveBackend
                          ? 'Gửi yêu cầu phân xử'
                          : 'Gửi yêu cầu phân xử mẫu',
                    ),
                  ),
                ],
                if (o.status == ContractStatus.disputed &&
                    !contracts.isLiveBackend)
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
          if (!contracts.isLiveBackend) ...[
            const SizedBox(height: 20),
            const Text(
              'Danh sách và đánh giá dưới đây là dữ liệu mẫu.',
              style: TextStyle(fontSize: 12, color: Palette.muted),
            ),
          ],
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
                          Text(
                            contracts.isLiveBackend
                                ? 'Hồ sơ giọng đọc đã xác minh trên hệ thống'
                                : 'Trích đoạn kịch bản mẫu · Chưa có audio',
                            style: const TextStyle(
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

class RecruitmentMarketplaceView extends StatefulWidget {
  const RecruitmentMarketplaceView({super.key, required this.state});
  final AppState state;

  @override
  State<RecruitmentMarketplaceView> createState() =>
      _RecruitmentMarketplaceViewState();
}

class _RecruitmentMarketplaceViewState
    extends State<RecruitmentMarketplaceView> {
  late final CreatorState creatorState = CreatorState(
    widget.state.preferences,
    channelRepository: widget.state.channelRepository,
    creatorSeriesRepository: widget.state.creatorSeriesRepository,
    creatorStudioRepository: widget.state.creatorStudioRepository,
    kycRepository: widget.state.kycRepository,
    contractRepository: widget.state.contractRepository,
    hireRequestRepository: widget.state.hireRequestRepository,
    milestoneRepository: widget.state.milestoneRepository,
    deliverableRepository: widget.state.deliverableRepository,
    disputeRepository: widget.state.disputeRepository,
    chatRepository: widget.state.chatRepository,
    narratorProfileRepository: widget.state.narratorProfileRepository,
    narratorDemoRepository: widget.state.narratorDemoRepository,
    freelancerRepository: widget.state.freelancerRepository,
    postRepository: widget.state.postRepository,
    walletRepository: widget.state.walletRepository,
    withdrawalRepository: widget.state.withdrawalRepository,
  );

  late final NarratorState contracts = NarratorState(creatorState);
  late final NarratorProfileState profile = NarratorProfileState(
    widget.state.preferences,
    narratorProfileRepository: widget.state.narratorProfileRepository,
    narratorDemoRepository: widget.state.narratorDemoRepository,
    freelancerRepository: widget.state.freelancerRepository,
    kycRepository: widget.state.kycRepository,
  );

  int activeTab =
      0; // 0: Tin tuyển dụng & Tìm việc, 1: Tin của tôi & Đơn ứng tuyển
  String selectedRegion = 'Tất cả';
  String voiceQuery = '';
  String _searchKeyword = '';
  String _selectedPostType = 'ALL'; // ALL, BOOKING, JOB_SEEKING
  String _selectedServiceType = 'ALL'; // ALL, VOICE, CONTENT

  final List<Map<String, dynamic>> _customJobs = [];
  List<PostModel> _myPosts = [];
  bool _loadingMyPosts = false;
  List<PostModel> _remotePosts = [];
  bool _loadingPosts = false;
  List<ApplicationModel> _myApplications = [];
  bool _loadingMyApplications = false;
  int _myPostSubTab = 0; // 0: Bài đăng của tôi, 1: Đơn đã nộp

  String _formatCurrency(num amount) {
    final intVal = amount.round();
    final s = intVal.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(s[i]);
    }
    return '${buffer.toString()}đ';
  }

  /// 1. Tìm kiếm / Lọc danh sách bài đăng (Chuẩn 100% Swagger GET /api/v1/posts)
  Future<void> _loadPosts({
    String? keyword,
    String? type,
    String? serviceType,
  }) async {
    final repo = widget.state.postRepository ?? creatorState.postRepository;
    if (repo == null) return;
    setState(() => _loadingPosts = true);
    try {
      final kw = (keyword ?? _searchKeyword).trim();
      final t = (type ?? _selectedPostType);
      final st = (serviceType ?? _selectedServiceType);
      final list = await repo.searchPosts(
        keyword: kw.isNotEmpty ? kw : null,
        type: t != 'ALL' ? t : null,
        serviceType: st != 'ALL' ? st : null,
      );
      if (mounted) {
        setState(() {
          _remotePosts = list;
          _loadingPosts = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingPosts = false);
    }
  }

  /// 3. Xem chi tiết bài đăng theo ID (Chuẩn 100% Swagger GET /api/v1/posts/{id})
  Future<void> openPostDetailSheet(int postId) async {
    final repo = widget.state.postRepository ?? creatorState.postRepository;
    if (repo == null) return;

    PostModel? post;
    bool loading = true;
    String? error;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, update) {
          if (loading && post == null && error == null) {
            repo
                .getPostById(postId)
                .then((val) {
                  if (ctx.mounted) {
                    update(() {
                      post = val;
                      loading = false;
                    });
                  }
                })
                .catchError((e) {
                  if (ctx.mounted) {
                    update(() {
                      error = e.toString();
                      loading = false;
                    });
                  }
                });
          }

          if (loading) {
            return const SizedBox(
              height: 250,
              child: Center(child: CircularProgressIndicator()),
            );
          }

          if (error != null || post == null) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Lỗi tải bài đăng: $error',
                    style: const TextStyle(color: Palette.red),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Đóng'),
                  ),
                ],
              ),
            );
          }

          final p = post!;
          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: p.type == 'BOOKING'
                            ? Palette.red.withValues(alpha: 0.12)
                            : const Color(0xFF1976D2).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        p.type == 'BOOKING'
                            ? 'BÀI ĐĂNG TUYỂN DỤNG'
                            : 'BÀI ĐĂNG TÌM VIỆC',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: p.type == 'BOOKING'
                              ? Palette.red
                              : const Color(0xFF1976D2),
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(CupertinoIcons.xmark, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(p.title, style: editorial(22)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(
                      CupertinoIcons.money_dollar_circle,
                      size: 16,
                      color: Palette.red,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Ngân sách: ${_formatCurrency(p.referencePrice)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Palette.red,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        p.serviceType ?? 'Dịch vụ',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Palette.muted,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                const Text(
                  'Mô tả chi tiết:',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                const SizedBox(height: 6),
                Text(
                  p.description,
                  style: const TextStyle(fontSize: 13, height: 1.5),
                ),
                const Divider(height: 24),
                Row(
                  children: [
                    const Icon(
                      CupertinoIcons.person_crop_circle,
                      size: 16,
                      color: Palette.muted,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Người đăng: ${p.userFullName ?? "Thành viên Sử Ký"}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Palette.muted,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${p.applicationCount} ứng viên',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Palette.muted,
                      ),
                    ),
                  ],
                ),
                if (p.expiresAt != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        CupertinoIcons.clock,
                        size: 15,
                        color: Palette.muted,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Hạn chót: ${p.expiresAt!.split("T").first}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Palette.muted,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 24),
                if (p.type == 'BOOKING')
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Palette.red,
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        openApplySheet(p);
                      },
                      child: const Text('Ứng tuyển bài đăng này'),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _loadMyPosts() async {
    final repo = widget.state.postRepository ?? creatorState.postRepository;
    if (repo == null) return;
    setState(() => _loadingMyPosts = true);
    try {
      final list = await repo.getMyPosts();
      if (mounted) {
        setState(() {
          _myPosts = list;
          _loadingMyPosts = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMyPosts = false);
    }
  }

  Future<void> _loadMyApplications() async {
    final repo = widget.state.postRepository ?? creatorState.postRepository;
    if (repo == null) return;
    setState(() => _loadingMyApplications = true);
    try {
      final list = await repo.getMyApplications();
      if (mounted) {
        setState(() {
          _myApplications = list;
          _loadingMyApplications = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMyApplications = false);
    }
  }

  List<NarratorVoice> get voices {
    final useOnlyRemote =
        contracts.isLiveBackend && contracts.remoteVoices.isNotEmpty;
    return [
      if (!useOnlyRemote) ...sampleNarrators,
      for (final rv in contracts.remoteVoices)
        if (useOnlyRemote ||
            !sampleNarrators.any((v) => v.id == 'nar-${rv.id}'))
          NarratorVoice(
            id: 'nar-${rv.id}',
            name: (rv.bio ?? '').contains('·')
                ? rv.bio!.split('·').first.trim()
                : 'Giọng kể #${rv.id}',
            region: (rv.languages ?? '').contains('Nam')
                ? 'Nam'
                : (rv.languages ?? '').contains('Trung')
                ? 'Trung'
                : 'Bắc',
            tone: (rv.bio ?? '').contains('·')
                ? rv.bio!.split('·').sublist(1).join('·').trim()
                : (rv.bio ?? 'Giọng đọc tư liệu lịch sử truyền cảm'),
            sampleQuote:
                'Tư liệu lịch sử được thể hiện rõ ràng, chuẩn mực niên đại · Mức phí tham khảo ${rv.baseRate.round()}đ / tập.',
            suggestedFee: '${rv.baseRate.round()}đ / tập',
            rating: 4.9,
            completedProjects: 12,
          ),
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
  }

  @override
  void initState() {
    super.initState();
    if (contracts.isLiveBackend) {
      contracts.syncMarketplaceBackend();
    }
    _loadPosts();
    _loadMyPosts();
    _loadMyApplications();
  }

  @override
  void dispose() {
    contracts.dispose();
    profile.dispose();
    creatorState.dispose();
    super.dispose();
  }

  /// 1. Đăng tin mới (Chuẩn 100% Swagger POST /api/v1/posts)
  Future<void> openPostJobSheet() async {
    final titleCtrl = TextEditingController();
    final feeCtrl = TextEditingController(text: '500000');
    final descCtrl = TextEditingController();
    String type = 'BOOKING'; // BOOKING, JOB_SEEKING
    String serviceType = 'VOICE'; // VOICE, CONTENT
    int expiresInDays = 30;
    bool busy = false;
    String? error;

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
              const _SheetTitle(title: 'Đăng tin mới (Booking & Tìm việc)'),
              const SizedBox(height: 10),
              const Text(
                'Đăng tin tuyển dụng dịch vụ kịch bản/diễn đọc hoặc đăng tin tìm việc nhận dự án.',
                style: TextStyle(fontSize: 13, color: Palette.muted),
              ),
              const SizedBox(height: 18),

              // Loại bài đăng (type: BOOKING / JOB_SEEKING)
              const Text(
                'Mục đích bài đăng',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Palette.muted,
                ),
              ),
              const SizedBox(height: 6),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'BOOKING',
                    label: Text('Cần thuê / Tuyển'),
                    icon: Icon(CupertinoIcons.briefcase, size: 16),
                  ),
                  ButtonSegment(
                    value: 'JOB_SEEKING',
                    label: Text('Tìm việc / Nhận việc'),
                    icon: Icon(CupertinoIcons.person_badge_plus, size: 16),
                  ),
                ],
                selected: {type},
                onSelectionChanged: busy
                    ? null
                    : (val) => update(() => type = val.first),
              ),
              const SizedBox(height: 16),

              // Loại dịch vụ (serviceType: VOICE / CONTENT)
              const Text(
                'Lĩnh vực dịch vụ',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Palette.muted,
                ),
              ),
              const SizedBox(height: 6),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'VOICE',
                    label: Text('Giọng đọc (Voice)'),
                    icon: Icon(CupertinoIcons.mic, size: 16),
                  ),
                  ButtonSegment(
                    value: 'CONTENT',
                    label: Text('Kịch bản (Content)'),
                    icon: Icon(CupertinoIcons.doc_text, size: 16),
                  ),
                ],
                selected: {serviceType},
                onSelectionChanged: busy
                    ? null
                    : (val) => update(() => serviceType = val.first),
              ),
              const SizedBox(height: 16),

              // Tiêu đề: title
              TextField(
                controller: titleCtrl,
                enabled: !busy,
                decoration: const InputDecoration(
                  labelText: 'Tiêu đề bài đăng *',
                  hintText:
                      'Ví dụ: Tuyển giọng đọc nam hào sảng kịch bản Chi Lăng',
                ),
              ),
              const SizedBox(height: 16),

              // Mức giá tham khảo: referencePrice
              TextField(
                controller: feeCtrl,
                enabled: !busy,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Mức giá tham khảo (VNĐ) *',
                  hintText: '500000',
                  suffixText: 'VNĐ',
                ),
              ),
              const SizedBox(height: 16),

              // Nội dung mô tả: description
              TextField(
                controller: descCtrl,
                enabled: !busy,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Nội dung mô tả chi tiết *',
                  hintText: 'Mô tả chi tiết kịch bản, thời lượng, yêu cầu tông giọng, chất lượng âm thanh...',
                ),
              ),
              const SizedBox(height: 16),

              // Thời hạn bài đăng: expiresInDays
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Thời hạn bài đăng',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Palette.muted,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final days in [7, 14, 30, 60])
                        ChoiceChip(
                          label: Text('$days ngày'),
                          selected: expiresInDays == days,
                          onSelected: busy
                              ? null
                              : (_) => update(() => expiresInDays = days),
                        ),
                    ],
                  ),
                ],
              ),

              if (error != null) ...[
                const SizedBox(height: 12),
                Text(
                  error!,
                  style: const TextStyle(color: Palette.red, fontSize: 13),
                ),
              ],
              const SizedBox(height: 20),

              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Palette.red,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: busy
                    ? null
                    : () async {
                        final title = titleCtrl.text.trim();
                        final desc = descCtrl.text.trim();
                        if (title.isEmpty) {
                          update(
                            () => error = 'Vui lòng nhập tiêu đề bài đăng',
                          );
                          return;
                        }
                        if (desc.isEmpty) {
                          update(() => error = 'Vui lòng nhập nội dung mô tả');
                          return;
                        }
                        final feeClean = feeCtrl.text.replaceAll(
                          RegExp(r'[^\d]'),
                          '',
                        );
                        final priceNum = double.tryParse(feeClean) ?? 0;
                        if (priceNum <= 0) {
                          update(
                            () => error = 'Mức giá tham khảo phải lớn hơn 0',
                          );
                          return;
                        }

                        update(() {
                          busy = true;
                          error = null;
                        });

                        try {
                          final repo =
                              widget.state.postRepository ??
                              creatorState.postRepository;
                          if (repo != null) {
                            await repo.createPost(
                              type: type,
                              serviceType: serviceType,
                              title: title,
                              description: desc,
                              referencePrice: priceNum,
                              expiresInDays: expiresInDays,
                            );
                          }
                          await _loadPosts();
                          await _loadMyPosts();
                          setState(() {
                            activeTab = 1; // Chuyển sang Tab Tin của tôi
                          });
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Đã đăng bài thành công lên hệ thống!',
                                ),
                              ),
                            );
                          }
                        } catch (e) {
                          update(() {
                            busy = false;
                            error = 'Lỗi khi đăng bài: $e';
                          });
                        }
                      },
                icon: const Icon(CupertinoIcons.paperplane_fill, size: 16),
                label: Text(busy ? 'Đang gửi bài đăng…' : 'Đăng bài ngay'),
              ),
            ],
          ),
        ),
      ),
    );
    await Future<void>.delayed(const Duration(milliseconds: 300));
    titleCtrl.dispose();
    feeCtrl.dispose();
    descCtrl.dispose();
  }

  /// 2. Ứng tuyển vào bài đăng BOOKING (POST /api/v1/posts/{id}/apply)
  Future<void> openApplySheet(PostModel post) async {
    final priceCtrl = TextEditingController(
      text: post.referencePrice.round().toString(),
    );
    final msgCtrl = TextEditingController();
    bool busy = false;
    String? error;

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
              _SheetTitle(title: 'Ứng tuyển bài đăng #${post.id}'),
              const SizedBox(height: 8),
              Text(
                post.title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Mức giá tham khảo: ${_formatCurrency(post.referencePrice)}',
                style: const TextStyle(
                  fontSize: 12.5,
                  color: Palette.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: priceCtrl,
                enabled: !busy,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Mức giá đề xuất của bạn (VNĐ) *',
                  hintText: '500000',
                  suffixText: 'VNĐ',
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: msgCtrl,
                enabled: !busy,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Lời nhắn / Giới thiệu năng lực',
                  hintText: 'Chào bạn, tôi có kinh nghiệm diễn đọc kịch bản lịch sử phong cách hào hùng...',
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 12),
                Text(
                  error!,
                  style: const TextStyle(color: Palette.red, fontSize: 13),
                ),
              ],
              const SizedBox(height: 20),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Palette.red,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: busy
                    ? null
                    : () async {
                        final priceClean = priceCtrl.text.replaceAll(
                          RegExp(r'[^\d]'),
                          '',
                        );
                        final proposedPrice = double.tryParse(priceClean) ?? 0;
                        if (proposedPrice <= 0) {
                          update(
                            () => error = 'Mức giá đề xuất phải lớn hơn 0',
                          );
                          return;
                        }
                        update(() {
                          busy = true;
                          error = null;
                        });
                        try {
                          final repo =
                              widget.state.postRepository ??
                              creatorState.postRepository;
                          if (repo != null) {
                            await repo.applyToPost(
                              post.id,
                              proposedPrice: proposedPrice,
                              message: msgCtrl.text.trim().isNotEmpty
                                  ? msgCtrl.text.trim()
                                  : null,
                            );
                          }
                          await _loadMyApplications();
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Đã gửi đơn ứng tuyển thành công!',
                                ),
                              ),
                            );
                          }
                        } catch (e) {
                          update(() {
                            busy = false;
                            error = 'Lỗi ứng tuyển: $e';
                          });
                        }
                      },
                icon: const Icon(CupertinoIcons.paperplane_fill, size: 16),
                label: Text(busy ? 'Đang gửi…' : 'Gửi đơn ứng tuyển'),
              ),
            ],
          ),
        ),
      ),
    );
    await Future<void>.delayed(const Duration(milliseconds: 300));
    priceCtrl.dispose();
    msgCtrl.dispose();
  }

  /// 3. Xem danh sách ứng viên của bài đăng (GET /api/v1/posts/{id}/applications)
  Future<void> openApplicationsSheet(PostModel post) async {
    List<ApplicationModel> apps = [];
    bool loading = true;
    String? error;

    final repo = widget.state.postRepository ?? creatorState.postRepository;

    Future<void> fetchApps(void Function(void Function()) update) async {
      if (repo == null) return;
      try {
        final list = await repo.getApplicationsByPost(post.id);
        update(() {
          apps = list;
          loading = false;
        });
      } catch (e) {
        update(() {
          error = 'Không thể tải ứng viên: $e';
          loading = false;
        });
      }
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, update) {
          if (loading && error == null) {
            fetchApps(update);
          }
          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(ctx).height * 0.85,
            ),
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SheetTitle(title: 'Ứng viên bài đăng #${post.id}'),
                const SizedBox(height: 6),
                Text(
                  post.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13, color: Palette.muted),
                ),
                const Divider(height: 24),
                if (loading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (error != null)
                  Center(
                    child: Text(
                      error!,
                      style: const TextStyle(color: Palette.red),
                    ),
                  )
                else if (apps.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: Text(
                        'Chưa có ai ứng tuyển bài đăng này.',
                        style: TextStyle(color: Palette.muted, fontSize: 13),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: ListView.builder(
                      itemCount: apps.length,
                      itemBuilder: (ctx, idx) {
                        final app = apps[idx];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
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
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: Palette.red.withValues(
                                      alpha: 0.1,
                                    ),
                                    backgroundImage:
                                        app.applicantAvatarUrl != null
                                        ? NetworkImage(app.applicantAvatarUrl!)
                                        : null,
                                    child: app.applicantAvatarUrl == null
                                        ? const Icon(
                                            CupertinoIcons.person_solid,
                                            size: 18,
                                            color: Palette.red,
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          app.applicantFullName ??
                                              'Ứng viên #${app.applicantId}',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                        if (app.applicantHeadline != null)
                                          Text(
                                            app.applicantHeadline!,
                                            style: const TextStyle(
                                              fontSize: 11.5,
                                              color: Palette.muted,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color:
                                          app.status == 'ACCEPTED' ||
                                              app.status == 'CHOSEN'
                                          ? const Color(0xFF2E7D32)
                                                .withValues(alpha: 0.12)
                                          : Palette.line,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      app.status,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color:
                                            app.status == 'ACCEPTED' ||
                                                app.status == 'CHOSEN'
                                            ? const Color(0xFF2E7D32)
                                            : Palette.muted,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Giá đề xuất: ${_formatCurrency(app.proposedPrice)}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: Palette.red,
                                  fontSize: 13,
                                ),
                              ),
                              if (app.message != null &&
                                  app.message!.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Text(
                                  app.message!,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: Palette.ink,
                                  ),
                                ),
                              ],
                              if (app.status == 'PENDING') ...[
                                const SizedBox(height: 10),
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton.icon(
                                    style: FilledButton.styleFrom(
                                      backgroundColor: const Color(0xFF2E7D32),
                                      visualDensity: VisualDensity.compact,
                                    ),
                                    onPressed: () async {
                                      try {
                                        await repo!.chooseApplicant(
                                          post.id,
                                          app.applicantId,
                                        );
                                        update(() {
                                          fetchApps(update);
                                        });
                                        await _loadMyPosts();
                                        if (mounted) {
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                'Đã chọn ứng viên ${app.applicantFullName ?? "#${app.applicantId}"}!',
                                              ),
                                            ),
                                          );
                                        }
                                      } catch (e) {
                                        if (mounted) {
                                          ScaffoldMessenger.of(context)
                                              .showSnackBar(
                                                SnackBar(
                                                  content: Text(
                                                    'Lỗi chọn ứng viên: $e',
                                                  ),
                                                ),
                                              );
                                        }
                                      }
                                    },
                                    icon: const Icon(
                                      CupertinoIcons.checkmark_alt,
                                      size: 14,
                                    ),
                                    label: const Text('Chọn ứng viên này'),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// 4. Sửa bài đăng (PUT /api/v1/posts/{id})
  Future<void> openEditPostSheet(PostModel post) async {
    final titleCtrl = TextEditingController(text: post.title);
    final descCtrl = TextEditingController(text: post.description);
    final feeCtrl = TextEditingController(
      text: post.referencePrice.round().toString(),
    );
    String status = post.status;
    bool busy = false;
    String? error;

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
              _SheetTitle(title: 'Cập nhật bài đăng #${post.id}'),
              const SizedBox(height: 16),
              TextField(
                controller: titleCtrl,
                enabled: !busy,
                decoration: const InputDecoration(
                  labelText: 'Tiêu đề bài đăng *',
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: feeCtrl,
                enabled: !busy,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Mức giá tham khảo (VNĐ) *',
                  suffixText: 'VNĐ',
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: descCtrl,
                enabled: !busy,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Mô tả chi tiết *',
                ),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                initialValue: status,
                decoration: const InputDecoration(
                  labelText: 'Trạng thái bài đăng',
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'OPEN',
                    child: Text('OPEN (Đang mở)'),
                  ),
                  DropdownMenuItem(
                    value: 'CLOSED',
                    child: Text('CLOSED (Đã đóng)'),
                  ),
                ],
                onChanged: busy
                    ? null
                    : (v) => update(() => status = v ?? 'OPEN'),
              ),
              if (error != null) ...[
                const SizedBox(height: 12),
                Text(
                  error!,
                  style: const TextStyle(color: Palette.red, fontSize: 13),
                ),
              ],
              const SizedBox(height: 20),
              FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: Palette.red),
                onPressed: busy
                    ? null
                    : () async {
                        final title = titleCtrl.text.trim();
                        final desc = descCtrl.text.trim();
                        final feeClean = feeCtrl.text.replaceAll(
                          RegExp(r'[^\d]'),
                          '',
                        );
                        final price = double.tryParse(feeClean) ?? 0;
                        if (title.isEmpty || desc.isEmpty || price <= 0) {
                          update(
                            () => error =
                                'Vui lòng điền đủ tiêu đề, mô tả và giá > 0',
                          );
                          return;
                        }
                        update(() {
                          busy = true;
                          error = null;
                        });
                        try {
                          final repo =
                              widget.state.postRepository ??
                              creatorState.postRepository;
                          if (repo != null) {
                            await repo.updatePost(
                              post.id,
                              title: title,
                              description: desc,
                              referencePrice: price,
                              status: status,
                            );
                          }
                          await _loadMyPosts();
                          await _loadPosts();
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Đã cập nhật bài đăng thành công!',
                                ),
                              ),
                            );
                          }
                        } catch (e) {
                          update(() {
                            busy = false;
                            error = 'Lỗi cập nhật: $e';
                          });
                        }
                      },
                icon: const Icon(CupertinoIcons.checkmark_alt, size: 16),
                label: Text(busy ? 'Đang lưu…' : 'Lưu thay đổi'),
              ),
            ],
          ),
        ),
      ),
    );
    await Future<void>.delayed(const Duration(milliseconds: 300));
    titleCtrl.dispose();
    descCtrl.dispose();
    feeCtrl.dispose();
  }

  /// 5. Đóng / Xóa bài đăng (DELETE /api/v1/posts/{id})
  Future<void> confirmDeletePost(PostModel post) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận xóa bài'),
        content: Text(
          'Bạn có chắc chắn muốn đóng và xóa bài đăng "${post.title}" không?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Palette.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xác nhận xóa'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final repo = widget.state.postRepository ?? creatorState.postRepository;
        if (repo != null) {
          await repo.deletePost(post.id);
        }
        await _loadMyPosts();
        await _loadPosts();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã xóa bài đăng thành công!')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Không thể xóa bài đăng: $e')));
        }
      }
    }
  }

  Future<void> openInviteSheet(NarratorVoice narrator) async {
    final drafts = creatorState.drafts
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
    var draftId = drafts.first.id;
    var deadline = DateTime.now().add(const Duration(days: 7));
    final fee = TextEditingController(text: narrator.suggestedFee);
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
              Text(
                contracts.isLiveBackend
                    ? 'Khởi tạo lời mời hợp tác & hợp đồng thu âm trực tiếp'
                    : 'Lời mời thử nghiệm · Lưu trên thiết bị',
                style: const TextStyle(color: Palette.muted, fontSize: 12),
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
                key: const Key('confirm-send-invite-view'),
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
                          if (mounted) setState(() => activeTab = 2);
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
                child: Text(
                  busy
                      ? 'Đang lưu…'
                      : (contracts.isLiveBackend
                            ? 'Gửi lời mời thu âm'
                            : 'Gửi lời mời mẫu'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    await Future<void>.delayed(const Duration(milliseconds: 300));
    fee.dispose();
    notes.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: contracts,
      builder: (context, _) {
        return RefreshIndicator(
          color: Palette.red,
          backgroundColor: Palette.paper,
          onRefresh: () async {
            if (contracts.isLiveBackend) {
              await contracts.syncMarketplaceBackend();
            }
            await Future.wait([
              _loadPosts(),
              _loadMyPosts(),
              _loadMyApplications(),
            ]);
          },
          child: ListView(
            key: const PageStorageKey('recruitment-scroll'),
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(
              24,
              12,
              24,
              widget.state.current == null ? 28 : 118,
            ),
            children: [
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 10,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Tuyển dụng & Việc', style: editorial(31)),
                      const SizedBox(height: 4),
                      const Text(
                        'Quản lý bài đăng Booking (Creator) và Tìm việc (Freelancer), ứng tuyển',
                        style: TextStyle(fontSize: 13, color: Palette.muted),
                      ),
                    ],
                  ),
                  FilledButton.icon(
                    key: const Key('open-post-job-btn'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Palette.red,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                    onPressed: openPostJobSheet,
                    icon: const Icon(CupertinoIcons.plus_circle, size: 14),
                    label: const Text(
                      'Đăng tin',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Navigation Tabs (Chỉ 2 Tab chuyên biệt của Post Management)
              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: Center(
                        child: Text(
                          'Tin tuyển dụng & Tìm việc (${_remotePosts.length})',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      selected: activeTab == 0,
                      onSelected: (_) => setState(() => activeTab = 0),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ChoiceChip(
                      key: const Key('tab-my-posts'),
                      label: Center(
                        child: Text(
                          'Tin của tôi (${_myPosts.length})',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      selected: activeTab == 1,
                      onSelected: (_) => setState(() => activeTab = 1),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // TAB 0: TIN TUYỂN DỤNG & TÌM VIỆC (POST SEARCH & DISCOVERY)
              if (activeTab == 0) ...[
                // Bộ lọc tìm kiếm từ khóa và loại bài (GET /api/v1/posts)
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Tìm bài đăng theo từ khóa...',
                    prefixIcon: const Icon(CupertinoIcons.search, size: 18),
                    suffixIcon: _searchKeyword.isNotEmpty
                        ? IconButton(
                            icon: const Icon(
                              CupertinoIcons.clear_circled,
                              size: 16,
                            ),
                            onPressed: () {
                              setState(() => _searchKeyword = '');
                              _loadPosts(keyword: '');
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Palette.line),
                    ),
                  ),
                  onSubmitted: (v) {
                    setState(() => _searchKeyword = v);
                    _loadPosts(keyword: v);
                  },
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ChoiceChip(
                        label: const Text('Tất cả'),
                        selected: _selectedPostType == 'ALL',
                        onSelected: (_) {
                          setState(() => _selectedPostType = 'ALL');
                          _loadPosts(type: 'ALL');
                        },
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('Cần thuê / Tuyển (BOOKING)'),
                        selected: _selectedPostType == 'BOOKING',
                        onSelected: (_) {
                          setState(() => _selectedPostType = 'BOOKING');
                          _loadPosts(type: 'BOOKING');
                        },
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('Tìm việc (JOB_SEEKING)'),
                        selected: _selectedPostType == 'JOB_SEEKING',
                        onSelected: (_) {
                          setState(() => _selectedPostType = 'JOB_SEEKING');
                          _loadPosts(type: 'JOB_SEEKING');
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                if (_loadingPosts)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (_remotePosts.isNotEmpty) ...[
                  for (final post in _remotePosts) ...[
                    InkWell(
                      borderRadius: BorderRadius.circular(10),
                      onTap: () => openPostDetailSheet(post.id),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Palette.paper,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              alignment: WrapAlignment.spaceBetween,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 7,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: post.type == 'BOOKING'
                                            ? Palette.red.withValues(
                                                alpha: 0.12,
                                              )
                                            : const Color(0xFF1976D2)
                                                  .withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        post.type == 'BOOKING'
                                            ? 'ĐANG TUYỂN'
                                            : 'TÌM VIỆC',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: post.type == 'BOOKING'
                                              ? Palette.red
                                              : const Color(0xFF1976D2),
                                          letterSpacing: 0.8,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Palette.soft,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        post.serviceType == 'VOICE'
                                            ? 'Giọng đọc'
                                            : (post.serviceType ?? 'Dịch vụ'),
                                        style: const TextStyle(
                                          fontSize: 10,
                                          color: Palette.muted,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  _formatCurrency(post.referencePrice),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Palette.ink,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(post.title, style: editorial(17)),
                            const SizedBox(height: 6),
                            Text(
                              post.description,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: Palette.muted,
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              alignment: WrapAlignment.spaceBetween,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              spacing: 12,
                              runSpacing: 6,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      CupertinoIcons.person_crop_circle,
                                      size: 14,
                                      color: Palette.muted,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      post.userFullName ?? 'Thành viên Sử Ký',
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        color: Palette.muted,
                                      ),
                                    ),
                                  ],
                                ),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      CupertinoIcons.clock,
                                      size: 13,
                                      color: Palette.muted,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      post.expiresAt != null
                                          ? 'Hạn: ${post.expiresAt!.split("T").first}'
                                          : 'Đang mở',
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        color: Palette.muted,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    style: OutlinedButton.styleFrom(
                                      visualDensity: VisualDensity.compact,
                                    ),
                                    onPressed: () =>
                                        openPostDetailSheet(post.id),
                                    child: const Text('Xem chi tiết'),
                                  ),
                                ),
                                if (post.type == 'BOOKING') ...[
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: FilledButton(
                                      style: FilledButton.styleFrom(
                                        backgroundColor: Palette.red,
                                        visualDensity: VisualDensity.compact,
                                      ),
                                      onPressed: () => openApplySheet(post),
                                      child: const Text('Ứng tuyển / Gửi báo giá'),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ] else ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 36,
                    ),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      children: [
                        const Icon(
                          CupertinoIcons.briefcase,
                          size: 40,
                          color: Palette.muted,
                        ),
                        const SizedBox(height: 12),
                        Text('Chưa có bài đăng nào', style: editorial(18)),
                        const SizedBox(height: 6),
                        const Text(
                          'Chưa có bài đăng nào từ máy chủ hoặc không khớp bộ lọc tìm kiếm.\nHãy bấm "Đăng tin" để tạo bài đăng đầu tiên!',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            color: Palette.muted,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: Palette.red,
                          ),
                          onPressed: openPostJobSheet,
                          icon: const Icon(
                            CupertinoIcons.plus_circle,
                            size: 16,
                          ),
                          label: const Text('Đăng tin ngay'),
                        ),
                      ],
                    ),
                  ),
                ],
              ],

              // TAB 1: TIN CỦA TÔI (MY POSTS & APPLICATIONS)
              if (activeTab == 1) ...[
                Row(
                  children: [
                    ChoiceChip(
                      label: Text('Bài đăng của tôi (${_myPosts.length})'),
                      selected: _myPostSubTab == 0,
                      onSelected: (_) => setState(() => _myPostSubTab = 0),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: Text('Đơn đã nộp (${_myApplications.length})'),
                      selected: _myPostSubTab == 1,
                      onSelected: (_) => setState(() => _myPostSubTab = 1),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_myPostSubTab == 0) ...[
                  if (_loadingMyPosts)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32.0),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else if (_myPosts.isEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 36,
                      ),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Column(
                        children: [
                          const Icon(
                            CupertinoIcons.square_list,
                            size: 40,
                            color: Palette.muted,
                          ),
                          const SizedBox(height: 12),
                          Text('Chưa có bài đăng nào', style: editorial(18)),
                          const SizedBox(height: 6),
                          const Text(
                            'Bạn chưa tạo bài đăng tuyển dụng hoặc tìm việc nào. Hãy đăng tin ngay để tìm đối tác phù hợp.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: Palette.muted,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 16),
                          FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: Palette.red,
                            ),
                            onPressed: openPostJobSheet,
                            icon: const Icon(
                              CupertinoIcons.plus_circle,
                              size: 16,
                            ),
                            label: const Text('Đăng tin ngay'),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    for (final post in _myPosts) ...[
                      Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Palette.paper,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              alignment: WrapAlignment.spaceBetween,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 7,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: post.type == 'BOOKING'
                                            ? Palette.red.withValues(
                                                alpha: 0.12,
                                              )
                                            : const Color(0xFF1976D2)
                                                  .withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        post.type == 'BOOKING'
                                            ? 'CẦN THUÊ'
                                            : 'TÌM VIỆC',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: post.type == 'BOOKING'
                                              ? Palette.red
                                              : const Color(0xFF1976D2),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Palette.soft,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        post.serviceType == 'VOICE'
                                            ? 'Giọng đọc'
                                            : 'Kịch bản',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          color: Palette.muted,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: post.status == 'OPEN'
                                            ? const Color(0xFF2E7D32)
                                                  .withValues(alpha: 0.12)
                                            : Palette.line,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        post.status,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: post.status == 'OPEN'
                                              ? const Color(0xFF2E7D32)
                                              : Palette.muted,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  _formatCurrency(post.referencePrice),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Palette.ink,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(post.title, style: editorial(17)),
                            const SizedBox(height: 6),
                            Text(
                              post.description,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: Palette.muted,
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              alignment: WrapAlignment.spaceBetween,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              spacing: 12,
                              runSpacing: 6,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      CupertinoIcons.clock,
                                      size: 13,
                                      color: Palette.muted,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      post.expiresAt != null
                                          ? 'Hạn: ${post.expiresAt!.split("T").first}'
                                          : 'Đang mở',
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        color: Palette.muted,
                                      ),
                                    ),
                                  ],
                                ),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      CupertinoIcons.person_2,
                                      size: 13,
                                      color: Palette.muted,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${post.applicationCount} ứng viên',
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        color: Palette.muted,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: FilledButton.tonalIcon(
                                    style: FilledButton.styleFrom(
                                      visualDensity: VisualDensity.compact,
                                    ),
                                    onPressed: () =>
                                        openApplicationsSheet(post),
                                    icon: const Icon(
                                      CupertinoIcons.person_2_fill,
                                      size: 14,
                                    ),
                                    label: Text(
                                      'Ứng viên (${post.applicationCount})',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                OutlinedButton(
                                  style: OutlinedButton.styleFrom(
                                    visualDensity: VisualDensity.compact,
                                  ),
                                  onPressed: () => openEditPostSheet(post),
                                  child: const Text('Sửa'),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  tooltip: 'Xóa bài đăng',
                                  icon: const Icon(
                                    CupertinoIcons.trash,
                                    size: 16,
                                    color: Palette.red,
                                  ),
                                  onPressed: () => confirmDeletePost(post),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ] else ...[
                  // Danh sách đơn ứng tuyển đã nộp
                  if (_loadingMyApplications)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32.0),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else if (_myApplications.isEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 36,
                      ),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Column(
                        children: [
                          const Icon(
                            CupertinoIcons.doc_checkmark,
                            size: 40,
                            color: Palette.muted,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Chưa có đơn ứng tuyển nào',
                            style: editorial(18),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Bạn chưa nộp đơn ứng tuyển vào dự án nào. Xem mục "Tin tuyển dụng" để tìm kiếm công việc phù hợp.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: Palette.muted,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    for (final app in _myApplications) ...[
                      Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.all(16),
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
                                Text(
                                  'Bài đăng #${app.postId}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 7,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color:
                                        app.status == 'ACCEPTED' ||
                                            app.status == 'CHOSEN'
                                        ? const Color(0xFF2E7D32)
                                              .withValues(alpha: 0.12)
                                        : Palette.line,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    app.status,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color:
                                          app.status == 'ACCEPTED' ||
                                              app.status == 'CHOSEN'
                                          ? const Color(0xFF2E7D32)
                                          : Palette.muted,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (app.postTitle != null) ...[
                              const SizedBox(height: 6),
                              Text(app.postTitle!, style: editorial(16)),
                            ],
                            const SizedBox(height: 8),
                            Text(
                              'Giá bạn đề xuất: ${_formatCurrency(app.proposedPrice)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Palette.red,
                                fontSize: 13,
                              ),
                            ),
                            if (app.message != null &&
                                app.message!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                'Lời nhắn: ${app.message!}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Palette.muted,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ],
                ],
              ],
            ],
          ),
        );
      },
    );
  }
}
