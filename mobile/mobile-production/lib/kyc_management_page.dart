import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'app_state.dart';
import 'components.dart';
import 'creator_state.dart';
import 'design.dart';
import 'kyc_form.dart';
import 'studio_pages.dart';

class KycManagementPage extends StatefulWidget {
  const KycManagementPage({
    super.key,
    required this.appState,
    this.creatorState,
  });

  final AppState appState;
  final CreatorState? creatorState;

  @override
  State<KycManagementPage> createState() => _KycManagementPageState();
}

class _KycManagementPageState extends State<KycManagementPage> {
  late final CreatorState creator = widget.creatorState ??
      CreatorState(
        widget.appState.preferences,
        channelRepository: widget.appState.channelRepository,
        creatorSeriesRepository: widget.appState.creatorSeriesRepository,
        creatorStudioRepository: widget.appState.creatorStudioRepository,
        kycRepository: widget.appState.kycRepository,
        contractRepository: widget.appState.contractRepository,
        hireRequestRepository: widget.appState.hireRequestRepository,
        milestoneRepository: widget.appState.milestoneRepository,
        deliverableRepository: widget.appState.deliverableRepository,
        disputeRepository: widget.appState.disputeRepository,
        chatRepository: widget.appState.chatRepository,
        narratorProfileRepository: widget.appState.narratorProfileRepository,
        narratorDemoRepository: widget.appState.narratorDemoRepository,
        freelancerRepository: widget.appState.freelancerRepository,
        postRepository: widget.appState.postRepository,
        walletRepository: widget.appState.walletRepository,
        withdrawalRepository: widget.appState.withdrawalRepository,
      );

  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _refreshKyc();
  }

  Future<void> _refreshKyc() async {
    setState(() => _loading = true);
    try {
      if (creator.isLiveBackend) {
        await creator.initStudioBackend();
      }
      await widget.appState.refreshProfile();
    } catch (_) {}
    if (mounted) {
      setState(() => _loading = false);
    }
  }

  void _openKycForm() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => KycSheet(
        state: creator,
        onSubmitted: () async {
          Navigator.pop(context);
          await _refreshKyc();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Hồ sơ xác thực KYC đã được gửi thành công!'),
                backgroundColor: Color(0xFF2E7D32),
              ),
            );
          }
        },
      ),
    );
  }

  void _navigateToStudio() {
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (_) => CreatorStudio(
          preferences: widget.appState.preferences,
          channelRepository: widget.appState.channelRepository,
          creatorSeriesRepository: widget.appState.creatorSeriesRepository,
          creatorStudioRepository: widget.appState.creatorStudioRepository,
          kycRepository: widget.appState.kycRepository,
          contractRepository: widget.appState.contractRepository,
          hireRequestRepository: widget.appState.hireRequestRepository,
          milestoneRepository: widget.appState.milestoneRepository,
          deliverableRepository: widget.appState.deliverableRepository,
          disputeRepository: widget.appState.disputeRepository,
          chatRepository: widget.appState.chatRepository,
          narratorProfileRepository: widget.appState.narratorProfileRepository,
          narratorDemoRepository: widget.appState.narratorDemoRepository,
          freelancerRepository: widget.appState.freelancerRepository,
          postRepository: widget.appState.postRepository,
          walletRepository: widget.appState.walletRepository,
          withdrawalRepository: widget.appState.withdrawalRepository,
        ),
      ),
    );
  }

  String _maskAccountNumber(String raw) {
    final clean = raw.trim();
    if (clean.length <= 4) return clean;
    final last4 = clean.substring(clean.length - 4);
    return '********$last4';
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([widget.appState, creator]),
      builder: (context, _) {
        final kyc = creator.kyc;
        final status = kyc.status;
        final isApproved = status == KycStatus.approved;
        final isPending = status == KycStatus.pending;
        final isRejected = status == KycStatus.rejected;
        final notSubmitted = status == KycStatus.notSubmitted;

        final displayName = kyc.fullName.isNotEmpty
            ? kyc.fullName
            : (widget.appState.displayName.isNotEmpty
                ? widget.appState.displayName
                : 'Nhà sáng tạo');

        return Scaffold(
          appBar: AppBar(
            title: const Text(
              'Xác thực KYC',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            actions: [
              IconButton(
                key: const Key('refresh-kyc-btn'),
                tooltip: 'Làm mới',
                onPressed: _loading ? null : _refreshKyc,
                icon: _loading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(CupertinoIcons.arrow_clockwise, size: 20),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: _refreshKyc,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              children: [
                // Top Header Banner
                _buildTopBanner(status, isApproved, isPending, isRejected),
                const SizedBox(height: 16),

                // Hero Status Card
                _buildHeroCard(
                  status: status,
                  isApproved: isApproved,
                  isPending: isPending,
                  isRejected: isRejected,
                  notSubmitted: notSubmitted,
                  displayName: displayName,
                  rejectionReason: kyc.rejectionReason,
                ),
                const SizedBox(height: 16),

                // Verified Information Section
                if (!notSubmitted) ...[
                  _buildVerifiedInfoCard(kyc, isApproved),
                  const SizedBox(height: 16),
                ],

                // Creator Benefits Card
                _buildBenefitsCard(isApproved),
                const SizedBox(height: 16),

                // Security Banner Card
                _buildSecurityBanner(),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTopBanner(
    KycStatus status,
    bool isApproved,
    bool isPending,
    bool isRejected,
  ) {
    final title = isApproved
        ? 'Hồ Sơ KYC Đã Được Phê Duyệt'
        : (isPending
            ? 'Hồ Sơ KYC Đang Chờ Phê Duyệt'
            : (isRejected
                ? 'Hồ Sơ KYC Cần Cập Nhật Lại'
                : 'Xác Thực Danh Tính Tác Giả'));

    final subtitle = isApproved
        ? 'Tài khoản của bạn đã được Ban Quản trị Sử Ký xác thực đầy đủ. Bạn có thể truy cập tất cả các tính năng và bắt đầu sáng tạo nội dung trên nền tảng.'
        : (isPending
            ? 'Hồ sơ của bạn đã được gửi thành công và đang được Ban Quản trị Sử Ký thẩm định. Quá trình xét duyệt thường diễn ra trong vòng 24 giờ.'
            : (isRejected
                ? 'Hồ sơ định danh chưa đạt yêu cầu của Ban Quản trị. Vui lòng kiểm tra lý do và gửi lại thông tin chính xác.'
                : 'Xác thực thông tin định danh và tài khoản ngân hàng thụ hưởng để xuất bản tác phẩm, mở kênh podcast và nhận nhuận bút tác quyền.'));

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFBF4F3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.red.withValues(alpha: .2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                CupertinoIcons.shield_lefthalf_fill,
                size: 15,
                color: Palette.red,
              ),
              const SizedBox(width: 6),
              Text(
                'XÁC THỰC DANH TÍNH NHÀ SÁNG TẠO',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: .6,
                  color: Palette.red.withValues(alpha: .9),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Palette.ink,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 13,
              height: 1.45,
              color: Palette.muted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroCard({
    required KycStatus status,
    required bool isApproved,
    required bool isPending,
    required bool isRejected,
    required bool notSubmitted,
    required String displayName,
    required String rejectionReason,
  }) {
    final statusColor = isApproved
        ? const Color(0xFF2E7D32)
        : (isPending
            ? const Color(0xFFE65100)
            : (isRejected
                ? const Color(0xFFC62828)
                : const Color(0xFF5E6470)));

    final statusBg = isApproved
        ? const Color(0xFFE8F5E9)
        : (isPending
            ? const Color(0xFFFFF3E0)
            : (isRejected
                ? const Color(0xFFFFEBEE)
                : const Color(0xFFF1F3F5)));

    final statusText = isApproved
        ? 'ĐÃ PHÊ DUYỆT (APPROVED)'
        : (isPending
            ? 'ĐANG CHỜ DUYỆT (PENDING)'
            : (isRejected
                ? 'BỊ TỪ CHỐI (REJECTED)'
                : 'CHƯA NỘP HỒ SƠ'));

    final iconData = isApproved
        ? CupertinoIcons.checkmark_alt_circle_fill
        : (isPending
            ? CupertinoIcons.clock_fill
            : (isRejected
                ? CupertinoIcons.xmark_circle_fill
                : CupertinoIcons.person_crop_circle_badge_exclam));

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: .03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(iconData, color: statusColor, size: 28),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                    letterSpacing: .3,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            isApproved
                ? 'Chào mừng Nhà sáng tạo $displayName'
                : (isPending
                    ? 'Hồ sơ của $displayName đang được thẩm định'
                    : (isRejected
                        ? 'Hồ sơ của $displayName bị từ chối'
                        : 'Bắt đầu đăng ký Nhà sáng tạo')),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Palette.ink,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isApproved
                ? 'Bạn đã đủ điều kiện xuất bản tác phẩm và quản lý kênh podcast. Mọi khoản thù lao nhuận bút và phân phối tác quyền sẽ được thanh toán về tài khoản ngân hàng đã đăng ký.'
                : (isPending
                    ? 'Bạn đã nộp thành công hồ sơ xác thực. Trong thời gian này, bạn có thể hoàn thiện bản thảo tập phim trước khi xuất bản.'
                    : (isRejected
                        ? (rejectionReason.isNotEmpty
                            ? 'Lý do: $rejectionReason'
                            : 'Vui lòng kiểm tra lại họ tên, thông tin tài khoản ngân hàng và gửi lại đơn xác thực.')
                        : 'Để bảo vệ tác quyền và đảm bảo quyền lợi chi trả thù lao, Sử Ký yêu cầu xác thực danh tính trước khi mở kênh.')),
            style: const TextStyle(fontSize: 13, height: 1.45, color: Palette.muted),
          ),
          const SizedBox(height: 14),

          // Actions
          if (isApproved) ...[
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    key: const Key('go-to-studio-btn'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Palette.red,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: _navigateToStudio,
                    icon: const Icon(CupertinoIcons.sparkles, size: 16),
                    label: const Text(
                      'Đến Không Gian Quản Lý Kênh →',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    key: const Key('update-kyc-btn'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Palette.ink,
                      side: const BorderSide(color: Palette.line),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    onPressed: _openKycForm,
                    icon: const Icon(CupertinoIcons.pencil, size: 15),
                    label: const Text(
                      'Cập nhật thông tin KYC',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ),
                ),
              ],
            ),
          ] else if (isPending) ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    key: const Key('refresh-pending-btn'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Palette.ink,
                      side: const BorderSide(color: Palette.line),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 11),
                    ),
                    onPressed: _refreshKyc,
                    icon: const Icon(CupertinoIcons.arrow_clockwise, size: 16),
                    label: const Text('Làm mới trạng thái'),
                  ),
                ),
              ],
            ),
            if (!creator.isLiveBackend) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF2E7D32),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onPressed: () async {
                        await creator.simulateKycDecision(true);
                        await widget.appState.refreshProfile();
                        setState(() {});
                      },
                      child: const Text('Mô phỏng Duyệt'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFC62828),
                        side: const BorderSide(color: Color(0xFFC62828)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onPressed: () async {
                        await creator.simulateKycDecision(
                          false,
                          reason: 'Ảnh chụp CMND/CCCD mờ hoặc thông tin không khớp',
                        );
                        await widget.appState.refreshProfile();
                        setState(() {});
                      },
                      child: const Text('Mô phỏng Từ chối'),
                    ),
                  ),
                ],
              ),
            ],
          ] else ...[
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    key: const Key('submit-kyc-action-btn'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Palette.red,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: _openKycForm,
                    icon: const Icon(
                      CupertinoIcons.person_crop_circle_badge_checkmark,
                      size: 16,
                    ),
                    label: Text(
                      isRejected ? 'Chỉnh sửa & Gửi lại hồ sơ' : 'Bắt đầu xác thực KYC ngay',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildVerifiedInfoCard(KycProfile kyc, bool isApproved) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    CupertinoIcons.person_crop_square_fill,
                    size: 16,
                    color: Palette.red,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Thông tin định danh đã xác thực',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Palette.ink,
                    ),
                  ),
                ],
              ),
              if (kyc.otpVerifiedAt.isNotEmpty)
                Text(
                  'Xác thực: ${kyc.otpVerifiedAt}',
                  style: const TextStyle(fontSize: 11, color: Palette.muted),
                ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),

          _buildInfoRow(
            label: 'Họ và tên tác giả',
            value: kyc.fullName.isNotEmpty ? kyc.fullName : 'Chưa cập nhật',
            icon: CupertinoIcons.person,
            isVerified: isApproved,
          ),
          const SizedBox(height: 10),

          _buildInfoRow(
            label: 'Email liên hệ',
            value: kyc.contactEmail.isNotEmpty ? kyc.contactEmail : 'Chưa cập nhật',
            icon: CupertinoIcons.mail,
            isVerified: isApproved,
          ),
          const SizedBox(height: 10),

          _buildInfoRow(
            label: 'Số điện thoại',
            value: kyc.phone.isNotEmpty ? kyc.phone : 'Chưa cập nhật',
            icon: CupertinoIcons.phone,
            isVerified: isApproved,
          ),
          const SizedBox(height: 10),

          _buildInfoRow(
            label: 'Ngân hàng thụ hưởng',
            value: kyc.bankName.isNotEmpty ? kyc.bankName : 'Chưa cập nhật',
            icon: CupertinoIcons.building_2_fill,
            isVerified: isApproved,
          ),
          const SizedBox(height: 10),

          _buildInfoRow(
            label: 'Số tài khoản ngân hàng',
            value: kyc.bankAccountNumber.isNotEmpty
                ? _maskAccountNumber(kyc.bankAccountNumber)
                : 'Chưa cập nhật',
            icon: CupertinoIcons.creditcard,
            isVerified: isApproved,
          ),
          const SizedBox(height: 10),

          _buildInfoRow(
            label: 'Chủ tài khoản thụ hưởng',
            value: kyc.bankAccountHolder.isNotEmpty
                ? kyc.bankAccountHolder.toUpperCase()
                : (kyc.fullName.isNotEmpty
                    ? kyc.fullName.toUpperCase()
                    : 'Chưa cập nhật'),
            icon: CupertinoIcons.person_crop_square,
            isVerified: isApproved,
          ),

          if (kyc.bio.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildInfoRow(
              label: 'Tiểu sử tác giả',
              value: kyc.bio,
              icon: CupertinoIcons.book,
              isVerified: false,
            ),
          ],

          if (kyc.portfolioUrl.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildInfoRow(
              label: 'Hồ sơ năng lực / Portfolio',
              value: kyc.portfolioUrl,
              icon: CupertinoIcons.link,
              isVerified: false,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required String label,
    required String value,
    required IconData icon,
    required bool isVerified,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Palette.soft.withValues(alpha: .35),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Palette.line.withValues(alpha: .5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Palette.muted),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Palette.muted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Palette.ink,
                  ),
                ),
              ],
            ),
          ),
          if (isVerified)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'Đã xác thực',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E7D32),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBenefitsCard(bool isApproved) {
    final benefits = [
      'Được xuất bản podcast và video không giới hạn',
      'Nhận thù lao nhuận bút theo chính sách phân phối',
      'Tham gia chương trình đối tác & hợp tác giọng đọc',
      'Sử dụng đầy đủ tính năng Creator Studio và AI Pipeline',
      'Được hỗ trợ ưu tiên trực tiếp từ đội ngũ Sử Ký',
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(CupertinoIcons.star_fill, size: 16, color: Color(0xFFF57C00)),
              SizedBox(width: 8),
              Text(
                'Quyền lợi sau khi xác thực',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Palette.ink,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),

          ...benefits.map(
            (b) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    CupertinoIcons.check_mark_circled_solid,
                    size: 15,
                    color: Color(0xFF2E7D32),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      b,
                      style: const TextStyle(
                        fontSize: 12.5,
                        height: 1.35,
                        color: Palette.ink,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isApproved
                  ? const Color(0xFFE8F5E9)
                  : Palette.soft.withValues(alpha: .5),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              children: [
                Icon(
                  isApproved
                      ? CupertinoIcons.checkmark_seal_fill
                      : CupertinoIcons.info_circle_fill,
                  size: 14,
                  color: isApproved
                      ? const Color(0xFF2E7D32)
                      : Palette.muted,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    isApproved
                        ? 'Đã kích hoạt toàn bộ đặc quyền trên hệ thống'
                        : 'Sẽ tự động kích hoạt sau khi hồ sơ được phê duyệt',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isApproved
                          ? const Color(0xFF2E7D32)
                          : Palette.muted,
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

  Widget _buildSecurityBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFBF4F3),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Palette.red.withValues(alpha: .15)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            CupertinoIcons.lock_shield_fill,
            size: 18,
            color: Palette.red,
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Thông tin của bạn được bảo mật tuyệt đối',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Palette.ink,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Sử Ký cam kết bảo vệ thông tin cá nhân và tài chính của nhà sáng tạo theo các tiêu chuẩn bảo mật cao nhất.',
                  style: TextStyle(
                    fontSize: 11,
                    height: 1.4,
                    color: Palette.muted,
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
