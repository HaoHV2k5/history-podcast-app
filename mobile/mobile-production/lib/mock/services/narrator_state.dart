import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../creator_state.dart';
import '../../narrator_profile.dart';
import '../../wallet_state.dart';

enum ContractStatus {
  invited,
  negotiating,
  pendingSign,
  inProduction,
  delivered,
  completed,
  rejected,
  cancelled,
  disputed,
  refunded,
}

extension ContractStatusLabel on ContractStatus {
  String get label => switch (this) {
    ContractStatus.invited => 'Chờ phản hồi',
    ContractStatus.negotiating => 'Đang thương lượng',
    ContractStatus.pendingSign => 'Chờ xác nhận hai bên',
    ContractStatus.inProduction => 'Đang thu âm',
    ContractStatus.delivered => 'Chờ nghiệm thu',
    ContractStatus.completed => 'Đã nghiệm thu',
    ContractStatus.rejected => 'Đã từ chối',
    ContractStatus.cancelled => 'Đã hủy trước sản xuất',
    ContractStatus.disputed => 'Chờ phân xử mẫu',
    ContractStatus.refunded => 'Đã hoàn tiền mẫu',
  };
}

class ContractOrder {
  const ContractOrder({
    required this.id,
    required this.narratorId,
    required this.narratorName,
    required this.draftId,
    required this.draftTitle,
    required this.channelName,
    required this.notes,
    required this.feeProposal,
    required this.deadline,
    this.status = ContractStatus.invited,
    this.creatorSigned = false,
    this.narratorSigned = false,
    this.deliveredAudioName = '',
    this.revisionNotes = '',
    this.history = const [],
  });
  final String id, narratorId, narratorName, draftId, draftTitle, channelName;
  final String notes, feeProposal, deadline, deliveredAudioName, revisionNotes;
  final ContractStatus status;
  final bool creatorSigned, narratorSigned;
  final List<String> history;
  bool get isFullySigned => creatorSigned && narratorSigned;
  int get feeAmount =>
      int.tryParse(
        RegExp(r'[\d.,]+')
                .firstMatch(feeProposal)
                ?.group(0)
                ?.replaceAll(RegExp(r'[.,]'), '') ??
            '',
      ) ??
      0;

  Map<String, dynamic> toJson() => {
    'id': id,
    'narratorId': narratorId,
    'narratorName': narratorName,
    'draftId': draftId,
    'draftTitle': draftTitle,
    'channelName': channelName,
    'notes': notes,
    'feeProposal': feeProposal,
    'deadline': deadline,
    'status': status.name,
    'creatorSigned': creatorSigned,
    'narratorSigned': narratorSigned,
    'deliveredAudioName': deliveredAudioName,
    'revisionNotes': revisionNotes,
    'history': history,
  };

  factory ContractOrder.fromJson(Map<String, dynamic> j) => ContractOrder(
    id: j['id'] as String,
    narratorId: j['narratorId'] as String,
    narratorName: j['narratorName'] as String,
    draftId: j['draftId'] as String,
    draftTitle: j['draftTitle'] as String,
    channelName: j['channelName'] as String,
    notes: j['notes'] as String,
    feeProposal: j['feeProposal'] as String,
    deadline: j['deadline'] as String,
    status: ContractStatus.values.byName(j['status'] as String),
    creatorSigned: j['creatorSigned'] == true,
    narratorSigned: j['narratorSigned'] == true,
    deliveredAudioName: j['deliveredAudioName'] as String? ?? '',
    revisionNotes: j['revisionNotes'] as String? ?? '',
    history: (j['history'] as List? ?? []).cast<String>(),
  );

  ContractOrder updated({
    ContractStatus? status,
    String? fee,
    String? note,
    bool? creatorSigned,
    bool? narratorSigned,
    String? audio,
    String? revision,
  }) => ContractOrder(
    id: id,
    narratorId: narratorId,
    narratorName: narratorName,
    draftId: draftId,
    draftTitle: draftTitle,
    channelName: channelName,
    notes: notes,
    feeProposal: fee ?? feeProposal,
    deadline: deadline,
    status: status ?? this.status,
    creatorSigned: creatorSigned ?? this.creatorSigned,
    narratorSigned: narratorSigned ?? this.narratorSigned,
    deliveredAudioName: audio ?? deliveredAudioName,
    revisionNotes: revision ?? revisionNotes,
    history: [
      ...history,
      if (note != null) '${DateTime.now().toIso8601String()} · $note',
    ],
  );
}

