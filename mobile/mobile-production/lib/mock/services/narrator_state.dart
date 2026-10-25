import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../core/api/chat_repository.dart';
import '../../core/api/contract_repository.dart';
import '../../core/api/deliverable_repository.dart';
import '../../core/api/dispute_repository.dart';
import '../../core/api/hire_request_repository.dart';
import '../../core/api/milestone_repository.dart';
import '../../core/api/narrator_profile_repository.dart';
import '../../core/api/post_repository.dart';
import '../../creator_state.dart';
import '../../narrator_profile.dart';
import '../../wallet_state.dart';

class ContractChatEntry {
  final String id;
  final String senderName;
  final String senderRole; // 'CREATOR' | 'NARRATOR'
  final String text;
  final String timestamp;

  const ContractChatEntry({
    required this.id,
    required this.senderName,
    required this.senderRole,
    required this.text,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'senderName': senderName,
    'senderRole': senderRole,
    'text': text,
    'timestamp': timestamp,
  };

  factory ContractChatEntry.fromJson(Map<String, dynamic> json) =>
      ContractChatEntry(
        id: (json['id'] ?? '').toString(),
        senderName: (json['senderName'] ?? '').toString(),
        senderRole: (json['senderRole'] ?? 'CREATOR').toString(),
        text: (json['text'] ?? '').toString(),
        timestamp: (json['timestamp'] ?? '').toString(),
      );
}

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

/// Workflow rehearsal + live backend sync for Marketplace, HireRequest, Contract, Milestone & Chat.
class NarratorState extends ChangeNotifier {
  NarratorState(
    this.creator, {
    ContractRepository? contractRepository,
    HireRequestRepository? hireRequestRepository,
    MilestoneRepository? milestoneRepository,
    DeliverableRepository? deliverableRepository,
    DisputeRepository? disputeRepository,
    ChatRepository? chatRepository,
    NarratorProfileRepository? narratorProfileRepository,
    PostRepository? postRepository,
  }) : contractRepository = contractRepository ?? creator.contractRepository,
       hireRequestRepository =
           hireRequestRepository ?? creator.hireRequestRepository,
       milestoneRepository =
           milestoneRepository ?? creator.milestoneRepository,
       deliverableRepository =
           deliverableRepository ?? creator.deliverableRepository,
       disputeRepository = disputeRepository ?? creator.disputeRepository,
       chatRepository = chatRepository ?? creator.chatRepository,
       narratorProfileRepository =
           narratorProfileRepository ?? creator.narratorProfileRepository,
       postRepository = postRepository ?? creator.postRepository {
    final raw = creator.preferences.getString('narratorContractsV1');
    if (raw != null) {
      _orders = (jsonDecode(raw) as List)
          .map((j) => ContractOrder.fromJson(j as Map<String, dynamic>))
          .toList();
    }
    final rawChats = creator.preferences.getString('narratorContractChatsV1');
    if (rawChats != null) {
      try {
        final decoded = jsonDecode(rawChats) as Map<String, dynamic>;
        for (final entry in decoded.entries) {
          if (entry.value is List) {
            contractMessages[entry.key] = (entry.value as List)
                .map(
                  (e) => ContractChatEntry.fromJson(e as Map<String, dynamic>),
                )
                .toList();
          }
        }
      } catch (_) {}
    }
  }
  final CreatorState creator;
  final ContractRepository? contractRepository;
  final HireRequestRepository? hireRequestRepository;
  final MilestoneRepository? milestoneRepository;
  final DeliverableRepository? deliverableRepository;
  final DisputeRepository? disputeRepository;
  final ChatRepository? chatRepository;
  final NarratorProfileRepository? narratorProfileRepository;
  final PostRepository? postRepository;

  List<ContractOrder> _orders = [];
  List<ContractOrder> get orders => List.unmodifiable(_orders);
  ContractOrder order(String id) => _orders.firstWhere((o) => o.id == id);

  List<NarratorProfileModel> remoteVoices = [];
  List<HireRequestModel> hireRequests = [];
  List<ContractModel> remoteContracts = [];
  final Map<String, ChatConversationModel> activeConversations = {};
  final Map<String, List<ContractChatEntry>> contractMessages = {};

  bool get isLiveBackend =>
      contractRepository != null ||
      hireRequestRepository != null ||
      narratorProfileRepository != null;

  int? _extractNumericId(String rawId) {
    final match = RegExp(r'\d+').firstMatch(rawId);
    return match != null ? int.tryParse(match.group(0)!) : null;
  }

