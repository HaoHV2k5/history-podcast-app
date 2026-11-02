import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'components.dart';
import 'core/api/chat_repository.dart';
import 'core/api/contract_repository.dart';
import 'core/api/hire_request_repository.dart';
import 'core/api/post_repository.dart';
import 'design.dart';
import 'mock/services/narrator_state.dart';

class ChatMessageItem {
  final String id;
  final int? senderId;
  final String senderRole; // 'CREATOR' | 'CUSTOMER' | 'FREELANCER' | 'NARRATOR'
  final String senderName;
  final String text;
  final String? imageUrl;
  final String type; // 'TEXT' | 'IMAGE' | 'MIXED'
  final String timestamp;
  final int? createdAtMillis;
  final bool isMe;

  ChatMessageItem({
    required this.id,
    this.senderId,
    required this.senderRole,
    required this.senderName,
    required this.text,
    this.imageUrl,
    this.type = 'TEXT',
    required this.timestamp,
    this.createdAtMillis,
    required this.isMe,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    if (senderId != null) 'senderId': senderId,
    'senderRole': senderRole,
    'senderName': senderName,
    'text': text,
    if (imageUrl != null) 'imageUrl': imageUrl,
    'type': type,
    'timestamp': timestamp,
    if (createdAtMillis != null) 'createdAtMillis': createdAtMillis,
    'isMe': isMe,
  };

  factory ChatMessageItem.fromJson(Map<String, dynamic> json) => ChatMessageItem(
    id: (json['id'] ?? '').toString(),
    senderId: (json['senderId'] as num?)?.toInt(),
    senderRole: (json['senderRole'] ?? 'CREATOR').toString(),
    senderName: (json['senderName'] ?? '').toString(),
    text: (json['text'] ?? '').toString(),
    imageUrl: json['imageUrl']?.toString(),
    type: (json['type'] ?? 'TEXT').toString(),
    timestamp: (json['timestamp'] ?? '').toString(),
    createdAtMillis: (json['createdAtMillis'] as num?)?.toInt(),
    isMe: json['isMe'] == true,
  );

  factory ChatMessageItem.fromFirestore(
    FirestoreChatMessageModel m, {
    required int? currentUserId,
    required String currentSenderRole,
  }) {
    final normalizedMyRole = currentSenderRole.toUpperCase();
    final normalizedMsgRole = m.senderRole.toUpperCase();
    final isMe = (currentUserId != null && currentUserId > 0 && m.senderId == currentUserId) ||
        (normalizedMyRole == normalizedMsgRole);
    return ChatMessageItem(
      id: m.id,
      senderId: m.senderId,
      senderRole: m.senderRole,
      senderName: m.senderName,
      text: m.text,
      imageUrl: m.imageUrl,
      type: m.type,
      timestamp: m.timeFormatted,
      createdAtMillis: m.createdAtMillis,
      isMe: isMe,
    );
  }
}

String _shortContractStatusLabel(String status) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'Chờ khách duyệt lộ trình';
    case 'REJECTED':
      return 'Khách yêu cầu sửa lộ trình';
    case 'ACTIVE':
      return 'Đang thực hiện';
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'CANCELLED':
      return 'Đã huỷ';
    default:
      return status;
  }
}

/// Phòng chat trực tiếp giữa Creator và Khách đặt nội dung / Freelancer
/// Kết nối API: POST /api/v1/chats/conversation + Firebase Cloud Firestore REST API
class CreatorFreelancerChatSheet extends StatefulWidget {
  const CreatorFreelancerChatSheet({
    super.key,
    this.chatRepository,
    this.contractRepository,
    this.hireRequestId,
    this.contractId,
    this.collaborationId,
    this.postId,
    this.applicantId,
    this.partnerName,
    this.partnerRole,
    this.partnerAvatarUrl,
    this.contextTitle,
    this.topicTitle,
    this.channelName,
    this.senderRole = 'CREATOR',
    this.senderName = 'Tôi',
    this.currentUserId,
    this.commissionStatus,
    this.contractStatus,
    this.preferences,
    this.onOpenContractRoadmap,
    this.onCreateNewCommission,
  });

  final ChatRepository? chatRepository;
  final ContractRepository? contractRepository;
  final int? hireRequestId;
  final int? contractId;
  final int? collaborationId;
  final int? postId;
  final int? applicantId;
  final String? partnerName;
  final String? partnerRole;
  final String? partnerAvatarUrl;
  final String? contextTitle;
  final String? topicTitle;
  final String? channelName;
  final String senderRole;
  final String senderName;
  final int? currentUserId;
  final String? commissionStatus;
  final String? contractStatus;
  final SharedPreferences? preferences;
  final ValueChanged<int>? onOpenContractRoadmap;
  final VoidCallback? onCreateNewCommission;

  @override
  State<CreatorFreelancerChatSheet> createState() => _CreatorFreelancerChatSheetState();
}

