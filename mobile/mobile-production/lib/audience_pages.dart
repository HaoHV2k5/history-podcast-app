import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'app_state.dart';
import 'components.dart';
import 'design.dart';
import 'artwork_image.dart';
import 'artwork_state.dart';
import 'artwork_editor.dart';
import 'episode.dart';
import 'studio_pages.dart';
import 'narrator_pages.dart';
import 'demo_pages.dart';
import 'wallet_page.dart';
import 'publication_page.dart';
import 'notification_page.dart';
import 'password_recovery.dart';

class ChannelPage extends StatefulWidget {
  const ChannelPage({
    super.key,
    required this.channel,
    required this.state,
    required this.onEpisode,
  });
  final Channel channel;
  final AppState state;
  final ValueChanged<Episode> onEpisode;
  @override
  State<ChannelPage> createState() => _ChannelPageState();
}

class _ChannelPageState extends State<ChannelPage> {
  String filter = 'Tất cả';
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.state,
    builder: (context, _) {
      final c = widget.channel;
      final followed = widget.state.followed.contains(c.name);
      final member = widget.state.memberships.contains(c.name);
      final items = c.content.where((e) {
        if (filter == 'Công khai') return !e.membersOnly;
        if (filter == 'Hội viên') return e.membersOnly;
        return true;
      }).toList();
      return Scaffold(
        appBar: AppBar(
          title: const Text('Kênh kể chuyện', style: TextStyle(fontSize: 14)),
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: ArtworkImage(
                c.image,
                height: 190,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) =>
                    Container(height: 190, color: Palette.soft),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                ChannelMark(channel: c),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Eyebrow('KÊNH KỂ CHUYỆN'),
                      const SizedBox(height: 6),
                      Text(c.name, style: editorial(26)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              c.description,
              style: const TextStyle(
                fontSize: 13,
                height: 1.8,
                color: Palette.muted,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              '${c.content.length} tập · ${c.content.where((e) => e.membersOnly).length} tập dành cho hội viên',
              style: const TextStyle(color: Palette.muted, fontSize: 12),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => widget.state.toggleFollow(c.name),
                icon: Icon(
                  followed ? CupertinoIcons.check_mark : CupertinoIcons.plus,
                  size: 18,
                ),
                label: Text(followed ? 'Đang theo dõi' : 'Theo dõi kênh'),
              ),
            ),
            if (c.hasMembership) ...[
              const SizedBox(height: 20),
              Material(
                color: Palette.soft,
                borderRadius: BorderRadius.circular(8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) =>
                          MembershipPage(channel: c, state: widget.state),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      children: [
                        Icon(
                          member
                              ? CupertinoIcons.checkmark_seal
                              : CupertinoIcons.lock,
                          color: Palette.red,
                          size: 23,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                member
                                    ? 'Bạn đang là hội viên thử'
                                    : 'Nghe thêm, hiểu sâu hơn.',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                member ? 'Quản lý quyền truy cập của kênh' : 'Khám phá những tập dành riêng cho hội viên',
                                style: const TextStyle(
                                  color: Palette.muted,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(CupertinoIcons.chevron_right, size: 16),
                      ],
                    ),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 28),
            const SectionTitle(title: 'Những câu chuyện'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['Tất cả', 'Công khai', if (c.hasMembership) 'Hội viên']
                  .map(
                    (label) => ChoiceChip(
                      label: Text(label),
                      selected: filter == label,
                      showCheckmark: false,
                      selectedColor: Palette.soft,
                      backgroundColor: Palette.paper,
                      side: BorderSide(
                        color: filter == label ? Palette.ink : Palette.line,
                      ),
                      onSelected: (_) => setState(() => filter = label),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            ...items.map(
              (e) => EpisodeRow(episode: e, onTap: () => widget.onEpisode(e)),
            ),
            const SizedBox(height: 20),
            const DemoNote(),
          ],
        ),
      );
    },
  );
}

class MembershipPage extends StatefulWidget {
  const MembershipPage({super.key, required this.channel, required this.state});
  final Channel channel;
  final AppState state;
  @override
  State<MembershipPage> createState() => _MembershipPageState();
}

class _MembershipPageState extends State<MembershipPage> {
  bool busy = false;
  String? error;

  Future<void> change(bool enabled) async {
    if (!enabled) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Tắt hội viên thử?'),
          content: const Text(
            'Các tập riêng của kênh sẽ được khóa lại. Tập đã lưu vẫn ở trong thư viện. Không có khoản phí hay giao dịch nào.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Giữ lại'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Tắt hội viên thử'),
            ),
          ],
        ),
      );
      if (confirmed != true || !mounted) return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await widget.state.setDemoMembership(widget.channel.name, enabled);
    } catch (_) {
      if (mounted) {
        setState(() => error = 'Chưa lưu được thay đổi. Hãy thử lại.');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  void _showReceipt(BuildContext context, bool active) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Eyebrow('BIÊN NHẬN THỬ NGHIỆM · MÔ PHỎNG'),
              const SizedBox(height: 12),
              Text('Gói hội viên ${widget.channel.name}', style: editorial(24)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Trạng thái',
                          style: TextStyle(color: Palette.muted, fontSize: 13),
                        ),
                        Text(
                          active
                              ? 'Đang hoạt động (Mô phỏng)'
                              : 'Chưa kích hoạt',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: active ? Palette.red : Palette.muted,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Kênh',
                          style: TextStyle(color: Palette.muted, fontSize: 13),
                        ),
                        Text(
                          widget.channel.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w500,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Chu kỳ',
                          style: TextStyle(color: Palette.muted, fontSize: 13),
                        ),
                        Text(
                          'Hàng tháng (TBD chi phí)',
                          style: TextStyle(fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Mã giao dịch',
                          style: TextStyle(color: Palette.muted, fontSize: 13),
                        ),
                        Text(
                          'TX-SIM-${widget.channel.name.hashCode.abs() % 100000}',
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Lưu ý: Đây là màn hình thử nghiệm giao diện cho môn PRM theo BRD/FRD v1.1. Chưa có cổng thanh toán thật và không thu bất kỳ khoản tiền nào.',
                style: TextStyle(
                  color: Palette.muted,
                  fontSize: 12,
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.state,
    builder: (context, _) {
      final c = widget.channel;
      final active = widget.state.memberships.contains(c.name);
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'Hội viên của kênh',
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            IconButton(
              tooltip: 'Biên nhận giao dịch',
              icon: const Icon(CupertinoIcons.doc_text, size: 20),
              onPressed: () => _showReceipt(context, active),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
          children: [
            const Eyebrow('GẮN BÓ CÙNG MỘT KÊNH'),
            const SizedBox(height: 14),
            Text(
              active ? 'Câu chuyện\ncòn tiếp.' : 'Ở lại với\nnhững câu chuyện.',
              style: editorial(32),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: Palette.red,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Eyebrow('HỘI VIÊN / BẢN THỬ', color: Palette.white),
                  const SizedBox(height: 18),
                  Text(c.name, style: editorial(26, color: Palette.white)),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Icon(
                        active
                            ? CupertinoIcons.check_mark_circled
                            : CupertinoIcons.lock,
                        color: Palette.white,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          active
                              ? 'Đã mở quyền truy cập thử'
                              : 'Quyền truy cập riêng cho kênh này',
                          style: const TextStyle(
                            color: Palette.white,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 26),
            const SectionTitle(title: 'Dành cho hội viên'),
            const SizedBox(height: 12),
            Benefit(
              icon: CupertinoIcons.headphones,
              title:
                  '${c.content.where((e) => e.membersOnly).length} tập nghe riêng',
              detail: 'Mở các tập có nhãn Hội viên của ${c.name}.',
            ),
            const Benefit(
              icon: CupertinoIcons.bookmark,
              title: 'Lưu để nghe sau',
              detail: 'Giữ các tập yêu thích trong cùng một thư viện.',
            ),
            const Benefit(
              icon: CupertinoIcons.person_2,
              title: 'Theo từng kênh',
              detail: 'Quyền hội viên của kênh này không mở nội dung riêng ở kênh khác.',
            ),
            const SizedBox(height: 22),
            const Divider(),
            const SizedBox(height: 20),
            const Text(
              'Chế độ thử giao diện',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => _showReceipt(context, active),
                icon: const Icon(CupertinoIcons.doc_plaintext, size: 14),
                label: const Text(
                  'Xem biên nhận giao dịch thử',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Giá và chu kỳ hội viên chưa được cấu hình. Nút bên dưới chỉ đổi trạng thái thử trên thiết bị này; không thanh toán, không gia hạn và không tạo hợp đồng.',
              style: TextStyle(fontSize: 12, color: Palette.muted, height: 1.8),
            ),
            const SizedBox(height: 22),
            if (error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Semantics(
                  liveRegion: true,
                  child: Text(
                    error!,
                    style: const TextStyle(color: Palette.red),
                  ),
                ),
              ),
            Text(
              'Trạng thái: ${switch (widget.state.checkoutStatus(c.name)) {
                'pending' => 'Đang chờ thanh toán mẫu',
                'failed' => 'Thất bại · Có thể thử lại',
                'expired' => 'Đã hết hạn thử',
                'active' => 'Đang có quyền thử',
                'cancelled' => 'Đã tắt quyền thử',
                _ => 'Chưa đăng ký',
              }}',
            ),
            const SizedBox(height: 12),
            if (!active && widget.state.checkoutStatus(c.name) != 'pending')
              FilledButton(
                key: const Key('checkout-start'),
                onPressed: busy
                    ? null
                    : () async {
                        setState(() {
                          busy = true;
                          error = null;
                        });
                        try {
                          await widget.state.beginCheckout(c.name);
                        } catch (_) {
                          error = 'Chưa tạo được giao dịch thử.';
                        }
                        if (mounted) setState(() => busy = false);
                      },
                child: Text(
                  widget.state.checkoutStatus(c.name) == 'failed'
                      ? 'Thử đăng ký lại'
                      : 'Đăng ký hội viên thử',
                ),
              ),
            if (widget.state.checkoutStatus(c.name) == 'pending')
              ExpansionTile(
                initiallyExpanded: true,
                tilePadding: EdgeInsets.zero,
                title: const Text('Thử kết quả thanh toán'),
                children: [
                  OutlinedButton(
                    onPressed: busy
                        ? null
                        : () async {
                            setState(() => busy = true);
                            try {
                              await widget.state.finishCheckout(c.name, true);
                            } catch (_) {
                              error = 'Chưa lưu được kết quả.';
                            }
                            if (mounted) setState(() => busy = false);
                          },
                    child: const Text('Thử thanh toán thành công'),
                  ),
                  TextButton(
                    onPressed: busy
                        ? null
                        : () async {
                            setState(() => busy = true);
                            try {
                              await widget.state.finishCheckout(c.name, false);
                            } catch (_) {
                              error = 'Chưa lưu được kết quả.';
                            }
                            if (mounted) setState(() => busy = false);
                          },
                    child: const Text('Thử thanh toán thất bại'),
                  ),
                ],
              ),
            if (active)
              TextButton(
                onPressed: busy
                    ? null
                    : () async {
                        setState(() => busy = true);
                        try {
                          await widget.state.expireMembership(c.name);
                        } catch (_) {
                          error = 'Chưa lưu được thay đổi.';
                        }
                        if (mounted) setState(() => busy = false);
                      },
                child: const Text('Giả lập hội viên hết hạn'),
              ),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: const Text('Đổi quyền trực tiếp để test'),
              children: [
                FilledButton.icon(
                  key: const Key('membership-toggle'),
                  onPressed: busy ? null : () => change(!active),
                  icon: Icon(
                    active ? CupertinoIcons.lock : CupertinoIcons.lock_open,
                    size: 18,
                  ),
                  label: Text(
                    busy
                        ? 'Đang lưu…'
                        : active
                        ? 'Tắt hội viên thử'
                        : 'Bật hội viên thử',
                  ),
                ),
              ],
            ),
            if (active)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Quay lại khám phá'),
                ),
              ),
          ],
        ),
      );
    },
  );
}

class ProfileContent extends StatelessWidget {
  const ProfileContent({
    super.key,
    required this.state,
    required this.onChannel,
  });
  final AppState state;
  final ValueChanged<Channel> onChannel;
  void _openAuth(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => AuthSheet(state: state),
  );
  @override
  Widget build(BuildContext context) => ListView(
    key: const PageStorageKey('profile-scroll'),
    padding: EdgeInsets.fromLTRB(24, 4, 24, state.current == null ? 28 : 118),
    children: [
      Text('Góc của bạn', style: editorial(31)),
      const SizedBox(height: 24),
      Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: ArtworkImage(
              artworkReference('avatar'),
              width: 56,
              height: 56,
              semanticLabel: 'Ảnh đại diện của bạn',
              fallback: ColoredBox(
                color: Palette.soft,
                child: Center(
                  child: Text(
                    state.displayName.trim().isEmpty
                        ? '?'
                        : String.fromCharCode(state.displayName.runes.first)
                              .toUpperCase(),
                    style: editorial(28),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  state.displayName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  state.isLoggedIn
                      ? (state.userEmail ??
                            state.userPhone ??
                            'Đã đăng nhập (Mô phỏng)')
                      : 'Hồ sơ trên thiết bị này',
                  style: const TextStyle(color: Palette.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Sửa tên hiển thị',
            onPressed: () => showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              showDragHandle: true,
              builder: (_) => EditNameSheet(state: state),
            ),
            icon: const Icon(CupertinoIcons.pencil, size: 20),
          ),
        ],
      ),
      const SizedBox(height: 16),
      if (!state.isLoggedIn)
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
              const Row(
                children: [
                  Icon(
                    CupertinoIcons.person_crop_circle_badge_checkmark,
                    size: 20,
                    color: Palette.red,
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Tài khoản người nghe',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Lưu câu chuyện, bình luận và theo dõi kênh yêu thích.',
                style: TextStyle(
                  color: Palette.muted,
                  fontSize: 12,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      key: const Key('open-login-btn'),
                      onPressed: () => _openAuth(context),
                      child: const Text(
                        'Đăng nhập / Đăng ký',
                        style: TextStyle(fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      const SizedBox(height: 24),
      const Divider(),
      const SizedBox(height: 8),
      _PersonalLink(
        key: const Key('open-updates'),
        icon: CupertinoIcons.bell,
        title: 'Cập nhật',
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => NotificationPage(state: state),
          ),
        ),
      ),
      _PersonalLink(
        key: const Key('open-tx-history'),
        icon: CupertinoIcons.tickets,
        title: 'Hội viên & giao dịch',
        subtitle: state.memberships.isEmpty
            ? null
            : '${state.memberships.length} kênh hội viên',
        onTap: () => showModalBottomSheet<void>(
          context: context,
          isScrollControlled: true,
          showDragHandle: true,
          builder: (_) => TransactionHistorySheet(state: state),
        ),
      ),
      const SizedBox(height: 20),
      const Divider(),
      const SizedBox(height: 8),
      _PersonalLink(
        key: const Key('open-workspace'),
        icon: CupertinoIcons.pencil_outline,
        title: 'Không gian sáng tạo',
        subtitle: 'Dành cho người kể và người đọc',
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => CreativeWorkspacePage(state: state),
          ),
        ),
      ),
      _PersonalLink(
        key: const Key('open-settings'),
        icon: CupertinoIcons.gear,
        title: 'Cài đặt & bản thử',
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => PersonalSettingsPage(state: state),
          ),
        ),
      ),
    ],
  );
}

class _PersonalLink extends StatelessWidget {
  const _PersonalLink({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(vertical: 4),
    leading: Icon(icon, size: 22),
    title: Text(
      title,
      style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
    ),
    subtitle: subtitle == null
        ? null
        : Text(
            subtitle!,
            style: const TextStyle(fontSize: 12, color: Palette.muted),
          ),
    trailing: const Icon(CupertinoIcons.chevron_right, size: 16),
    onTap: onTap,
  );
}

class CreativeWorkspacePage extends StatelessWidget {
  const CreativeWorkspacePage({super.key, required this.state});
  final AppState state;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Không gian sáng tạo')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      children: [
        Text('Từ trang viết\nđến giọng kể.', style: editorial(28)),
        const SizedBox(height: 28),
        const Eyebrow('NGƯỜI KỂ'),
        const SizedBox(height: 8),
        _PersonalLink(
          key: const Key('open-studio'),
          icon: CupertinoIcons.pencil_outline,
          title: 'Studio người kể',
          subtitle: 'Kênh, bản thảo và duyệt nội dung',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => CreatorStudio(preferences: state.preferences),
            ),
          ),
        ),
        _PersonalLink(
          key: const Key('open-publish'),
          icon: CupertinoIcons.paperplane,
          title: 'Phát hành nội dung',
          subtitle: 'Tập đã duyệt và tập đã phát hành',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) =>
                  PublicationPage(preferences: state.preferences, app: state),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Divider(),
        const SizedBox(height: 20),
        const Eyebrow('NGƯỜI ĐỌC'),
        const SizedBox(height: 8),
        _PersonalLink(
          key: const Key('open-narrator'),
          icon: CupertinoIcons.mic,
          title: 'Không gian người đọc',
          subtitle: 'Giọng đọc, lời mời và công việc',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => NarratorHome(preferences: state.preferences),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Divider(),
        const SizedBox(height: 8),
        _PersonalLink(
          key: const Key('open-wallet'),
          icon: CupertinoIcons.creditcard,
          title: 'Ví & rút tiền',
          subtitle: 'Số dư và giao dịch của cả hai vai trò',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => WalletPage(preferences: state.preferences),
            ),
          ),
        ),
      ],
    ),
  );
}