/// Local workflow rehearsal. No legal signature, notification or money transfer.
class NarratorState extends ChangeNotifier {
  NarratorState(this.creator) {
    final raw = creator.preferences.getString('narratorContractsV1');
    if (raw != null) {
      _orders = (jsonDecode(raw) as List)
          .map((j) => ContractOrder.fromJson(j as Map<String, dynamic>))
          .toList();
    }
  }
  final CreatorState creator;
  List<ContractOrder> _orders = [];
  List<ContractOrder> get orders => List.unmodifiable(_orders);
  ContractOrder order(String id) => _orders.firstWhere((o) => o.id == id);

  void _guard() {
    if (!creator.demoVerified ||
        !creator.kyc.isApproved ||
        creator.channel.isEmpty) {
      throw StateError('Cần hồ sơ đã duyệt và kênh sáng tạo.');
    }
  }

  Future<void> _commit(List<ContractOrder> orders) async {
    final saved = await creator.preferences.setString(
      'narratorContractsV1',
      jsonEncode(orders.map((o) => o.toJson()).toList()),
    );
    if (!saved) throw StateError('Không lưu được hợp đồng trên thiết bị.');
    _orders = orders;
    notifyListeners();
  }

  Future<void> invite({
    required String draftId,
    required String narratorId,
    required String narratorName,
    required String fee,
    required String notes,
    required DateTime deadline,
  }) async {
    _guard();
    final matches = creator.drafts.where((d) => d.id == draftId);
    if (matches.isEmpty ||
        !matches.first.editable ||
        matches.first.script.trim().isEmpty ||
        matches.first.sources.trim().isEmpty) {
      throw StateError(
        'Chọn bản thảo có kịch bản, nguồn và còn chỉnh sửa được.',
      );
    }
    final today = DateTime.now();
    if (!deadline.isAfter(DateTime(today.year, today.month, today.day)) ||
        fee.trim().isEmpty ||
        notes.trim().isEmpty) {
      throw StateError(
        'Nhập thù lao, yêu cầu thu âm và hạn bàn giao sau hôm nay.',
      );
    }
    if (_orders.any(
      (o) =>
          o.draftId == draftId &&
          o.narratorId == narratorId &&
          ![
            ContractStatus.completed,
            ContractStatus.rejected,
          ].contains(o.status),
    )) {
      throw StateError(
        'Bản thảo này đã có lời mời đang xử lý với người đọc này.',
      );
    }
    final d = matches.first;
    final o = ContractOrder(
      id: 'HD-${DateTime.now().microsecondsSinceEpoch}',
      narratorId: narratorId,
      narratorName: narratorName,
      draftId: d.id,
      draftTitle: d.title,
      channelName: creator.channel,
      notes: notes.trim(),
      feeProposal: fee.trim(),
      deadline: deadline.toIso8601String(),
      history: ['${DateTime.now().toIso8601String()} · Gửi lời mời mẫu'],
    );
    await _commit([o, ..._orders]);
  }

  Future<void> act(String id, String action, {String value = ''}) async {
    _guard();
    await _act(id, action, value: value);
  }

  Future<void> actAsNarrator(
    String id,
    String action,
    NarratorProfileState profile, {
    String value = '',
  }) async {
    if (!profile.canReceiveJobs ||
        order(id).narratorId != profile.id ||
        ![
          'accept',
          'reject',
          'counter',
          'narratorSign',
          'deliver',
          'cancel',
          'dispute',
        ].contains(action)) {
      throw StateError(
        'Cần hồ sơ người đọc đã duyệt và công việc thuộc hồ sơ này.',
      );
    }
    await _act(id, action, value: value);
  }

