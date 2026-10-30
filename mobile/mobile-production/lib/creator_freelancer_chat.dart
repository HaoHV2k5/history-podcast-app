import 'dart:async';
import 'dart:convert';
import 'dart:ui';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'components.dart';
import 'core/api/chat_repository.dart';
import 'core/api/contract_repository.dart';
import 'core/api/post_repository.dart';
import 'design.dart';
import 'mock/services/narrator_state.dart';

class ChatMessageItem {
  final String id;
  final String senderRole; // 'CREATOR' | 'FREELANCER' | 'NARRATOR'
  final String senderName;
  final String text;
  final String timestamp;
  final bool isMe;

  ChatMessageItem({
    required this.id,
    required this.senderRole,
    required this.senderName,
    required this.text,
    required this.timestamp,
    required this.isMe,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'senderRole': senderRole,
    'senderName': senderName,
    'text': text,
    'timestamp': timestamp,
    'isMe': isMe,
  };

  factory ChatMessageItem.fromJson(Map<String, dynamic> json) => ChatMessageItem(
    id: (json['id'] ?? '').toString(),
    senderRole: (json['senderRole'] ?? 'CREATOR').toString(),
    senderName: (json['senderName'] ?? '').toString(),
    text: (json['text'] ?? '').toString(),
    timestamp: (json['timestamp'] ?? '').toString(),
    isMe: json['isMe'] == true,
  );
}

/// Phòng chat trực tiếp giữa Creator và Freelancer (Narrator)
/// Kết nối API: POST /api/v1/chats/conversation
class CreatorFreelancerChatSheet extends StatefulWidget {
  const CreatorFreelancerChatSheet({
    super.key,
    this.chatRepository,
    this.contractId,
    this.collaborationId,
    this.postId,
    this.applicantId,
    this.partnerName,
    this.partnerRole,
    this.partnerAvatarUrl,
    this.contextTitle,
    this.senderRole = 'CREATOR',
    this.senderName = 'Tôi',
    this.preferences,
  });

  final ChatRepository? chatRepository;
  final int? contractId;
  final int? collaborationId;
  final int? postId;
  final int? applicantId;
  final String? partnerName;
  final String? partnerRole;
  final String? partnerAvatarUrl;
  final String? contextTitle;
  final String senderRole;
  final String senderName;
  final SharedPreferences? preferences;

  @override
  State<CreatorFreelancerChatSheet> createState() => _CreatorFreelancerChatSheetState();
}

class _CreatorFreelancerChatSheetState extends State<CreatorFreelancerChatSheet> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  Timer? _replyTimer;
  bool _loading = true;
  bool _sending = false;
  String? _error;
  ChatConversationModel? _conversation;
  List<ChatMessageItem> _messages = [];

  String get _storageKey {
    final convId = _conversation?.conversationId ??
        (widget.contractId != null
            ? 'contract_${widget.contractId}'
            : 'post_${widget.postId}_applicant_${widget.applicantId}');
    return 'chat_messages_v1_$convId';
  }

  @override
  void initState() {
    super.initState();
    _initConversation();
  }

  @override
  void dispose() {
    _replyTimer?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _initConversation() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      if (widget.chatRepository != null) {
        final conv = await widget.chatRepository!.getOrCreateConversation(
          contractId: widget.contractId,
          collaborationId: widget.collaborationId,
          postId: widget.postId,
          applicantId: widget.applicantId,
        );
        _conversation = conv;
      }
    } catch (e) {
      // Fallback model nếu offline hoặc test
      final isContract = widget.contractId != null || widget.collaborationId != null;
      final cid = widget.contractId ?? widget.collaborationId;
      _conversation = ChatConversationModel(
        conversationId: isContract
            ? 'contract_$cid'
            : 'post_${widget.postId}_applicant_${widget.applicantId}',
        partnerId: 2,
        partnerName: widget.partnerName ?? (isContract ? 'Đối tác hợp đồng' : 'Ứng viên #${widget.applicantId}'),
        partnerRole: widget.partnerRole ?? (widget.senderRole == 'CREATOR' ? 'FREELANCER' : 'CREATOR'),
        partnerAvatarUrl: widget.partnerAvatarUrl,
        contextType: isContract ? 'CONTRACT' : 'APPLICATION',
        contextId: isContract ? cid : widget.postId,
      );
    }

