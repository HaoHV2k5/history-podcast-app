import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'app_state.dart';
import 'audience_pages.dart';
import 'components.dart';
import 'core/api/channel_repository.dart';
import 'core/api/contract_repository.dart' hide MilestoneModel;
import 'core/api/dispute_repository.dart';
import 'core/api/hire_request_repository.dart';
import 'core/api/milestone_repository.dart';
import 'core/api/review_repository.dart';
import 'creator_freelancer_chat.dart';
import 'design.dart';
import 'episode.dart';
import 'wallet_page.dart';

String formatVndAmount(num amount) {
  final intVal = amount.round();
  final isNegative = intVal < 0;
  final digits = intVal.abs().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) {
      buffer.write('.');
    }
    buffer.write(digits[i]);
  }
  return '${isNegative ? '-' : ''}$bufferđ';
}

String commissionStatusLabel(String status) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'CHỜ CREATOR PHẢN HỒI';
    case 'ACCEPTED':
      return 'ĐANG THẢO LUẬN (CHAT 1-1)';
    case 'REJECTED':
      return 'ĐÃ TỪ CHỐI';
    case 'CONTRACT_SENT':
      return 'ĐÃ GỬI LỘ TRÌNH MILESTONE';
    case 'COMPLETED':
      return 'ĐÃ HOÀN THÀNH';
    case 'CANCELLED':
      return 'ĐÃ HỦY';
    default:
      return status;
  }
}

Color commissionStatusColor(String status) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return const Color(0xFFD97706);
    case 'ACCEPTED':
      return const Color(0xFF1976D2);
    case 'CONTRACT_SENT':
      return const Color(0xFF7C3AED);
    case 'COMPLETED':
      return const Color(0xFF2E7D32);
    case 'REJECTED':
    case 'CANCELLED':
      return Palette.red;
    default:
      return Palette.muted;
  }
}

bool isContractNegotiating(String status) {
  final s = status.toUpperCase();
  return s == 'PENDING' || s == 'REJECTED';
}

String contractStatusLabel(String status) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'Chờ khách duyệt lộ trình';
    case 'REJECTED':
      return 'Khách yêu cầu sửa lộ trình';
    case 'ACTIVE':
      return 'Đang thực hiện';
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'DISPUTED':
      return 'Đang khiếu nại / Tranh chấp';
    case 'CANCELLED':
      return 'Đã huỷ';
    default:
      return status;
  }
}

String stripUrlsFromEvidenceText(String? rawText) {
  if (rawText == null || rawText.trim().isEmpty) return '';
  return rawText
      .replaceAll(
        RegExp(r'\(\s*Đính kèm:\s*https?://[^\s)]+\s*\)', caseSensitive: false),
        '',
      )
      .replaceAll(RegExp(r'Đính kèm:\s*https?://\S+', caseSensitive: false), '')
      .replaceAll(RegExp(r'https?://\S+', caseSensitive: false), '')
      .replaceAll(RegExp(r'\s{2,}'), ' ')
      .trim();
}

/// Quy tắc hiển thị Badge trạng thái 4 giai đoạn (Section 6.4.2)
String contractStageBadgeLabel(
  ContractModel c, [
  List<MilestoneModel>? overrideMilestones,
]) {
  final status = c.status.toUpperCase();
  if (status == 'PENDING') return 'Chờ khách duyệt lộ trình';
  if (status == 'REJECTED') return 'Khách yêu cầu sửa lộ trình';
  if (status == 'COMPLETED') return 'Đã hoàn thành';
  final msList = overrideMilestones != null && overrideMilestones.isNotEmpty
      ? overrideMilestones.map((m) => (orderNo: m.orderNo, status: m.status)).toList()
      : c.milestones.map((m) => (orderNo: m.orderNo, status: m.status)).toList();
  if (status == 'CANCELLED') {
    final doneMs = msList
        .where(
          (m) =>
              m.status.toUpperCase() == 'APPROVED' ||
              m.status.toUpperCase() == 'RELEASED',
        )
        .length;
    if (doneMs > 0 && msList.isNotEmpty) {
      return 'Đã dừng • Hoàn tất $doneMs/${msList.length} mốc';
    }
    return 'Đã huỷ';
  }
  if (status == 'DISPUTED') return 'Đang khiếu nại';

  if (status == 'ACTIVE') {
    for (var i = 0; i < msList.length; i++) {
      final mStatus = msList[i].status.toUpperCase();
      if (mStatus != 'APPROVED' && mStatus != 'RELEASED' && mStatus != 'CANCELLED') {
        final orderNo = msList[i].orderNo ?? (i + 1);
        if (mStatus == 'UNFUNDED') {
          return 'Khách đã duyệt • Chờ ký quỹ Mốc #$orderNo';
        }
        return 'Đang thực hiện';
      }
    }
    return 'Đang thực hiện';
  }
  return contractStatusLabel(status);
}

/// Quy tắc hiển thị dòng trạng thái trên Thanh tiến độ (Progress Bar - Section 6.4.2)
String contractStageProgressLabel(
  ContractModel c, [
  List<MilestoneModel>? overrideMilestones,
]) {
  final status = c.status.toUpperCase();
  if (status == 'PENDING') {
    return 'Chưa bắt đầu — Chờ khách chấp thuận lộ trình';
  }
  if (status == 'REJECTED') {
    return 'Khách yêu cầu sửa — Chờ cập nhật & gửi lại lộ trình';
  }
  final msList = overrideMilestones != null && overrideMilestones.isNotEmpty
      ? overrideMilestones
          .map((m) => (orderNo: m.orderNo, title: m.title, status: m.status))
          .toList()
      : c.milestones
          .map((m) => (orderNo: m.orderNo, title: m.title, status: m.status))
          .toList();
  final total = msList.isNotEmpty ? msList.length : 1;

  if (status == 'COMPLETED') {
    return 'Đã hoàn thành toàn bộ $total/$total mốc';
  }
  if (status == 'CANCELLED') {
    final doneMs = msList
        .where(
          (m) =>
              m.status.toUpperCase() == 'APPROVED' ||
              m.status.toUpperCase() == 'RELEASED',
        )
        .length;
    if (doneMs > 0) {
      return 'Hợp đồng đã dừng — Đã hoàn thành $doneMs/$total mốc trước đó';
    }
    return 'Hợp đồng đã huỷ';
  }
  if (status == 'ACTIVE') {
    final doneMs = msList
        .where(
          (m) =>
              m.status.toUpperCase() == 'APPROVED' ||
              m.status.toUpperCase() == 'RELEASED',
        )
        .length;
    if (doneMs == total && total > 0) {
      return 'Đã nghiệm thu $doneMs/$total mốc - Chờ đối soát giải ngân';
    }
    for (var i = 0; i < msList.length; i++) {
      final m = msList[i];
      final mStatus = m.status.toUpperCase();
      if (mStatus != 'APPROVED' && mStatus != 'RELEASED' && mStatus != 'CANCELLED') {
        final orderNo = m.orderNo ?? (i + 1);
        if (mStatus == 'UNFUNDED') {
          return 'Đang ở Mốc #$orderNo/$total: ${m.title} (Chờ khách nạp cọc)';
        }
        if (mStatus == 'SUBMITTED') {
          return 'Đang ở Mốc #$orderNo/$total: ${m.title} (Chờ khách nghiệm thu)';
        }
        return 'Đang ở Mốc #$orderNo/$total: ${m.title} (Đang thực hiện)';
      }
    }
    return 'Đang thực hiện lộ trình ($total mốc)';
  }
  return contractStatusLabel(status);
}

Color contractStatusColor(String status) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return const Color(0xFFD97706);
    case 'REJECTED':
      return Palette.red;
    case 'ACTIVE':
      return const Color(0xFF1976D2);
    case 'COMPLETED':
      return const Color(0xFF2E7D32);
    case 'DISPUTED':
      return Palette.red;
    case 'CANCELLED':
      return Palette.muted;
    default:
      return Palette.ink;
  }
}

String milestoneStatusLabel(
  String status, {
  String? contractStatus,
  int? orderNo,
}) {
  switch (status.toUpperCase()) {
    case 'WAITING':
      final cStatus = contractStatus?.toUpperCase();
      if (cStatus == 'PENDING') {
        return 'CHỜ KHÁCH DUYỆT LỘ TRÌNH';
      }
      if (cStatus == 'REJECTED') {
        return 'CHỜ CẬP NHẬT LỘ TRÌNH';
      }
      if (cStatus == 'ACTIVE') {
        final prevOrder = (orderNo != null && orderNo > 1) ? orderNo - 1 : 1;
        return 'CHỜ MỞ KHÓA (SAU MỐC #$prevOrder)';
      }
      return 'ĐANG KHÓA (CHỜ GIAI ĐOẠN TRƯỚC)';
    case 'UNFUNDED':
      return 'MỞ KHÓA · CHỜ KHÁCH ĐÓNG CỌC';
    case 'IN_PROGRESS':
      return 'ĐANG THỰC HIỆN (ĐÃ ĐÓNG CỌC)';
    case 'SUBMITTED':
      return 'ĐÃ NỘP FILE · CHỜ NGHIỆM THU (72H)';
    case 'APPROVED':
      return 'ĐÃ DUYỆT · CHỜ ĐỐI SOÁT 3 NGÀY';
    case 'RELEASED':
      return 'ĐÃ GIẢI NGÂN 95% VỀ VÍ CREATOR';
    case 'DISPUTED':
      return 'ĐANG KHIẾU NẠI / ĐÓNG BĂNG';
    case 'CANCELLED':
      return 'ĐÃ HỦY / HOÀN TIỀN 100%';
    default:
      return status;
  }
}

Color milestoneStatusColor(String status) {
  switch (status.toUpperCase()) {
    case 'WAITING':
      return Palette.muted;
    case 'UNFUNDED':
      return const Color(0xFFD97706);
    case 'IN_PROGRESS':
      return const Color(0xFF1976D2);
    case 'SUBMITTED':
      return const Color(0xFF7C3AED);
    case 'APPROVED':
    case 'RELEASED':
      return const Color(0xFF2E7D32);
    case 'DISPUTED':
    case 'CANCELLED':
      return Palette.red;
    default:
      return Palette.ink;
  }
}

/// Sheet chọn Kênh để gửi Yêu cầu Đặt làm Nội dung (Form 1) ngay từ Marketplace
class SelectChannelForCommissionSheet extends StatefulWidget {
  const SelectChannelForCommissionSheet({
    super.key,
    required this.state,
    this.onCommissionCreated,
  });

  final AppState state;
  final VoidCallback? onCommissionCreated;

  @override
  State<SelectChannelForCommissionSheet> createState() =>
      _SelectChannelForCommissionSheetState();
}