  Future<void> _act(String id, String action, {String value = ''}) async {
    final o = order(id);
    ContractOrder next;
    switch (action) {
      case 'accept':
        if (![
          ContractStatus.invited,
          ContractStatus.negotiating,
        ].contains(o.status)) {
          throw StateError('Lời mời đã được xử lý.');
        }
        next = o.updated(
          status: ContractStatus.pendingSign,
          note: 'Chấp thuận thỏa thuận mẫu',
        );
      case 'reject':
        if (![
          ContractStatus.invited,
          ContractStatus.negotiating,
        ].contains(o.status)) {
          throw StateError('Chỉ từ chối lời mời chưa ký.');
        }
        next = o.updated(
          status: ContractStatus.rejected,
          note: 'Từ chối lời mời mẫu',
        );
      case 'counter':
        if (![
              ContractStatus.invited,
              ContractStatus.negotiating,
            ].contains(o.status) ||
            value.trim().isEmpty) {
          throw StateError('Cần đề xuất thù lao trong bước thương lượng.');
        }
        next = o.updated(
          status: ContractStatus.negotiating,
          fee: value.trim(),
          note: 'Đề xuất thù lao: ${value.trim()}',
        );
      case 'creatorSign':
        if (value != '889900') {
          throw StateError('Đọc điều khoản và nhập OTP mẫu 889900.');
        }
        if (o.status != ContractStatus.pendingSign || o.creatorSigned) {
          throw StateError('Chưa đến bước xác nhận.');
        }
        next = o.updated(
          creatorSigned: true,
          note: 'Người sáng tạo xác nhận mẫu',
        );
      case 'narratorSign':
        if (value != '889900') {
          throw StateError('Đọc điều khoản và nhập OTP mẫu 889900.');
        }
        if (o.status != ContractStatus.pendingSign ||
            !o.creatorSigned ||
            o.narratorSigned) {
          throw StateError('Cần người sáng tạo xác nhận trước.');
        }
        next = o.updated(
          narratorSigned: true,
          status: ContractStatus.inProduction,
          note: 'Người đọc xác nhận mẫu',
        );
        await WalletState(creator.preferences)
            .reserve(o.id, o.narratorId, o.feeAmount);
      case 'deliver':
        if (o.status != ContractStatus.inProduction || !o.isFullySigned) {
          throw StateError('Chưa được bàn giao.');
        }
        if (value.isNotEmpty &&
            !RegExp(
              r'^[^/\\]{1,100}\.(wav|mp3)$',
              caseSensitive: false,
            ).hasMatch(value.trim())) {
          throw StateError('Nhập tên file WAV/MP3, không kèm đường dẫn.');
        }
        next = o.updated(
          status: ContractStatus.delivered,
          audio: value.trim().isEmpty
              ? '${o.draftId}_master.wav'
              : value.trim(),
          note: 'Bàn giao tên file mẫu',
        );
      case 'revise':
        if (o.status != ContractStatus.delivered || value.trim().length < 5) {
          throw StateError('Ghi rõ phần cần sửa (ít nhất 5 ký tự).');
        }
        next = o.updated(
          status: ContractStatus.inProduction,
          revision: value.trim(),
          note: 'Yêu cầu sửa: ${value.trim()}',
        );
      case 'complete':
        if (o.status != ContractStatus.delivered) {
          throw StateError('Cần nhận bản thu trước khi nghiệm thu.');
        }
        next = o.updated(
          status: ContractStatus.completed,
          note: 'Nghiệm thu · Giải ngân sổ ví mẫu, không chuyển tiền thật',
        );
        await WalletState(creator.preferences).settle(o.id, refund: false);
      case 'cancel':
        if (![
          ContractStatus.invited,
          ContractStatus.negotiating,
          ContractStatus.pendingSign,
        ].contains(o.status)) {
          throw StateError(
            'Chỉ hủy trước sản xuất. Sau đó cần gửi yêu cầu phân xử.',
          );
        }
        next = o.updated(
          status: ContractStatus.cancelled,
          note: 'Một bên hủy trước sản xuất',
        );
      case 'dispute':
        if (![
              ContractStatus.inProduction,
              ContractStatus.delivered,
            ].contains(o.status) ||
            value.trim().length < 5) {
          throw StateError('Ghi lý do phân xử trong công việc đã có hiệu lực.');
        }
        next = o.updated(
          status: ContractStatus.disputed,
          revision: value.trim(),
          note: 'Gửi yêu cầu phân xử mẫu: ${value.trim()}',
        );
      case 'demoRelease':
      case 'demoRefund':
        if (o.status != ContractStatus.disputed) {
          throw StateError('Chỉ xử lý yêu cầu đang phân xử.');
        }
        final refund = action == 'demoRefund';
        await WalletState(creator.preferences).settle(o.id, refund: refund);
        next = o.updated(
          status: refund ? ContractStatus.refunded : ContractStatus.completed,
          note:
              'Kết quả phân xử diễn tập: ${refund ? 'hoàn Creator' : 'giải ngân Narrator'}',
        );
      default:
        throw StateError('Thao tác không hợp lệ.');
    }
    await _commit([
      for (final item in _orders)
        if (item.id == id) next else item,
    ]);
  }
}