    _loadMessages();

    if (mounted) {
      setState(() => _loading = false);
      _scrollToBottom();
    }
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

    // Default welcome messages
    final partnerDisplay = _conversation?.partnerName ?? widget.partnerName ?? 'Đối tác';
    final isContract = widget.contractId != null || widget.collaborationId != null;
    _messages = [
      ChatMessageItem(
        id: 'welcome-1',
        senderRole: _conversation?.partnerRole ?? 'FREELANCER',
        senderName: partnerDisplay,
        text: isContract
            ? 'Xin chào! Tôi đã nhận thông tin về hợp đồng #${widget.contractId ?? widget.collaborationId}. Rất sẵn lòng trao đổi về yêu cầu thu âm và tiến độ dự án!'
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

  Future<void> _sendMessage() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _sending) return;

    final now = DateTime.now();
    final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    final myMsg = ChatMessageItem(
      id: 'msg-${now.microsecondsSinceEpoch}',
      senderRole: widget.senderRole,
      senderName: widget.senderName.trim().isEmpty ? 'Tôi' : widget.senderName.trim(),
      text: text,
      timestamp: timeStr,
      isMe: true,
    );

    setState(() {
      _messages.add(myMsg);
      _msgCtrl.clear();
      _sending = true;
    });

    await _saveMessages();
    _scrollToBottom();

    // Mô phỏng phản hồi từ đối tác sau 1 giây nếu không có backend socket
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
  }

  @override
  Widget build(BuildContext context) {
    final partnerName = _conversation?.partnerName ?? widget.partnerName ?? 'Đối tác';
    final partnerRole = _conversation?.partnerRole ?? widget.partnerRole ?? (widget.senderRole == 'CREATOR' ? 'FREELANCER' : 'CREATOR');
    final convId = _conversation?.conversationId ?? 'Đang xác thực…';

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          10,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 16,
        ),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.78,
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
                                partnerRole == 'CREATOR' ? 'CREATOR' : 'FREELANCER',
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
                                'Phòng chat: $convId',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Palette.muted,
                                  fontFeatures: [FontFeature.tabularFigures()],
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

              // Messages
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _messages.isEmpty
                        ? const Center(
                            child: Text(
                              'Chưa có tin nhắn nào trong cuộc trò chuyện này.',
                              style: TextStyle(color: Palette.muted, fontSize: 13),
                            ),
                          )
                        : ListView.separated(
                            controller: _scrollCtrl,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            itemCount: _messages.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final m = _messages[index];
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

              const Divider(height: 1),
              const SizedBox(height: 10),

              // Bottom Input
              Row(
                children: [
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
    this.postRepository,
    this.myPosts = const [],
    this.myApplications = const [],
    this.contractOrders = const [],
    this.preferences,
    this.isCreator = true,
    this.currentUserName = 'Tôi',
  });

  final ChatRepository? chatRepository;
  final ContractRepository? contractRepository;
  final PostRepository? postRepository;
  final List<PostModel> myPosts;
  final List<ApplicationModel> myApplications;
  final List<ContractOrder> contractOrders;
  final SharedPreferences? preferences;
  final bool isCreator;
  final String currentUserName;

  @override
  State<CreatorFreelancerChatHubSheet> createState() => _CreatorFreelancerChatHubSheetState();
}

class _CreatorFreelancerChatHubSheetState extends State<CreatorFreelancerChatHubSheet> {
  int _activeTab = 0; // 0: Tất cả, 1: Hợp đồng, 2: Ứng tuyển, 3: Kết nối nhanh
  final _quickContractCtrl = TextEditingController();
  final _quickPostCtrl = TextEditingController();
  final _quickApplicantCtrl = TextEditingController();
  bool _loading = false;
  List<ContractModel> _remoteContracts = [];

