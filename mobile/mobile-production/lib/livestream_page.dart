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

class HistoricalSlideItem {
  final String id;
  final String period;
  final String title;
  final String subtitle;
  final String description;
  final List<String> bulletPoints;
  final IconData visualIcon;
  final Color primaryColor;
  final Color accentColor;

  const HistoricalSlideItem({
    required this.id,
    required this.period,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.bulletPoints,
    required this.visualIcon,
    required this.primaryColor,
    required this.accentColor,
  });
}

const List<HistoricalSlideItem> historicalDocumentSlides = [
  HistoricalSlideItem(
    id: 'dien-bien-phu-1954',
    period: 'Kháng chiến chống Pháp · 1954',
    title: 'Bản đồ tác chiến & Thế trận lòng chảo Mường Thanh',
    subtitle: 'Kế hoạch vây hãm, đánh lấn tiến công tập đoàn cứ điểm 49 cứ điểm',
    description:
        'Sơ đồ hiệp đồng binh chủng pháo binh, bộ binh và đào giao thông hào siết chặt sân bay Mường Thanh.',
    bulletPoints: [
      'Đợt 1 (13/3 - 17/3): Tiêu diệt cứ điểm Him Lam, Độc Lập, bức hàng Bản Kéo',
      'Đợt 2 (30/3 - 30/4): Tác chiến tiêu hao đồi A1, C1, D1, siết chặt vòng vây sân bay',
      'Đợt 3 (01/5 - 07/5): Tổng công kích, tiêu diệt toàn bộ cứ điểm, bắt sống tướng De Castries',
    ],
    visualIcon: CupertinoIcons.map_fill,
    primaryColor: Color(0xFF8B1E1E),
    accentColor: Color(0xFFC97A63),
  ),
  HistoricalSlideItem(
    id: 'dai-viet-su-ky-1479',
    period: 'Triều Lê Sơ · Năm Kỷ Hợi 1479',
    title: 'Mộc bản Văn hiến Hoàng Thành Thăng Long',
    subtitle: 'Khảo cứu bản khắc gỗ bộ chính sử cổ do Sử quan Ngô Sĩ Liên biên soạn',
    description:
        'Trưng bày bản phục dựng mộc bản chữ Hán - Nôm ghi chép cải cách hành chính Hồng Đức và chế độ khoa cử.',
    bulletPoints: [
      'Chiếu dời đô và tư tưởng quốc gia độc lập thời Lý - Trần - Lê',
      'Cải cách hành chính 13 đạo thừa tuyên thời vua Lê Thánh Tông',
      'Chế độ khoa cử tuyển chọn hiền tài và truyền thống bia tiến sĩ Văn Miếu',
    ],
    visualIcon: CupertinoIcons.book_fill,
    primaryColor: Color(0xFF7A4E1D),
    accentColor: Color(0xFFD4AF37),
  ),
  HistoricalSlideItem(
    id: 'bach-dang-938',
    period: 'Thời kỳ Tự chủ · Năm 938',
    title: 'Thủy chiến Bạch Đằng & Nghệ thuật bãi cọc ngầm',
    subtitle: 'Trận địa cọc gỗ bịt sắt đón đỉnh triều rút chôn vùi thủy quân Nam Hán',
    description:
        'Mô phỏng động lực học dòng triều cửa biển và thế trận phục kích thủy chiến lịch sử của Ngô Quyền.',
    bulletPoints: [
      'Quy luật thủy triều: Đo lường chính xác con nước ròng - nước lớn vịnh Bắc Bộ',
      'Bãi cọc vạt nhọn bọc sắt cắm nghiêng 45 độ đón luồng nước rút',
      'Chiến thuật nhử thuyền chiến địch vào trận địa khi triều dâng và tổng phản công',
    ],
    visualIcon: CupertinoIcons.compass_fill,
    primaryColor: Color(0xFF1A365D),
    accentColor: Color(0xFF38B2AC),
  ),
  HistoricalSlideItem(
    id: 'truong-son-1959',
    period: 'Kháng chiến chống Mỹ · Tuyến vận tải 559',
    title: 'Hệ thống đường mòn Hồ Chí Minh & Tuyến tiếp tế chiến lược',
    subtitle: 'Mạng lưới 20.000 km đường bộ xẻ dọc dãy Trường Sơn chi viện tiền tuyến',
    description:
        'Sơ đồ các trục đường kín, hệ thống đường ống dẫn xăng dầu 5.000 km và các trọng điểm kiên cường.',
    bulletPoints: [
      'Đoàn 559: Mở đường gùi thồ bí mật băng qua đỉnh Trường Sơn hiểm trở',
      'Hệ thống đường kín, đường ngầm tránh bom tọa độ và pháo đài bay B-52',
      'Đường ống xăng dầu xuyên rừng và mạng lưới thông tin liên lạc dã chiến',
    ],
    visualIcon: CupertinoIcons.location_north_fill,
    primaryColor: Color(0xFF22543D),
    accentColor: Color(0xFF48BB78),
  ),
];

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
  bool _isFullscreen = false;

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
        if (widget.isHost) {
          widget.state.updateLivestreamMediaState(
            widget.session.id,
            isCameraOn: true,
            isMicOn: true,
            isScreenSharing: false,
            currentSlideIndex: 0,
          );
        }
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

  void _toggleMic() {
    final media = widget.state.getLivestreamMediaState(widget.session.id);
    final next = !media.isMicOn;
    setState(() => _hostMicOn = next);
    widget.state.updateLivestreamMediaState(
      widget.session.id,
      isMicOn: next,
    );
  }

  void _toggleCamera() {
    final media = widget.state.getLivestreamMediaState(widget.session.id);
    widget.state.updateLivestreamMediaState(
      widget.session.id,
      isCameraOn: !media.isCameraOn,
    );
  }

  void _toggleScreenShare() {
    final media = widget.state.getLivestreamMediaState(widget.session.id);
    final next = !media.isScreenSharing;
    widget.state.updateLivestreamMediaState(
      widget.session.id,
      isScreenSharing: next,
    );
    if (next && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đang chia sẻ màn hình tư liệu lịch sử trực tiếp.'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _toggleCameraFlip() {
    final media = widget.state.getLivestreamMediaState(widget.session.id);
    widget.state.updateLivestreamMediaState(
      widget.session.id,
      isFrontCamera: !media.isFrontCamera,
    );
  }

  void _prevSlide() {
    final media = widget.state.getLivestreamMediaState(widget.session.id);
    if (media.currentSlideIndex > 0) {
      widget.state.updateLivestreamMediaState(
        widget.session.id,
        currentSlideIndex: media.currentSlideIndex - 1,
      );
    }
  }

  void _nextSlide() {
    final media = widget.state.getLivestreamMediaState(widget.session.id);
    if (media.currentSlideIndex < historicalDocumentSlides.length - 1) {
      widget.state.updateLivestreamMediaState(
        widget.session.id,
        currentSlideIndex: media.currentSlideIndex + 1,
      );
    }
  }

  void _openSlidePickerModal() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final media = widget.state.getLivestreamMediaState(widget.session.id);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Chọn tư liệu trình chiếu', style: editorial(18)),
                    IconButton(
                      icon: const Icon(CupertinoIcons.xmark, size: 18),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Chọn slide hồ sơ lịch sử hoặc bản đồ để hiển thị trực tiếp lên màn hình chia sẻ.',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
                const SizedBox(height: 16),
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: historicalDocumentSlides.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, idx) {
                      final slide = historicalDocumentSlides[idx];
                      final isSelected = media.currentSlideIndex == idx;
                      return InkWell(
                        onTap: () {
                          widget.state.updateLivestreamMediaState(
                            widget.session.id,
                            currentSlideIndex: idx,
                            isScreenSharing: true,
                          );
                          Navigator.pop(ctx);
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? Palette.red.withValues(alpha: 0.08)
                                : Palette.soft,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected ? Palette.red : Palette.line,
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: slide.primaryColor,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(slide.visualIcon,
                                    color: Palette.paper, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      slide.period,
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.bold,
                                        color: slide.primaryColor,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      slide.title,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Palette.ink,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              if (isSelected)
                                const Icon(CupertinoIcons.checkmark_seal_fill,
                                    color: Palette.red, size: 20),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
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
        final mediaState = widget.state.getLivestreamMediaState(session.id);

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

        if (_isFullscreen) {
          return Scaffold(
            backgroundColor: Colors.black,
            body: SafeArea(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Center(
                    child: _buildVideoStage(mediaState, channelName, session),
                  ),
                  Positioned(
                    top: 16,
                    right: 16,
                    child: IconButton(
                      icon: const Icon(
                        CupertinoIcons.fullscreen_exit,
                        color: Colors.white,
                        size: 26,
                      ),
                      onPressed: () => setState(() => _isFullscreen = false),
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
              _buildVideoStage(mediaState, channelName, session),
              _buildSessionMeta(session, mediaState),
              if (widget.isHost || _token?.role == 'PUBLISHER')
                _buildStudioToolbar(mediaState),
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

  Widget _buildSessionMeta(
    LivestreamSessionModel session,
    LivestreamMediaState mediaState,
  ) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
              Expanded(
                child: Text(
                  session.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Palette.ink,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (session.isExclusive)
                Container(
                  margin: const EdgeInsets.only(left: 6),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Palette.red,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: const Text(
                    'HỘI VIÊN VIP',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      color: Palette.paper,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(
                _joining
                    ? CupertinoIcons.clock
                    : (mediaState.isScreenSharing
                        ? CupertinoIcons.device_laptop
                        : (mediaState.isCameraOn
                            ? CupertinoIcons.video_camera
                            : CupertinoIcons.waveform_path)),
                size: 13,
                color: Palette.muted,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _joining
                      ? 'Đang kết nối Agora RTC…'
                      : (_joinError ??
                          '${_token?.agoraChannelName ?? session.agoraChannelName} · ${mediaState.isScreenSharing ? "Chia sẻ màn hình" : (mediaState.isCameraOn ? "Camera Video" : "Audio Only")}'),
                  style: const TextStyle(
                    fontSize: 11,
                    color: Palette.muted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                '${session.viewerCount} người xem',
                key: const Key('livestream-viewer-count'),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Palette.ink,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStudioToolbar(LivestreamMediaState mediaState) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Palette.ink,
        borderRadius: BorderRadius.circular(10),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildStudioToolBtn(
              key: const Key('host-screenshare-toggle'),
              icon: CupertinoIcons.device_laptop,
              label:
                  mediaState.isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình',
              isActive: mediaState.isScreenSharing,
              activeColor: const Color(0xFF0284C7),
              onTap: _toggleScreenShare,
            ),
            const SizedBox(width: 8),
            _buildStudioToolBtn(
              key: const Key('host-camera-toggle'),
              icon: mediaState.isCameraOn
                  ? CupertinoIcons.video_camera_solid
                  : CupertinoIcons.video_camera,
              label: mediaState.isCameraOn ? 'Tắt Camera' : 'Bật Camera',
              isActive: mediaState.isCameraOn,
              activeColor: Palette.red,
              onTap: _toggleCamera,
            ),
            const SizedBox(width: 8),
            _buildStudioToolBtn(
              key: const Key('host-mic-toggle'),
              icon: mediaState.isMicOn
                  ? CupertinoIcons.mic_fill
                  : CupertinoIcons.mic_slash_fill,
              label: mediaState.isMicOn ? 'Tắt Mic' : 'Bật Mic',
              isActive: mediaState.isMicOn,
              activeColor: const Color(0xFF10B981),
              onTap: _toggleMic,
            ),
            const SizedBox(width: 8),
            if (mediaState.isScreenSharing)
              _buildStudioToolBtn(
                key: const Key('host-slide-selector'),
                icon: CupertinoIcons.doc_text_viewfinder,
                label: 'Đổi tư liệu',
                isActive: false,
                activeColor: Palette.paper,
                onTap: _openSlidePickerModal,
              )
            else
              _buildStudioToolBtn(
                key: const Key('host-camera-flip'),
                icon: CupertinoIcons.camera_rotate,
                label: mediaState.isFrontCamera ? 'Cam Trước' : 'Cam Sau',
                isActive: false,
                activeColor: Palette.paper,
                onTap: _toggleCameraFlip,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudioToolBtn({
    Key? key,
    required IconData icon,
    required String label,
    required bool isActive,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      key: key,
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? activeColor : Palette.paper.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 17,
              color: Palette.paper,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Palette.paper,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoStage(
    LivestreamMediaState mediaState,
    String channelName,
    LivestreamSessionModel session,
  ) {
    return Container(
      key: const Key('livestream-video-stage'),
      margin: const EdgeInsets.fromLTRB(20, 6, 20, 10),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Palette.line),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (mediaState.isScreenSharing)
              _buildScreenShareCanvas(mediaState, session)
            else if (mediaState.isCameraOn)
              _buildCameraCanvas(mediaState, session, channelName)
            else
              _buildAudioOnlyCanvas(mediaState, session, channelName),
            Positioned(
              top: 10,
              left: 10,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 3,
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
                          size: 11,
                          color: Palette.paper,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'ĐANG PHÁT SÓNG',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                            color: Palette.paper,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  if (mediaState.isScreenSharing)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0284C7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            CupertinoIcons.device_laptop,
                            size: 11,
                            color: Palette.paper,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'CHIA SẺ MÀN HÌNH',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: Palette.paper,
                            ),
                          ),
                        ],
                      ),
                    )
                  else if (mediaState.isCameraOn)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'CAM ${mediaState.isFrontCamera ? "TRƯỚC" : "SAU"} · 1080p',
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                          color: Palette.paper,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Positioned(
              top: 6,
              right: 6,
              child: Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'HD 60FPS',
                      style: TextStyle(
                        fontSize: 9,
                        color: Colors.white70,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  IconButton(
                    icon: Icon(
                      _isFullscreen
                          ? CupertinoIcons.fullscreen_exit
                          : CupertinoIcons.fullscreen,
                      color: Colors.white,
                      size: 16,
                    ),
                    padding: EdgeInsets.zero,
                    constraints:
                        const BoxConstraints(minWidth: 28, minHeight: 28),
                    onPressed: () =>
                        setState(() => _isFullscreen = !_isFullscreen),
                  ),
                ],
              ),
            ),
            if (mediaState.isScreenSharing)
              Positioned(
                bottom: 8,
                right: 8,
                child: _buildPipCamera(mediaState, session),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPipCamera(
    LivestreamMediaState mediaState,
    LivestreamSessionModel session,
  ) {
    return Container(
      key: const Key('livestream-pip-camera'),
      width: 116,
      height: 74,
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: mediaState.isCameraOn ? const Color(0xFF38BDF8) : Palette.line,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (mediaState.isCameraOn) ...[
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFF334155), Color(0xFF0F172A)],
                ),
              ),
              child: Center(
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: mediaState.isMicOn
                          ? const Color(0xFF22C55E)
                          : Colors.white54,
                      width: 2,
                    ),
                    color: Palette.paper,
                  ),
                  child: Center(
                    child: Text(
                      (session.creatorName?.isNotEmpty == true
                              ? session.creatorName!
                              : widget.state.displayName)
                          .characters
                          .take(1)
                          .toString()
                          .toUpperCase(),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Palette.ink,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 3,
              left: 4,
              right: 4,
              child: Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Color(0xFF22C55E),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 3),
                  Expanded(
                    child: Text(
                      session.creatorName ?? widget.state.displayName,
                      style: const TextStyle(
                        fontSize: 8.5,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Icon(
                    mediaState.isMicOn
                        ? CupertinoIcons.mic_fill
                        : CupertinoIcons.mic_slash_fill,
                    size: 8,
                    color: mediaState.isMicOn ? Colors.white : Palette.red,
                  ),
                ],
              ),
            ),
          ] else ...[
            Container(
              color: const Color(0xFF0F172A),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    CupertinoIcons.video_camera,
                    color: Colors.white38,
                    size: 18,
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Cam tắt',
                    style: TextStyle(
                      fontSize: 8.5,
                      color: Colors.white54,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildScreenShareCanvas(
    LivestreamMediaState mediaState,
    LivestreamSessionModel session,
  ) {
    final slide = historicalDocumentSlides[
        mediaState.currentSlideIndex % historicalDocumentSlides.length];

    return Container(
      key: const Key('livestream-screenshare-view'),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            slide.primaryColor.withValues(alpha: 0.85),
            const Color(0xFF0F172A),
            const Color(0xFF020617),
          ],
        ),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.12,
              child: Icon(
                slide.visualIcon,
                size: 260,
                color: slide.accentColor,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 34, 14, 30),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: slide.accentColor.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: slide.accentColor.withValues(alpha: 0.5),
                        ),
                      ),
                      child: Text(
                        slide.period,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: slide.accentColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Tư liệu trình chiếu #${mediaState.currentSlideIndex + 1}',
                        style: const TextStyle(
                          fontSize: 9,
                          color: Colors.white54,
                        ),
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  slide.title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    height: 1.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  slide.subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFFE2E8F0),
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        slide.visualIcon,
                        size: 13,
                        color: slide.accentColor,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          slide.bulletPoints.first,
                          style: const TextStyle(
                            fontSize: 9.5,
                            color: Colors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 4,
            left: 10,
            child: Row(
              children: [
                InkWell(
                  onTap: _prevSlide,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      CupertinoIcons.chevron_left,
                      size: 12,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '${mediaState.currentSlideIndex + 1}/${historicalDocumentSlides.length}',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(width: 6),
                InkWell(
                  onTap: _nextSlide,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      CupertinoIcons.chevron_right,
                      size: 12,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCameraCanvas(
    LivestreamMediaState mediaState,
    LivestreamSessionModel session,
    String channelName,
  ) {
    return Container(
      key: const Key('livestream-camera-view'),
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1.0,
          colors: [
            Color(0xFF27272A),
            Color(0xFF09090B),
          ],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: mediaState.isMicOn
                              ? const Color(0xFF22C55E).withValues(alpha: 0.6)
                              : Colors.white24,
                          width: 2.5,
                        ),
                      ),
                    ),
                    Container(
                      width: 64,
                      height: 64,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF3F3F46),
                      ),
                      child: Center(
                        child: Text(
                          (session.creatorName?.isNotEmpty == true
                                  ? session.creatorName!
                                  : widget.state.displayName)
                              .characters
                              .take(1)
                              .toString()
                              .toUpperCase(),
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  session.creatorName ?? widget.state.displayName,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Kênh $channelName · Người kể chuyện',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Colors.white60,
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            top: 14,
            left: 14,
            child: Container(
              width: 12,
              height: 12,
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: Colors.white30, width: 2),
                  left: BorderSide(color: Colors.white30, width: 2),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 14,
            left: 14,
            child: Container(
              width: 12,
              height: 12,
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: Colors.white30, width: 2),
                  left: BorderSide(color: Colors.white30, width: 2),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 14,
            right: 14,
            child: Container(
              width: 12,
              height: 12,
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: Colors.white30, width: 2),
                  right: BorderSide(color: Colors.white30, width: 2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAudioOnlyCanvas(
    LivestreamMediaState mediaState,
    LivestreamSessionModel session,
    String channelName,
  ) {
    return Container(
      key: const Key('livestream-audio-only-view'),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF1C1917), Color(0xFF0C0A09)],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Palette.paper.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                CupertinoIcons.waveform_path,
                size: 28,
                color: Palette.paper,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Chế độ Chỉ phát Âm thanh (Radio Live)',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              widget.isHost
                  ? 'Bật Camera hoặc Chia sẻ màn hình bên dưới để phát video.'
                  : 'Người kể chuyện đang phát sóng chế độ âm thanh.',
              style: const TextStyle(
                fontSize: 10.5,
                color: Colors.white60,
              ),
            ),
          ],
        ),
      ),
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