class _CreatorFreelancerChatSheetState extends State<CreatorFreelancerChatSheet> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  Timer? _replyTimer;
  Timer? _contractPollTimer;
  Timer? _firestorePollTimer;
  bool _loading = true;
  bool _sending = false;
  bool _uploadingImage = false;
  String? _error;
  ChatConversationModel? _conversation;
  ContractModel? _linkedContract;
  List<ContractModel> _partnerContracts = [];
  List<ChatMessageItem> _messages = [];

  // Lazy Scroll-up Pagination: hiển thị 15 tin gần nhất, kéo lên đỉnh nạp thêm +15
  int _visibleCount = 15;

  // Pending Image Upload state
  Uint8List? _pendingImageBytes;
  String? _pendingImageName;

  // Collapsible 1-line Contract Context Strip
  bool _contractContextExpanded = false;

  bool get _isTestBinding =>
      WidgetsBinding.instance.runtimeType.toString().contains('Test');

  String get _effectiveConversationId {
    return _conversation?.conversationId ??
        (widget.hireRequestId != null
            ? 'hire_request_${widget.hireRequestId}'
            : widget.contractId != null
                ? 'contract_${widget.contractId}'
                : widget.collaborationId != null
                    ? 'collaboration_${widget.collaborationId}'
                    : 'post_${widget.postId}_applicant_${widget.applicantId}');
  }

  String get _storageKey => 'chat_messages_v1_$_effectiveConversationId';

  bool get _isReadOnlyArchive {
    final cStatus = (_linkedContract?.status ?? widget.contractStatus ?? '').toUpperCase();
    final hStatus = (widget.commissionStatus ?? '').toUpperCase();
    // Lưu ý: REJECTED vẫn giữ mở chat để 2 bên tiếp tục thương lượng!
    // Chỉ COMPLETED hoặc CANCELLED mới chuyển sang Read-Only Archive.
    if (cStatus == 'COMPLETED' || cStatus == 'CANCELLED') return true;
    if (cStatus.isEmpty && (hStatus == 'COMPLETED' || hStatus == 'CANCELLED')) {
      return true;
    }
    return false;
  }

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
    _initConversation();
    _checkLinkedContract();
    if (!_isTestBinding) {
      if (widget.contractRepository != null) {
        _contractPollTimer = Timer.periodic(
          const Duration(seconds: 4),
          (_) => _checkLinkedContract(),
        );
      }
      if (widget.chatRepository != null) {
        _firestorePollTimer = Timer.periodic(
          const Duration( milliseconds: 2500),
          (_) => _syncFirestoreMessages(silent: true),
        );
      }
    }
  }

  @override
  void dispose() {
    _replyTimer?.cancel();
    _contractPollTimer?.cancel();
    _firestorePollTimer?.cancel();
    _scrollCtrl.removeListener(_onScroll);
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollCtrl.hasClients) return;
    if (_scrollCtrl.position.pixels <= 28 && _visibleCount < _messages.length) {
      setState(() {
        _visibleCount = (_visibleCount + 15).clamp(15, _messages.length);
      });
    }
  }

  Future<void> _checkLinkedContract() async {
    final repo = widget.contractRepository;
    if (repo == null) return;
    try {
      final list = await repo.getMyContracts();
      final cid = widget.contractId ?? _conversation?.contractId;
      ContractModel? matched;
      if (cid != null) {
        for (final c in list) {
          if (c.id == cid) {
            matched = c;
            break;
          }
        }
        matched ??= await repo.getContractById(cid);
      } else if (widget.hireRequestId != null) {
        for (final c in list) {
          if (c.hireRequestId == widget.hireRequestId) {
            matched = c;
            break;
          }
        }
      }
      final partnerId = _conversation?.partnerId;
      final samePartner = list.where((c) {
        if (partnerId != null && partnerId > 0) {
          return c.creatorId == partnerId ||
              c.effectiveRequesterId == partnerId ||
              c.freelancerId == partnerId;
        }
        if (matched != null) {
          return c.creatorId == matched.creatorId &&
              c.effectiveRequesterId == matched.effectiveRequesterId;
        }
        return false;
      }).toList();

      if (mounted) {
        setState(() {
          if (matched != null) _linkedContract = matched;
          _partnerContracts = samePartner;
        });
      }
    } catch (_) {}
  }

  Future<void> _initConversation() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      if (widget.chatRepository != null) {
        final conv = await widget.chatRepository!.getOrCreateConversation(
          hireRequestId: widget.hireRequestId,
          contractId: widget.contractId,
          collaborationId: widget.collaborationId,
          postId: widget.postId,
          applicantId: widget.applicantId,
        );
        _conversation = conv;
      }
    } catch (e) {
      final isCommission = widget.hireRequestId != null;
      final isContract = widget.contractId != null || widget.collaborationId != null;
      final cid = widget.contractId ?? widget.collaborationId;
      _conversation = ChatConversationModel(
        conversationId: isCommission
            ? 'hire_request_${widget.hireRequestId}'
            : isContract
                ? 'contract_$cid'
                : 'post_${widget.postId}_applicant_${widget.applicantId}',
        partnerId: 2,
        partnerName: widget.partnerName ??
            (isCommission
                ? 'Đối tác đặt nội dung'
                : isContract
                    ? 'Đối tác hợp đồng'
                    : 'Ứng viên #${widget.applicantId}'),
        partnerRole: widget.partnerRole ?? (widget.senderRole == 'CREATOR' ? 'CUSTOMER' : 'CREATOR'),
        partnerAvatarUrl: widget.partnerAvatarUrl,
        contextType: isCommission
            ? 'COMMISSION'
            : isContract
                ? 'CONTRACT'
                : 'APPLICATION',
        contextId: isCommission
            ? widget.hireRequestId
            : isContract
                ? cid
                : widget.postId,
        topicTitle: widget.topicTitle ?? widget.contextTitle,
        channelName: widget.channelName,
      );
    }

    _loadMessages();
    await _syncFirestoreMessages(silent: true);

    if (mounted) {
      setState(() => _loading = false);
      _scrollToBottom();
    }
  }

  Future<void> _syncFirestoreMessages({bool silent = false}) async {
    final repo = widget.chatRepository;
    if (repo == null) return;
    final convId = _effectiveConversationId;
    if (convId.isEmpty) return;
    try {
      final remote = await repo.listFirestoreMessages(convId);
      if (remote.isNotEmpty && mounted) {
        final prevLen = _messages.length;
        final mapped = remote
            .map(
              (m) => ChatMessageItem.fromFirestore(
                m,
                currentUserId: widget.currentUserId,
                currentSenderRole: widget.senderRole,
              ),
            )
            .toList();
        setState(() {
          _messages = mapped;
        });
        await _saveMessages();
        if (mapped.length > prevLen) {
          _scrollToBottom();
        }
      }
    } catch (_) {}
  }

  void _loadMessages() {
    final prefs = widget.preferences;
    if (prefs != null) {
      final raw = prefs.getString(_storageKey);
      if (raw != null && raw.isNotEmpty) {
        try {
          final list = jsonDecode(raw) as List<dynamic>;
          _messages = list.map((e) => ChatMessageItem.fromJson(e as Map<String, dynamic>)).toList();
          return;
        } catch (_) {}
      }
    }

    final partnerDisplay = _conversation?.partnerName ?? widget.partnerName ?? 'Đối tác';
    final topicDisplay = _conversation?.topicTitle ?? widget.topicTitle ?? widget.contextTitle;
    final isCommission = widget.hireRequestId != null || _conversation?.contextType == 'COMMISSION';
    final isContract = widget.contractId != null || widget.collaborationId != null;
    _messages = [
      ChatMessageItem(
        id: 'welcome-1',
        senderRole: _conversation?.partnerRole ?? 'CREATOR',
        senderName: partnerDisplay,
        text: isCommission
            ? 'Xin chào! Phòng trao đổi đề tài "${topicDisplay ?? 'Đặt làm nội dung'}" đã mở. Chúng ta cùng thống nhất kịch bản, số lượng tập và lộ trình Milestone tại đây nhé!'
            : isContract
                ? 'Xin chào! Tôi đã nhận thông tin về hợp đồng "${topicDisplay ?? '#${widget.contractId ?? widget.collaborationId}'}". Rất sẵn lòng trao đổi về yêu cầu và tiến độ dự án!'
                : 'Xin chào! Cảm ơn bạn đã quan tâm đến bài đăng #${widget.postId}. Chúng ta có thể trao đổi thêm về yêu cầu công việc và chi phí tại đây.',
        timestamp: 'Vừa xong',
        isMe: false,
      ),
    ];
  }

  Future<void> _saveMessages() async {
    final prefs = widget.preferences;
    if (prefs != null) {
      final raw = jsonEncode(_messages.map((e) => e.toJson()).toList());
      await prefs.setString(_storageKey, raw);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _pickChatImage() async {
    try {
      final files = await FilePicker.pickFiles(
        type: FileType.image,
      );
      if (files.isEmpty) return;
      final picked = files.first;
      final bytes = await picked.xFile.readAsBytes();
      if (bytes.isEmpty) return;
      if (bytes.length > 10 * 1024 * 1024) {
        if (mounted) {
          setState(() => _error = 'Ảnh đính kèm vượt quá giới hạn 10MB.');
        }
        return;
      }
      if (mounted) {
        setState(() {
          _error = null;
          _pendingImageBytes = bytes;
          _pendingImageName = picked.name.isNotEmpty ? picked.name : 'chat_image.jpg';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Không thể chọn ảnh: $e');
      }
    }
  }

  void _openImageLightbox(String imageUrl) {
    showDialog<void>(
      context: context,
      useRootNavigator: true,
      barrierColor: Colors.black.withValues(alpha: 0.9),
      builder: (dialogCtx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          alignment: Alignment.center,
          children: [
            InteractiveViewer(
              minScale: 0.6,
              maxScale: 4.0,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => Container(
                    padding: const EdgeInsets.all(24),
                    color: Palette.soft,
                    child: const Text('Không thể tải ảnh gốc.'),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: IconButton.filled(
                key: const Key('close-image-lightbox-btn'),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black.withValues(alpha: 0.65),
                ),
                onPressed: () => Navigator.of(dialogCtx).pop(),
                icon: const Icon(CupertinoIcons.xmark, color: Colors.white, size: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendMessage() async {
    final text = _msgCtrl.text.trim();
    final hasImage = _pendingImageBytes != null;
    if ((text.isEmpty && !hasImage) || _sending || _isReadOnlyArchive) return;

    final now = DateTime.now();
    final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    final senderDisplay = widget.senderName.trim().isEmpty ? 'Tôi' : widget.senderName.trim();
    final convId = _effectiveConversationId;

    final imageBytesToUpload = _pendingImageBytes;
    final imageNameToUpload = _pendingImageName ?? 'chat_image.jpg';

    setState(() {
      _sending = true;
      _uploadingImage = hasImage;
      _error = null;
      _msgCtrl.clear();
      _pendingImageBytes = null;
      _pendingImageName = null;
    });

    String? uploadedImageUrl;
    if (imageBytesToUpload != null) {
      if (widget.chatRepository != null) {
        try {
          uploadedImageUrl = await widget.chatRepository!.uploadChatImage(
            fileBytes: imageBytesToUpload,
            filename: imageNameToUpload,
            conversationId: convId,
          );
        } catch (e) {
          // Fallback data URI nếu offline/test
          uploadedImageUrl = 'data:image/png;base64,${base64Encode(imageBytesToUpload)}';
        }
      } else {
        uploadedImageUrl = 'data:image/png;base64,${base64Encode(imageBytesToUpload)}';
      }
    }

    final msgType = (uploadedImageUrl != null && text.isNotEmpty)
        ? 'MIXED'
        : uploadedImageUrl != null
            ? 'IMAGE'
            : 'TEXT';

    final myMsg = ChatMessageItem(
      id: 'msg-${now.microsecondsSinceEpoch}',
      senderId: widget.currentUserId,
      senderRole: widget.senderRole,
      senderName: senderDisplay,
      text: text,
      imageUrl: uploadedImageUrl,
      type: msgType,
      timestamp: timeStr,
      createdAtMillis: now.millisecondsSinceEpoch,
      isMe: true,
    );

    if (mounted) {
      setState(() {
        _messages.add(myMsg);
        _uploadingImage = false;
      });
    }

    await _saveMessages();
    _scrollToBottom();

    if (widget.chatRepository != null) {
      try {
        await widget.chatRepository!.sendFirestoreMessage(
          convId,
          senderId: widget.currentUserId ?? 1,
          senderRole: widget.senderRole,
          senderName: senderDisplay,
          text: text,
          imageUrl: uploadedImageUrl,
        );
      } catch (_) {}
    }

    if (_isTestBinding || widget.chatRepository == null) {
      // Mô phỏng phản hồi từ đối tác trong môi trường test / offline
      _replyTimer = Timer(const Duration(milliseconds: 900), () {
        if (!mounted) return;
        final replyText = widget.senderRole == 'CREATOR'
            ? 'Đã nhận tin nhắn từ bạn! Tôi sẽ phản hồi chi tiết kịch bản và thời gian giao nộp sớm nhất.'
            : 'Cảm ơn bạn đã phản hồi! Tôi đã nắm được thông tin và sẽ gửi bản thu theo đúng lịch trình.';
        final replyTime = DateTime.now();
        final replyTimeStr = '${replyTime.hour.toString().padLeft(2, '0')}:${replyTime.minute.toString().padLeft(2, '0')}';
        setState(() {
          _messages.add(
            ChatMessageItem(
              id: 'reply-${replyTime.microsecondsSinceEpoch}',
              senderRole: _conversation?.partnerRole ?? 'FREELANCER',
              senderName: _conversation?.partnerName ?? widget.partnerName ?? 'Đối tác',
              text: replyText,
              timestamp: replyTimeStr,
              isMe: false,
            ),
          );
          _sending = false;
        });
        _saveMessages();
        _scrollToBottom();
      });
    } else {
      if (mounted) {
        setState(() => _sending = false);
      }
      await _syncFirestoreMessages(silent: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final partnerName = _conversation?.partnerName ?? widget.partnerName ?? 'Đối tác';
    final partnerRole = _conversation?.partnerRole ?? widget.partnerRole ?? (widget.senderRole == 'CREATOR' ? 'CUSTOMER' : 'CREATOR');
    final topicLabel = _conversation?.topicTitle ?? widget.topicTitle ?? widget.contextTitle ?? 'Trao đổi kịch bản & Lộ trình';
    final channelLabel = _conversation?.channelName ?? widget.channelName;
    final convIdLabel = _effectiveConversationId;

    final totalMsgs = _messages.length;
    final startIdx = (totalMsgs - _visibleCount).clamp(0, totalMsgs);
    final visibleMessages = _messages.sublist(startIdx);
    final hasOlderMessages = startIdx > 0;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          10,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 16,
        ),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.82,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag Handle
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

              // Header
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: Palette.red.withValues(alpha: 0.12),
                    backgroundImage: _conversation?.partnerAvatarUrl != null &&
                            _conversation!.partnerAvatarUrl!.startsWith('http')
                        ? NetworkImage(_conversation!.partnerAvatarUrl!)
                        : null,
                    child: _conversation?.partnerAvatarUrl == null ||
                            !_conversation!.partnerAvatarUrl!.startsWith('http')
                        ? Text(
                            partnerName.isNotEmpty ? partnerName[0].toUpperCase() : '?',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Palette.red),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                partnerName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: editorial(18),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Palette.soft,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: Palette.line),
                              ),
                              child: Text(
                                partnerRole == 'CREATOR'
                                    ? 'CREATOR'
                                    : partnerRole == 'CUSTOMER'
                                        ? 'KHÁCH ĐẶT'
                                        : (partnerRole == 'NARRATOR' || partnerRole == 'FREELANCER')
                                            ? 'FREELANCER'
                                            : 'ĐỐI TÁC',
                                style: const TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w700,
                                  color: Palette.red,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            const Icon(CupertinoIcons.lock_shield_fill, size: 12, color: Color(0xFF2E7D32)),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                channelLabel != null && channelLabel.trim().isNotEmpty
                                    ? 'Kênh $channelLabel · $topicLabel · $convIdLabel'
                                    : '$topicLabel · $convIdLabel',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  color: Palette.muted,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    key: const Key('close-chat-sheet-btn'),
                    tooltip: 'Đóng',
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(CupertinoIcons.xmark, size: 18),
                  ),
                ],
              ),

              const SizedBox(height: 10),
              const Divider(height: 1),
              const SizedBox(height: 8),

              // Pinned Policy Banner trong phòng Chat 1-1
              Container(
                key: const Key('chat-escrow-policy-banner'),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF8E7),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE6C27A)),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(CupertinoIcons.shield_lefthalf_fill, size: 14, color: Color(0xFFB45309)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Hai bên trao đổi kịch bản, số lượng tập và chi phí tại đây. Mọi thanh toán đều được bảo vệ qua Ký quỹ (Escrow) theo từng giai đoạn — tuyệt đối không chuyển khoản riêng bên ngoài hệ thống.',
                        style: TextStyle(fontSize: 11.5, height: 1.4, color: Color(0xFF78350F)),
                      ),
                    ),
                  ],
                ),
              ),

              // Collapsible 1-line Contract Context Strip + Multi-contract Switcher (Section 6.4.6)
              if (_linkedContract != null ||
                  widget.contractId != null ||
                  _conversation?.contractId != null) ...[
                const SizedBox(height: 8),
                Builder(
                  builder: (context) {
                    final cid = _linkedContract?.id ??
                        widget.contractId ??
                        _conversation!.contractId!;
                    final cStatus =
                        (_linkedContract?.status ?? widget.contractStatus ?? 'PENDING').toUpperCase();
                    final cTitle = _linkedContract?.title ?? topicLabel;
                    final isWaitingCustomer =
                        cStatus == 'PENDING' && widget.senderRole != 'CREATOR';
                    final badgeLabel = _shortContractStatusLabel(cStatus);
                    return Container(
                      key: const Key('chat-linked-contract-banner'),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF7C3AED)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (_partnerContracts.length > 1) ...[
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  const Text(
                                    'Chuyển HĐ: ',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF5B21B6),
                                    ),
                                  ),
                                  ..._partnerContracts.map((pc) {
                                    final selected = pc.id == cid;
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 6),
                                      child: InkWell(
                                        key: Key('chat-switch-contract-${pc.id}'),
                                        onTap: () => setState(() => _linkedContract = pc),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 3,
                                          ),
                                          decoration: BoxDecoration(
                                            color: selected
                                                ? const Color(0xFF7C3AED)
                                                : Palette.white,
                                            borderRadius: BorderRadius.circular(999),
                                            border: Border.all(
                                              color: const Color(0xFF7C3AED),
                                            ),
                                          ),
                                          child: Text(
                                            'HĐ #${pc.id}',
                                            style: TextStyle(
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.w700,
                                              color: selected
                                                  ? Palette.white
                                                  : const Color(0xFF5B21B6),
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  }),
                                ],
                              ),
                            ),
                            const SizedBox(height: 6),
                          ],
                          Row(
                            children: [
                              const Icon(
                                CupertinoIcons.layers_alt_fill,
                                size: 14,
                                color: Color(0xFF7C3AED),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: GestureDetector(
                                  key: const Key('chat-collapsible-contract-strip'),
                                  onTap: () => setState(
                                    () => _contractContextExpanded =
                                        !_contractContextExpanded,
                                  ),
                                  child: Text(
                                    isWaitingCustomer
                                        ? '[HĐ #$cid] $cTitle • Chờ bạn duyệt (Tầng 1) ${_contractContextExpanded ? "▴" : "▾"}'
                                        : '[HĐ #$cid] $cTitle • $badgeLabel ${_contractContextExpanded ? "▴" : "▾"}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF5B21B6),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              if (widget.onOpenContractRoadmap != null)
                                FilledButton.icon(
                                  key: const Key('chat-open-contract-roadmap-btn'),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: const Color(0xFF7C3AED),
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                  ),
                                  onPressed: () {
                                    Navigator.pop(context);
                                    widget.onOpenContractRoadmap!(cid);
                                  },
                                  icon: const Icon(
                                    CupertinoIcons.doc_text_search,
                                    size: 12,
                                  ),
                                  label: Text(
                                    isWaitingCustomer
                                        ? 'Duyệt HĐ (#$cid)'
                                        : 'Lộ trình (#$cid)',
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                ),
                            ],
                          ),
                          if (_contractContextExpanded && _linkedContract != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              'Tổng ngân sách: ${_linkedContract!.totalAmount.round()} đ · Số mốc: ${_linkedContract!.milestones.isNotEmpty ? _linkedContract!.milestones.length : 1} mốc${_linkedContract!.description != null && _linkedContract!.description!.trim().isNotEmpty ? "\n${_linkedContract!.description!.trim()}" : ""}',
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: Color(0xFF4C1D95),
                                height: 1.35,
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
              ],

              // Messages
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : visibleMessages.isEmpty
                        ? const Center(
                            child: Text(
                              'Chưa có tin nhắn nào trong cuộc trò chuyện này.',
                              style: TextStyle(color: Palette.muted, fontSize: 13),
                            ),
                          )
                        : ListView.separated(
                            controller: _scrollCtrl,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            itemCount: visibleMessages.length + (hasOlderMessages ? 1 : 0),
                            separatorBuilder: (_, _) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              if (hasOlderMessages && index == 0) {
                                return Center(
                                  child: TextButton.icon(
                                    key: const Key('chat-load-older-messages-btn'),
                                    onPressed: () {
                                      setState(() {
                                        _visibleCount = (_visibleCount + 15).clamp(
                                          15,
                                          _messages.length,
                                        );
                                      });
                                    },
                                    icon: const Icon(CupertinoIcons.arrow_up_circle, size: 14),
                                    label: Text(
                                      'Xem thêm tin nhắn cũ (${_messages.length - visibleMessages.length})',
                                      style: const TextStyle(fontSize: 11.5),
                                    ),
                                  ),
                                );
                              }
                              final m = visibleMessages[hasOlderMessages ? index - 1 : index];
                              final hasImg = m.imageUrl != null && m.imageUrl!.trim().isNotEmpty;
                              return Align(
                                alignment: m.isMe ? Alignment.centerRight : Alignment.centerLeft,
                                child: Container(
                                  constraints: BoxConstraints(
                                    maxWidth: MediaQuery.sizeOf(context).width * 0.74,
                                  ),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: m.isMe ? Palette.red : Palette.soft,
                                    borderRadius: BorderRadius.only(
                                      topLeft: const Radius.circular(12),
                                      topRight: const Radius.circular(12),
                                      bottomLeft: Radius.circular(m.isMe ? 12 : 2),
                                      bottomRight: Radius.circular(m.isMe ? 2 : 12),
                                    ),
                                    border: Border.all(
                                      color: m.isMe ? Palette.red : Palette.line,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            m.senderName,
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: m.isMe ? Palette.white.withValues(alpha: 0.9) : Palette.ink,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            m.timestamp,
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: m.isMe ? Palette.white.withValues(alpha: 0.7) : Palette.muted,
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (hasImg) ...[
                                        const SizedBox(height: 6),
                                        GestureDetector(
                                          key: Key('chat-msg-image-${m.id}'),
                                          onTap: () {
                                            if (m.imageUrl!.startsWith('http')) {
                                              _openImageLightbox(m.imageUrl!);
                                            }
                                          },
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(8),
                                            child: m.imageUrl!.startsWith('data:image/')
                                                ? Image.memory(
                                                    base64Decode(m.imageUrl!.split(',').last),
                                                    height: 150,
                                                    fit: BoxFit.cover,
                                                  )
                                                : Image.network(
                                                    m.imageUrl!,
                                                    height: 150,
                                                    fit: BoxFit.cover,
                                                    errorBuilder: (_, _, _) => Container(
                                                      padding: const EdgeInsets.all(8),
                                                      color: Colors.black12,
                                                      child: Text(
                                                        'Ảnh đính kèm: ${m.imageUrl}',
                                                        style: TextStyle(
                                                          fontSize: 11,
                                                          color: m.isMe ? Palette.white : Palette.ink,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                          ),
                                        ),
                                      ],
                                      if (m.text.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          m.text,
                                          style: TextStyle(
                                            fontSize: 13,
                                            height: 1.45,
                                            color: m.isMe ? Palette.white : Palette.ink,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
              ),

              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(_error!, style: const TextStyle(color: Palette.red, fontSize: 12)),
                ),

              // Pending Image Preview (Section 4.2)
              if (_pendingImageBytes != null)
                Container(
                  key: const Key('chat-pending-image-preview'),
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Palette.soft,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Palette.line),
                  ),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.memory(
                          _pendingImageBytes!,
                          width: 44,
                          height: 44,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _pendingImageName ?? 'Ảnh đính kèm',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                      IconButton(
                        key: const Key('chat-remove-pending-image-btn'),
                        visualDensity: VisualDensity.compact,
                        onPressed: () => setState(() {
                          _pendingImageBytes = null;
                          _pendingImageName = null;
                        }),
                        icon: const Icon(CupertinoIcons.xmark_circle_fill, size: 18, color: Palette.red),
                      ),
                    ],
                  ),
                ),

              const Divider(height: 1),
              const SizedBox(height: 10),

              // Read-Only Archive Mode hoặc Bottom Input (Section 4.2 & 6.4.6)
              if (_isReadOnlyArchive)
                Container(
                  key: const Key('chat-readonly-archive-bar'),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Palette.soft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Palette.line),
                  ),
                  child: Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(CupertinoIcons.archivebox_fill, size: 15, color: Palette.muted),
                          SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              'Phiên làm việc đã kết thúc — Chỉ xem lịch sử trò chuyện',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Palette.muted,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (widget.senderRole != 'CREATOR' && widget.onCreateNewCommission != null)
                        FilledButton.icon(
                          key: const Key('chat-archive-new-commission-btn'),
                          style: FilledButton.styleFrom(
                            backgroundColor: Palette.red,
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: () {
                            Navigator.pop(context);
                            widget.onCreateNewCommission!();
                          },
                          icon: const Icon(CupertinoIcons.add_circled_solid, size: 13),
                          label: const Text(
                            'Đặt làm nội dung mới',
                            style: TextStyle(fontSize: 11.5),
                          ),
                        ),
                    ],
                  ),
                )
              else
                Row(
                  children: [
                    IconButton(
                      key: const Key('chat-pick-image-btn'),
                      tooltip: 'Đính kèm ảnh (tối đa 10MB)',
                      onPressed: (_loading || _sending || _uploadingImage) ? null : _pickChatImage,
                      icon: _uploadingImage
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(CupertinoIcons.photo_on_rectangle, size: 20, color: Palette.ink),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: TextField(
                        key: const Key('chat-message-input'),
                        controller: _msgCtrl,
                        enabled: !_loading,
                        decoration: InputDecoration(
                          hintText: 'Nhắn tin thương lượng, bản thu, kịch bản…',
                          hintStyle: const TextStyle(fontSize: 13, color: Palette.muted),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          filled: true,
                          fillColor: Palette.soft,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: const BorderSide(color: Palette.line),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: const BorderSide(color: Palette.line),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: const BorderSide(color: Palette.red),
                          ),
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      key: const Key('chat-message-send-btn'),
                      style: FilledButton.styleFrom(
                        backgroundColor: Palette.red,
                        shape: const CircleBorder(),
                        padding: const EdgeInsets.all(12),
                      ),
                      onPressed: _loading ? null : _sendMessage,
                      child: const Icon(CupertinoIcons.paperplane_fill, size: 16, color: Palette.white),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Trung tâm Trò chuyện Tuyển dụng & Hợp đồng (Chat Hub)
/// Mở từ nút "Trò chuyện" cạnh nút "Đăng tin"
class CreatorFreelancerChatHubSheet extends StatefulWidget {
  const CreatorFreelancerChatHubSheet({
    super.key,
    this.chatRepository,
    this.contractRepository,
    this.hireRequestRepository,
    this.postRepository,
    this.myPosts = const [],
    this.myApplications = const [],
    this.sentCommissions = const [],
    this.receivedCommissions = const [],
    this.contractOrders = const [],
    this.preferences,
    this.isCreator = true,
    this.currentUserName = 'Tôi',
    this.onOpenContractRoadmap,
  });

  final ChatRepository? chatRepository;
  final ContractRepository? contractRepository;
  final HireRequestRepository? hireRequestRepository;
  final PostRepository? postRepository;
  final List<PostModel> myPosts;
  final List<ApplicationModel> myApplications;
  final List<HireRequestModel> sentCommissions;
  final List<HireRequestModel> receivedCommissions;
  final List<ContractOrder> contractOrders;
  final SharedPreferences? preferences;
  final bool isCreator;
  final String currentUserName;
  final ValueChanged<int>? onOpenContractRoadmap;

  @override
  State<CreatorFreelancerChatHubSheet> createState() => _CreatorFreelancerChatHubSheetState();
}

class _CreatorFreelancerChatHubSheetState extends State<CreatorFreelancerChatHubSheet> {
  int _activeTab = 0; // 0: Tất cả, 1: Hợp đồng, 2: Đơn đặt nội dung, 3: Kết nối nhanh
  String _viewFilter = 'ALL'; // 'ALL' (Tất cả) | 'BY_PARTNER' (Theo khách) | 'ACTIVE' (Đang chạy) | 'ENDED' (Kết thúc)
  final _quickContractCtrl = TextEditingController();
  final _quickPostCtrl = TextEditingController();
  final _quickApplicantCtrl = TextEditingController();
  List<ContractModel> _remoteContracts = [];
  List<HireRequestModel> _remoteCommissions = [];

  @override
  void initState() {
    super.initState();
    _remoteCommissions = [
      ...widget.sentCommissions,
      ...widget.receivedCommissions,
    ];
    _fetchContracts();
  }

  @override
  void dispose() {
    _quickContractCtrl.dispose();
    _quickPostCtrl.dispose();
    _quickApplicantCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchContracts() async {
    if (widget.contractRepository != null) {
      try {
        final list = await widget.contractRepository!.getMyContracts();
        if (mounted) setState(() => _remoteContracts = list);
      } catch (_) {}
    }
    if (widget.hireRequestRepository != null) {
      try {
        final results = await Future.wait([
          widget.hireRequestRepository!.getMySent(),
          widget.hireRequestRepository!.getMyReceived(),
        ]);
        final merged = <int, HireRequestModel>{};
        for (final item in [...results[0], ...results[1]]) {
          merged[item.id] = item;
        }
        if (mounted) {
          setState(() => _remoteCommissions = merged.values.toList());
        }
      } catch (_) {}
    }
  }

  void _openChatWithContract({
    required int contractId,
    required String title,
    String? partnerName,
    String? contractStatus,
  }) {
    Navigator.pop(context); // Đóng hub
    showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (_) => CreatorFreelancerChatSheet(
        chatRepository: widget.chatRepository,
        contractRepository: widget.contractRepository,
        contractId: contractId,
        contractStatus: contractStatus,
        contextTitle: 'Hợp đồng: $title',
        partnerName: partnerName,
        senderRole: widget.isCreator ? 'CREATOR' : 'CUSTOMER',
        senderName: widget.currentUserName,
        preferences: widget.preferences,
        onOpenContractRoadmap: widget.onOpenContractRoadmap,
      ),
    );
  }

  void _openChatWithCommission(HireRequestModel item) {
    Navigator.pop(context); // Đóng hub
    showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (_) => CreatorFreelancerChatSheet(
        chatRepository: widget.chatRepository,
        contractRepository: widget.contractRepository,
        hireRequestId: item.id,
        contractId: item.contractId,
        commissionStatus: item.status,
        topicTitle: item.title,
        channelName: item.channelName,
        partnerName: item.creatorFullName ?? item.effectiveRequesterName,
        senderRole: widget.isCreator ? 'CREATOR' : 'CUSTOMER',
        senderName: widget.currentUserName,
        preferences: widget.preferences,
        onOpenContractRoadmap: widget.onOpenContractRoadmap,
      ),
    );
  }

  void _openChatWithApplicant({
    required int postId,
    required int applicantId,
    String? applicantName,
    String? postTitle,
  }) {
    Navigator.pop(context); // Đóng hub
    showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (_) => CreatorFreelancerChatSheet(
        chatRepository: widget.chatRepository,
        postId: postId,
        applicantId: applicantId,
        contextTitle: postTitle != null ? 'Bài đăng #$postId: $postTitle' : 'Bài đăng #$postId',
        partnerName: applicantName,
        senderRole: widget.isCreator ? 'CREATOR' : 'FREELANCER',
        senderName: widget.currentUserName,
        preferences: widget.preferences,
      ),
    );
  }

  bool _matchesStatusFilter(String rawStatus) {
    final s = rawStatus.toUpperCase();
    final isEnded = s == 'COMPLETED' || s == 'CANCELLED';
    if (_viewFilter == 'ACTIVE') return !isEnded;
    if (_viewFilter == 'ENDED') return isEnded;
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final totalContracts = _remoteContracts.isNotEmpty ? _remoteContracts.length : widget.contractOrders.length;
    final totalApps = _remoteCommissions.length + widget.myApplications.length + widget.myPosts.fold<int>(0, (sum, p) => sum + p.applicationCount);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.85,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag Handle
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

              // Title Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hội thoại Tuyển dụng & Hợp đồng', style: editorial(21)),
                        const SizedBox(height: 2),
                        const Text(
                          'Phòng chat 1-1 xác thực giữa Khách đặt nội dung và Creator',
                          style: TextStyle(fontSize: 12, color: Palette.muted),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    key: const Key('close-chat-hub-btn'),
                    tooltip: 'Đóng',
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(CupertinoIcons.xmark, size: 18),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // 4 Tab lọc nằm gọn trên 1 hàng ngang (Không thanh cuộn ngang - Section 6.4.6)
              Row(
                children: [
                  Expanded(
                    child: _buildCompactFilterTab(
                      key: const Key('chat-hub-filter-all'),
                      label: 'Tất cả',
                      selected: _viewFilter == 'ALL' && _activeTab != 3,
                      onTap: () => setState(() {
                        _viewFilter = 'ALL';
                        if (_activeTab == 3) _activeTab = 0;
                      }),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _buildCompactFilterTab(
                      key: const Key('chat-hub-filter-partner'),
                      label: 'Theo khách',
                      selected: _viewFilter == 'BY_PARTNER' && _activeTab != 3,
                      onTap: () => setState(() {
                        _viewFilter = 'BY_PARTNER';
                        if (_activeTab == 3) _activeTab = 0;
                      }),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _buildCompactFilterTab(
                      key: const Key('chat-hub-filter-active'),
                      label: 'Đang chạy',
                      selected: _viewFilter == 'ACTIVE' && _activeTab != 3,
                      onTap: () => setState(() {
                        _viewFilter = 'ACTIVE';
                        if (_activeTab == 3) _activeTab = 0;
                      }),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _buildCompactFilterTab(
                      key: const Key('chat-hub-filter-ended'),
                      label: 'Kết thúc',
                      selected: _viewFilter == 'ENDED' && _activeTab != 3,
                      onTap: () => setState(() {
                        _viewFilter = 'ENDED';
                        if (_activeTab == 3) _activeTab = 0;
                      }),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Category Row (giữ đầy đủ keys cho widget test & kết nối ID nhanh)
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  ChoiceChip(
                    key: const Key('chat-hub-tab-all'),
                    label: const Text('Mọi nguồn', style: TextStyle(fontSize: 11)),
                    selected: _activeTab == 0,
                    visualDensity: VisualDensity.compact,
                    onSelected: (_) => setState(() => _activeTab = 0),
                  ),
                  ChoiceChip(
                    key: const Key('chat-hub-tab-contracts'),
                    label: Text('HĐ ($totalContracts)', style: const TextStyle(fontSize: 11)),
                    selected: _activeTab == 1,
                    visualDensity: VisualDensity.compact,
                    onSelected: (_) => setState(() => _activeTab = 1),
                  ),
                  ChoiceChip(
                    key: const Key('chat-hub-tab-apps'),
                    label: Text('Đơn ($totalApps)', style: const TextStyle(fontSize: 11)),
                    selected: _activeTab == 2,
                    visualDensity: VisualDensity.compact,
                    onSelected: (_) => setState(() => _activeTab = 2),
                  ),
                  ChoiceChip(
                    key: const Key('chat-hub-tab-quick'),
                    label: const Text('Kết nối ID ⚡', style: TextStyle(fontSize: 11)),
                    selected: _activeTab == 3,
                    visualDensity: VisualDensity.compact,
                    onSelected: (_) => setState(() => _activeTab = 3),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Divider(height: 1),

              // Content Body
              Expanded(
                child: _activeTab == 3
                    ? _buildQuickConnectTab()
                    : _buildConversationsList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompactFilterTab({
    required Key key,
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      key: key,
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 7),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? Palette.red : Palette.soft,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: selected ? Palette.red : Palette.line),
        ),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: selected ? Palette.white : Palette.ink,
          ),
        ),
      ),
    );
  }

  Widget _buildConversationsList() {
    final showContracts = _activeTab == 0 || _activeTab == 1;
    final showApps = _activeTab == 0 || _activeTab == 2;

    final filteredContracts = _remoteContracts
        .where((c) => _matchesStatusFilter(c.status))
        .toList();
    final filteredCommissions = _remoteCommissions
        .where((c) => _matchesStatusFilter(c.status))
        .toList();

    final hasContracts = filteredContracts.isNotEmpty || widget.contractOrders.isNotEmpty;
    final hasCommissions = filteredCommissions.isNotEmpty;
    final hasApps = hasCommissions || widget.myApplications.isNotEmpty || widget.myPosts.any((p) => p.applicationCount > 0);

    if (!hasContracts && !hasApps) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Palette.red.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(CupertinoIcons.chat_bubble_2, color: Palette.red, size: 28),
              ),
              const SizedBox(height: 16),
              Text('Chưa có hội thoại nào', style: editorial(19)),
              const SizedBox(height: 8),
              const Text(
                'Bạn chưa có hợp đồng hoặc đơn đặt nội dung nào mở phòng chat. Bạn có thể chuyển sang tab "Kết nối ID ⚡" để mở phòng chat trực tiếp với bất kỳ ID nào.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12.5, color: Palette.muted, height: 1.5),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                key: const Key('switch-quick-connect-btn'),
                style: FilledButton.styleFrom(backgroundColor: Palette.red),
                onPressed: () => setState(() => _activeTab = 3),
                icon: const Icon(CupertinoIcons.bolt_fill, size: 14),
                label: const Text('Mở kết nối ID nhanh'),
              ),
            ],
          ),
        ),
      );
    }

    if (_viewFilter == 'BY_PARTNER' && filteredContracts.isNotEmpty) {
      final grouped = <String, List<ContractModel>>{};
      for (final c in filteredContracts) {
        final pName = widget.isCreator
            ? c.effectiveRequesterName
            : (c.creatorFullName ?? 'Creator #${c.creatorId}');
        grouped.putIfAbsent(pName, () => []).add(c);
      }
      return ListView(
        padding: const EdgeInsets.symmetric(vertical: 12),
        children: grouped.entries.map((entry) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Eyebrow('ĐỐI TÁC: ${entry.key.toUpperCase()} (${entry.value.length} HỢP ĐỒNG)'),
              const SizedBox(height: 8),
              ...entry.value.map((c) => _buildRemoteContractCard(c)),
              const SizedBox(height: 12),
            ],
          );
        }).toList(),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 12),
      children: [
        // Hợp đồng
        if (showContracts && hasContracts) ...[
          const Eyebrow('HỢP ĐỒNG & LỘ TRÌNH MILESTONE'),
          const SizedBox(height: 8),
          if (filteredContracts.isNotEmpty)
            ...filteredContracts.map((c) => _buildRemoteContractCard(c))
          else
            ...widget.contractOrders.map((o) => _buildContractOrderCard(o)),
          const SizedBox(height: 16),
        ],

        // Đơn đặt làm nội dung (Commission)
        if (showApps && hasCommissions) ...[
          const Eyebrow('ĐƠN ĐẶT LÀM NỘI DUNG (COMMISSION)'),
          const SizedBox(height: 8),
          ...filteredCommissions.map((comm) {
            final cid = comm.contractId;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Palette.soft,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Palette.line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Đơn #${comm.id}: ${comm.title ?? "Đặt làm nội dung"}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'Kênh: ${comm.channelName ?? "Sử Ký"} · Trạng thái: ${comm.status}${cid != null ? " · Hợp đồng #$cid" : ""}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11.5, color: Palette.muted),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      if (cid != null && widget.onOpenContractRoadmap != null)
                        FilledButton.icon(
                          key: Key('hub-commission-open-contract-$cid'),
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF7C3AED),
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: () {
                            Navigator.pop(context);
                            widget.onOpenContractRoadmap!(cid);
                          },
                          icon: const Icon(CupertinoIcons.layers_alt_fill, size: 12),
                          label: Text(
                            'Xem & Duyệt Hợp đồng (#$cid)',
                            style: const TextStyle(fontSize: 11.5),
                          ),
                        ),
                      OutlinedButton.icon(
                        key: Key('hub-chat-commission-${comm.id}'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Palette.red,
                          side: const BorderSide(color: Palette.red),
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: () => _openChatWithCommission(comm),
                        icon: const Icon(CupertinoIcons.chat_bubble_2_fill, size: 12),
                        label: const Text('Phòng Chat 1-1', style: TextStyle(fontSize: 11.5)),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
        ],

        // Ứng tuyển bài đăng của tôi
        if (showApps && widget.myPosts.any((p) => p.applicationCount > 0)) ...[
          const Eyebrow('ỨNG VIÊN BÀI ĐĂNG CỦA TÔI'),
          const SizedBox(height: 8),
          ...widget.myPosts.where((p) => p.applicationCount > 0).map(
            (p) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Palette.soft,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Palette.line),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Palette.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(CupertinoIcons.person_2_fill, color: Palette.red, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Bài đăng #${p.id}: ${p.title}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 3),
                        Text('${p.applicationCount} ứng viên đang chờ trao đổi', style: const TextStyle(fontSize: 11.5, color: Palette.muted)),
                      ],
                    ),
                  ),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Palette.red,
                      side: const BorderSide(color: Palette.red),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      visualDensity: VisualDensity.compact,
                    ),
                    onPressed: () {
                      _openChatWithApplicant(
                        postId: p.id,
                        applicantId: 1,
                        postTitle: p.title,
                        applicantName: 'Ứng viên bài #${p.id}',
                      );
                    },
                    child: const Text('Nhắn tin', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Đơn đã nộp của tôi (vai trò Freelancer)
        if (showApps && widget.myApplications.isNotEmpty) ...[
          const Eyebrow('ĐƠN ĐÃ NỘP CỦA TÔI (FREELANCER)'),
          const SizedBox(height: 8),
          ...widget.myApplications.map(
            (app) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Palette.soft,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Palette.line),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2E7D32).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(CupertinoIcons.paperplane_fill, color: Color(0xFF2E7D32), size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Bài đăng #${app.postId}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 3),
                        Text('Trạng thái: ${app.status}', style: const TextStyle(fontSize: 11.5, color: Palette.muted)),
                      ],
                    ),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: Palette.red,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      visualDensity: VisualDensity.compact,
                    ),
                    onPressed: () {
                      _openChatWithApplicant(
                        postId: app.postId,
                        applicantId: app.applicantId,
                        applicantName: 'Creator bài #${app.postId}',
                      );
                    },
                    child: const Text('Chat với Creator', style: TextStyle(fontSize: 11.5)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildRemoteContractCard(ContractModel c) {
    final partnerName = widget.isCreator ? (c.effectiveRequesterName) : (c.creatorFullName ?? 'Creator #${c.creatorId}');
    final badgeLabel = _shortContractStatusLabel(c.status);
    final isEnded = c.status.toUpperCase() == 'COMPLETED' || c.status.toUpperCase() == 'CANCELLED';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
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
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Palette.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(CupertinoIcons.doc_text_fill, color: Palette.red, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hợp đồng #${c.id}: ${c.title}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 3),
                    // Section 6.4.6: Không hiển thị số tiền hợp đồng và chữ tĩnh "Đang kết nối"
                    Text(
                      'Đối tác: $partnerName · $badgeLabel',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11.5, color: Palette.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              if (widget.onOpenContractRoadmap != null)
                FilledButton.icon(
                  key: Key('hub-open-contract-roadmap-${c.id}'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: () {
                    Navigator.pop(context);
                    widget.onOpenContractRoadmap!(c.id);
                  },
                  icon: const Icon(CupertinoIcons.layers_alt_fill, size: 12),
                  label: Text(
                    c.status.toUpperCase() == 'PENDING'
                        ? 'Xem & Duyệt Hợp đồng (#${c.id})'
                        : 'Mở Lộ trình Hợp đồng (#${c.id})',
                    style: const TextStyle(fontSize: 11.5),
                  ),
                ),
              FilledButton.icon(
                key: Key('chat-contract-${c.id}'),
                style: FilledButton.styleFrom(
                  backgroundColor: Palette.red,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: () => _openChatWithContract(
                  contractId: c.id,
                  title: c.title,
                  partnerName: partnerName,
                  contractStatus: c.status,
                ),
                icon: const Icon(CupertinoIcons.chat_bubble_fill, size: 12),
                label: Text(
                  isEnded ? 'Xem lịch sử chat' : 'Mở chat',
                  style: const TextStyle(fontSize: 11.5),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContractOrderCard(ContractOrder o) {
    final partnerName = widget.isCreator ? o.narratorName : o.channelName;
    final numericId = int.tryParse(o.id.replaceAll(RegExp(r'[^0-9]'), '')) ?? 1;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Palette.soft,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Palette.line),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Palette.red.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(CupertinoIcons.doc_text_fill, color: Palette.red, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(o.draftTitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 3),
                Text('Đối tác: $partnerName · ${o.status.label}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11.5, color: Palette.muted)),
              ],
            ),
          ),
          FilledButton.icon(
            key: Key('chat-order-${o.id}'),
            style: FilledButton.styleFrom(
              backgroundColor: Palette.red,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              visualDensity: VisualDensity.compact,
            ),
            onPressed: () => _openChatWithContract(
              contractId: numericId,
              title: o.draftTitle,
              partnerName: partnerName,
            ),
            icon: const Icon(CupertinoIcons.chat_bubble_fill, size: 12),
            label: const Text('Mở chat', style: TextStyle(fontSize: 11.5)),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickConnectTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Palette.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(CupertinoIcons.bolt_fill, size: 16, color: Palette.red),
                    const SizedBox(width: 8),
                    Text('Kết nối nhanh theo Hợp đồng', style: editorial(16)),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Nhập contractId để gọi API POST /api/v1/chats/conversation',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
                const SizedBox(height: 12),
                TextField(
                  key: const Key('quick-contract-id-input'),
                  controller: _quickContractCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Mã hợp đồng (contractId)',
                    hintText: 'Ví dụ: 1',
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    key: const Key('quick-connect-contract-btn'),
                    style: FilledButton.styleFrom(backgroundColor: Palette.red),
                    onPressed: () {
                      final id = int.tryParse(_quickContractCtrl.text.trim());
                      if (id != null) {
                        _openChatWithContract(contractId: id, title: 'Hợp đồng #$id');
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Vui lòng nhập contractId hợp lệ')),
                        );
                      }
                    },
                    icon: const Icon(CupertinoIcons.chat_bubble_2_fill, size: 14),
                    label: const Text('Mở phòng chat Hợp đồng'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Palette.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(CupertinoIcons.person_2_fill, size: 16, color: Color(0xFF2E7D32)),
                    const SizedBox(width: 8),
                    Text('Kết nối nhanh theo Ứng tuyển', style: editorial(16)),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Nhập postId và applicantId để xác thực phòng chat',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
                const SizedBox(height: 12),
                TextField(
                  key: const Key('quick-post-id-input'),
                  controller: _quickPostCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Mã bài đăng (postId)',
                    hintText: 'Ví dụ: 1',
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  key: const Key('quick-applicant-id-input'),
                  controller: _quickApplicantCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Mã ứng viên (applicantId)',
                    hintText: 'Ví dụ: 3',
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    key: const Key('quick-connect-applicant-btn'),
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF2E7D32)),
                    onPressed: () {
                      final pid = int.tryParse(_quickPostCtrl.text.trim());
                      final aid = int.tryParse(_quickApplicantCtrl.text.trim());
                      if (pid != null && aid != null) {
                        _openChatWithApplicant(postId: pid, applicantId: aid);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Vui lòng nhập postId và applicantId hợp lệ')),
                        );
                      }
                    },
                    icon: const Icon(CupertinoIcons.chat_bubble_2_fill, size: 14),
                    label: const Text('Mở phòng chat Ứng tuyển'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
