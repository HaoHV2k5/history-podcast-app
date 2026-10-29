import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'audience_pages.dart';
import 'components.dart';
import 'core/api/channel_repository.dart';
import 'core/api/livestream_repository.dart';
import 'design.dart';
import 'episode.dart';
import 'mock/services/app_state.dart';

class LivestreamShelfCard extends StatelessWidget {
  const LivestreamShelfCard({
    super.key,
    required this.session,
    required this.state,
  });

  final LivestreamSessionModel session;
  final AppState state;

  @override
  Widget build(BuildContext context) {
    final channelName = state.resolveLivestreamChannelName(session);
    return InkWell(
      key: Key('livestream-card-${session.id}'),
      borderRadius: BorderRadius.circular(8),
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute<void>(
          builder: (_) => LivestreamRoomPage(
            session: session,
            state: state,
          ),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Palette.paper,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Palette.red.withValues(alpha: 0.45)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Palette.red,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        CupertinoIcons.dot_radiowaves_left_right,
                        size: 12,
                        color: Palette.paper,
                      ),
                      SizedBox(width: 5),
                      Text(
                        'TRỰC TIẾP',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.1,
                          color: Palette.paper,
                        ),
                      ),
                    ],
                  ),
                ),
                if (session.isExclusive)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: Palette.line),
                    ),
                    child: const Text(
                      'PHÒNG HỘI VIÊN',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.0,
                        color: Palette.red,
                      ),
                    ),
                  ),
                Text(
                  '${session.viewerCount} người đang nghe',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Palette.muted,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(session.title, style: editorial(19)),
            if (session.description != null &&
                session.description!.trim().isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                session.description!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  color: Palette.muted,
                  height: 1.5,
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    channelName,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Palette.ink,
                    ),
                  ),
                ),
                const Text(
                  'Vào phòng nghe',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Palette.red,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  CupertinoIcons.arrow_right,
                  size: 14,
                  color: Palette.red,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ChannelLiveBanner extends StatelessWidget {
  const ChannelLiveBanner({
    super.key,
    required this.session,
    required this.state,
  });

  final LivestreamSessionModel session;
  final AppState state;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Palette.soft,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Palette.red.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                CupertinoIcons.dot_radiowaves_left_right,
                size: 16,
                color: Palette.red,
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'KÊNH ĐANG PHÁT SÓNG TRỰC TIẾP',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.3,
                    color: Palette.red,
                  ),
                ),
              ),
              Text(
                '${session.viewerCount} mắt xem',
                style: const TextStyle(
                  fontSize: 12,
                  color: Palette.muted,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(session.title, style: editorial(18)),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              key: Key('channel-join-live-${session.id}'),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => LivestreamRoomPage(
                    session: session,
                    state: state,
                  ),
                ),
              ),
              icon: const Icon(
                CupertinoIcons.headphones,
                size: 16,
              ),
              label: Text(
                session.isExclusive
                    ? 'Tham gia phòng Hội viên trực tiếp'
                    : 'Tham gia phòng phát sóng',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LivestreamRoomPage extends StatefulWidget {
  const LivestreamRoomPage({
    super.key,
    required this.session,
    required this.state,
    this.isHost = false,
  });

  final LivestreamSessionModel session;
  final AppState state;
  final bool isHost;

  @override
  State<LivestreamRoomPage> createState() => _LivestreamRoomPageState();
}

class _LivestreamRoomPageState extends State<LivestreamRoomPage> {
  final TextEditingController _chatCtrl = TextEditingController();
  Timer? _chatPollTimer;
  LivestreamTokenModel? _token;
  bool _joining = true;
  bool _memberRequired = false;
  String? _joinError;
  bool _joinedServer = false;
  bool _hostMicOn = true;
  bool _sendingChat = false;
  int _lastChatTimestamp = 0;

  LivestreamSessionModel get _currentSession {
    final idx = widget.state.activeLivestreams.indexWhere(
      (s) => s.id == widget.session.id,
    );
    return idx >= 0 ? widget.state.activeLivestreams[idx] : widget.session;
  }

  @override
  void initState() {
    super.initState();
    _enterRoom();
  }

  Future<void> _enterRoom() async {
    setState(() {
      _joining = true;
      _memberRequired = false;
      _joinError = null;
    });

    if (!widget.isHost &&
        widget.session.isExclusive &&
        !widget.state.canJoinLivestream(widget.session)) {
      if (mounted) {
        setState(() {
          _joining = false;
          _memberRequired = true;
        });
      }
      return;
    }

    try {
      final token = await widget.state.joinLivestream(
        widget.session,
        isHost: widget.isHost,
      );
      _joinedServer = true;
      await _pollChats();
      _chatPollTimer?.cancel();
      _chatPollTimer = Timer.periodic(
        const Duration(seconds: 2),
        (_) => _pollChats(),
      );
      if (mounted) {
        setState(() {
          _token = token;
          _joining = false;
        });
      }
    } catch (e) {
      final msg = e.toString();
      final isVipError = msg.contains('LIVESTREAM_MEMBER_REQUIRED') ||
          msg.contains('hội viên') ||
          msg.contains('403');
      if (mounted) {
        setState(() {
          _joining = false;
          _memberRequired = isVipError;
          if (!isVipError) {
            _joinError = msg
                .replaceFirst('Exception: ', '')
                .replaceFirst('StateError: ', '');
          }
        });
      }
    }
  }

  Future<void> _pollChats() async {
    if (!mounted) return;
    final list = await widget.state.fetchLivestreamChats(
      widget.session.id,
      since: _lastChatTimestamp,
    );
    if (list.isNotEmpty) {
      final maxTs = list
          .map((m) => m.timestamp)
          .reduce((a, b) => a > b ? a : b);
      if (maxTs > _lastChatTimestamp) {
        _lastChatTimestamp = maxTs;
      }
    }
    // Đồng bộ chi tiết phiên phát sóng từ backend GET /api/v1/livestreams/{id}
    try {
      final latest = await widget.state.fetchLivestreamSession(widget.session.id);
      if (latest != null && latest.status.toUpperCase() == 'ENDED' && mounted && !widget.isHost) {
        setState(() {
          _joinError = 'Phiên phát sóng đã kết thúc bởi người kể chuyện.';
        });
      }
    } catch (_) {}
  }

  Future<void> _sendMessage() async {
    final text = _chatCtrl.text.trim();
    if (text.isEmpty || _sendingChat) return;
    setState(() => _sendingChat = true);
    _chatCtrl.clear();
    try {
      final sent = await widget.state.sendLivestreamChat(
        widget.session.id,
        text,
        isHost: widget.isHost || _token?.role == 'PUBLISHER',
      );
      if (sent.timestamp > _lastChatTimestamp) {
        _lastChatTimestamp = sent.timestamp;
      }
    } finally {
      if (mounted) {
        setState(() => _sendingChat = false);
      }
    }
  }

  Future<void> _endSessionByHost() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Palette.paper,
        title: Text('Kết thúc phát sóng?', style: editorial(20)),
        content: const Text(
          'Phiên phát sóng trực tiếp sẽ khép lại và ngừng nhận kết nối mới từ thính giả.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Tiếp tục phát'),
          ),
          FilledButton(
            key: const Key('confirm-end-livestream-btn'),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Kết thúc ngay'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    _chatPollTimer?.cancel();
    _joinedServer = false;
    await widget.state.endLivestreamSession(widget.session.id);
    if (mounted) {
      Navigator.pop(context);
    }
  }

  @override
  void dispose() {
    _chatPollTimer?.cancel();
    _chatCtrl.dispose();
    if (_joinedServer) {
      widget.state.leaveLivestream(
        widget.session.id,
        reset: widget.isHost,
      );
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final channelName = widget.state.resolveLivestreamChannelName(
      widget.session,
    );
    final channel = channelByName(channelName);

    return AnimatedBuilder(
      animation: widget.state,
      builder: (context, _) {
        final session = _currentSession;
        final chats = widget.state.getLivestreamChats(session.id);

        if (_memberRequired) {
          return Scaffold(
            appBar: AppBar(title: const Text('Phòng phát sóng Hội viên')),
            body: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Eyebrow('PHÒNG TRỰC TIẾP ĐỘC QUYỀN · VIP'),
                  const SizedBox(height: 12),
                  Text(session.title, style: editorial(26)),
                  const SizedBox(height: 12),
                  Text(
                    'Phiên kể chuyện trực tiếp này dành riêng cho Hội viên đang hoạt động của kênh $channelName.',
                    style: const TextStyle(color: Palette.muted, height: 1.6),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              CupertinoIcons.lock_shield,
                              size: 18,
                              color: Palette.red,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Quyền lợi Hội viên kênh $channelName',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Tham gia mọi phòng phát sóng trực tiếp độc quyền, đặt câu hỏi trực tiếp cho người kể chuyện và nghe trọn vẹn kho tư liệu chuyên sâu.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Palette.muted,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      key: const Key('livestream-open-membership-btn'),
                      onPressed: () async {
                        await Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) => MembershipPage(
                              channel: channel,
                              state: widget.state,
                            ),
                          ),
                        );
                        if (mounted &&
                            widget.state.canJoinLivestream(session)) {
                          _enterRoom();
                        }
                      },
                      child: const Text('Mở quyền hội viên kênh'),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(channelName, style: const TextStyle(fontSize: 15)),
            actions: [
              if (widget.isHost || _token?.role == 'PUBLISHER')
                TextButton.icon(
                  key: const Key('end-livestream-btn'),
                  onPressed: _endSessionByHost,
                  icon: const Icon(
                    CupertinoIcons.stop_circle,
                    size: 16,
                    color: Palette.red,
                  ),
                  label: const Text(
                    'Kết thúc',
                    style: TextStyle(
                      color: Palette.red,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                margin: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Palette.ink,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Palette.red,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                CupertinoIcons.dot_radiowaves_left_right,
                                size: 12,
                                color: Palette.paper,
                              ),
                              SizedBox(width: 5),
                              Text(
                                'ĐANG PHÁT SÓNG',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 1.1,
                                  color: Palette.paper,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (session.isExclusive)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Palette.paper.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'HỘI VIÊN VIP',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Palette.paper,
                              ),
                            ),
                          ),
                        Text(
                          '${session.viewerCount} người đang nghe',
                          key: const Key('livestream-viewer-count'),
                          style: TextStyle(
                            fontSize: 12,
                            color: Palette.paper.withValues(alpha: 0.8),
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      session.title,
                      style: editorial(21, color: Palette.paper),
                    ),
                    if (session.description != null &&
                        session.description!.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        session.description!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Palette.paper.withValues(alpha: 0.75),
                          height: 1.5,
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Icon(
                          _joining
                              ? CupertinoIcons.clock
                              : CupertinoIcons.waveform_path,
                          size: 15,
                          color: Palette.paper.withValues(alpha: 0.85),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _joining
                                ? 'Đang lấy Agora RTC Token…'
                                : (_joinError != null
                                      ? _joinError!
                                      : 'Kênh âm thanh: ${_token?.agoraChannelName ?? session.agoraChannelName} (${_token?.role ?? (widget.isHost ? "PUBLISHER" : "SUBSCRIBER")})'),
                            style: TextStyle(
                              fontSize: 11,
                              color: Palette.paper.withValues(alpha: 0.78),
                              fontFeatures: const [
                                FontFeature.tabularFigures(),
                              ],
                            ),
                          ),
                        ),
                        if (widget.isHost || _token?.role == 'PUBLISHER')
                          IconButton(
                            key: const Key('host-mic-toggle'),
                            tooltip: _hostMicOn ? 'Tắt micro' : 'Bật micro',
                            onPressed: () =>
                                setState(() => _hostMicOn = !_hostMicOn),
                            icon: Icon(
                              _hostMicOn
                                  ? CupertinoIcons.mic_fill
                                  : CupertinoIcons.mic_slash_fill,
                              size: 18,
                              color: _hostMicOn ? Palette.paper : Palette.red,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 6,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Eyebrow('TRÒ CHUYỆN TRỰC TIẾP'),
                    Text(
                      '${chats.length} tin nhắn',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Palette.muted,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: chats.isEmpty
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Text(
                            'Phòng trò chuyện đã mở. Hãy gửi lời chào hoặc đặt câu hỏi lịch sử cho người kể chuyện.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: Palette.muted,
                              height: 1.6,
                            ),
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                        itemCount: chats.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final msg = chats[index];
                          final isCreator =
                              msg.role.toLowerCase() == 'creator' ||
                              msg.role.toUpperCase() == 'PUBLISHER';
                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isCreator ? Palette.soft : Palette.paper,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isCreator
                                    ? Palette.red.withValues(alpha: 0.4)
                                    : Palette.line,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    if (isCreator) ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Palette.red,
                                          borderRadius: BorderRadius.circular(
                                            3,
                                          ),
                                        ),
                                        child: const Text(
                                          'NGƯỜI KỂ',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w600,
                                            color: Palette.paper,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                    ],
                                    Expanded(
                                      child: Text(
                                        msg.author,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    if (msg.timeFormatted != null &&
                                        msg.timeFormatted!.isNotEmpty)
                                      Text(
                                        msg.timeFormatted!,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Palette.muted,
                                          fontFeatures: [
                                            FontFeature.tabularFigures(),
                                          ],
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  msg.text,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    height: 1.45,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
              SafeArea(
                top: false,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                  decoration: const BoxDecoration(
                    color: Palette.paper,
                    border: Border(top: BorderSide(color: Palette.line)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          key: const Key('livestream-chat-input'),
                          controller: _chatCtrl,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _sendMessage(),
                          decoration: const InputDecoration(
                            hintText: 'Gửi câu hỏi hoặc bình luận trực tiếp…',
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      FilledButton(
                        key: const Key('livestream-chat-send'),
                        onPressed: _sendingChat ? null : _sendMessage,
                        child: const Text('Gửi'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class CreatorLivestreamStudioPage extends StatefulWidget {
  const CreatorLivestreamStudioPage({
    super.key,
    required this.state,
    this.initialChannelName,
  });

  final AppState state;
  final String? initialChannelName;

  @override
  State<CreatorLivestreamStudioPage> createState() =>
      _CreatorLivestreamStudioPageState();
}

class _CreatorLivestreamStudioPageState
    extends State<CreatorLivestreamStudioPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _isExclusive = false;
  bool _busy = false;
  bool _loadingChannel = false;
  String? _error;
  ChannelModel? _myChannel;

  @override
  void initState() {
    super.initState();
    _loadMyChannel();
  }

  String _resolveEffectiveChannelName() {
    if (_myChannel != null && _myChannel!.name.isNotEmpty) {
      return _myChannel!.name;
    }
    if (widget.state.creatorState.channelModel != null &&
        widget.state.creatorState.channelModel!.name.isNotEmpty) {
      return widget.state.creatorState.channelModel!.name;
    }
    if (widget.state.creatorState.channel.isNotEmpty) {
      return widget.state.creatorState.channel;
    }
    if (widget.initialChannelName != null &&
        widget.initialChannelName!.trim().isNotEmpty) {
      return widget.initialChannelName!.trim();
    }
    if (widget.state.displayName.isNotEmpty) {
      return 'Kênh của ${widget.state.displayName}';
    }
    return 'Kênh phát sóng chính thức';
  }

  int _resolveEffectiveChannelId() {
    if (_myChannel != null && _myChannel!.id > 0) {
      return _myChannel!.id;
    }
    if (widget.state.creatorState.channelModel != null &&
        widget.state.creatorState.channelModel!.id > 0) {
      return widget.state.creatorState.channelModel!.id;
    }
    return 1;
  }

  Future<void> _loadMyChannel() async {
    if (widget.state.creatorState.channelModel != null) {
      _myChannel = widget.state.creatorState.channelModel;
    }
    if (widget.state.channelRepository != null) {
      setState(() => _loadingChannel = true);
      try {
        final myChan = await widget.state.channelRepository!.getMyChannel();
        if (mounted && myChan.name.isNotEmpty) {
          setState(() {
            _myChannel = myChan;
            widget.state.creatorState.channelModel = myChan;
          });
        }
      } catch (_) {
      } finally {
        if (mounted) {
          setState(() => _loadingChannel = false);
        }
      }
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _startSession() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final int channelId = _resolveEffectiveChannelId();
      final String channelName = _resolveEffectiveChannelName();

      final created = await widget.state.createLivestreamSession(
        channelId: channelId,
        channelName: channelName,
        title: _titleCtrl.text,
        description: _descCtrl.text,
        isExclusive: _isExclusive,
      );
      _titleCtrl.clear();
      _descCtrl.clear();
      if (!mounted) return;
      setState(() => _busy = false);
      await Navigator.push<void>(
        context,
        MaterialPageRoute<void>(
          builder: (_) => LivestreamRoomPage(
            session: created,
            state: widget.state,
            isHost: true,
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e
              .toString()
              .replaceFirst('Exception: ', '')
              .replaceFirst('StateError: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.state,
      builder: (context, _) {
        final active = widget.state.activeLivestreams;
        return Scaffold(
          appBar: AppBar(title: const Text('Phòng phát sóng trực tiếp')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            children: [
              const Eyebrow('PHÁT SÓNG TRỰC TIẾP · AGORA RTC'),
              const SizedBox(height: 10),
              Text('Mở phòng kể chuyện trực tiếp', style: editorial(28)),
              const SizedBox(height: 8),
              const Text(
                'Giao lưu trực tiếp bằng âm thanh với thính giả và giải đáp câu hỏi lịch sử theo thời gian thực.',
                style: TextStyle(color: Palette.muted, height: 1.5),
              ),
              if (active.isNotEmpty) ...[
                const SizedBox(height: 24),
                const Eyebrow('PHIÊN ĐANG HOẠT ĐỘNG'),
                const SizedBox(height: 10),
                ...active.map(
                  (s) => Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Palette.soft,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Palette.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.title, style: editorial(18)),
                        const SizedBox(height: 4),
                        Text(
                          '${widget.state.resolveLivestreamChannelName(s)} · ${s.viewerCount} người đang nghe',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Palette.muted,
                            fontFeatures: [FontFeature.tabularFigures()],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => Navigator.push(
                                  context,
                                  MaterialPageRoute<void>(
                                    builder: (_) => LivestreamRoomPage(
                                      session: s,
                                      state: widget.state,
                                      isHost: true,
                                    ),
                                  ),
                                ),
                                child: const Text('Vào điều phối'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            TextButton(
                              onPressed: () =>
                                  widget.state.endLivestreamSession(s.id),
                              child: const Text(
                                'Kết thúc',
                                style: TextStyle(color: Palette.red),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Kênh phát sóng chính thức (Tự động theo Creator)',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Palette.muted,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      key: const Key('livestream-locked-channel-card'),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: SizedBox(
                              width: 44,
                              height: 44,
                              child: (_myChannel?.avatarUrl != null &&
                                      _myChannel!.avatarUrl!.isNotEmpty)
                                  ? Image.network(
                                      _myChannel!.avatarUrl!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(
                                        color: Palette.paper,
                                        child: const Icon(
                                          CupertinoIcons.dot_radiowaves_left_right,
                                          color: Palette.red,
                                          size: 22,
                                        ),
                                      ),
                                    )
                                  : Container(
                                      color: Palette.paper,
                                      child: const Icon(
                                        CupertinoIcons.dot_radiowaves_left_right,
                                        color: Palette.red,
                                        size: 22,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _resolveEffectiveChannelName(),
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Palette.ink,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (_loadingChannel)
                                      const Padding(
                                        padding: EdgeInsets.only(left: 6),
                                        child: SizedBox(
                                          width: 12,
                                          height: 12,
                                          child: CircularProgressIndicator(strokeWidth: 2),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'Mã kênh: #${_resolveEffectiveChannelId()} · Chủ kênh: ${widget.state.displayName.isNotEmpty ? widget.state.displayName : "Tôi"}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Palette.muted,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8F5E9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFFA5D6A7),
                              ),
                            ),
                            child: const Text(
                              'Đã xác thực',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF2E7D32),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    TextFormField(
                      key: const Key('livestream-title-input'),
                      controller: _titleCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Tiêu đề buổi phát trực tiếp',
                        hintText:
                            'Ví dụ: Đêm trước trận Bạch Đằng 938 · Giải đáp tư liệu',
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Vui lòng nhập tiêu đề buổi phát sóng'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      key: const Key('livestream-desc-input'),
                      controller: _descCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Giới thiệu nội dung buổi phát',
                        hintText:
                            'Tóm tắt các điểm nhấn lịch sử sẽ trao đổi cùng thính giả…',
                      ),
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      key: const Key('livestream-exclusive-switch'),
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'Phòng độc quyền cho Hội viên (VIP)',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      subtitle: const Text(
                        'Chỉ thính giả có gói hội viên còn hạn của kênh mới có thể tham gia.',
                        style: TextStyle(fontSize: 12, color: Palette.muted),
                      ),
                      value: _isExclusive,
                      onChanged: (val) => setState(() => _isExclusive = val),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        _error!,
                        style: const TextStyle(
                          color: Palette.red,
                          fontSize: 13,
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        key: const Key('start-livestream-btn'),
                        onPressed: _busy ? null : _startSession,
                        icon: const Icon(
                          CupertinoIcons.dot_radiowaves_left_right,
                          size: 16,
                        ),
                        label: Text(
                          _busy
                              ? 'Đang khởi tạo phòng…'
                              : 'Bắt đầu phát trực tiếp',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class LivestreamExploreView extends StatefulWidget {
  const LivestreamExploreView({super.key, required this.state});
  final AppState state;

  @override
  State<LivestreamExploreView> createState() => _LivestreamExploreViewState();
}

class _LivestreamExploreViewState extends State<LivestreamExploreView> {
  String _selectedFilter = 'Tất cả';

  @override
  void initState() {
    super.initState();
    widget.state.refreshLivestreams();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.state,
      builder: (context, _) {
        final allSessions = widget.state.activeLivestreams;
        final filteredSessions = allSessions.where((s) {
          if (_selectedFilter == 'Đang trực tiếp') {
            return s.status.toUpperCase() == 'LIVE';
          }
          if (_selectedFilter == 'Hội viên (VIP)') {
            return s.isExclusive;
          }
          return true;
        }).toList();

        return RefreshIndicator(
          color: Palette.red,
          backgroundColor: Palette.paper,
          onRefresh: widget.state.refreshLivestreams,
          child: ListView(
            key: const PageStorageKey('livestream-scroll'),
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
                      Text('Trực tiếp', style: editorial(31)),
                      const SizedBox(height: 4),
                      const Text(
                        'Kể chuyện & giao lưu thời gian thực',
                        style: TextStyle(
                          fontSize: 13,
                          color: Palette.muted,
                        ),
                      ),
                    ],
                  ),
                  FilledButton.icon(
                    key: const Key('open-live-studio-btn'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Palette.red,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => CreatorLivestreamStudioPage(
                          state: widget.state,
                        ),
                      ),
                    ),
                    icon: const Icon(
                      CupertinoIcons.dot_radiowaves_left_right,
                      size: 14,
                    ),
                    label: const Text(
                      'Mở phòng live',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final filter in [
                      'Tất cả',
                      'Đang trực tiếp',
                      'Hội viên (VIP)',
                    ])
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(
                            filter,
                            style: const TextStyle(fontSize: 12),
                          ),
                          selected: _selectedFilter == filter,
                          onSelected: (_) =>
                              setState(() => _selectedFilter = filter),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (filteredSessions.isNotEmpty) ...[
                for (final session in filteredSessions)
                  LivestreamShelfCard(session: session, state: widget.state),
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
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Palette.red.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          CupertinoIcons.dot_radiowaves_left_right,
                          color: Palette.red,
                          size: 28,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text('Chưa có phòng live nào', style: editorial(19)),
                      const SizedBox(height: 8),
                      const Text(
                        'Hiện chưa có kênh nào đang phát sóng trực tiếp. Hãy quay lại sau hoặc tự mở một phiên phát sóng để giao lưu cùng thính giả!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          color: Palette.muted,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 18),
                      FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: Palette.red,
                        ),
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) => CreatorLivestreamStudioPage(
                              state: widget.state,
                            ),
                          ),
                        ),
                        icon: const Icon(CupertinoIcons.plus_circle, size: 16),
                        label: const Text('Bắt đầu buổi phát sóng của bạn'),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