class _SelectChannelForCommissionSheetState
    extends State<SelectChannelForCommissionSheet> {
  bool _loading = true;
  List<ChannelModel> _channels = [];

  @override
  void initState() {
    super.initState();
    _loadChannels();
  }

  Future<void> _loadChannels() async {
    if (widget.state.channelRepository != null) {
      try {
        final list =
            await widget.state.channelRepository!.getAllChannels(size: 50);
        if (mounted) {
          setState(() {
            _channels = list;
            _loading = false;
          });
          return;
        }
      } catch (_) {}
    }
    if (mounted) {
      setState(() {
        _channels = channels
            .map(
              (c) => ChannelModel(
                id: c.id ?? 1,
                creatorId: c.creatorId ?? 2,
                name: c.name,
                description: c.description,
                avatarUrl: c.image,
                coverUrl: c.coverImage,
              ),
            )
            .toList();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final myUserId = widget.state.currentUserId;
    final available = _channels
        .where(
          (c) => myUserId == null || c.creatorId == null || c.creatorId != myUserId,
        )
        .toList();
    final displayList = available.isNotEmpty ? available : _channels;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.72,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Palette.line,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Eyebrow('ĐẶT LÀM NỘI DUNG THEO YÊU CẦU'),
                        const SizedBox(height: 4),
                        Text('Chọn Kênh Kể Chuyện', style: editorial(22)),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Đóng',
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(CupertinoIcons.xmark, size: 18),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Chọn kênh bạn muốn đặt sản xuất Video / Podcast lẻ hoặc Series nhiều tập.',
                style: TextStyle(fontSize: 12.5, color: Palette.muted),
              ),
              const Divider(height: 22),
              if (_loading)
                const Expanded(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (displayList.isEmpty)
                const Expanded(
                  child: Center(
                    child: Text(
                      'Chưa tìm thấy kênh nào để đặt nội dung.',
                      style: TextStyle(color: Palette.muted),
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView.separated(
                    itemCount: displayList.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) {
                      final ch = displayList[i];
                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: Palette.red.withValues(alpha: 0.12),
                              child: Text(
                                ch.name.isNotEmpty
                                    ? ch.name[0].toUpperCase()
                                    : 'K',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Palette.red,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    ch.name,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    ch.description.isNotEmpty
                                        ? ch.description
                                        : 'Kênh kể chuyện lịch sử trên nền tảng Sử Ký',
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Palette.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            FilledButton.icon(
                              key: Key('pick-channel-commission-${ch.id}'),
                              style: FilledButton.styleFrom(
                                backgroundColor: Palette.red,
                                visualDensity: VisualDensity.compact,
                              ),
                              onPressed: () {
                                Navigator.pop(context);
                                showModalBottomSheet<void>(
                                  context: context,
                                  isScrollControlled: true,
                                  useSafeArea: true,
                                  backgroundColor: Palette.paper,
                                  builder: (_) => CustomCommissionRequestSheet(
                                    state: widget.state,
                                    channelId: ch.id,
                                    creatorId: ch.creatorId ?? 2,
                                    channelName: ch.name,
                                    onSubmitted: widget.onCommissionCreated,
                                  ),
                                );
                              },
                              icon: const Icon(CupertinoIcons.sparkles, size: 14),
                              label: const Text('Đặt làm'),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Form 2 — Lập / Chỉnh sửa Hợp đồng & Lộ trình Milestone Tổng (Creator -> Khách)
/// Tuân thủ tuyệt đối mục 6.2 của MILESTONE_FLOW_GUIDE.md:
/// - Phần A: title & description của Hợp đồng
/// - Phần B: Danh sách động 1..20 Milestones, mỗi mốc chỉ gồm đúng 4 ô nhập:
///   1. Tên giai đoạn (title)
///   2. Sản phẩm bàn giao cam kết (requirement)
///   3. Số tiền của giai đoạn (amount - VND, tối thiểu 10.000đ)
///   4. Số ngày thực hiện giai đoạn (durationDays - tối thiểu 1 ngày)
/// - Phần C: Bảng tạm tính tự động (Tổng giá trị hợp đồng, Phí nền tảng 5%, Thực nhận 95%)
class CreateOrEditMilestoneRoadmapSheet extends StatefulWidget {
  const CreateOrEditMilestoneRoadmapSheet({
    super.key,
    required this.state,
    this.commission,
    this.existingContract,
    this.onSaved,
  });

  final AppState state;
  final HireRequestModel? commission;
  final ContractModel? existingContract;
  final VoidCallback? onSaved;

  @override
  State<CreateOrEditMilestoneRoadmapSheet> createState() =>
      _CreateOrEditMilestoneRoadmapSheetState();
}

class _DraftMilestoneItem {
  final TextEditingController titleCtrl;
  final TextEditingController reqCtrl;
  final TextEditingController amountCtrl;
  final TextEditingController durationCtrl;

  _DraftMilestoneItem({
    required String title,
    required String requirement,
    required String amount,
    required String durationDays,
  })  : titleCtrl = TextEditingController(text: title),
        reqCtrl = TextEditingController(text: requirement),
        amountCtrl = TextEditingController(text: amount),
        durationCtrl = TextEditingController(text: durationDays);

  void dispose() {
    titleCtrl.dispose();
    reqCtrl.dispose();
    amountCtrl.dispose();
    durationCtrl.dispose();
  }
}

class _CreateOrEditMilestoneRoadmapSheetState
    extends State<CreateOrEditMilestoneRoadmapSheet> {
  late final TextEditingController _contractTitleCtrl;
  late final TextEditingController _contractDescCtrl;
  final List<_DraftMilestoneItem> _items = [];
  BookingEscrowPolicyModel _policy = const BookingEscrowPolicyModel();
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final existing = widget.existingContract;
    final comm = widget.commission;

    _contractTitleCtrl = TextEditingController(
      text: existing?.title ??
          (comm != null
              ? 'Hợp đồng sản xuất: ${comm.title ?? "Nội dung lịch sử"}'
              : 'Hợp đồng sản xuất nội dung theo yêu cầu'),
    );
    _contractDescCtrl = TextEditingController(
      text: existing?.description ??
          comm?.description ??
          'Sản xuất và bàn giao theo lộ trình Milestone đã thống nhất qua phòng Chat 1-1.',
    );

    if (existing != null && existing.milestones.isNotEmpty) {
      for (final m in existing.milestones) {
        _items.add(
          _DraftMilestoneItem(
            title: m.title,
            requirement: m.requirement ?? m.description ?? '',
            amount: m.amount.round().toString(),
            durationDays: (m.durationDays ?? 3).toString(),
          ),
        );
      }
    } else if (comm?.contentType == 'SERIES') {
      _items.addAll([
        _DraftMilestoneItem(
          title: 'Giai đoạn 1: Đề cương & Kịch bản chi tiết Tập 1',
          requirement: 'File PDF kịch bản và tài liệu tham khảo lịch sử Tập 1',
          amount: '200000',
          durationDays: '3',
        ),
        _DraftMilestoneItem(
          title: 'Giai đoạn 2: Bản thu âm / Video hoàn chỉnh Tập 1',
          requirement: 'File MP3/MP4 chất lượng cao đã hậu kỳ hoàn chỉnh Tập 1',
          amount: '400000',
          durationDays: '5',
        ),
      ]);
    } else {
      _items.addAll([
        _DraftMilestoneItem(
          title: 'Giai đoạn 1: Đề cương & Kịch bản chi tiết',
          requirement: 'File PDF kịch bản hoàn chỉnh khoảng 3.000 từ',
          amount: '200000',
          durationDays: '3',
        ),
        _DraftMilestoneItem(
          title: 'Giai đoạn 2: Bản thu âm & Hậu kỳ hoàn chỉnh',
          requirement: 'File MP3/MP4 Master chất lượng cao sẵn sàng xuất bản',
          amount: '400000',
          durationDays: '4',
        ),
      ]);
    }

    for (final item in _items) {
      item.amountCtrl.addListener(_onAmountChanged);
    }
    _loadPolicy();
  }

  void _onAmountChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _loadPolicy() async {
    final repo = widget.state.contractRepository ??
        widget.state.creatorState.contractRepository;
    if (repo == null) return;
    try {
      final p = await repo.getPublicPolicy();
      if (mounted) setState(() => _policy = p);
    } catch (_) {}
  }

  @override
  void dispose() {
    _contractTitleCtrl.dispose();
    _contractDescCtrl.dispose();
    for (final item in _items) {
      item.amountCtrl.removeListener(_onAmountChanged);
      item.dispose();
    }
    super.dispose();
  }

  void _addMilestone() {
    if (_items.length >= _policy.maxMilestones) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Tối đa ${_policy.maxMilestones} giai đoạn cho một hợp đồng.',
          ),
        ),
      );
      return;
    }
    final nextIdx = _items.length + 1;
    final newItem = _DraftMilestoneItem(
      title: 'Giai đoạn $nextIdx: Nộp sản phẩm giai đoạn $nextIdx',
      requirement: 'File bàn giao hoàn chỉnh của giai đoạn $nextIdx',
      amount: '200000',
      durationDays: '3',
    );
    newItem.amountCtrl.addListener(_onAmountChanged);
    setState(() => _items.add(newItem));
  }

  void _removeMilestone(int index) {
    if (_items.length <= 1) return;
    final removed = _items.removeAt(index);
    removed.amountCtrl.removeListener(_onAmountChanged);
    removed.dispose();
    setState(() {});
  }

  double get _totalContractAmount {
    double sum = 0;
    for (final item in _items) {
      final clean = item.amountCtrl.text.replaceAll(RegExp(r'[^\d]'), '');
      sum += double.tryParse(clean) ?? 0;
    }
    return sum;
  }

  double get _platformFeeAmount =>
      (_totalContractAmount * (_policy.platformFeePercent / 100.0));

  double get _creatorNetAmount => _totalContractAmount - _platformFeeAmount;

  double get _creatorReceivePercent => 100.0 - _policy.platformFeePercent;

  Future<void> _submit() async {
    final contractTitle = _contractTitleCtrl.text.trim();
    final contractDesc = _contractDescCtrl.text.trim();
    if (contractTitle.isEmpty || contractDesc.isEmpty) {
      setState(() {
        _error = 'Vui lòng nhập đầy đủ Tiêu đề hợp đồng và Mô tả tổng quan.';
      });
      return;
    }

    final milestonesPayload = <Map<String, dynamic>>[];
    for (var i = 0; i < _items.length; i++) {
      final m = _items[i];
      final mTitle = m.titleCtrl.text.trim();
      final mReq = m.reqCtrl.text.trim();
      final amountClean = m.amountCtrl.text.replaceAll(RegExp(r'[^\d]'), '');
      final mAmount = double.tryParse(amountClean) ?? 0;
      final durationClean = m.durationCtrl.text.replaceAll(RegExp(r'[^\d]'), '');
      final mDuration = int.tryParse(durationClean) ?? 0;

      if (mTitle.isEmpty || mReq.isEmpty) {
        setState(() {
          _error =
              'Giai đoạn #${i + 1}: Vui lòng nhập đủ Tên giai đoạn và Sản phẩm bàn giao cam kết.';
        });
        return;
      }
      if (mAmount < _policy.depositMinAmount) {
        setState(() {
          _error =
              'Giai đoạn #${i + 1}: Số tiền tối thiểu là ${formatVndAmount(_policy.depositMinAmount)}.';
        });
        return;
      }
      if (mDuration < 1) {
        setState(() {
          _error = 'Giai đoạn #${i + 1}: Số ngày thực hiện tối thiểu là 1 ngày.';
        });
        return;
      }

      milestonesPayload.add({
        'orderIndex': i + 1,
        'orderNo': i + 1,
        'title': mTitle,
        'requirement': mReq,
        'description': mReq,
        'amount': mAmount,
        'durationDays': mDuration,
      });
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final repo = widget.state.contractRepository ??
          widget.state.creatorState.contractRepository;
      if (repo != null) {
        if (widget.existingContract != null) {
          await repo.updatePendingContract(
            widget.existingContract!.id,
            title: contractTitle,
            description: contractDesc,
            milestones: milestonesPayload,
          );
        } else {
          await repo.createAndSendContract(
            hireRequestId: widget.commission?.id,
            requesterId: widget.commission?.effectiveRequesterId,
            title: contractTitle,
            description: contractDesc,
            serviceType: 'CONTENT',
            milestones: milestonesPayload,
          );
        }
      }

      if (!mounted) return;
      setState(() => _submitting = false);
      widget.onSaved?.call();
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.existingContract != null
                ? 'Đã cập nhật Lộ trình Milestone Tổng và gửi lại cho Khách hàng!'
                : 'Đã lập và gửi Lộ trình Milestone Tổng (${milestonesPayload.length} giai đoạn) cho Khách hàng xác nhận!',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existingContract != null;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          14,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.88,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Palette.line,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Eyebrow('FORM 2 · LỘ TRÌNH KÝ QUỸ 2 TẦNG'),
                        const SizedBox(height: 4),
                        Text(
                          isEdit
                              ? 'Chỉnh sửa Lộ trình Milestone Tổng'
                              : 'Lập Hợp đồng & Lộ trình Milestone',
                          style: editorial(21),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Đóng',
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(CupertinoIcons.xmark, size: 18),
                  ),
                ],
              ),
              const Divider(height: 18),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                    // PHẦN A — Thông tin chung của Hợp đồng
                    const Eyebrow('PHẦN A · THÔNG TIN CHUNG CỦA HỢP ĐỒNG'),
                    const SizedBox(height: 8),
                    TextField(
                      key: const Key('roadmap-contract-title-input'),
                      controller: _contractTitleCtrl,
                      decoration: const InputDecoration(
                        labelText: '1. Tiêu đề hợp đồng *',
                        hintText:
                            'VD: Sản xuất Podcast Trận Bạch Đằng năm 938 (Full HD)',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      key: const Key('roadmap-contract-desc-input'),
                      controller: _contractDescCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: '2. Mô tả tổng quan / Thỏa thuận chung *',
                        hintText:
                            'VD: Sản xuất theo lộ trình đã thống nhất trong phòng Chat 1-1...',
                      ),
                    ),
                    const SizedBox(height: 20),

                    // PHẦN B — Danh sách các Giai đoạn (Milestones)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Eyebrow(
                            'PHẦN B · DANH SÁCH GIAI ĐOẠN (${_items.length}/${_policy.maxMilestones} MỐC)',
                          ),
                        ),
                        TextButton.icon(
                          key: const Key('add-milestone-row-btn'),
                          onPressed: _addMilestone,
                          icon: const Icon(
                            CupertinoIcons.add_circled_solid,
                            size: 16,
                          ),
                          label: const Text('+ Thêm giai đoạn'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    for (var i = 0; i < _items.length; i++) ...[
                      Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Palette.red,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'GIAI ĐOẠN #${i + 1}',
                                    style: const TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.bold,
                                      color: Palette.white,
                                    ),
                                  ),
                                ),
                                if (_items.length > 1)
                                  IconButton(
                                    tooltip: 'Xóa giai đoạn #${i + 1}',
                                    visualDensity: VisualDensity.compact,
                                    onPressed: () => _removeMilestone(i),
                                    icon: const Icon(
                                      CupertinoIcons.trash,
                                      size: 16,
                                      color: Palette.red,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              key: Key('milestone-title-input-$i'),
                              controller: _items[i].titleCtrl,
                              decoration: const InputDecoration(
                                labelText: '1. Tên giai đoạn (title) *',
                                hintText:
                                    'VD: Giai đoạn 1: Đề cương & Kịch bản chi tiết',
                                isDense: true,
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              key: Key('milestone-req-input-$i'),
                              controller: _items[i].reqCtrl,
                              maxLines: 2,
                              decoration: const InputDecoration(
                                labelText:
                                    '2. Sản phẩm bàn giao cam kết (requirement) *',
                                hintText:
                                    'VD: File PDF kịch bản hoàn chỉnh khoảng 3.000 từ',
                                isDense: true,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  flex: 3,
                                  child: TextField(
                                    key: Key('milestone-amount-input-$i'),
                                    controller: _items[i].amountCtrl,
                                    keyboardType: TextInputType.number,
                                    decoration: const InputDecoration(
                                      labelText: '3. Số tiền (VND, ≥10.000đ) *',
                                      suffixText: 'đ',
                                      isDense: true,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  flex: 2,
                                  child: TextField(
                                    key: Key('milestone-duration-input-$i'),
                                    controller: _items[i].durationCtrl,
                                    keyboardType: TextInputType.number,
                                    decoration: const InputDecoration(
                                      labelText: '4. Số ngày (≥1) *',
                                      suffixText: 'ngày',
                                      isDense: true,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],

                    // PHẦN C — Bảng tạm tính tự động ở cuối Form
                    const SizedBox(height: 6),
                    const Eyebrow('PHẦN C · BẢNG TẠM TÍNH TỰ ĐỘNG'),
                    const SizedBox(height: 8),
                    Container(
                      key: const Key('roadmap-realtime-summary-box'),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF8E7),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE6C27A)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Tổng giá trị hợp đồng (Khách trả):',
                                style: TextStyle(fontSize: 13),
                              ),
                              Text(
                                formatVndAmount(_totalContractAmount),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  fontFeatures: [ui.FontFeature.tabularFigures()],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Phí nền tảng (${_policy.platformFeePercent.round()}%):',
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: Palette.muted,
                                ),
                              ),
                              Text(
                                '-${formatVndAmount(_platformFeeAmount)}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Palette.red,
                                  fontFeatures: [ui.FontFeature.tabularFigures()],
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 18),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Tổng thực nhận của bạn (${_creatorReceivePercent.round()}%):',
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF2E7D32),
                                ),
                              ),
                              Text(
                                formatVndAmount(_creatorNetAmount),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF2E7D32),
                                  fontFeatures: [ui.FontFeature.tabularFigures()],
                                ),
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
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: const TextStyle(color: Palette.red, fontSize: 12.5),
                ),
              ],
              const SizedBox(height: 12),
              FilledButton.icon(
                key: const Key('submit-milestone-roadmap-btn'),
                style: FilledButton.styleFrom(
                  backgroundColor: Palette.red,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Palette.white,
                        ),
                      )
                    : const Icon(CupertinoIcons.paperplane_fill, size: 16),
                label: Text(
                  isEdit
                      ? 'Cập nhật & Gửi lại Lộ trình Tổng'
                      : 'Gửi Lộ trình Milestone Tổng cho Khách duyệt',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Sheet Chi tiết Hợp đồng & Tiến độ Milestone 2 Tầng (Tầng 1: Duyệt lộ trình, Tầng 2: Ký quỹ cuốn chiếu)
class ContractMilestoneRoadmapSheet extends StatefulWidget {
  const ContractMilestoneRoadmapSheet({
    super.key,
    required this.state,
    required this.contractId,
    this.initialContract,
    this.onChanged,
  });

  final AppState state;
  final int contractId;
  final ContractModel? initialContract;
  final VoidCallback? onChanged;

  @override
  State<ContractMilestoneRoadmapSheet> createState() =>
      _ContractMilestoneRoadmapSheetState();
}

class _ContractMilestoneRoadmapSheetState
    extends State<ContractMilestoneRoadmapSheet> {
  ContractModel? _contract;
  List<MilestoneModel> _milestones = [];
  final Map<int, List<MilestoneDeliverableModel>> _deliverablesByMilestone = {};
  List<DisputeModel> _disputes = [];
  List<ReviewModel> _contractReviews = [];
  bool _loading = true;
  bool _busy = false;
  String? _error;

  /// Section 6.4.5: Thu gọn mô tả dài còn 2 dòng mặc định
  bool _descExpanded = false;

  /// Section 6.4.4: Smart Collapse cho danh sách Milestone
  bool _expandAllMilestones = false;
  final Set<int> _manuallyToggledMilestones = {};

  bool _isMilestoneExpanded(MilestoneModel m, bool isNegotiating) {
    if (_expandAllMilestones) return true;
    final mStatus = m.status.toUpperCase();
    final defaultExpanded = isNegotiating ||
        mStatus == 'UNFUNDED' ||
        mStatus == 'IN_PROGRESS' ||
        mStatus == 'SUBMITTED' ||
        mStatus == 'DISPUTED';
    if (_manuallyToggledMilestones.contains(m.id)) {
      return !defaultExpanded;
    }
    return defaultExpanded;
  }

  ContractRepository? get _contractRepo =>
      widget.state.contractRepository ??
      widget.state.creatorState.contractRepository;

  MilestoneRepository? get _milestoneRepo =>
      widget.state.milestoneRepository ??
      widget.state.creatorState.milestoneRepository;

  DisputeRepository? get _disputeRepo =>
      widget.state.disputeRepository ??
      widget.state.creatorState.disputeRepository;

  ReviewRepository? get _reviewRepo => widget.state.reviewRepository;

  @override
  void initState() {
    super.initState();
    _contract = widget.initialContract;
    if (_contract != null) {
      _milestones = _mapContractMilestones(_contract!);
      for (final m in _milestones) {
        if (m.deliverables.isNotEmpty) {
          _deliverablesByMilestone[m.id] = m.deliverables;
        }
      }
    }
    _refreshDetail();
  }

  List<MilestoneModel> _mapContractMilestones(ContractModel c) {
    return c.milestones
        .map(
          (cm) => MilestoneModel(
            id: cm.id,
            contractId: cm.contractId ?? c.id,
            orderNo: cm.orderNo,
            title: cm.title,
            requirement: cm.requirement ?? cm.description,
            amount: cm.amount,
            durationDays: cm.durationDays,
            maxRevisions: cm.maxRevisions,
            revisionsUsed: cm.revisionsUsed,
            revisionDays: cm.revisionDays,
            status: cm.status,
            fundDueAt: cm.fundDueAt,
            dueAt: cm.dueAt ?? cm.dueDate,
            reviewDueAt: cm.reviewDueAt,
            releaseAt: cm.releaseAt,
            escrowStatus: cm.escrowStatus,
            platformFee: cm.platformFee,
            netAmount: cm.netAmount,
            fundedAt: cm.fundedAt,
            releasedAt: cm.releasedAt,
            refundedAt: cm.refundedAt,
            deliverables: cm.deliverables,
            reviews: cm.reviews,
            revisionRequests: cm.revisionRequests,
          ),
        )
        .toList();
  }

  bool get _isCreator {
    final uid = widget.state.currentUserId;
    final c = _contract;
    if (uid != null && c != null) {
      if (c.creatorId == uid) return true;
      if (c.effectiveRequesterId == uid) return false;
    }
    return widget.state.isCreator;
  }

  bool get _isRequester => !_isCreator;

  Future<void> _refreshDetail() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (_contractRepo != null) {
        final detail = await _contractRepo!.getContractById(widget.contractId);
        _contract = detail;
        _milestones = _mapContractMilestones(detail);
        for (final m in _milestones) {
          if (m.deliverables.isNotEmpty) {
            _deliverablesByMilestone[m.id] = m.deliverables;
          }
        }
      }
      if (_milestoneRepo != null) {
        try {
          final ms =
              await _milestoneRepo!.getMilestonesByContract(widget.contractId);
          if (ms.isNotEmpty) {
            _milestones = ms;
            for (final m in _milestones) {
              if (m.deliverables.isNotEmpty) {
                _deliverablesByMilestone[m.id] = m.deliverables;
              }
            }
          }
        } catch (_) {}
        for (final m in _milestones) {
          try {
            final dels = await _milestoneRepo!.getDeliverablesByMilestone(m.id);
            if (dels.isNotEmpty || !_deliverablesByMilestone.containsKey(m.id)) {
              _deliverablesByMilestone[m.id] = dels;
            }
          } catch (_) {}
        }
      }
      if (_disputeRepo != null) {
        try {
          _disputes = await _disputeRepo!.getByContract(widget.contractId);
        } catch (_) {}
      }
      if (_reviewRepo != null) {
        try {
          _contractReviews =
              await _reviewRepo!.getReviewsByContract(widget.contractId);
        } catch (_) {}
      }
      if (widget.state.isLiveBackend) {
        await widget.state.refreshWalletBalance();
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }
    if (mounted) {
      setState(() => _loading = false);
    }
  }

  Future<void> _runAction(
    Future<void> Function() action, {
    required String successMessage,
  }) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
      await _refreshDetail();
      widget.onChanged?.call();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(successMessage)),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  /// Upload file bàn giao cho Milestone (POST /api/v1/milestones/{id}/deliverables)
  /// Tự động chuyển Milestone từ IN_PROGRESS -> SUBMITTED
  /// Mở Modal trước để Creator xem lịch sử các bản đã nộp (v1, v2...) và chọn tệp bên trong Modal (Section 6.4.3).
  Future<void> _uploadDeliverableFile(MilestoneModel m) async {
    final orderNo = m.orderNo ?? 1;
    final existingDels = _deliverablesByMilestone[m.id] ?? m.deliverables;
    final nextVersion = existingDels.length + 1;
    final titleCtrl = TextEditingController(
      text: 'Bản bàn giao v$nextVersion - ${m.title}',
    );
    final descCtrl = TextEditingController(
      text: 'Đã hoàn thiện theo đúng yêu cầu giai đoạn #$orderNo.',
    );

    String? pickedFileName;
    Uint8List? pickedBytes;
    String? modalError;

    final confirmed = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: Text('Nộp sản phẩm giai đoạn #$orderNo (v$nextVersion)'),
          content: SizedBox(
            width: 480,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mốc #$orderNo: ${m.title}',
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: Palette.ink,
                          ),
                        ),
                        if (m.requirement != null &&
                            m.requirement!.trim().isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(
                            'Yêu cầu bàn giao: ${m.requirement}',
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: Palette.muted,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (existingDels.isNotEmpty) ...[
                    Container(
                      key: Key('upload-modal-version-history-${m.id}'),
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Sản phẩm đã nộp trước đó (${existingDels.length} bản):',
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: Palette.ink,
                            ),
                          ),
                          const SizedBox(height: 6),
                          for (var idx = 0; idx < existingDels.length; idx++)
                            Builder(
                              builder: (_) {
                                final d = existingDels[idx];
                                final isLatest = idx == existingDels.length - 1;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 5,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isLatest
                                              ? const Color(0xFF2E7D32)
                                                  .withValues(alpha: 0.14)
                                              : Palette.paper,
                                          borderRadius:
                                              BorderRadius.circular(4),
                                          border: Border.all(
                                            color: isLatest
                                                ? const Color(0xFF2E7D32)
                                                : Palette.line,
                                          ),
                                        ),
                                        child: Text(
                                          isLatest
                                              ? 'v${d.versionNo ?? (idx + 1)} · Hiện tại'
                                              : 'v${d.versionNo ?? (idx + 1)}',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w800,
                                            color: isLatest
                                                ? const Color(0xFF2E7D32)
                                                : Palette.muted,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          d.fileName,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                      TextButton(
                                        style: TextButton.styleFrom(
                                          visualDensity: VisualDensity.compact,
                                        ),
                                        onPressed: () =>
                                            _previewOrDownloadDeliverable(
                                          d,
                                          download: false,
                                        ),
                                        child: const Text(
                                          'Xem sản phẩm',
                                          style: TextStyle(fontSize: 11),
                                        ),
                                      ),
                                      TextButton(
                                        style: TextButton.styleFrom(
                                          visualDensity: VisualDensity.compact,
                                        ),
                                        onPressed: () =>
                                            _previewOrDownloadDeliverable(
                                          d,
                                          download: true,
                                        ),
                                        child: const Text(
                                          'Tải về',
                                          style: TextStyle(fontSize: 11),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                        ],
                      ),
                    ),
                  ],
                  InkWell(
                    key: const Key('upload-modal-pick-file-btn'),
                    borderRadius: BorderRadius.circular(8),
                    onTap: () async {
                      final files = await FilePicker.pickFiles(
                        type: FileType.any,
                      );
                      if (files.isEmpty) return;
                      final picked = files.first;
                      final bytes = await picked.xFile.readAsBytes();
                      if (bytes.isEmpty) {
                        setModalState(() {
                          modalError =
                              'Không đọc được dữ liệu file. Vui lòng chọn file khác.';
                        });
                        return;
                      }
                      if (bytes.length > 10 * 1024 * 1024) {
                        setModalState(() {
                          modalError =
                              'Dung lượng tệp vượt quá giới hạn 10MB. Vui lòng nén hoặc chọn tệp nhỏ hơn.';
                        });
                        return;
                      }
                      setModalState(() {
                        pickedFileName = picked.name;
                        pickedBytes = bytes;
                        modalError = null;
                        titleCtrl.text =
                            'Bản bàn giao v$nextVersion - ${m.title} (${picked.name})';
                      });
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: pickedBytes != null
                            ? const Color(0xFFE8F5E9)
                            : Palette.soft,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: pickedBytes != null
                              ? const Color(0xFF2E7D32)
                              : Palette.red,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            pickedBytes != null
                                ? CupertinoIcons.checkmark_seal_fill
                                : CupertinoIcons.cloud_upload_fill,
                            color: pickedBytes != null
                                ? const Color(0xFF2E7D32)
                                : Palette.red,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  pickedBytes != null
                                      ? 'Đã chọn tệp: $pickedFileName (${(pickedBytes!.length / 1024).ceil()} KB)'
                                      : 'Chọn tệp sản phẩm hoàn thiện từ thiết bị *',
                                  key: const Key(
                                    'upload-modal-selected-file-label',
                                  ),
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.bold,
                                    color: pickedBytes != null
                                        ? const Color(0xFF1B5E20)
                                        : Palette.red,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Hỗ trợ MP4, MOV, MP3, WAV, PDF, DOC/DOCX, TXT, ZIP/RAR (Tối đa 10MB). Không nhập URL ngoài.',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Palette.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (modalError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      modalError!,
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: Palette.red,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Tiêu đề bản nộp',
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: descCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Ghi chú bàn giao cho Khách',
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Lưu ý: Ngay sau khi tải file lên, giai đoạn này sẽ tự động chuyển sang trạng thái ĐÃ NỘP (SUBMITTED) để Khách hàng nghiệm thu trong 72 giờ.',
                    style: TextStyle(fontSize: 11.5, color: Palette.muted),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Hủy'),
            ),
            FilledButton(
              key: const Key('upload-modal-submit-btn'),
              style: FilledButton.styleFrom(backgroundColor: Palette.red),
              onPressed: pickedBytes == null || pickedBytes!.isEmpty
                  ? null
                  : () => Navigator.pop(ctx, true),
              child: const Text('Tải lên & Nộp nghiệm thu'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || pickedBytes == null || pickedFileName == null) {
      titleCtrl.dispose();
      descCtrl.dispose();
      return;
    }

    final titleText = titleCtrl.text.trim();
    final descText = descCtrl.text.trim();
    final finalBytes = pickedBytes!;
    final finalFileName = pickedFileName!;
    titleCtrl.dispose();
    descCtrl.dispose();

    await _runAction(
      () async {
        await _milestoneRepo!.uploadDeliverable(
          m.id,
          fileBytes: finalBytes,
          filename: finalFileName,
          title: titleText.isNotEmpty ? titleText : null,
          description: descText.isNotEmpty ? descText : null,
        );
      },
      successMessage:
          'Đã tải file "$finalFileName" lên thành công! Giai đoạn #$orderNo đã chuyển sang SUBMITTED.',
    );
  }

  /// Xem hoặc Tải xuống file bàn giao có đính kèm JWT Header (GET /api/v1/deliverables/{id}/view | /download)
  Future<void> _previewOrDownloadDeliverable(
    MilestoneDeliverableModel d, {
    required bool download,
  }) async {
    if (_milestoneRepo == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final fetched = await _milestoneRepo!.fetchDeliverableBytes(
        d.id,
        download: download,
      );
      final bytes = fetched.bytes;
      if (!mounted) return;
      setState(() => _busy = false);

      final fname = d.fileName.toLowerCase();
      final isPdf = fname.endsWith('.pdf') ||
          (d.contentType ?? fetched.contentType).toLowerCase().contains('pdf');
      final isImage = fname.endsWith('.png') ||
          fname.endsWith('.jpg') ||
          fname.endsWith('.jpeg') ||
          fname.endsWith('.webp') ||
          fname.endsWith('.gif');
      final isText = fname.endsWith('.txt') ||
          fname.endsWith('.md') ||
          fname.endsWith('.json') ||
          fname.endsWith('.csv') ||
          fetched.contentType.contains('text');

      if (download) {
        try {
          final savedPath = await FilePicker.saveFile(
            dialogTitle: 'Lưu sản phẩm bàn giao',
            fileName: d.fileName,
            bytes: Uint8List.fromList(bytes),
          );
          if (!mounted) return;
          if (savedPath != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Đã lưu tệp "${d.fileName}" về thiết bị ($savedPath)'),
              ),
            );
            return;
          }
        } catch (_) {
          // Fallback to preview dialog if platform save picker is cancelled/unsupported
        }
      }

      String? extractedPdfPreview;
      if (isPdf) {
        final rawLatin = latin1.decode(bytes, allowInvalid: true);
        final matches = RegExp(r'\(([^()]+)\)\s*Tj')
            .allMatches(rawLatin)
            .map((m) => m.group(1)?.trim() ?? '')
            .where((s) => s.isNotEmpty)
            .toList();
        if (matches.isNotEmpty) {
          extractedPdfPreview = matches.join('\n');
        }
      }

      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(
            download
                ? 'Đã tải về: ${d.fileName}'
                : 'Xem sản phẩm: ${d.fileName}',
          ),
          content: SizedBox(
            width: 480,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Dung lượng xác thực: ${(bytes.length / 1024).toStringAsFixed(1)} KB · Loại: ${isPdf ? "application/pdf" : (d.contentType ?? fetched.contentType)}',
                    style: const TextStyle(fontSize: 12, color: Palette.muted),
                  ),
                  if (d.description != null && d.description!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      'Ghi chú: ${d.description}',
                      style: const TextStyle(fontSize: 12.5),
                    ),
                  ],
                  const SizedBox(height: 12),
                  if (isImage)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.memory(
                        Uint8List.fromList(bytes),
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const Text(
                          'Đã tải dữ liệu ảnh thành công qua luồng bảo mật JWT.',
                        ),
                      ),
                    )
                  else if (isText)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Text(
                        utf8.decode(bytes, allowMalformed: true),
                        style: const TextStyle(
                          fontSize: 12,
                          fontFamily: 'monospace',
                        ),
                      ),
                    )
                  else if (isPdf && extractedPdfPreview != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Palette.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                CupertinoIcons.doc_richtext,
                                size: 16,
                                color: Palette.red,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  d.title ?? d.fileName,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 16),
                          Text(
                            extractedPdfPreview,
                            style: const TextStyle(
                              fontSize: 12.5,
                              height: 1.5,
                              color: Palette.ink,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            CupertinoIcons.checkmark_shield_fill,
                            color: Color(0xFF2E7D32),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Đã tải thành công ${bytes.length} bytes dữ liệu gốc của file "${d.fileName}" thông qua kết nối bảo mật JWT.',
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: Color(0xFF1B5E20),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
          actions: [
            OutlinedButton.icon(
              onPressed: () async {
                try {
                  final savedPath = await FilePicker.saveFile(
                    dialogTitle: 'Lưu sản phẩm bàn giao',
                    fileName: d.fileName,
                    bytes: Uint8List.fromList(bytes),
                  );
                  if (savedPath != null && ctx.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(
                        content: Text('Đã lưu tệp "${d.fileName}" về máy'),
                      ),
                    );
                  }
                } catch (_) {}
              },
              icon: const Icon(CupertinoIcons.arrow_down_to_line, size: 14),
              label: const Text('Lưu về máy'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Đóng'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  /// Khách yêu cầu chỉnh sửa sản phẩm của Milestone (POST /api/v1/milestones/{id}/request-revision)
  Future<void> _promptRequestRevision(MilestoneModel m) async {
    final orderNo = m.orderNo ?? 1;
    final noteCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Yêu cầu chỉnh sửa giai đoạn #$orderNo (${(m.revisionsUsed ?? 0) + 1}/${m.maxRevisions ?? 2})',
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Mỗi giai đoạn có tối đa 2 lần chỉnh sửa miễn phí. Mỗi lần yêu cầu chỉnh sửa sẽ cộng thêm +2 ngày làm việc cho Creator.',
              style: TextStyle(fontSize: 12, color: Palette.muted),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: noteCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Nội dung cần chỉnh sửa (note) *',
                hintText:
                    'VD: Nhờ bạn đọc chậm lại đoạn dẫn nhập năm 938 và tăng âm lượng nhạc nền...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Palette.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Gửi yêu cầu chỉnh sửa'),
          ),
        ],
      ),
    );
    final note = noteCtrl.text.trim();
    noteCtrl.dispose();
    if (confirmed != true || note.isEmpty) return;

    await _runAction(
      () async {
        await _milestoneRepo!.requestRevision(m.id, note: note);
      },
      successMessage:
          'Đã gửi yêu cầu chỉnh sửa giai đoạn #$orderNo. Giai đoạn đã quay lại trạng thái IN_PROGRESS (+2 ngày).',
    );
  }

  /// Khách hàng bấm "Giải ngân ngay" khi Milestone đang APPROVED & HELD (POST /api/v1/milestones/{id}/release-early - Mục 15)
  Future<void> _promptReleaseEarlyMilestone(MilestoneModel m) async {
    final orderNo = m.orderNo ?? 1;
    final confirmed = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận giải ngân ngay'),
        content: const Text(
          'Bạn có chắc chắn muốn bỏ qua thời gian giữ đối soát 3 ngày và chuyển 95% tiền ký quỹ cho Nhà sáng tạo ngay lập tức? Thao tác này không thể hoàn tác.',
          style: TextStyle(fontSize: 13, height: 1.45),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            key: const Key('confirm-release-early-btn'),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF2E7D32),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xác nhận giải ngân'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    await _runAction(
      () async {
        await _milestoneRepo!.releaseEarlyMilestone(m.id);
      },
      successMessage:
          'Đã giải ngân ngay 95% tiền ký quỹ giai đoạn #$orderNo vào ví của Nhà sáng tạo!',
    );
  }

  /// Mở khiếu nại / tranh chấp trên Milestone (POST /api/v1/disputes + POST /api/v1/disputes/evidence-upload - Mục 9 & 16)
  Future<void> _promptOpenDispute(MilestoneModel m) async {
    final orderNo = m.orderNo ?? 1;
    final reasonCtrl = TextEditingController();
    final evidenceCtrl = TextEditingController();
    final uploadedFiles = <({String name, String url})>[];
    bool uploadingFile = false;
    String? uploadError;

    final confirmed = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Mở khiếu nại giai đoạn #$orderNo'),
          content: SizedBox(
            width: 460,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Tiền ký quỹ của giai đoạn này sẽ được đóng băng (FROZEN) để Admin phân xử công bằng.',
                    style: TextStyle(fontSize: 12, color: Palette.muted),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    key: const Key('dispute-reason-input'),
                    controller: reasonCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Lý do khiếu nại *',
                      hintText:
                          'VD: Sản phẩm bàn giao sai lệch hoàn toàn với kịch bản cam kết...',
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    key: const Key('dispute-evidence-note-input'),
                    controller: evidenceCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Mô tả chi tiết bằng chứng',
                      hintText:
                          'Mô tả chi tiết điểm sai lệch hoặc thỏa thuận trong phòng Chat 1-1...',
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    key: const Key('pick-dispute-evidence-file-btn'),
                    onPressed: uploadingFile
                        ? null
                        : () async {
                            try {
                              final files = await FilePicker.pickFiles(
                                type: FileType.any,
                              );
                              if (files.isEmpty) {
                                return;
                              }
                              setDialogState(() {
                                uploadingFile = true;
                                uploadError = null;
                              });
                              for (final f in files) {
                                final bytes = await f.xFile.readAsBytes();
                                if (bytes.isEmpty) continue;
                                if (bytes.length > 10 * 1024 * 1024) {
                                  throw Exception(
                                    'Tệp "${f.name}" vượt quá giới hạn 10MB. Vui lòng chọn tệp nhỏ hơn.',
                                  );
                                }
                                if (_disputeRepo != null) {
                                  final fileUrl =
                                      await _disputeRepo!.uploadEvidenceFile(
                                    fileBytes: bytes,
                                    filename: f.name,
                                  );
                                  uploadedFiles
                                      .add((name: f.name, url: fileUrl));
                                }
                              }
                              setDialogState(() => uploadingFile = false);
                            } catch (e) {
                              setDialogState(() {
                                uploadingFile = false;
                                uploadError = e
                                    .toString()
                                    .replaceFirst('Exception: ', '');
                              });
                            }
                          },
                    icon: uploadingFile
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(CupertinoIcons.paperclip, size: 15),
                    label: Text(
                      uploadingFile
                          ? 'Đang tải tệp bằng chứng lên...'
                          : 'Chọn tệp bằng chứng từ thiết bị',
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Hỗ trợ ảnh (PNG, JPG, WEBP), tài liệu (PDF, DOC, TXT), âm thanh/video (MP3, WAV, MP4) hoặc tệp nén (ZIP, RAR). Tối đa 10MB/tệp.',
                    style: TextStyle(fontSize: 11, color: Palette.muted),
                  ),
                  if (uploadError != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      uploadError!,
                      style: const TextStyle(fontSize: 11.5, color: Palette.red),
                    ),
                  ],
                  if (uploadedFiles.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    for (var i = 0; i < uploadedFiles.length; i++)
                      Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              CupertinoIcons.doc_fill,
                              size: 14,
                              color: Palette.red,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                uploadedFiles[i].name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () {
                                setDialogState(() => uploadedFiles.removeAt(i));
                              },
                              icon: const Icon(
                                CupertinoIcons.xmark_circle_fill,
                                size: 16,
                                color: Palette.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Hủy'),
            ),
            FilledButton(
              key: const Key('submit-open-dispute-btn'),
              style: FilledButton.styleFrom(backgroundColor: Palette.red),
              onPressed: uploadingFile ? null : () => Navigator.pop(ctx, true),
              child: const Text('Gửi khiếu nại'),
            ),
          ],
        ),
      ),
    );
    final reason = reasonCtrl.text.trim();
    final evidence = evidenceCtrl.text.trim();
    reasonCtrl.dispose();
    evidenceCtrl.dispose();
    if (confirmed != true || reason.isEmpty) return;

    final attachmentUrls = uploadedFiles.map((f) => f.url).toList();
    await _runAction(
      () async {
        await _disputeRepo!.openDispute(
          milestoneId: m.id,
          contractId: widget.contractId,
          reason: reason,
          evidence: evidence.isNotEmpty ? evidence : null,
          attachmentUrls: attachmentUrls.isNotEmpty ? attachmentUrls : null,
        );
      },
      successMessage:
          'Đã mở khiếu nại cho giai đoạn #$orderNo. Tiền ký quỹ đã được đóng băng chờ Admin phân xử.',
    );
  }

  /// Gửi bằng chứng đối chất khiếu nại (POST /api/v1/disputes/{id}/counter-evidence - Mục 9 & 16)
  Future<void> _promptCounterEvidence(DisputeModel d) async {
    final counterCtrl = TextEditingController(text: stripUrlsFromEvidenceText(d.counterEvidenceUrl));
    final uploadedFiles = <({String name, String url})>[
      for (final url in d.counterEvidenceUrls)
        (name: url.split('/').last, url: url),
    ];
    bool uploadingFile = false;
    String? uploadError;

    final confirmed = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Gửi bằng chứng đối chất Khiếu nại #${d.id}'),
          content: SizedBox(
            width: 460,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    key: const Key('counter-evidence-note-input'),
                    controller: counterCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Nội dung giải trình đối chất *',
                      hintText:
                          'Trình bày rõ quá trình thực hiện, các phiên bản file đã nộp và thỏa thuận trong Chat 1-1...',
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    key: const Key('pick-counter-evidence-file-btn'),
                    onPressed: uploadingFile
                        ? null
                        : () async {
                            try {
                              final files = await FilePicker.pickFiles(
                                type: FileType.any,
                              );
                              if (files.isEmpty) {
                                return;
                              }
                              setDialogState(() {
                                uploadingFile = true;
                                uploadError = null;
                              });
                              for (final f in files) {
                                final bytes = await f.xFile.readAsBytes();
                                if (bytes.isEmpty) continue;
                                if (bytes.length > 10 * 1024 * 1024) {
                                  throw Exception(
                                    'Tệp "${f.name}" vượt quá giới hạn 10MB. Vui lòng chọn tệp nhỏ hơn.',
                                  );
                                }
                                if (_disputeRepo != null) {
                                  final fileUrl =
                                      await _disputeRepo!.uploadEvidenceFile(
                                    fileBytes: bytes,
                                    filename: f.name,
                                  );
                                  uploadedFiles
                                      .add((name: f.name, url: fileUrl));
                                }
                              }
                              setDialogState(() => uploadingFile = false);
                            } catch (e) {
                              setDialogState(() {
                                uploadingFile = false;
                                uploadError = e
                                    .toString()
                                    .replaceFirst('Exception: ', '');
                              });
                            }
                          },
                    icon: uploadingFile
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(CupertinoIcons.paperclip, size: 15),
                    label: Text(
                      uploadingFile
                          ? 'Đang tải tệp đối chất lên...'
                          : 'Chọn tệp bằng chứng từ thiết bị',
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Hỗ trợ ảnh (PNG, JPG, WEBP), tài liệu (PDF, DOC, TXT), âm thanh/video (MP3, WAV, MP4) hoặc tệp nén (ZIP, RAR). Tối đa 10MB/tệp.',
                    style: TextStyle(fontSize: 11, color: Palette.muted),
                  ),
                  if (uploadError != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      uploadError!,
                      style: const TextStyle(fontSize: 11.5, color: Palette.red),
                    ),
                  ],
                  if (uploadedFiles.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    for (var i = 0; i < uploadedFiles.length; i++)
                      Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              CupertinoIcons.doc_fill,
                              size: 14,
                              color: Color(0xFF1976D2),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                uploadedFiles[i].name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () {
                                setDialogState(() => uploadedFiles.removeAt(i));
                              },
                              icon: const Icon(
                                CupertinoIcons.xmark_circle_fill,
                                size: 16,
                                color: Palette.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Hủy'),
            ),
            FilledButton(
              key: const Key('submit-counter-evidence-btn'),
              style: FilledButton.styleFrom(backgroundColor: Palette.red),
              onPressed: uploadingFile ? null : () => Navigator.pop(ctx, true),
              child: const Text('Gửi bằng chứng'),
            ),
          ],
        ),
      ),
    );
    final text = counterCtrl.text.trim();
    counterCtrl.dispose();
    if (confirmed != true || (text.isEmpty && uploadedFiles.isEmpty)) return;

    final attachmentUrls = uploadedFiles.map((f) => f.url).toList();
    await _runAction(
      () async {
        await _disputeRepo!.submitCounterEvidence(
          d.id,
          counterEvidence: text.isNotEmpty ? text : 'Đính kèm tệp bằng chứng đối chất',
          attachmentUrls: attachmentUrls.isNotEmpty ? attachmentUrls : null,
        );
      },
      successMessage: 'Đã gửi bằng chứng đối chất lên hệ thống phân xử.',
    );
  }

  void _showEvidenceAttachmentDialog(String rawUrl) {
    final fullUrl = rawUrl.startsWith('http')
        ? rawUrl
        : '${widget.state.apiClient?.baseUrl ?? "http://localhost:8080"}$rawUrl';
    final lower = rawUrl.toLowerCase();
    final isImage = lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif');
    showDialog<void>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        title: Text('Tệp bằng chứng: ${rawUrl.split('/').last}'),
        content: SizedBox(
          width: 460,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isImage)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      fullUrl,
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => Text('Đường dẫn tệp: $fullUrl'),
                    ),
                  )
                else
                  SelectableText(
                    'Đường dẫn tệp đính kèm:\n$fullUrl',
                    style: const TextStyle(fontSize: 12.5),
                  ),
              ],
            ),
          ),
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  /// Creator sửa lẻ 1 Milestone khi Hợp đồng đang PENDING / REJECTED (PUT /api/v1/milestones/{id})
  Future<void> _promptEditSingleMilestone(MilestoneModel m) async {
    final orderNo = m.orderNo ?? 1;
    final titleCtrl = TextEditingController(text: m.title);
    final reqCtrl = TextEditingController(text: m.requirement ?? '');
    final amountCtrl = TextEditingController(text: m.amount.round().toString());
    final durationCtrl =
        TextEditingController(text: (m.durationDays ?? 3).toString());

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Chỉnh sửa Giai đoạn #$orderNo'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: 'Tên giai đoạn *'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: reqCtrl,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Sản phẩm bàn giao cam kết *',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Số tiền (VND, ≥10.000đ) *',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: durationCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Số ngày thực hiện (≥1) *',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Palette.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Lưu giai đoạn'),
          ),
        ],
      ),
    );

    final newTitle = titleCtrl.text.trim();
    final newReq = reqCtrl.text.trim();
    final newAmount =
        double.tryParse(amountCtrl.text.replaceAll(RegExp(r'[^\d]'), '')) ?? 0;
    final newDuration =
        int.tryParse(durationCtrl.text.replaceAll(RegExp(r'[^\d]'), '')) ?? 1;
    titleCtrl.dispose();
    reqCtrl.dispose();
    amountCtrl.dispose();
    durationCtrl.dispose();

    if (confirmed != true || newTitle.isEmpty || newAmount < 10000) return;

    await _runAction(
      () async {
        await _milestoneRepo!.updateMilestone(
          m.id,
          title: newTitle,
          requirement: newReq,
          amount: newAmount,
          durationDays: newDuration,
        );
      },
      successMessage:
          'Đã cập nhật Giai đoạn #$orderNo và tính lại tổng giá trị Hợp đồng!',
    );
  }

  /// Đánh giá giai đoạn (POST /api/v1/milestones/{id}/reviews) hoặc Đánh giá tổng kết Hợp đồng (POST /api/v1/reviews/contract/{contractId})
  Future<void> _promptReview({MilestoneModel? milestone}) async {
    final orderNo = milestone?.orderNo ?? 1;
    int rating = 5;
    final commentCtrl = TextEditingController(
      text: milestone != null
          ? 'Giai đoạn #$orderNo bàn giao đúng hẹn, nội dung chất lượng!'
          : 'Hợp đồng hợp tác rất chuyên nghiệp và uy tín!',
    );
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, updateDialog) => AlertDialog(
          title: Text(
            milestone != null
                ? 'Đánh giá Giai đoạn #$orderNo'
                : 'Đánh giá tổng kết Hợp đồng',
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  5,
                  (idx) => IconButton(
                    onPressed: () => updateDialog(() => rating = idx + 1),
                    icon: Icon(
                      idx < rating
                          ? CupertinoIcons.star_fill
                          : CupertinoIcons.star,
                      color: const Color(0xFFD97706),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: commentCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Nhận xét của bạn',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Hủy'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: Palette.red),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Gửi đánh giá'),
            ),
          ],
        ),
      ),
    );
    final comment = commentCtrl.text.trim();
    commentCtrl.dispose();
    if (confirmed != true) return;

    await _runAction(
      () async {
        if (milestone != null) {
          await _milestoneRepo!.createMilestoneReview(
            milestone.id,
            rating: rating,
            comment: comment,
          );
        } else if (_reviewRepo != null) {
          await _reviewRepo!.createReview(
            widget.contractId,
            rating: rating,
            comment: comment,
          );
        }
      },
      successMessage: 'Đã gửi đánh giá uy tín thành công!',
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = _contract;
    final status = (c?.status ?? 'PENDING').toUpperCase();
    final isNegotiating = isContractNegotiating(status);
    final badgeText = c != null
        ? contractStageBadgeLabel(c, _milestones)
        : contractStatusLabel(status);
    final progressLabelText = c != null
        ? contractStageProgressLabel(c, _milestones)
        : contractStatusLabel(status);

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.90,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: Palette.line,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 2.5,
                              ),
                              decoration: BoxDecoration(
                                color: contractStatusColor(status)
                                    .withValues(alpha: 0.14),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                badgeText,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: contractStatusColor(status),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Hợp đồng #${widget.contractId}',
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: Palette.muted,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          c?.title ?? 'Lộ trình Hợp đồng & Milestone',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: editorial(20),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Làm mới',
                    onPressed: _busy ? null : _refreshDetail,
                    icon: const Icon(CupertinoIcons.refresh, size: 18),
                  ),
                  IconButton(
                    tooltip: 'Đóng',
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(CupertinoIcons.xmark, size: 18),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Thanh mở nhanh Phòng Chat 1-1 (Đã xóa nút Góc nhìn thủ công - Mục 6)
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton.icon(
                  key: const Key('open-contract-chat-1on1-btn'),
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    foregroundColor: Palette.red,
                    side: const BorderSide(color: Palette.red),
                  ),
                  onPressed: () {
                    showModalBottomSheet<void>(
                      context: context,
                      useRootNavigator: true,
                      isScrollControlled: true,
                      useSafeArea: true,
                      backgroundColor: Palette.paper,
                      builder: (_) => CreatorFreelancerChatSheet(
                        chatRepository: widget.state.chatRepository ??
                            widget.state.creatorState.chatRepository,
                        contractRepository: _contractRepo,
                        hireRequestId: c?.hireRequestId,
                        contractId: widget.contractId,
                        contractStatus: c?.status,
                        topicTitle: c?.title,
                        channelName: c?.channelName,
                        partnerName: _isCreator
                            ? (c?.effectiveRequesterName ?? 'Khách đặt nội dung')
                            : (c?.creatorFullName ?? 'Chủ kênh'),
                        senderRole: _isCreator ? 'CREATOR' : 'CUSTOMER',
                        senderName: widget.state.displayName,
                        currentUserId: widget.state.currentUserId,
                        preferences: widget.state.preferences,
                      ),
                    );
                  },
                  icon: const Icon(CupertinoIcons.chat_bubble_2_fill, size: 14),
                  label: Text(
                    (status == 'COMPLETED' || status == 'CANCELLED')
                        ? 'Xem lịch sử chat'
                        : 'Phòng Chat 1-1',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ),
              const Divider(height: 16),

              if (_loading)
                const Expanded(
                  child: Center(child: CircularProgressIndicator()),
                )
              else
                Expanded(
                  child: ListView(
                    children: [
                      // Tóm tắt tài chính Hợp đồng + Mô tả thu gọn 2 dòng (Section 6.4.5)
                      if (c != null)
                        Container(
                          padding: const EdgeInsets.all(14),
                          margin: const EdgeInsets.only(bottom: 12),
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
                                  const Icon(
                                    CupertinoIcons.flag_fill,
                                    size: 13,
                                    color: Palette.red,
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      progressLabelText,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: Palette.ink,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              if (c.description != null &&
                                  c.description!.trim().isNotEmpty) ...[
                                Text(
                                  c.description!.trim(),
                                  maxLines: _descExpanded ? null : 2,
                                  overflow: _descExpanded
                                      ? TextOverflow.visible
                                      : TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: Palette.ink,
                                    height: 1.45,
                                  ),
                                ),
                                if (c.description!.trim().length > 90 ||
                                    c.description!.contains('\n'))
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: TextButton(
                                      key: const Key('toggle-contract-desc-btn'),
                                      style: TextButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 0,
                                          vertical: 2,
                                        ),
                                        visualDensity: VisualDensity.compact,
                                      ),
                                      onPressed: () => setState(
                                        () => _descExpanded = !_descExpanded,
                                      ),
                                      child: Text(
                                        _descExpanded
                                            ? 'Thu gọn'
                                            : 'Xem đầy đủ',
                                        style: const TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w700,
                                          color: Palette.red,
                                        ),
                                      ),
                                    ),
                                  ),
                                const Divider(height: 16),
                              ],
                              Wrap(
                                spacing: 18,
                                runSpacing: 8,
                                children: [
                                  _metricItem(
                                    'Tổng giá trị Hợp đồng',
                                    formatVndAmount(c.totalAmount),
                                    Palette.ink,
                                  ),
                                  _metricItem(
                                    'Phí nền tảng (${(c.platformFeePercent ?? 5).round()}%)',
                                    formatVndAmount(
                                      c.platformFee ?? (c.totalAmount * 0.05),
                                    ),
                                    Palette.muted,
                                  ),
                                  _metricItem(
                                    'Creator thực nhận (95%)',
                                    formatVndAmount(
                                      c.netAmount ?? (c.totalAmount * 0.95),
                                    ),
                                    const Color(0xFF2E7D32),
                                  ),
                                  _metricItem(
                                    'Số dư Ví của bạn',
                                    formatVndAmount(
                                      widget.state.walletAvailableBalance,
                                    ),
                                    Palette.red,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                      // Vị trí 3 — Hộp Tóm tắt Chính sách & Thời hạn (SLA)
                      Container(
                        key: const Key('contract-sla-policy-box'),
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF8E7),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFE6C27A)),
                        ),
                        child: const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  CupertinoIcons.shield_fill,
                                  size: 15,
                                  color: Color(0xFFB45309),
                                ),
                                SizedBox(width: 6),
                                Text(
                                  'Chính sách Bảo vệ Ký quỹ (Escrow) & Thời hạn SLA',
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF78350F),
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 6),
                            Text(
                              '• Xác nhận lộ trình: Khách hàng xác nhận lộ trình tổng trong vòng 48 giờ kể từ khi Creator gửi.\n'
                              '• Ký quỹ cuốn chiếu: Khách chỉ nạp tiền cho từng giai đoạn khi giai đoạn đó mở khóa (UNFUNDED).\n'
                              '• Nghiệm thu & Tự động duyệt: Khách có 3 ngày (72 giờ) để kiểm tra sản phẩm sau khi Creator nộp file. Quá 3 ngày không phản hồi, hệ thống tự động nghiệm thu.\n'
                              '• Chỉnh sửa (Revision): Tối đa 2 lần chỉnh sửa miễn phí / mỗi giai đoạn (mỗi lần +2 ngày làm việc).\n'
                              '• Cam kết đúng hạn: Nếu Creator trễ hạn bàn giao, Khách có quyền hủy giai đoạn trễ hạn để nhận lại 100% tiền ký quỹ ngay lập tức.\n'
                              '• Giải ngân minh bạch: Sau khi giai đoạn được duyệt, hệ thống giữ đối soát 3 ngày rồi giải ngân 95% về ví Creator (Phí nền tảng 5%).',
                              style: TextStyle(
                                fontSize: 11.5,
                                height: 1.45,
                                color: Color(0xFF78350F),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // TẦNG 1: Thao tác Duyệt / Từ chối / Sửa Lộ trình Tổng (Chỉ khi isNegotiating == true: PENDING hoặc REJECTED)
                      if (isNegotiating) ...[
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Palette.paper,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Palette.red),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                _isRequester
                                    ? 'TẦNG 1 · XÁC NHẬN LỘ TRÌNH MILESTONE TỔNG (DÀNH CHO KHÁCH ĐẶT)'
                                    : 'TẦNG 1 · QUẢN LÝ LỘ TRÌNH MILESTONE TỔNG (DÀNH CHO CREATOR)',
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                  color: Palette.red,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _isRequester
                                    ? 'Khi bạn bấm "Chấp thuận Lộ trình Tổng", bạn chưa bị trừ tiền ngay. Hợp đồng sẽ chuyển sang ACTIVE và mở khóa Giai đoạn #1 (UNFUNDED) để bắt đầu đóng cọc cuốn chiếu.'
                                    : (status == 'REJECTED'
                                        ? 'Khách hàng đã yêu cầu thương lượng lại lộ trình. Bạn có thể chỉnh sửa lại các giai đoạn bên dưới để gửi lại cho Khách duyệt.'
                                        : 'Lộ trình đang chờ Khách hàng chấp thuận trong 48 giờ. Bạn vẫn có thể chỉnh sửa hoặc gộp/xóa mốc khi Khách chưa đóng cọc.'),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Palette.muted,
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 12),
                              if (_isRequester && status == 'PENDING')
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    FilledButton.icon(
                                      key: const Key(
                                        'accept-contract-roadmap-btn',
                                      ),
                                      style: FilledButton.styleFrom(
                                        backgroundColor: const Color(0xFF2E7D32),
                                      ),
                                      onPressed: _busy
                                          ? null
                                          : () => _runAction(
                                                () => _contractRepo!
                                                    .acceptContract(
                                                  widget.contractId,
                                                ),
                                                successMessage:
                                                    'Đã chấp thuận Lộ trình Tổng! Hợp đồng đã chuyển sang ACTIVE và mở khóa Giai đoạn #1 (UNFUNDED).',
                                              ),
                                      icon: const Icon(
                                        CupertinoIcons.checkmark_seal_fill,
                                        size: 16,
                                      ),
                                      label:
                                          const Text('Chấp thuận Lộ trình Tổng'),
                                    ),
                                    OutlinedButton.icon(
                                      key: const Key(
                                        'reject-contract-roadmap-btn',
                                      ),
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: const Color(0xFFD97706),
                                        side: const BorderSide(
                                          color: Color(0xFFD97706),
                                        ),
                                      ),
                                      onPressed: _busy
                                          ? null
                                          : () => _runAction(
                                                () => _contractRepo!
                                                    .rejectContract(
                                                  widget.contractId,
                                                ),
                                                successMessage:
                                                    'Đã yêu cầu thương lượng lại. Creator có thể chỉnh sửa và gửi lại lộ trình!',
                                              ),
                                      icon: const Icon(
                                        CupertinoIcons.arrow_uturn_left,
                                        size: 14,
                                      ),
                                      label: const Text('Từ chối để sửa lại'),
                                    ),
                                    TextButton.icon(
                                      onPressed: _busy
                                          ? null
                                          : () => _runAction(
                                                () => _contractRepo!
                                                    .cancelContract(
                                                  widget.contractId,
                                                ),
                                                successMessage:
                                                    'Đã hủy Hợp đồng thành công.',
                                              ),
                                      icon: const Icon(
                                        CupertinoIcons.xmark_circle,
                                        size: 15,
                                        color: Palette.red,
                                      ),
                                      label: const Text(
                                        'Hủy hợp đồng',
                                        style: TextStyle(color: Palette.red),
                                      ),
                                    ),
                                  ],
                                ),
                              if (_isCreator)
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    FilledButton.icon(
                                      key: const Key('edit-full-roadmap-btn'),
                                      style: FilledButton.styleFrom(
                                        backgroundColor: Palette.red,
                                      ),
                                      onPressed: _busy || c == null
                                          ? null
                                          : () {
                                              showModalBottomSheet<void>(
                                                context: context,
                                                useRootNavigator: true,
                                                isScrollControlled: true,
                                                useSafeArea: true,
                                                backgroundColor: Palette.paper,
                                                builder: (_) =>
                                                    CreateOrEditMilestoneRoadmapSheet(
                                                  state: widget.state,
                                                  existingContract: c,
                                                  onSaved: () {
                                                    _refreshDetail();
                                                    widget.onChanged?.call();
                                                  },
                                                ),
                                              );
                                            },
                                      icon: const Icon(
                                        CupertinoIcons.pencil,
                                        size: 15,
                                      ),
                                      label: const Text(
                                        'Chỉnh sửa toàn bộ Lộ trình (PUT)',
                                      ),
                                    ),
                                    TextButton.icon(
                                      onPressed: _busy
                                          ? null
                                          : () => _runAction(
                                                () => _contractRepo!
                                                    .cancelContract(
                                                  widget.contractId,
                                                ),
                                                successMessage:
                                                    'Đã hủy Hợp đồng thành công.',
                                              ),
                                      icon: const Icon(
                                        CupertinoIcons.xmark_circle,
                                        size: 15,
                                        color: Palette.red,
                                      ),
                                      label: const Text(
                                        'Hủy hợp đồng',
                                        style: TextStyle(color: Palette.red),
                                      ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                      ],

                      // Khiếu nại đang diễn ra (nếu có - Mục 9 & 16)
                      if (_disputes.isNotEmpty) ...[
                        const Eyebrow('KHIẾU NẠI & PHÂN XỬ TRANH CHẤP'),
                        const SizedBox(height: 8),
                        for (final d in _disputes)
                          Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Palette.red.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Palette.red),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Khiếu nại #${d.id} · Trạng thái: ${d.status}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Palette.red,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Lý do khiếu nại (${d.raisedByName ?? "Bên khởi kiện"}): ${d.reason}',
                                  style: const TextStyle(fontSize: 12.5),
                                ),
                                if (stripUrlsFromEvidenceText(d.evidenceUrl)
                                    .isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 3),
                                    child: Text(
                                      'Bằng chứng ban đầu: ${stripUrlsFromEvidenceText(d.evidenceUrl)}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Palette.muted,
                                      ),
                                    ),
                                  ),
                                if (d.evidenceUrls.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: [
                                      for (final url in d.evidenceUrls)
                                        ActionChip(
                                          visualDensity: VisualDensity.compact,
                                          avatar: const Icon(
                                            CupertinoIcons.paperclip,
                                            size: 13,
                                            color: Palette.red,
                                          ),
                                          label: Text(
                                            url.split('/').last,
                                            style: const TextStyle(fontSize: 11),
                                          ),
                                          onPressed: () =>
                                              _showEvidenceAttachmentDialog(url),
                                        ),
                                    ],
                                  ),
                                ],
                                if (stripUrlsFromEvidenceText(
                                      d.counterEvidenceUrl,
                                    ).isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Text(
                                      'Giải trình đối chất: ${stripUrlsFromEvidenceText(d.counterEvidenceUrl)}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF1976D2),
                                      ),
                                    ),
                                  ),
                                if (d.counterEvidenceUrls.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: [
                                      for (final url in d.counterEvidenceUrls)
                                        ActionChip(
                                          visualDensity: VisualDensity.compact,
                                          avatar: const Icon(
                                            CupertinoIcons.paperclip,
                                            size: 13,
                                            color: Color(0xFF1976D2),
                                          ),
                                          label: Text(
                                            url.split('/').last,
                                            style: const TextStyle(fontSize: 11),
                                          ),
                                          onPressed: () =>
                                              _showEvidenceAttachmentDialog(url),
                                        ),
                                    ],
                                  ),
                                ],
                                if (d.resolution != null &&
                                    d.resolution!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Text(
                                      'Phán quyết Admin: ${d.resolution}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF2E7D32),
                                      ),
                                    ),
                                  ),
                                if (d.status.toUpperCase() == 'OPEN' &&
                                    (widget.state.currentUserId == null ||
                                        d.raisedByUserId !=
                                            widget.state.currentUserId)) ...[
                                  const SizedBox(height: 8),
                                  OutlinedButton.icon(
                                    key: Key('counter-evidence-btn-${d.id}'),
                                    style: OutlinedButton.styleFrom(
                                      visualDensity: VisualDensity.compact,
                                    ),
                                    onPressed: _busy
                                        ? null
                                        : () => _promptCounterEvidence(d),
                                    icon: const Icon(
                                      CupertinoIcons.doc_text_search,
                                      size: 14,
                                    ),
                                    label: const Text('Gửi bằng chứng đối chất'),
                                  ),
                                ],
                              ],
                            ),
                          ),
                      ],

                      // THANH STEPPER BAR NGANG (Section 6.4.4 — khi có > 1 mốc)
                      if (_milestones.length > 1) ...[
                        Container(
                          key: const Key('contract-milestone-stepper-bar'),
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Palette.soft,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Palette.line),
                          ),
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                for (var idx = 0;
                                    idx < _milestones.length;
                                    idx++) ...[
                                  if (idx > 0)
                                    Container(
                                      width: 22,
                                      height: 2,
                                      margin: const EdgeInsets.symmetric(
                                        horizontal: 4,
                                      ),
                                      color: Palette.line,
                                    ),
                                  Builder(
                                    builder: (context) {
                                      final stepM = _milestones[idx];
                                      final stepOrder =
                                          stepM.orderNo ?? (idx + 1);
                                      final stepStatus =
                                          stepM.status.toUpperCase();
                                      final isDone = stepStatus == 'APPROVED' ||
                                          stepStatus == 'RELEASED';
                                      final isCurrent =
                                          stepStatus == 'UNFUNDED' ||
                                              stepStatus == 'IN_PROGRESS' ||
                                              stepStatus == 'SUBMITTED';
                                      return InkWell(
                                        key: Key(
                                          'stepper-node-milestone-${stepM.id}',
                                        ),
                                        onTap: () {
                                          setState(() {
                                            if (!_isMilestoneExpanded(
                                              stepM,
                                              isNegotiating,
                                            )) {
                                              _manuallyToggledMilestones
                                                  .add(stepM.id);
                                            }
                                          });
                                        },
                                        borderRadius: BorderRadius.circular(8),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 10,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color: isDone
                                                ? const Color(0xFF2E7D32)
                                                    .withValues(alpha: 0.12)
                                                : isCurrent
                                                    ? milestoneStatusColor(
                                                        stepStatus,
                                                      ).withValues(alpha: 0.14)
                                                    : Palette.paper,
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            border: Border.all(
                                              color: isDone
                                                  ? const Color(0xFF2E7D32)
                                                  : isCurrent
                                                      ? milestoneStatusColor(
                                                          stepStatus,
                                                        )
                                                      : Palette.line,
                                              width: isCurrent ? 1.5 : 1.0,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                isDone
                                                    ? CupertinoIcons
                                                        .checkmark_circle_fill
                                                    : isCurrent
                                                        ? CupertinoIcons
                                                            .play_circle_fill
                                                        : CupertinoIcons.circle,
                                                size: 13,
                                                color: isDone
                                                    ? const Color(0xFF2E7D32)
                                                    : isCurrent
                                                        ? milestoneStatusColor(
                                                            stepStatus,
                                                          )
                                                        : Palette.muted,
                                              ),
                                              const SizedBox(width: 5),
                                              Text(
                                                'Mốc #$stepOrder',
                                                style: TextStyle(
                                                  fontSize: 11.5,
                                                  fontWeight: FontWeight.w800,
                                                  color: isDone
                                                      ? const Color(0xFF2E7D32)
                                                      : isCurrent
                                                          ? milestoneStatusColor(
                                                              stepStatus,
                                                            )
                                                          : Palette.ink,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],

                      // DANH SÁCH CÁC GIAI ĐOẠN MILESTONE (#1 .. #N) + Smart Collapse Toggle
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Eyebrow(
                              'LỘ TRÌNH CUỐN CHIẾU (${_milestones.length} GIAI ĐOẠN MILESTONE)',
                            ),
                          ),
                          if (_milestones.length > 1)
                            TextButton.icon(
                              key: const Key(
                                'toggle-all-milestones-collapse-btn',
                              ),
                              style: TextButton.styleFrom(
                                visualDensity: VisualDensity.compact,
                              ),
                              onPressed: () {
                                setState(() {
                                  _expandAllMilestones = !_expandAllMilestones;
                                  _manuallyToggledMilestones.clear();
                                });
                              },
                              icon: Icon(
                                _expandAllMilestones
                                    ? CupertinoIcons.chevron_up_circle
                                    : CupertinoIcons.chevron_down_circle,
                                size: 13,
                              ),
                              label: Text(
                                _expandAllMilestones
                                    ? 'Thu gọn tất cả'
                                    : 'Mở rộng chi tiết',
                                style: const TextStyle(fontSize: 11.5),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      for (var idx = 0; idx < _milestones.length; idx++)
                        _buildMilestoneCard(
                          _milestones[idx],
                          idx + 1,
                          isNegotiating,
                        ),

                      // Đánh giá tổng kết Hợp đồng khi COMPLETED
                      if (status == 'COMPLETED') ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5E9),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFF2E7D32)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(
                                    CupertinoIcons.checkmark_seal_fill,
                                    color: Color(0xFF2E7D32),
                                  ),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Hợp đồng đã hoàn thành toàn bộ các giai đoạn!',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF1B5E20),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (_contractReviews.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                for (final r in _contractReviews)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 4),
                                    child: Text(
                                      '★ ${r.rating}/5 · ${r.reviewerFullName ?? "Đối tác"}: "${r.comment ?? ""}"',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ),
                              ],
                              const SizedBox(height: 10),
                              FilledButton.icon(
                                key: const Key('review-completed-contract-btn'),
                                style: FilledButton.styleFrom(
                                  backgroundColor: const Color(0xFF2E7D32),
                                ),
                                onPressed: _busy ? null : () => _promptReview(),
                                icon: const Icon(
                                  CupertinoIcons.star_fill,
                                  size: 15,
                                ),
                                label:
                                    const Text('Đánh giá tổng kết Hợp đồng'),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: const TextStyle(color: Palette.red, fontSize: 12.5),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _metricItem(String label, String value, Color valueColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Palette.muted),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.w800,
            color: valueColor,
            fontFeatures: const [ui.FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }

  String _escrowStatusLabel(String rawEscrow, String mStatus) {
    final e = rawEscrow.toUpperCase();
    if (e == 'HELD') return 'Đang giữ Ký quỹ';
    if (e == 'FROZEN') return 'Đóng băng tranh chấp';
    if (e == 'RELEASED') return 'Đã giải ngân';
    if (e == 'REFUNDED') return 'Đã hoàn tiền';
    if (e == 'UNFUNDED' || e == 'NONE' || e.isEmpty) {
      if (mStatus == 'IN_PROGRESS' || mStatus == 'SUBMITTED' || mStatus == 'APPROVED') {
        return 'Đang giữ Ký quỹ';
      }
      if (mStatus == 'RELEASED') return 'Đã giải ngân';
      return 'Chưa nạp cọc';
    }
    return e;
  }

  Color _escrowStatusColor(String rawEscrow, String mStatus) {
    final e = rawEscrow.toUpperCase();
    if (e == 'HELD') return const Color(0xFFD97706);
    if (e == 'FROZEN') return Palette.red;
    if (e == 'RELEASED') return const Color(0xFF2E7D32);
    if (e == 'REFUNDED') return const Color(0xFF1976D2);
    if (mStatus == 'IN_PROGRESS' || mStatus == 'SUBMITTED' || mStatus == 'APPROVED') {
      return const Color(0xFFD97706);
    }
    if (mStatus == 'RELEASED') return const Color(0xFF2E7D32);
    return Palette.muted;
  }

  Widget _buildMilestoneCard(
    MilestoneModel m,
    int fallbackOrder,
    bool isNegotiating,
  ) {
    final orderNo = m.orderNo ?? fallbackOrder;
    final mStatus = m.status.toUpperCase();
    final rawEscrow = (m.escrowStatus ?? '').toUpperCase();
    final effectiveEscrow = rawEscrow.isNotEmpty
        ? rawEscrow
        : (mStatus == 'IN_PROGRESS' ||
                mStatus == 'SUBMITTED' ||
                mStatus == 'APPROVED'
            ? 'HELD'
            : (mStatus == 'RELEASED' ? 'RELEASED' : 'UNFUNDED'));
    final hasOpenDispute = _disputes.any(
      (d) => d.milestoneId == m.id && d.status.toUpperCase() == 'OPEN',
    );
    final canOpenDispute = !hasOpenDispute &&
        (mStatus == 'IN_PROGRESS' ||
            mStatus == 'SUBMITTED' ||
            mStatus == 'APPROVED');
    final deliverables = _deliverablesByMilestone[m.id] ?? m.deliverables;
    final revisions = m.revisionRequests;
    final canRequestMoreRevisions =
        (m.revisionsUsed ?? 0) < (m.maxRevisions ?? 2);
    final isExpanded = _isMilestoneExpanded(m, isNegotiating);

    // Smart Collapse: nếu thu gọn thì hiển thị 1 dòng gọn gàng (Section 6.4.4)
    if (!isExpanded) {
      return Container(
        key: Key('milestone-card-${m.id}'),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: Palette.soft,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Palette.line),
        ),
        child: InkWell(
          key: Key('toggle-milestone-collapse-${m.id}'),
          borderRadius: BorderRadius.circular(10),
          onTap: () {
            setState(() {
              if (_manuallyToggledMilestones.contains(m.id)) {
                _manuallyToggledMilestones.remove(m.id);
              } else {
                _manuallyToggledMilestones.add(m.id);
              }
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Palette.ink,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'MỐC #$orderNo',
                    style: const TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      color: Palette.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    m.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Palette.ink,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  formatVndAmount(m.amount),
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: Palette.ink,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: milestoneStatusColor(mStatus).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    mStatus == 'WAITING'
                        ? 'Đang chờ'
                        : (mStatus == 'APPROVED' || mStatus == 'RELEASED')
                            ? 'Hoàn tất'
                            : mStatus,
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w800,
                      color: milestoneStatusColor(mStatus),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                const Icon(
                  CupertinoIcons.chevron_down,
                  size: 13,
                  color: Palette.muted,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      key: Key('milestone-card-${m.id}'),
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: mStatus == 'UNFUNDED' ||
                  mStatus == 'IN_PROGRESS' ||
                  mStatus == 'SUBMITTED'
              ? milestoneStatusColor(mStatus)
              : Palette.line,
          width: mStatus == 'UNFUNDED' ||
                  mStatus == 'IN_PROGRESS' ||
                  mStatus == 'SUBMITTED'
              ? 1.4
              : 1.0,
        ),
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
              Wrap(
                spacing: 6,
                runSpacing: 4,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: Palette.ink,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'MỐC #$orderNo',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Palette.white,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color:
                          milestoneStatusColor(mStatus).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      milestoneStatusLabel(
                        mStatus,
                        contractStatus: _contract?.status,
                        orderNo: orderNo,
                      ),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: milestoneStatusColor(mStatus),
                      ),
                    ),
                  ),
                  Container(
                    key: Key('milestone-escrow-badge-${m.id}'),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: _escrowStatusColor(rawEscrow, mStatus)
                          .withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: _escrowStatusColor(rawEscrow, mStatus)
                            .withValues(alpha: 0.35),
                      ),
                    ),
                    child: Text(
                      'Ký quỹ: ${_escrowStatusLabel(rawEscrow, mStatus)}',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: _escrowStatusColor(rawEscrow, mStatus),
                      ),
                    ),
                  ),
                ],
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    formatVndAmount(m.amount),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Palette.ink,
                      fontFeatures: [ui.FontFeature.tabularFigures()],
                    ),
                  ),
                  if (_milestones.length > 1) ...[
                    const SizedBox(width: 6),
                    InkWell(
                      key: Key('toggle-milestone-collapse-${m.id}'),
                      borderRadius: BorderRadius.circular(4),
                      onTap: () {
                        setState(() {
                          if (_manuallyToggledMilestones.contains(m.id)) {
                            _manuallyToggledMilestones.remove(m.id);
                          } else {
                            _manuallyToggledMilestones.add(m.id);
                          }
                        });
                      },
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(
                          CupertinoIcons.chevron_up,
                          size: 13,
                          color: Palette.muted,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            m.title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
          if (m.requirement != null && m.requirement!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Cam kết bàn giao: ${m.requirement}',
              style: const TextStyle(
                fontSize: 12.5,
                color: Palette.muted,
                height: 1.4,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Wrap(
            spacing: 14,
            runSpacing: 4,
            children: [
              Text(
                'Thời gian thực hiện: ${m.durationDays ?? 3} ngày',
                style: const TextStyle(fontSize: 11.5, color: Palette.muted),
              ),
              Text(
                'Thực nhận Creator (95%): ${formatVndAmount(m.netAmount ?? (m.amount * 0.95))}',
                style: const TextStyle(
                  fontSize: 11.5,
                  color: Color(0xFF2E7D32),
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                'Lượt sửa: ${m.revisionsUsed ?? 0}/${m.maxRevisions ?? 2}',
                style: const TextStyle(fontSize: 11.5, color: Palette.muted),
              ),
              if (m.fundDueAt != null && m.fundDueAt!.isNotEmpty)
                Text(
                  'Hạn đóng cọc (48h): ${m.fundDueAt!.split("T").first}',
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFFD97706),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              if (m.dueAt != null && m.dueAt!.isNotEmpty)
                Text(
                  'Hạn bàn giao: ${m.dueAt!.split("T").first}',
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Palette.red,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              if (m.reviewDueAt != null && m.reviewDueAt!.isNotEmpty)
                Text(
                  'Hạn nghiệm thu (72h): ${m.reviewDueAt!.split("T").first}',
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF7C3AED),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              if (m.releaseAt != null && m.releaseAt!.isNotEmpty)
                Text(
                  'Giải ngân đối soát: ${m.releaseAt!.split("T").first}',
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF2E7D32),
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),

          // Danh sách sản phẩm bàn giao (Deliverables v1, v2...)
          if (deliverables.isNotEmpty) ...[
            const Divider(height: 18),
            const Text(
              'Sản phẩm bàn giao đã tải lên:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            for (final d in deliverables)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.line),
                ),
                child: Row(
                  children: [
                    const Icon(
                      CupertinoIcons.doc_on_doc_fill,
                      size: 16,
                      color: Palette.red,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'v${d.versionNo ?? 1} · ${d.fileName}',
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (d.description != null && d.description!.isNotEmpty)
                            Text(
                              d.description!,
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: Palette.muted,
                              ),
                            ),
                        ],
                      ),
                    ),
                    TextButton.icon(
                      key: Key('preview-deliverable-btn-${d.id}'),
                      onPressed: _busy
                          ? null
                          : () => _previewOrDownloadDeliverable(
                                d,
                                download: false,
                              ),
                      icon: const Icon(CupertinoIcons.eye_fill, size: 13),
                      label: const Text('Xem', style: TextStyle(fontSize: 11.5)),
                    ),
                    TextButton.icon(
                      key: Key('download-deliverable-btn-${d.id}'),
                      onPressed: _busy
                          ? null
                          : () => _previewOrDownloadDeliverable(
                                d,
                                download: true,
                              ),
                      icon: const Icon(
                        CupertinoIcons.arrow_down_circle_fill,
                        size: 13,
                      ),
                      label: const Text(
                        'Tải về',
                        style: TextStyle(fontSize: 11.5),
                      ),
                    ),
                  ],
                ),
              ),
          ],

          // Lịch sử yêu cầu chỉnh sửa (Revision Requests)
          if (revisions.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8E7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Lịch sử yêu cầu chỉnh sửa:',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF78350F),
                    ),
                  ),
                  const SizedBox(height: 4),
                  for (var rIdx = 0; rIdx < revisions.length; rIdx++)
                    Text(
                      '• Lần #${rIdx + 1}: ${revisions[rIdx].note}',
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: Color(0xFF78350F),
                      ),
                    ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 10),

          // THAO TÁC Ở TẦNG 1: Sửa / Xóa mốc lẻ cho Creator (Chỉ khi isNegotiating == true)
          if (isNegotiating && _isCreator)
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                OutlinedButton.icon(
                  key: Key('edit-milestone-btn-${m.id}'),
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: _busy ? null : () => _promptEditSingleMilestone(m),
                  icon: const Icon(CupertinoIcons.pencil, size: 13),
                  label: const Text(
                    'Sửa mốc này',
                    style: TextStyle(fontSize: 11.5),
                  ),
                ),
                if (_milestones.length >= 2)
                  OutlinedButton.icon(
                    key: Key('delete-milestone-btn-${m.id}'),
                    style: OutlinedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      foregroundColor: Palette.red,
                      side: const BorderSide(color: Palette.red),
                    ),
                    onPressed: _busy
                        ? null
                        : () => _runAction(
                              () => _milestoneRepo!.deleteMilestone(m.id),
                              successMessage:
                                  'Đã xóa Giai đoạn #$orderNo và đánh số lại lộ trình!',
                            ),
                    icon: const Icon(CupertinoIcons.trash, size: 13),
                    label: const Text(
                      'Xóa / Gộp mốc',
                      style: TextStyle(fontSize: 11.5),
                    ),
                  ),
              ],
            ),

          // THAO TÁC Ở TẦNG 2 THEO TỪNG TRẠNG THÁI CUỐN CHIẾU
          if (!isNegotiating) ...[
            // 1. WAITING
            if (mStatus == 'WAITING')
              const Text(
                'Giai đoạn này sẽ tự động mở khóa sang UNFUNDED ngay sau khi giai đoạn trước được Khách duyệt nghiệm thu.',
                style: TextStyle(fontSize: 11.5, color: Palette.muted),
              ),

            // 2. UNFUNDED -> Khách đóng cọc (Fund)
            if (mStatus == 'UNFUNDED') ...[
              if (_isRequester)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.icon(
                      key: Key('fund-milestone-btn-${m.id}'),
                      style: FilledButton.styleFrom(
                        backgroundColor: Palette.red,
                      ),
                      onPressed: _busy
                          ? null
                          : () => _runAction(
                                () => _milestoneRepo!.fundMilestone(m.id),
                                successMessage:
                                    'Đã nạp ${formatVndAmount(m.amount)} vào Ký quỹ (Escrow) cho Giai đoạn #$orderNo! Creator đã có thể bắt đầu làm việc.',
                              ),
                      icon: const Icon(
                        CupertinoIcons.lock_shield_fill,
                        size: 15,
                      ),
                      label: Text(
                        'Nạp tiền ký quỹ giai đoạn #$orderNo (${formatVndAmount(m.amount)})',
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) => WalletPage(
                              preferences: widget.state.preferences,
                              walletRepository: widget.state.walletRepository,
                              withdrawalRepository:
                                  widget.state.withdrawalRepository,
                              contractRepository:
                                  widget.state.contractRepository,
                              kycRepository: widget.state.kycRepository,
                            ),
                          ),
                        ).then((_) => _refreshDetail());
                      },
                      icon: const Icon(
                        CupertinoIcons.creditcard_fill,
                        size: 14,
                      ),
                      label: const Text('Nạp thêm tiền vào Ví (VNPay)'),
                    ),
                  ],
                )
              else
                const Text(
                  'Đang chờ Khách hàng nạp tiền ký quỹ (Escrow) cho giai đoạn này trước khi bạn bắt đầu sản xuất.',
                  style: TextStyle(fontSize: 12, color: Color(0xFFD97706)),
                ),
            ],

            // 3. IN_PROGRESS -> Creator nộp file (tự động lên SUBMITTED), Khách có thể hủy nếu trễ hạn, cả 2 bên có thể Mở khiếu nại (Mục 9)
            if (mStatus == 'IN_PROGRESS') ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (_isCreator)
                    FilledButton.icon(
                      key: Key('upload-deliverable-btn-${m.id}'),
                      style: FilledButton.styleFrom(
                        backgroundColor: Palette.red,
                      ),
                      onPressed: _busy ? null : () => _uploadDeliverableFile(m),
                      icon: const Icon(
                        CupertinoIcons.cloud_upload_fill,
                        size: 15,
                      ),
                      label: const Text(
                        'Nộp sản phẩm bàn giao (Tải File lên)',
                      ),
                    ),
                  if (_isRequester)
                    OutlinedButton.icon(
                      key: Key('cancel-overdue-milestone-btn-${m.id}'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Palette.red,
                        side: const BorderSide(color: Palette.red),
                      ),
                      onPressed: _busy
                          ? null
                          : () => _runAction(
                                () =>
                                    _milestoneRepo!.cancelOverdueMilestone(m.id),
                                successMessage:
                                    'Đã hủy giai đoạn trễ hạn và hoàn 100% tiền ký quỹ về Ví của bạn!',
                              ),
                      icon: const Icon(
                        CupertinoIcons.clock_fill,
                        size: 14,
                      ),
                      label: const Text(
                        'Hủy giai đoạn trễ hạn (Hoàn 100%)',
                      ),
                    ),
                  if (canOpenDispute)
                    OutlinedButton.icon(
                      key: Key('open-dispute-milestone-btn-${m.id}'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Palette.red,
                        side: const BorderSide(color: Palette.red),
                      ),
                      onPressed: _busy ? null : () => _promptOpenDispute(m),
                      icon: const Icon(
                        CupertinoIcons.exclamationmark_shield_fill,
                        size: 14,
                      ),
                      label: const Text('Mở khiếu nại'),
                    ),
                ],
              ),
            ],

            // 4. SUBMITTED -> Khách nghiệm thu (Approve / Request Revision / Open Dispute), Creator nộp bổ sung / Mở khiếu nại (Mục 9)
            if (mStatus == 'SUBMITTED') ...[
              if (_isRequester)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.icon(
                      key: Key('approve-milestone-btn-${m.id}'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF2E7D32),
                      ),
                      onPressed: _busy
                          ? null
                          : () => _runAction(
                                () => _milestoneRepo!.approveMilestone(m.id),
                                successMessage:
                                    'Đã duyệt nghiệm thu Giai đoạn #$orderNo! Hệ thống tự động mở khóa giai đoạn tiếp theo.',
                              ),
                      icon: const Icon(
                        CupertinoIcons.checkmark_circle_fill,
                        size: 15,
                      ),
                      label: Text('Duyệt nghiệm thu #$orderNo'),
                    ),
                    if (canRequestMoreRevisions)
                      OutlinedButton.icon(
                        key: Key('request-revision-btn-${m.id}'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFD97706),
                          side: const BorderSide(color: Color(0xFFD97706)),
                        ),
                        onPressed:
                            _busy ? null : () => _promptRequestRevision(m),
                        icon: const Icon(
                          CupertinoIcons.arrow_2_circlepath,
                          size: 14,
                        ),
                        label: Text(
                          'Yêu cầu chỉnh sửa (${m.revisionsUsed ?? 0}/${m.maxRevisions ?? 2})',
                        ),
                      ),
                    if (canOpenDispute)
                      OutlinedButton.icon(
                        key: Key('open-dispute-milestone-btn-${m.id}'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Palette.red,
                          side: const BorderSide(color: Palette.red),
                        ),
                        onPressed: _busy ? null : () => _promptOpenDispute(m),
                        icon: const Icon(
                          CupertinoIcons.exclamationmark_shield_fill,
                          size: 14,
                        ),
                        label: const Text('Mở khiếu nại'),
                      ),
                  ],
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    const Text(
                      'Đã nộp sản phẩm! Khách hàng có 72 giờ để nghiệm thu (quá 72 giờ tự động APPROVED).',
                      style: TextStyle(fontSize: 12, color: Color(0xFF7C3AED)),
                    ),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: _busy ? null : () => _uploadDeliverableFile(m),
                      icon: const Icon(CupertinoIcons.cloud_upload, size: 14),
                      label: const Text('Nộp bổ sung bản mới'),
                    ),
                    if (canOpenDispute)
                      OutlinedButton.icon(
                        key: Key('open-dispute-milestone-btn-${m.id}'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Palette.red,
                          side: const BorderSide(color: Palette.red),
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: _busy ? null : () => _promptOpenDispute(m),
                        icon: const Icon(
                          CupertinoIcons.exclamationmark_shield_fill,
                          size: 14,
                        ),
                        label: const Text('Mở khiếu nại'),
                      ),
                  ],
                ),
            ],

            // 5. APPROVED / RELEASED -> Đối soát 3 ngày, Giải ngân ngay (Mục 15), Mở khiếu nại (Mục 9) & Đánh giá giai đoạn
            if (mStatus == 'APPROVED' || mStatus == 'RELEASED') ...[
              Text(
                mStatus == 'RELEASED'
                    ? 'Đã giải ngân 95% (${formatVndAmount(m.netAmount ?? (m.amount * 0.95))}) vào số dư khả dụng của Creator.'
                    : 'Đã nghiệm thu! Khoản thực nhận 95% (${formatVndAmount(m.netAmount ?? (m.amount * 0.95))}) đang giữ đối soát 3 ngày trước khi tự động cộng vào Ví khả dụng.',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF2E7D32),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (_isRequester &&
                      mStatus == 'APPROVED' &&
                      effectiveEscrow == 'HELD')
                    FilledButton.icon(
                      key: Key('release-early-milestone-btn-${m.id}'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF2E7D32),
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed:
                          _busy ? null : () => _promptReleaseEarlyMilestone(m),
                      icon: const Icon(
                        CupertinoIcons.checkmark_shield_fill,
                        size: 14,
                      ),
                      label: const Text('Giải ngân ngay'),
                    ),
                  if (canOpenDispute)
                    OutlinedButton.icon(
                      key: Key('open-dispute-milestone-btn-${m.id}'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Palette.red,
                        side: const BorderSide(color: Palette.red),
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: _busy ? null : () => _promptOpenDispute(m),
                      icon: const Icon(
                        CupertinoIcons.exclamationmark_shield_fill,
                        size: 14,
                      ),
                      label: const Text('Mở khiếu nại'),
                    ),
                  TextButton.icon(
                    onPressed: _busy ? null : () => _promptReview(milestone: m),
                    icon: const Icon(
                      CupertinoIcons.star_fill,
                      size: 14,
                      color: Color(0xFFD97706),
                    ),
                    label: const Text(
                      'Đánh giá mốc này',
                      style: TextStyle(fontSize: 12),
                    ),
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

/// Khu vực Quản lý Đơn Đặt làm Nội dung (Khách đã gửi & Kênh nhận được)
class CommissionManagementSection extends StatefulWidget {
  const CommissionManagementSection({
    super.key,
    required this.state,
    required this.sentCommissions,
    required this.receivedCommissions,
    this.contracts = const [],
    required this.loading,
    required this.onRefresh,
    this.onSwitchToContractsTab,
  });

  final AppState state;
  final List<HireRequestModel> sentCommissions;
  final List<HireRequestModel> receivedCommissions;
  final List<ContractModel> contracts;
  final bool loading;
  final Future<void> Function() onRefresh;
  final VoidCallback? onSwitchToContractsTab;

  @override
  State<CommissionManagementSection> createState() =>
      _CommissionManagementSectionState();
}

class _CommissionManagementSectionState
    extends State<CommissionManagementSection> {
  int _subTab = 0; // 0: Đơn tôi đã đặt (Khách), 1: Đơn kênh nhận được (Creator)
  bool _busy = false;
  String _searchQuery = '';
  String _statusFilter = 'ALL';
  String _sortBy = 'NEWEST';

  HireRequestRepository? get _repo =>
      widget.state.hireRequestRepository ??
      widget.state.creatorState.hireRequestRepository;

  @override
  void initState() {
    super.initState();
    if (widget.sentCommissions.isEmpty &&
        widget.receivedCommissions.isNotEmpty) {
      _subTab = 1;
    }
  }

  ContractModel? _findLinkedContract(HireRequestModel item) {
    for (final c in widget.contracts) {
      if ((item.contractId != null && c.id == item.contractId) ||
          c.hireRequestId == item.id) {
        return c;
      }
    }
    return null;
  }

  void _openChatForCommission(
    HireRequestModel item, {
    required bool asCreator,
  }) {
    final linked = _findLinkedContract(item);
    final effectiveContractId = item.contractId ?? linked?.id;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (_) => CreatorFreelancerChatSheet(
        chatRepository: widget.state.chatRepository ??
            widget.state.creatorState.chatRepository,
        contractRepository: widget.state.contractRepository ??
            widget.state.creatorState.contractRepository,
        hireRequestId: item.id,
        contractId: effectiveContractId,
        topicTitle: item.title,
        channelName: item.channelName,
        partnerName: asCreator
            ? item.effectiveRequesterName
            : (item.creatorFullName ??
                item.channelName ??
                'Creator #${item.creatorId}'),
        senderRole: asCreator ? 'CREATOR' : 'CUSTOMER',
        senderName: widget.state.displayName,
        preferences: widget.state.preferences,
        onOpenContractRoadmap: (cid) => _openContractRoadmap(cid),
      ),
    );
  }

  void _openContractRoadmap(int contractId) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (_) => ContractMilestoneRoadmapSheet(
        state: widget.state,
        contractId: contractId,
        onChanged: widget.onRefresh,
      ),
    );
  }

  Future<void> _acceptCommission(HireRequestModel item) async {
    if (_repo == null) return;
    setState(() => _busy = true);
    try {
      await _repo!.acceptCommission(item.id);
      await widget.onRefresh();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Đã chấp nhận đơn "${item.title ?? "#${item.id}"}". Hãy lập Lộ trình Milestone để gửi Khách hàng duyệt.',
          ),
        ),
      );
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        backgroundColor: Palette.paper,
        builder: (_) => CreateOrEditMilestoneRoadmapSheet(
          state: widget.state,
          commission: item,
          onSaved: widget.onRefresh,
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi chấp nhận đơn: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _rejectCommission(HireRequestModel item) async {
    if (_repo == null) return;
    final reasonCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Từ chối đơn đặt làm nội dung'),
        content: TextField(
          key: const Key('reject-commission-reason-input'),
          controller: reasonCtrl,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Lý do từ chối (reason) *',
            hintText:
                'VD: Hiện lịch sản xuất của kênh trong tháng này đã kín, hẹn bạn dịp tới...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Palette.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xác nhận từ chối'),
          ),
        ],
      ),
    );
    final reason = reasonCtrl.text.trim();
    reasonCtrl.dispose();
    if (confirmed != true || reason.isEmpty) return;

    setState(() => _busy = true);
    try {
      await _repo!.rejectCommission(item.id, reason: reason);
      await widget.onRefresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã từ chối đơn đặt nội dung.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi từ chối đơn: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancelCommission(HireRequestModel item) async {
    if (_repo == null) return;
    setState(() => _busy = true);
    try {
      await _repo!.cancelCommission(item.id);
      await widget.onRefresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã hủy yêu cầu đặt làm nội dung.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi hủy đơn: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _effectiveCommissionStatus(HireRequestModel item) {
    final linkedContract = _findLinkedContract(item);
    final effectiveContractId = item.contractId ?? linkedContract?.id;
    final rawStatus = item.status.toUpperCase();
    return (effectiveContractId != null && rawStatus == 'ACCEPTED')
        ? 'CONTRACT_SENT'
        : rawStatus;
  }

  @override
  Widget build(BuildContext context) {
    final rawItems = _subTab == 0
        ? widget.sentCommissions
        : widget.receivedCommissions;

    final pendingCount = rawItems
        .where((i) => _effectiveCommissionStatus(i) == 'PENDING')
        .length;
    final acceptedCount = rawItems
        .where((i) => _effectiveCommissionStatus(i) == 'ACCEPTED')
        .length;
    final contractSentCount = rawItems
        .where((i) => _effectiveCommissionStatus(i) == 'CONTRACT_SENT')
        .length;

    final query = _searchQuery.trim().toLowerCase();
    final items = rawItems.where((i) {
      final st = _effectiveCommissionStatus(i);
      if (_statusFilter != 'ALL') {
        if (_statusFilter == 'REJECTED_CANCELLED') {
          if (st != 'REJECTED' && st != 'CANCELLED') return false;
        } else if (st != _statusFilter) {
          return false;
        }
      }
      if (query.isNotEmpty) {
        final hay =
            '${i.id} ${i.title ?? ""} ${i.description ?? ""} ${i.channelName ?? ""} ${i.effectiveRequesterName} ${i.creatorFullName ?? ""}'
                .toLowerCase();
        if (!hay.contains(query)) return false;
      }
      return true;
    }).toList();

    items.sort((a, b) {
      if (_sortBy == 'OLDEST') return a.id.compareTo(b.id);
      if (_sortBy == 'TITLE_AZ') {
        return (a.title ?? '').toLowerCase().compareTo(
              (b.title ?? '').toLowerCase(),
            );
      }
      return b.id.compareTo(a.id);
    });

    final pendingContractsForViewer = widget.contracts
        .where((c) => c.status.toUpperCase() == 'PENDING')
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_subTab == 0 && pendingContractsForViewer.isNotEmpty) ...[
          for (final pc in pendingContractsForViewer)
            Container(
              key: Key('viewer-pending-contract-callout-${pc.id}'),
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF7C3AED).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: const Color(0xFF7C3AED),
                  width: 1.4,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        CupertinoIcons.bell_solid,
                        size: 16,
                        color: Color(0xFF7C3AED),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Hợp đồng & Lộ trình Milestone (#${pc.id}) đang chờ bạn duyệt (Tầng 1)!',
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF5B21B6),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${pc.title} · Tổng giá trị: ${formatVndAmount(pc.totalAmount)} (${pc.milestones.length} giai đoạn). Khi chấp thuận lộ trình tổng, bạn chưa bị trừ tiền ngay mà sẽ đóng cọc cuốn chiếu từng giai đoạn.',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Palette.ink,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton.icon(
                        key: Key('callout-open-contract-btn-${pc.id}'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF7C3AED),
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: () => _openContractRoadmap(pc.id),
                        icon: const Icon(
                          CupertinoIcons.checkmark_seal_fill,
                          size: 14,
                        ),
                        label: Text(
                          'Xem & Duyệt Hợp đồng (#${pc.id}) ngay',
                        ),
                      ),
                      if (widget.onSwitchToContractsTab != null)
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF7C3AED),
                            side: const BorderSide(color: Color(0xFF7C3AED)),
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: widget.onSwitchToContractsTab,
                          icon: const Icon(
                            CupertinoIcons.layers_alt_fill,
                            size: 13,
                          ),
                          label: Text(
                            'Mở tab Hợp đồng (${widget.contracts.length})',
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
        ],
        Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: Palette.soft,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Palette.line),
          ),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  key: const Key('subtab-my-sent-commissions'),
                  borderRadius: BorderRadius.circular(6),
                  onTap: () {
                    setState(() => _subTab = 0);
                    widget.onRefresh();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 7,
                    ),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: _subTab == 0
                          ? Palette.white
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                      border: _subTab == 0
                          ? Border.all(color: Palette.line)
                          : null,
                    ),
                    child: Text(
                      'Tôi đã đặt (${widget.sentCommissions.length})',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: _subTab == 0
                            ? FontWeight.w800
                            : FontWeight.w600,
                        color: _subTab == 0 ? Palette.red : Palette.muted,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: InkWell(
                  key: const Key('subtab-my-received-commissions'),
                  borderRadius: BorderRadius.circular(6),
                  onTap: () {
                    setState(() => _subTab = 1);
                    widget.onRefresh();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 7,
                    ),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: _subTab == 1
                          ? Palette.white
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                      border: _subTab == 1
                          ? Border.all(color: Palette.line)
                          : null,
                    ),
                    child: Text(
                      'Kênh nhận được (${widget.receivedCommissions.length})',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: _subTab == 1
                            ? FontWeight.w800
                            : FontWeight.w600,
                        color: _subTab == 1 ? Palette.red : Palette.muted,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        // Thanh thống kê nhanh trạng thái đơn (Mục 14)
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: [
            _summaryCountChip(
              'Chờ duyệt: $pendingCount',
              const Color(0xFFD97706),
            ),
            _summaryCountChip(
              'Đang thảo luận: $acceptedCount',
              const Color(0xFF1976D2),
            ),
            _summaryCountChip(
              'Đã gửi hợp đồng: $contractSentCount',
              const Color(0xFF7C3AED),
            ),
          ],
        ),
        const SizedBox(height: 10),
        // Thanh tìm kiếm + lọc + sắp xếp (Mục 11)
        Row(
          children: [
            Expanded(
              child: TextField(
                key: const Key('commission-search-input'),
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Tìm tiêu đề, kênh, đối tác hoặc mã #ID...',
                  hintStyle: const TextStyle(fontSize: 12, color: Palette.muted),
                  prefixIcon: const Icon(
                    CupertinoIcons.search,
                    size: 15,
                    color: Palette.muted,
                  ),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 9,
                  ),
                  filled: true,
                  fillColor: Palette.soft,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Palette.line),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Palette.line),
                  ),
                ),
                style: const TextStyle(fontSize: 12.5),
              ),
            ),
            const SizedBox(width: 8),
            DropdownButtonHideUnderline(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.line),
                ),
                child: DropdownButton<String>(
                  key: const Key('commission-sort-dropdown'),
                  value: _sortBy,
                  isDense: true,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: Palette.ink,
                  ),
                  items: const [
                    DropdownMenuItem(value: 'NEWEST', child: Text('Mới nhất')),
                    DropdownMenuItem(value: 'OLDEST', child: Text('Cũ nhất')),
                    DropdownMenuItem(
                      value: 'TITLE_AZ',
                      child: Text('Tiêu đề A-Z'),
                    ),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _sortBy = val);
                  },
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final entry in const [
                ('ALL', 'Tất cả'),
                ('PENDING', 'Chờ duyệt'),
                ('ACCEPTED', 'Đã chấp nhận'),
                ('CONTRACT_SENT', 'Đã gửi hợp đồng'),
                ('COMPLETED', 'Đã hoàn tất'),
                ('REJECTED_CANCELLED', 'Đã từ chối/Đã hủy'),
              ]) ...[
                ChoiceChip(
                  key: Key('commission-filter-${entry.$1}'),
                  label: Text(entry.$2, style: const TextStyle(fontSize: 11.5)),
                  selected: _statusFilter == entry.$1,
                  selectedColor: Palette.red.withValues(alpha: 0.14),
                  visualDensity: VisualDensity.compact,
                  onSelected: (_) =>
                      setState(() => _statusFilter = entry.$1),
                ),
                const SizedBox(width: 6),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (widget.loading)
          const Padding(
            padding: EdgeInsets.all(32.0),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (items.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 34),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Palette.line),
            ),
            child: Column(
              children: [
                const Icon(
                  CupertinoIcons.doc_text,
                  size: 38,
                  color: Palette.muted,
                ),
                const SizedBox(height: 12),
                Text(
                  rawItems.isEmpty
                      ? (_subTab == 0
                          ? 'Bạn chưa đặt làm nội dung nào'
                          : 'Kênh chưa nhận đơn đặt nội dung nào')
                      : 'Không có đơn phù hợp với bộ lọc',
                  style: editorial(18),
                ),
                const SizedBox(height: 6),
                Text(
                  _subTab == 0
                      ? 'Bạn có thể truy cập bất kỳ Kênh kể chuyện nào hoặc bấm nút "Đặt làm nội dung" để gửi đề tài mong muốn cho Creator.'
                      : 'Khi người nghe gửi yêu cầu đặt làm Video / Podcast lẻ hoặc Series nhiều tập tại kênh của bạn, đơn sẽ xuất hiện tại đây.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: Palette.muted,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          )
        else
          for (final item in items)
            _buildCommissionCard(item, isCreatorView: _subTab == 1),
      ],
    );
  }

  Widget _summaryCountChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }

  Widget _buildCommissionCard(
    HireRequestModel item, {
    required bool isCreatorView,
  }) {
    final linkedContract = _findLinkedContract(item);
    final effectiveContractId = item.contractId ?? linkedContract?.id;
    final effectiveContractStatus =
        (item.contractStatus ?? linkedContract?.status ?? 'PENDING')
            .toUpperCase();
    final rawStatus = item.status.toUpperCase();
    final status =
        (effectiveContractId != null && rawStatus == 'ACCEPTED')
            ? 'CONTRACT_SENT'
            : rawStatus;
    final cType = (item.contentType ?? 'SINGLE_VIDEO').toUpperCase();
    final isSeries = cType == 'SERIES';

    return Container(
      key: Key('commission-card-${item.id}'),
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: effectiveContractId != null &&
                  effectiveContractStatus == 'PENDING'
              ? const Color(0xFF7C3AED)
              : Palette.line,
          width: effectiveContractId != null &&
                  effectiveContractStatus == 'PENDING'
              ? 1.4
              : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 6,
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
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
                      color: Palette.red.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isSeries ? 'SERIES NHIỀU TẬP' : 'VIDEO / PODCAST LẺ',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Palette.red,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color:
                          commissionStatusColor(status).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      commissionStatusLabel(status),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: commissionStatusColor(status),
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                'Đơn #${item.id}',
                style: const TextStyle(fontSize: 11.5, color: Palette.muted),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(item.title ?? 'Đề tài đặt làm nội dung', style: editorial(17)),
          const SizedBox(height: 6),
          Text(
            item.description ?? '',
            style: const TextStyle(
              fontSize: 12.5,
              color: Palette.muted,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 14,
            runSpacing: 4,
            children: [
              if (item.channelName != null && item.channelName!.isNotEmpty)
                Text(
                  'Kênh: ${item.channelName}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              Text(
                isCreatorView
                    ? 'Khách đặt: ${item.effectiveRequesterName}'
                    : 'Creator: ${item.creatorFullName ?? "Chủ kênh #${item.creatorId}"}',
                style: const TextStyle(fontSize: 12, color: Palette.muted),
              ),
            ],
          ),
          if (effectiveContractId != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: contractStatusColor(effectiveContractStatus)
                    .withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: contractStatusColor(effectiveContractStatus)
                      .withValues(alpha: 0.35),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    CupertinoIcons.doc_text_fill,
                    size: 15,
                    color: contractStatusColor(effectiveContractStatus),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      !isCreatorView && effectiveContractStatus == 'PENDING'
                          ? 'Hợp đồng #$effectiveContractId · Creator đã gửi Lộ trình Milestone! Hãy bấm nút bên dưới để xem chi tiết & Chấp thuận lộ trình (Tầng 1).'
                          : 'Hợp đồng #$effectiveContractId · ${contractStatusLabel(effectiveContractStatus)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: contractStatusColor(effectiveContractStatus),
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (status == 'REJECTED' &&
              item.rejectionReason != null &&
              item.rejectionReason!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Palette.red.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Lý do từ chối: ${item.rejectionReason}',
                style: const TextStyle(fontSize: 12, color: Palette.red),
              ),
            ),
          ],
          const SizedBox(height: 12),

          // Các nút hành động theo đúng vai trò & trạng thái
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              // 1. Góc nhìn Khách đặt (Sent)
              if (!isCreatorView && status == 'PENDING') ...[
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: _busy
                      ? null
                      : () {
                          showModalBottomSheet<void>(
                            context: context,
                            isScrollControlled: true,
                            useSafeArea: true,
                            backgroundColor: Palette.paper,
                            builder: (_) => CustomCommissionRequestSheet(
                              state: widget.state,
                              channelId: item.channelId ?? 1,
                              creatorId: item.creatorId,
                              channelName:
                                  item.channelName ?? 'Kênh kể chuyện',
                              commissionId: item.id,
                              initialContentType:
                                  item.contentType ?? 'SINGLE_VIDEO',
                              initialTitle: item.title ?? '',
                              initialDescription: item.description ?? '',
                              onSubmitted: widget.onRefresh,
                            ),
                          );
                        },
                  icon: const Icon(CupertinoIcons.pencil, size: 13),
                  label: const Text('Chỉnh sửa yêu cầu'),
                ),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    foregroundColor: Palette.red,
                    side: const BorderSide(color: Palette.red),
                  ),
                  onPressed: _busy ? null : () => _cancelCommission(item),
                  icon: const Icon(CupertinoIcons.xmark_circle, size: 13),
                  label: const Text('Hủy yêu cầu'),
                ),
              ],

              // 2. Góc nhìn Creator (Received) khi PENDING
              if (isCreatorView && status == 'PENDING') ...[
                FilledButton.icon(
                  key: Key('accept-commission-btn-${item.id}'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2E7D32),
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: _busy ? null : () => _acceptCommission(item),
                  icon: const Icon(
                    CupertinoIcons.chat_bubble_2_fill,
                    size: 14,
                  ),
                  label: const Text('Chấp nhận thảo luận (Mở Chat 1-1)'),
                ),
                OutlinedButton.icon(
                  key: Key('reject-commission-btn-${item.id}'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Palette.red,
                    side: const BorderSide(color: Palette.red),
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: _busy ? null : () => _rejectCommission(item),
                  icon: const Icon(CupertinoIcons.xmark, size: 13),
                  label: const Text('Từ chối đơn'),
                ),
              ],

              // 3. Mở phòng Chat 1-1 khi đã ACCEPTED / CONTRACT_SENT / COMPLETED
              if (status == 'ACCEPTED' ||
                  status == 'CONTRACT_SENT' ||
                  status == 'COMPLETED')
                OutlinedButton.icon(
                  key: Key('open-commission-chat-btn-${item.id}'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1976D2),
                    side: const BorderSide(color: Color(0xFF1976D2)),
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: () =>
                      _openChatForCommission(item, asCreator: isCreatorView),
                  icon: const Icon(
                    CupertinoIcons.chat_bubble_2_fill,
                    size: 14,
                  ),
                  label: const Text('Phòng Chat 1-1'),
                ),

              // 4. Creator lập Lộ trình Milestone Tổng (Form 2) khi ACCEPTED và chưa có contract
              if (isCreatorView &&
                  status == 'ACCEPTED' &&
                  effectiveContractId == null)
                FilledButton.icon(
                  key: Key('create-roadmap-btn-${item.id}'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Palette.red,
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: () {
                    showModalBottomSheet<void>(
                      context: context,
                      isScrollControlled: true,
                      useSafeArea: true,
                      backgroundColor: Palette.paper,
                      builder: (_) => CreateOrEditMilestoneRoadmapSheet(
                        state: widget.state,
                        commission: item,
                        onSaved: widget.onRefresh,
                      ),
                    );
                  },
                  icon: const Icon(CupertinoIcons.doc_text_fill, size: 14),
                  label: const Text('Lập Lộ trình Milestone Tổng (1..20 mốc)'),
                ),

              // 5. Xem / Quản lý Hợp đồng & Milestone khi đã có contractId
              if (effectiveContractId != null)
                FilledButton.icon(
                  key: Key('view-commission-contract-btn-$effectiveContractId'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: () => _openContractRoadmap(effectiveContractId),
                  icon: const Icon(CupertinoIcons.layers_alt_fill, size: 14),
                  label: Text(
                    !isCreatorView && effectiveContractStatus == 'PENDING'
                        ? 'Xem & Duyệt Hợp đồng Milestone (#$effectiveContractId)'
                        : 'Mở Lộ trình Hợp đồng & Milestone (#$effectiveContractId)',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Khu vực Hợp đồng & Tiến độ Milestone 2 Tầng + Thống kê Tài chính Ký quỹ
class MilestoneContractsSection extends StatefulWidget {
  const MilestoneContractsSection({
    super.key,
    required this.state,
    required this.contracts,
    required this.financials,
    required this.loading,
    required this.onRefresh,
  });

  final AppState state;
  final List<ContractModel> contracts;
  final MilestoneFinancialSummaryModel? financials;
  final bool loading;
  final Future<void> Function() onRefresh;

  @override
  State<MilestoneContractsSection> createState() =>
      _MilestoneContractsSectionState();
}

class _MilestoneContractsSectionState extends State<MilestoneContractsSection> {
  String _searchQuery = '';
  String _statusFilter = 'ALL';
  String _sortBy = 'NEWEST';

  AppState get state => widget.state;
  Future<void> Function() get onRefresh => widget.onRefresh;

  void _openContractDetail(BuildContext context, ContractModel c) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (_) => ContractMilestoneRoadmapSheet(
        state: state,
        contractId: c.id,
        initialContract: c,
        onChanged: onRefresh,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fin = widget.financials;
    final query = _searchQuery.trim().toLowerCase();
    final filteredContracts = widget.contracts.where((c) {
      final st = c.status.toUpperCase();
      if (_statusFilter != 'ALL') {
        if (_statusFilter == 'PENDING') {
          if (!isContractNegotiating(st)) return false;
        } else if (st != _statusFilter) {
          return false;
        }
      }
      if (query.isNotEmpty) {
        final hay =
            '${c.id} ${c.title} ${c.description ?? ""} ${c.channelName ?? ""} ${c.effectiveRequesterName} ${c.creatorFullName ?? ""}'
                .toLowerCase();
        if (!hay.contains(query)) return false;
      }
      return true;
    }).toList();

    filteredContracts.sort((a, b) {
      if (_sortBy == 'OLDEST') return a.id.compareTo(b.id);
      if (_sortBy == 'TITLE_AZ') {
        return a.title.toLowerCase().compareTo(b.title.toLowerCase());
      }
      return b.id.compareTo(a.id);
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Thẻ Thống kê Tài chính Ký quỹ Milestone (GET /api/v1/contracts/me/milestone-financials)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Palette.soft,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Palette.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('THỐNG KÊ TÀI CHÍNH KÝ QUỸ MILESTONE (ESCROW)'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 18,
                runSpacing: 10,
                children: [
                  _finTile(
                    'Đang giữ Ký quỹ (Escrow)',
                    formatVndAmount(fin?.escrowHeldAmount ?? 0),
                    const Color(0xFFD97706),
                  ),
                  _finTile(
                    'Đã nhận về Ví (Creator 95%)',
                    formatVndAmount(fin?.totalEarned ?? 0),
                    const Color(0xFF2E7D32),
                  ),
                  _finTile(
                    'Tổng đã chi (Khách đặt)',
                    formatVndAmount(fin?.totalSpent ?? 0),
                    Palette.ink,
                  ),
                  _finTile(
                    'Đã hoàn tiền 100%',
                    formatVndAmount(fin?.refundedAmount ?? 0),
                    const Color(0xFF1976D2),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Thanh tìm kiếm + lọc + sắp xếp Hợp đồng (Mục 11)
        Row(
          children: [
            Expanded(
              child: TextField(
                key: const Key('contract-search-input'),
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Tìm hợp đồng theo tên, kênh, đối tác hoặc #ID...',
                  hintStyle: const TextStyle(fontSize: 12, color: Palette.muted),
                  prefixIcon: const Icon(
                    CupertinoIcons.search,
                    size: 15,
                    color: Palette.muted,
                  ),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 9,
                  ),
                  filled: true,
                  fillColor: Palette.soft,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Palette.line),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Palette.line),
                  ),
                ),
                style: const TextStyle(fontSize: 12.5),
              ),
            ),
            const SizedBox(width: 8),
            DropdownButtonHideUnderline(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.line),
                ),
                child: DropdownButton<String>(
                  key: const Key('contract-sort-dropdown'),
                  value: _sortBy,
                  isDense: true,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: Palette.ink,
                  ),
                  items: const [
                    DropdownMenuItem(value: 'NEWEST', child: Text('Mới nhất')),
                    DropdownMenuItem(value: 'OLDEST', child: Text('Cũ nhất')),
                    DropdownMenuItem(
                      value: 'TITLE_AZ',
                      child: Text('Tiêu đề A-Z'),
                    ),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _sortBy = val);
                  },
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final entry in const [
                ('ALL', 'Tất cả'),
                ('PENDING', 'Chờ duyệt'),
                ('ACTIVE', 'Đang thực hiện'),
                ('COMPLETED', 'Đã hoàn tất'),
                ('CANCELLED', 'Đã hủy'),
              ]) ...[
                ChoiceChip(
                  key: Key('contract-filter-${entry.$1}'),
                  label: Text(entry.$2, style: const TextStyle(fontSize: 11.5)),
                  selected: _statusFilter == entry.$1,
                  selectedColor: Palette.red.withValues(alpha: 0.14),
                  visualDensity: VisualDensity.compact,
                  onSelected: (_) =>
                      setState(() => _statusFilter = entry.$1),
                ),
                const SizedBox(width: 6),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),

        if (widget.loading)
          const Padding(
            padding: EdgeInsets.all(32.0),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (filteredContracts.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 34),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Palette.line),
            ),
            child: Column(
              children: [
                const Icon(
                  CupertinoIcons.doc_text_search,
                  size: 38,
                  color: Palette.muted,
                ),
                const SizedBox(height: 12),
                Text(
                  widget.contracts.isEmpty
                      ? 'Chưa có Hợp đồng Milestone nào'
                      : 'Không có Hợp đồng phù hợp với bộ lọc',
                  style: editorial(18),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Sau khi Creator chấp nhận đơn đặt nội dung và lập Lộ trình Milestone Tổng, hợp đồng sẽ hiển thị tại đây để Khách hàng duyệt (Tầng 1) và đóng cọc cuốn chiếu từng giai đoạn (Tầng 2).',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12.5,
                    color: Palette.muted,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          )
        else
          for (final c in filteredContracts) _buildContractCard(context, c),
      ],
    );
  }

  Widget _finTile(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Palette.muted)),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: color,
            fontFeatures: const [ui.FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }

  Widget _buildContractCard(BuildContext context, ContractModel c) {
    final status = c.status.toUpperCase();
    final totalMs = c.milestones.isNotEmpty
        ? c.milestones.length
        : 1;
    final doneMs = c.milestones
        .where(
          (m) =>
              m.status.toUpperCase() == 'APPROVED' ||
              m.status.toUpperCase() == 'RELEASED',
        )
        .length;
    final progressRatio = totalMs > 0
        ? (doneMs / totalMs).clamp(0.0, 1.0)
        : (status == 'COMPLETED' ? 1.0 : 0.0);
    final pct = (progressRatio * 100).round();

    final badgeText = contractStageBadgeLabel(c);
    final progressLabelText = contractStageProgressLabel(c);
    final isNegotiating = isContractNegotiating(status);
    final isCreatorRole = (state.currentUserId != null &&
            c.creatorId == state.currentUserId) ||
        (state.currentUserId == null && state.isCreator);
    final isEnded = status == 'COMPLETED' || status == 'CANCELLED';
    final partnerName = isCreatorRole
        ? c.effectiveRequesterName
        : (c.creatorFullName ?? c.channelName ?? 'Creator #${c.creatorId}');
    final amountDisplay = isCreatorRole
        ? formatVndAmount(c.netAmount ?? (c.totalAmount * 0.95))
        : formatVndAmount(c.totalAmount);
    final amountSubtitle = isCreatorRole ? 'Thực nhận (95%)' : 'Tổng ngân sách';

    return Container(
      key: Key('milestone-contract-card-${c.id}'),
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // TẦNG 1 (Header): Trái [HĐ #id] + [LỘ TRÌNH N MỐC] + Tiêu đề | Phải Thực nhận/Tổng tiền + Badge 4 giai đoạn
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 2.5,
                          ),
                          decoration: BoxDecoration(
                            color: Palette.ink,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'HỢP ĐỒNG #${c.id}',
                            style: const TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: Palette.white,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 2.5,
                          ),
                          decoration: BoxDecoration(
                            color: Palette.soft,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Palette.line),
                          ),
                          child: Text(
                            'LỘ TRÌNH $totalMs MỐC',
                            style: const TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: Palette.ink,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      c.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: editorial(17),
                    ),
                    if (c.description != null &&
                        c.description!.trim().isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        c.description!.trim(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Palette.muted,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '$amountSubtitle: $amountDisplay',
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: Palette.ink,
                      fontFeatures: [ui.FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 5),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: contractStatusColor(status).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      badgeText,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: contractStatusColor(status),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),

          // TẦNG 2 (Full-Width Progress Bar — width: double.infinity, Section 6.4.4)
          Container(
            key: Key('contract-fullwidth-progress-${c.id}'),
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Palette.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        progressLabelText,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: Palette.ink,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$doneMs/$totalMs mốc ($pct%)',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF2E7D32),
                        fontFeatures: [ui.FontFeature.tabularFigures()],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: progressRatio,
                    minHeight: 7,
                    backgroundColor: Palette.line,
                    color: contractStatusColor(status),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // TẦNG 3 (Footer — Partner & Action Buttons)
          Wrap(
            spacing: 10,
            runSpacing: 8,
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(
                    radius: 13,
                    backgroundColor: Palette.red.withValues(alpha: 0.12),
                    child: Text(
                      partnerName.isNotEmpty
                          ? partnerName[0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Palette.red,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      c.channelName != null && c.channelName!.isNotEmpty
                          ? '$partnerName · Kênh ${c.channelName}'
                          : partnerName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Palette.muted,
                      ),
                    ),
                  ),
                ],
              ),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  OutlinedButton.icon(
                    key: Key('card-open-chat-btn-${c.id}'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Palette.ink,
                      side: const BorderSide(color: Palette.line),
                      visualDensity: VisualDensity.compact,
                    ),
                    onPressed: () {
                      showModalBottomSheet<void>(
                        context: context,
                        useRootNavigator: true,
                        isScrollControlled: true,
                        useSafeArea: true,
                        backgroundColor: Palette.paper,
                        builder: (_) => CreatorFreelancerChatSheet(
                          chatRepository: state.chatRepository ??
                              state.creatorState.chatRepository,
                          contractRepository: state.contractRepository ??
                              state.creatorState.contractRepository,
                          hireRequestId: c.hireRequestId,
                          contractId: c.id,
                          contractStatus: c.status,
                          topicTitle: c.title,
                          channelName: c.channelName,
                          partnerName: partnerName,
                          senderRole: isCreatorRole ? 'CREATOR' : 'CUSTOMER',
                          senderName: state.displayName,
                          currentUserId: state.currentUserId,
                          preferences: state.preferences,
                          onOpenContractRoadmap: (_) =>
                              _openContractDetail(context, c),
                        ),
                      );
                    },
                    icon: const Icon(CupertinoIcons.chat_bubble_2_fill, size: 13),
                    label: Text(
                      isEnded ? 'Xem lịch sử chat' : 'Mở chat',
                      style: const TextStyle(fontSize: 11.5),
                    ),
                  ),
                  if (isNegotiating && isCreatorRole)
                    OutlinedButton.icon(
                      key: Key('card-edit-roadmap-btn-${c.id}'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Palette.red,
                        side: const BorderSide(color: Palette.red),
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () {
                        showModalBottomSheet<void>(
                          context: context,
                          useRootNavigator: true,
                          isScrollControlled: true,
                          useSafeArea: true,
                          backgroundColor: Palette.paper,
                          builder: (_) => CreateOrEditMilestoneRoadmapSheet(
                            state: state,
                            existingContract: c,
                            onSaved: onRefresh,
                          ),
                        );
                      },
                      icon: const Icon(CupertinoIcons.pencil, size: 13),
                      label: const Text(
                        'Sửa lộ trình',
                        style: TextStyle(fontSize: 11.5),
                      ),
                    ),
                  FilledButton.icon(
                    key: Key('open-contract-roadmap-sheet-btn-${c.id}'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Palette.red,
                      visualDensity: VisualDensity.compact,
                    ),
                    onPressed: () => _openContractDetail(context, c),
                    icon: const Icon(CupertinoIcons.layers_alt_fill, size: 14),
                    label: const Text(
                      'Chi tiết & Tiến độ',
                      style: TextStyle(fontSize: 11.5),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