class PersonalSettingsPage extends StatelessWidget {
  const PersonalSettingsPage({super.key, required this.state});
  final AppState state;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Cài đặt & bản thử')),
    body: AnimatedBuilder(
      animation: state,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        children: [
          _PersonalLink(
            icon: CupertinoIcons.person_crop_circle,
            title: 'Tên hiển thị',
            subtitle: state.displayName,
            onTap: () => showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              showDragHandle: true,
              builder: (_) => EditNameSheet(state: state),
            ),
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 16),
          const Eyebrow('BẢN THỬ GIAO DIỆN'),
          _PersonalLink(
            key: const Key('open-demo-data'),
            icon: CupertinoIcons.square_stack,
            title: 'Dữ liệu thử giao diện',
            subtitle: 'Nạp bộ mẫu hoặc khôi phục dữ liệu',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => DemoDataPage(state: state),
              ),
            ),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(CupertinoIcons.info_circle, size: 21),
            title: const Text(
              'Về bản thử Sử Ký',
              style: TextStyle(fontSize: 14),
            ),
            trailing: const Icon(CupertinoIcons.chevron_right, size: 16),
            onTap: () => showModalBottomSheet<void>(
              context: context,
              showDragHandle: true,
              builder: (_) => const SafeArea(
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sử Ký · Bản thử giao diện',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Các kênh và tập là dữ liệu mẫu. Tập kỹ thuật có audio/video phát thật; các tập biên tập chưa có giọng kể. Hồ sơ và quyền thử lưu trên thiết bị, chưa có đồng bộ tài khoản.',
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Bạn có thể tắt hội viên thử ở từng kênh. Không có thanh toán hoặc thu thập thông tin thanh toán.',
                        style: TextStyle(color: Palette.muted),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (state.isLoggedIn) ...[
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 12),
            TextButton.icon(
              icon: const Icon(CupertinoIcons.square_arrow_right, size: 18),
              label: const Text('Đăng xuất'),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Đăng xuất?'),
                    content: const Text(
                      'Bạn sẽ trở về hồ sơ người nghe trên thiết bị.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Ở lại'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text('Đăng xuất'),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  await state.logout();
                  if (context.mounted) Navigator.pop(context);
                }
              },
            ),
          ],
        ],
      ),
    ),
  );
}