  Future<void> syncMarketplaceBackend() async {
    if (narratorProfileRepository != null) {
      try {
        remoteVoices = await narratorProfileRepository!.getAll();
      } catch (_) {}
    }
    if (hireRequestRepository != null) {
      try {
        hireRequests = await hireRequestRepository!.getAll();
      } catch (_) {}
    }
    if (contractRepository != null) {
      try {
        remoteContracts = await contractRepository!.getMyContracts();
        var changed = false;
        final updated = List<ContractOrder>.from(_orders);
        for (final rc in remoteContracts) {
          final orderId = 'HD-${rc.id}';
          if (!updated.any((o) => o.id == orderId)) {
            final mappedStatus = switch (rc.status.toUpperCase()) {
              'ACTIVE' => ContractStatus.inProduction,
              'COMPLETED' => ContractStatus.completed,
              'REJECTED' => ContractStatus.rejected,
              'CANCELLED' => ContractStatus.cancelled,
              'DISPUTED' => ContractStatus.disputed,
              _ => ContractStatus.invited,
            };
            updated.add(
              ContractOrder(
                id: orderId,
                narratorId: 'nar-${rc.freelancerId ?? 1}',
                narratorName: rc.freelancerFullName ?? 'Nghệ sĩ lồng tiếng',
                draftId: 'draft-${rc.postId ?? rc.id}',
                draftTitle: rc.title,
                channelName: creator.channel.isNotEmpty
                    ? creator.channel
                    : (rc.creatorFullName ?? 'Kênh Sử Ký'),
                notes: rc.description ?? 'Thu âm kịch bản lịch sử',
                feeProposal: '${rc.totalAmount.round()}đ / tập',
                deadline: DateTime.now()
                    .add(const Duration(days: 7))
                    .toIso8601String(),
                status: mappedStatus,
                creatorSigned: mappedStatus == ContractStatus.inProduction ||
                    mappedStatus == ContractStatus.completed,
                narratorSigned: mappedStatus == ContractStatus.inProduction ||
                    mappedStatus == ContractStatus.completed,
                history: [
                  '${rc.createdAt ?? DateTime.now().toIso8601String()} · Đồng bộ hợp đồng #${rc.id} từ hệ thống',
                ],
              ),
            );
            changed = true;
          }
        }
        if (changed) {
          await _commit(updated);
          return;
        }
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<ChatConversationModel> openContractChat(String orderId) async {
    final numericContractId = _extractNumericId(orderId) ?? 1;
    if (chatRepository != null) {
      try {
        final conv = await chatRepository!.getOrCreateConversation(
          contractId: numericContractId,
        );
        activeConversations[orderId] = conv;
      } catch (_) {}
    }
    final fallbackOrder = _orders.where((o) => o.id == orderId).firstOrNull;
    final conv = activeConversations.putIfAbsent(
      orderId,
      () => ChatConversationModel(
        conversationId: 'conv_contract_$orderId',
        partnerId: 2,
        partnerName: fallbackOrder?.narratorName ?? 'Đối tác thu âm',
        partnerRole: 'FREELANCER',
        contextType: 'CONTRACT',
        contextId: numericContractId,
      ),
    );
    contractMessages.putIfAbsent(orderId, () {
      if (fallbackOrder == null) return [];
      return [
        ContractChatEntry(
          id: 'msg-init-$orderId',
          senderName: fallbackOrder.channelName,
          senderRole: 'CREATOR',
          text:
              'Chào ${fallbackOrder.narratorName}, mời bạn xem yêu cầu thu âm tập "${fallbackOrder.draftTitle}": ${fallbackOrder.notes}',
          timestamp: 'Vừa xong',
        ),
      ];
    });
    notifyListeners();
    return conv;
  }

  List<ContractChatEntry> messagesForOrder(String orderId) =>
      List.unmodifiable(contractMessages[orderId] ?? const []);

  Future<ContractChatEntry> sendContractChatMessage(
    String orderId, {
    required String senderName,
    required String senderRole,
    required String text,
  }) async {
    final clean = text.trim();
    if (clean.isEmpty) {
      throw StateError('Vui lòng nhập nội dung tin nhắn.');
    }
    await openContractChat(orderId);
    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    final entry = ContractChatEntry(
      id: 'msg-${now.microsecondsSinceEpoch}',
      senderName: senderName.trim().isEmpty ? 'Thành viên' : senderName.trim(),
      senderRole: senderRole,
      text: clean,
      timestamp: timeStr,
    );
    final current = List<ContractChatEntry>.from(
      contractMessages[orderId] ?? const [],
    )..add(entry);
    contractMessages[orderId] = current;
    await creator.preferences.setString(
      'narratorContractChatsV1',
      jsonEncode(
        contractMessages.map(
          (k, v) => MapEntry(k, v.map((m) => m.toJson()).toList()),
        ),
      ),
    );
    notifyListeners();
    return entry;
  }

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
    final parsedFee =
        int.tryParse(
          RegExp(r'[\d.,]+')
                  .firstMatch(fee.trim())
                  ?.group(0)
                  ?.replaceAll(RegExp(r'[.,]'), '') ??
              '',
        ) ??
        300000;
    final numericNarratorId = _extractNumericId(narratorId) ?? 1;
    var generatedOrderId = 'HD-${DateTime.now().microsecondsSinceEpoch}';

    if (hireRequestRepository != null) {
      try {
        final hr = await hireRequestRepository!.create(
          creatorId: creator.channelModel?.id ?? 1,
          narratorId: numericNarratorId,
          channelId: creator.channelModel?.id,
          description: '${d.title} · ${notes.trim()}',
          proposedPrice: parsedFee.toDouble(),
          deadline: deadline.toIso8601String(),
        );
        hireRequests = [hr, ...hireRequests];
      } catch (_) {}
    }

    if (contractRepository != null) {
      try {
        final createdContract = await contractRepository!.createAndSendContract(
          freelancerId: numericNarratorId,
          serviceType: 'VOICE',
          title: d.title,
          description: notes.trim(),
          milestones: [
            {
              'title': 'Bản thu hoàn chỉnh · ${d.title}',
              'requirement': notes.trim(),
              'amount': parsedFee.toDouble(),
              'durationDays': 7,
              'maxRevisions': 2,
              'revisionDays': 3,
            },
          ],
        );
        remoteContracts = [createdContract, ...remoteContracts];
        generatedOrderId = 'HD-${createdContract.id}';
      } catch (_) {}
    }

    final o = ContractOrder(
      id: generatedOrderId,
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
    final numericContractId = _extractNumericId(o.id);
    ContractOrder next;
    switch (action) {
      case 'accept':
        if (![
          ContractStatus.invited,
          ContractStatus.negotiating,
        ].contains(o.status)) {
          throw StateError('Lời mời đã được xử lý.');
        }
        if (contractRepository != null && numericContractId != null) {
          try {
            await contractRepository!.acceptContract(numericContractId);
          } catch (_) {}
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
        if (contractRepository != null && numericContractId != null) {
          try {
            await contractRepository!.rejectContract(numericContractId);
          } catch (_) {}
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
        if (value.trim().length < 4) {
          throw StateError('Vui lòng đọc điều khoản và nhập mã OTP xác thực.');
        }
        if (o.status != ContractStatus.pendingSign || o.creatorSigned) {
          throw StateError('Chưa đến bước xác nhận.');
        }
        next = o.updated(
          creatorSigned: true,
          note: 'Người sáng tạo đã ký hợp đồng',
        );
      case 'narratorSign':
        if (value.trim().length < 4) {
          throw StateError('Vui lòng đọc điều khoản và nhập mã OTP xác thực.');
        }
        if (o.status != ContractStatus.pendingSign ||
            !o.creatorSigned ||
            o.narratorSigned) {
          throw StateError('Cần người sáng tạo xác nhận trước.');
        }
        if (milestoneRepository != null && numericContractId != null) {
          try {
            await milestoneRepository!.fundMilestone(numericContractId);
          } catch (_) {}
        }
        next = o.updated(
          narratorSigned: true,
          status: ContractStatus.inProduction,
          note: 'Người đọc đã ký hợp đồng',
        );
        await WalletState(
          creator.preferences,
          walletRepository: creator.walletRepository,
          withdrawalRepository: creator.withdrawalRepository,
          contractRepository: contractRepository,
        ).reserve(o.id, o.narratorId, o.feeAmount);

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
        final audioFile = value.trim().isEmpty
            ? '${o.draftId}_master.wav'
            : value.trim();
        if (milestoneRepository != null && numericContractId != null) {
          try {
            await milestoneRepository!.submitDeliverable(
              numericContractId,
              content: 'Bàn giao bản thu $audioFile',
              fileUrl: audioFile,
            );
          } catch (_) {}
        }
        if (deliverableRepository != null && numericContractId != null) {
          try {
            await deliverableRepository!.create(
              contractId: numericContractId,
              fileUrl: audioFile,
            );
          } catch (_) {}
        }
        next = o.updated(
          status: ContractStatus.delivered,
          audio: audioFile,
          note: 'Bàn giao tên file mẫu',
        );
      case 'revise':
        if (o.status != ContractStatus.delivered || value.trim().length < 5) {
          throw StateError('Ghi rõ phần cần sửa (ít nhất 5 ký tự).');
        }
        if (milestoneRepository != null && numericContractId != null) {
          try {
            await milestoneRepository!.requestRevision(
              numericContractId,
              note: value.trim(),
            );
          } catch (_) {}
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
        if (milestoneRepository != null && numericContractId != null) {
          try {
            await milestoneRepository!.approveMilestone(numericContractId);
          } catch (_) {}
        }
        next = o.updated(
          status: ContractStatus.completed,
          note: 'Nghiệm thu · Giải ngân sổ ví mẫu, không chuyển tiền thật',
        );
        await WalletState(
          creator.preferences,
          walletRepository: creator.walletRepository,
          withdrawalRepository: creator.withdrawalRepository,
          contractRepository: contractRepository,
        ).settle(o.id, refund: false);
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
        if (contractRepository != null && numericContractId != null) {
          try {
            await contractRepository!.cancelContract(numericContractId);
          } catch (_) {}
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
        if (disputeRepository != null && numericContractId != null) {
          try {
            await disputeRepository!.openDispute(
              contractId: numericContractId,
              reason: value.trim(),
            );
          } catch (_) {}
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