  @override
  void initState() {
    super.initState();
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
    if (widget.contractRepository == null) return;
    try {
      final list = await widget.contractRepository!.getMyContracts();
      if (mounted) setState(() => _remoteContracts = list);
    } catch (_) {}
  }

  void _openChatWithContract({
    required int contractId,
    required String title,
    String? partnerName,
  }) {
    Navigator.pop(context); // Đóng hub
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Palette.paper,
      builder: (_) => CreatorFreelancerChatSheet(
        chatRepository: widget.chatRepository,
        contractId: contractId,
        contextTitle: 'Hợp đồng: $title',
        partnerName: partnerName,
        senderRole: widget.isCreator ? 'CREATOR' : 'FREELANCER',
        senderName: widget.currentUserName,
        preferences: widget.preferences,
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

  @override
  Widget build(BuildContext context) {
    final totalContracts = _remoteContracts.isNotEmpty ? _remoteContracts.length : widget.contractOrders.length;
    final totalApps = widget.myApplications.length + widget.myPosts.fold<int>(0, (sum, p) => sum + p.applicationCount);

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
                          'Phòng chat xác thực giữa Creator và Freelancer',
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
              const SizedBox(height: 12),

              // Filter Tabs
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ChoiceChip(
                      key: const Key('chat-hub-tab-all'),
                      label: const Text('Tất cả'),
                      selected: _activeTab == 0,
                      onSelected: (_) => setState(() => _activeTab = 0),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      key: const Key('chat-hub-tab-contracts'),
                      label: Text('Hợp đồng ($totalContracts)'),
                      selected: _activeTab == 1,
                      onSelected: (_) => setState(() => _activeTab = 1),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      key: const Key('chat-hub-tab-apps'),
                      label: Text('Ứng tuyển ($totalApps)'),
                      selected: _activeTab == 2,
                      onSelected: (_) => setState(() => _activeTab = 2),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      key: const Key('chat-hub-tab-quick'),
                      label: const Text('Kết nối ID ⚡'),
                      selected: _activeTab == 3,
                      onSelected: (_) => setState(() => _activeTab = 3),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
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

  Widget _buildConversationsList() {
    final showContracts = _activeTab == 0 || _activeTab == 1;
    final showApps = _activeTab == 0 || _activeTab == 2;

    final hasContracts = _remoteContracts.isNotEmpty || widget.contractOrders.isNotEmpty;
    final hasApps = widget.myApplications.isNotEmpty || widget.myPosts.any((p) => p.applicationCount > 0);

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
                'Bạn chưa có hợp đồng hoặc ứng viên nào để mở phòng chat. Bạn có thể chuyển sang tab "Kết nối ID ⚡" để mở phòng chat trực tiếp với bất kỳ ID nào.',
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

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 12),
      children: [
        // Hợp đồng
        if (showContracts && hasContracts) ...[
          const Eyebrow('HỢP ĐỒNG CỘNG TÁC'),
          const SizedBox(height: 8),
          if (_remoteContracts.isNotEmpty)
            ..._remoteContracts.map((c) => _buildRemoteContractCard(c))
          else
            ...widget.contractOrders.map((o) => _buildContractOrderCard(o)),
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
    final partnerName = widget.isCreator ? (c.freelancerFullName ?? 'Freelancer #${c.freelancerId}') : (c.creatorFullName ?? 'Creator #${c.creatorId}');
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
                Text('Hợp đồng #${c.id}: ${c.title}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 3),
                Text('Đối tác: $partnerName · ${c.status}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11.5, color: Palette.muted)),
              ],
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
            ),
            icon: const Icon(CupertinoIcons.chat_bubble_fill, size: 12),
            label: const Text('Mở chat', style: TextStyle(fontSize: 11.5)),
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