class AuthSheet extends StatefulWidget {
  const AuthSheet({super.key, required this.state});
  final AppState state;
  @override
  State<AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends State<AuthSheet> {
  int tab = 0; // 0: Login, 1: Register
  final identifierCtrl = TextEditingController();
  final passwordCtrl = TextEditingController();
  final nameCtrl = TextEditingController();
  final formKey = GlobalKey<FormState>();
  bool busy = false;
  String? error;

  Future<void> recoverPassword() async {
    FocusScope.of(context).unfocus();
    final result = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            PasswordRecoveryPage(initialIdentifier: identifierCtrl.text),
      ),
    );
    if (!mounted || result == null) return;
    setState(() {
      identifierCtrl.text = result;
      passwordCtrl.clear();
      tab = 0;
      error = null;
    });
  }

  @override
  void dispose() {
    identifierCtrl.dispose();
    passwordCtrl.dispose();
    nameCtrl.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      if (tab == 0) {
        await widget.state.login(
          identifier: identifierCtrl.text,
          password: passwordCtrl.text,
        );
      } else {
        await widget.state.register(
          name: nameCtrl.text,
          identifier: identifierCtrl.text,
          password: passwordCtrl.text,
        );
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() {
          busy = false;
          error = e
              .toString()
              .replaceFirst('Exception: ', '')
              .replaceFirst('ArgumentError: ', '');
        });
      }
    }
  }

  Future<void> guestLogin() async {
    setState(() {
      busy = true;
      error = null;
    });
    await widget.state.loginAsGuest();
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) => SafeArea(
    child: SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        24,
        12,
        24,
        MediaQuery.viewInsetsOf(context).bottom + 24,
      ),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Eyebrow('TÀI KHOẢN NGƯỜI NGHE · UC-06'),
            const SizedBox(height: 12),
            Text(
              tab == 0 ? 'Đăng nhập Sử Ký' : 'Đăng ký tài khoản',
              style: editorial(26),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ChoiceChip(
                  label: const Text('Đăng nhập'),
                  selected: tab == 0,
                  onSelected: (_) => setState(() {
                    tab = 0;
                    error = null;
                  }),
                  selectedColor: Palette.soft,
                  backgroundColor: Palette.paper,
                  side: BorderSide(
                    color: tab == 0 ? Palette.ink : Palette.line,
                  ),
                ),
                ChoiceChip(
                  label: const Text('Đăng ký mới'),
                  selected: tab == 1,
                  onSelected: (_) => setState(() {
                    tab = 1;
                    error = null;
                  }),
                  selectedColor: Palette.soft,
                  backgroundColor: Palette.paper,
                  side: BorderSide(
                    color: tab == 1 ? Palette.ink : Palette.line,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (tab == 1) ...[
              TextFormField(
                key: const Key('auth-name'),
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Họ và tên hiển thị',
                  hintText: 'Nguyễn Văn A',
                ),
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'Nhập họ tên của bạn'
                    : null,
              ),
              const SizedBox(height: 16),
            ],
            TextFormField(
              key: const Key('auth-identifier'),
              controller: identifierCtrl,
              decoration: const InputDecoration(
                labelText: 'Email hoặc số điện thoại',
                hintText: 'nghechuyen@suky.vn hoặc 0901234567',
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Nhập email hoặc SĐT' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              key: const Key('auth-password'),
              controller: passwordCtrl,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Mật khẩu',
                helperText: 'Tối thiểu 6 ký tự',
              ),
              validator: (v) => v == null || v.length < 6
                  ? 'Mật khẩu từ 6 ký tự trở lên'
                  : null,
            ),
            if (tab == 0)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  key: const Key('auth-forgot'),
                  onPressed: busy ? null : recoverPassword,
                  child: const Text('Quên mật khẩu?'),
                ),
              ),
            if (error != null) ...[
              const SizedBox(height: 12),
              Text(
                error!,
                style: const TextStyle(color: Palette.red, fontSize: 13),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                key: const Key('auth-submit-btn'),
                onPressed: busy ? null : submit,
                child: Text(
                  busy
                      ? 'Đang xử lý…'
                      : (tab == 0 ? 'Đăng nhập' : 'Tạo tài khoản'),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: busy ? null : guestLogin,
                child: const Text('Dùng tài khoản khách thử nghiệm'),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Lưu ý: Xác thực tài khoản mô phỏng theo Use Case UC-06 trong tài liệu. Chưa kết nối OAuth/SMS Gateway thực tế.',
              style: TextStyle(color: Palette.muted, fontSize: 11, height: 1.5),
            ),
          ],
        ),
      ),
    ),
  );
}

class TransactionHistorySheet extends StatelessWidget {
  const TransactionHistorySheet({super.key, required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) => SafeArea(
    child: SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Eyebrow('LỊCH SỬ GIAO DỊCH · FR-06 / BR-07'),
          const SizedBox(height: 12),
          Text('Gói hội viên & Giao dịch', style: editorial(24)),
          const SizedBox(height: 8),
          const Text(
            'Các giao dịch kích hoạt và hủy hội viên thử nghiệm trên thiết bị này.',
            style: TextStyle(color: Palette.muted, fontSize: 12),
          ),
          const SizedBox(height: 20),
          if (state.memberships.isNotEmpty) ...[
            const SectionTitle(title: 'Kênh hội viên của bạn'),
            const SizedBox(height: 12),
            ...channels
                .where((c) => state.memberships.contains(c.name))
                .map(
                  (c) => ChannelListItem(
                    channel: c,
                    subtitle: 'Quản lý quyền hội viên',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) =>
                            MembershipPage(channel: c, state: state),
                      ),
                    ),
                  ),
                ),
            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 20),
          ],
          if (state.transactions.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Palette.soft,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text(
                  'Chưa có giao dịch hội viên nào được ghi nhận.',
                  style: TextStyle(color: Palette.muted, fontSize: 13),
                ),
              ),
            )
          else
            ...state.transactions.map(
              (tx) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.paper,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            tx.planTitle,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
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
                            tx.status,
                            style: const TextStyle(
                              fontSize: 11,
                              color: Palette.red,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Text(
                          'Mã: ${tx.id}',
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 11,
                            color: Palette.muted,
                          ),
                        ),
                        Text(
                          tx.date,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Palette.muted,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Loại thao tác: ${tx.type}',
                      style: const TextStyle(fontSize: 12, color: Palette.ink),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),
          const Text(
            'Ghi chú: Toàn bộ phí và tỷ lệ hoa hồng nền tảng hiện đang theo trạng thái TBD theo tài liệu BRD/FRD v1.1.',
            style: TextStyle(color: Palette.muted, fontSize: 11, height: 1.5),
          ),
        ],
      ),
    ),
  );
}

class EditNameSheet extends StatefulWidget {
  const EditNameSheet({super.key, required this.state});
  final AppState state;
  @override
  State<EditNameSheet> createState() => _EditNameSheetState();
}

class _EditNameSheetState extends State<EditNameSheet> {
  late final controller = TextEditingController(text: widget.state.displayName);
  final formKey = GlobalKey<FormState>();
  bool busy = false;
  String? error;
  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> save() async {
    if (!formKey.currentState!.validate()) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await widget.state.updateName(controller.text);
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) {
        setState(() {
          busy = false;
          error = 'Chưa lưu được tên. Vui lòng thử lại.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => SafeArea(
    child: SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        24,
        12,
        24,
        MediaQuery.viewInsetsOf(context).bottom + 24,
      ),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            ArtworkEditor(
              preferences: widget.state.preferences,
              target: 'avatar',
              kind: ArtworkKind.avatar,
              label: 'Ảnh đại diện',
            ),
            const SizedBox(height: 24),
            Text('Bạn muốn được gọi là gì?', style: editorial(24)),
            const SizedBox(height: 20),
            TextFormField(
              key: const Key('profile-name'),
              controller: controller,
              autofocus: true,
              maxLength: 40,
              decoration: const InputDecoration(
                labelText: 'Tên hiển thị',
                helperText: 'Tên này chỉ lưu trên thiết bị của bạn.',
              ),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Nhập tên hiển thị của bạn.'
                  : null,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) {
                if (!busy) save();
              },
            ),
            if (error != null)
              Text(error!, style: const TextStyle(color: Palette.red)),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: busy ? null : save,
                child: Text(busy ? 'Đang lưu…' : 'Lưu tên'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class ChannelMark extends StatelessWidget {
  const ChannelMark({super.key, required this.channel});
  final Channel channel;
  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: Container(
      width: 48,
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Palette.soft,
        borderRadius: BorderRadius.circular(5),
      ),
      child: channel.image.startsWith('local-artwork:')
          ? ClipRRect(
              borderRadius: BorderRadius.circular(5),
              child: ArtworkImage(
                channel.image,
                width: 48,
                height: 56,
                fallback: Center(
                  child: Text(channel.initial, style: editorial(25)),
                ),
              ),
            )
          : Text(channel.initial, style: editorial(25)),
    ),
  );
}

class ChannelListItem extends StatelessWidget {
  const ChannelListItem({
    super.key,
    required this.channel,
    required this.subtitle,
    required this.onTap,
  });
  final Channel channel;
  final String subtitle;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          ChannelMark(channel: channel),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  channel.name,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(color: Palette.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(CupertinoIcons.chevron_right, size: 16),
        ],
      ),
    ),
  );
}

class Benefit extends StatelessWidget {
  const Benefit({
    super.key,
    required this.icon,
    required this.title,
    required this.detail,
  });
  final IconData icon;
  final String title, detail;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 22, color: Palette.muted),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              Text(
                detail,
                style: const TextStyle(
                  fontSize: 12,
                  color: Palette.muted,
                  height: 1.7,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
