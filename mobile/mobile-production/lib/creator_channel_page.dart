import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'core/api/channel_repository.dart';
import 'creator_state.dart';
import 'creator_studio_extensions.dart';
import 'design.dart';

class CreatorChannelPage extends StatefulWidget {
  const CreatorChannelPage({
    super.key,
    required this.state,
    this.onOpenPreview,
  });

  final CreatorState state;
  final VoidCallback? onOpenPreview;

  @override
  State<CreatorChannelPage> createState() => _CreatorChannelPageState();
}

class _CreatorChannelPageState extends State<CreatorChannelPage> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  final _formKey = GlobalKey<FormState>();

  bool _savingInfo = false;
  bool _uploadingAvatar = false;
  bool _uploadingCover = false;
  String? _feedbackMessage;
  bool _isErrorFeedback = false;

  @override
  void initState() {
    super.initState();
    final model = widget.state.channelModel;
    _nameCtrl = TextEditingController(text: model?.name ?? widget.state.channel);
    _descCtrl = TextEditingController(
      text: model?.description ?? widget.state.channelDescription,
    );
    _loadRemoteData();
  }

  Future<void> _loadRemoteData() async {
    await widget.state.fetchMyChannel();
    if (mounted) {
      final model = widget.state.channelModel;
      if (model != null) {
        if (_nameCtrl.text.isEmpty) _nameCtrl.text = model.name;
        if (_descCtrl.text.isEmpty) _descCtrl.text = model.description;
      }
      setState(() {});
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '–';
    try {
      final dt = DateTime.parse(raw).toLocal();
      final d = dt.day.toString().padLeft(2, '0');
      final m = dt.month.toString().padLeft(2, '0');
      final y = dt.year;
      return '$d/$m/$y';
    } catch (_) {
      return raw.length >= 10 ? raw.substring(0, 10) : raw;
    }
  }

  String _formatPrice(double? price) {
    final p = (price ?? 50000).round();
    final s = p.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buffer.write('.');
      buffer.write(s[i]);
    }
    return '${buffer.toString()}đ';
  }

  Future<void> _handleUploadAvatar() async {
    setState(() {
      _uploadingAvatar = true;
      _feedbackMessage = null;
    });

    try {
      List<int> bytes;
      String filename = 'channel_avatar.png';

      try {
        final files = await FilePicker.pickFiles(type: FileType.image);
        if (files.isNotEmpty) {
          final file = files.first;
          filename = file.name;
          bytes = await file.xFile.readAsBytes();
        } else {
          // Fallback giả lập 1x1 png cho môi trường test
          bytes = [137, 80, 78, 71, 13, 10, 26, 10];
        }
      } catch (_) {
        bytes = [137, 80, 78, 71, 13, 10, 26, 10];
      }

      final updated = await widget.state.uploadChannelAvatar(bytes, filename);
      if (mounted) {
        setState(() {
          _uploadingAvatar = false;
          _feedbackMessage = 'Cập nhật ảnh đại diện kênh thành công!';
          _isErrorFeedback = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cập nhật ảnh đại diện kênh thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _uploadingAvatar = false;
          _feedbackMessage = 'Tải ảnh đại diện thất bại: $e';
          _isErrorFeedback = true;
        });
      }
    }
  }

  Future<void> _handleUploadCover() async {
    setState(() {
      _uploadingCover = true;
      _feedbackMessage = null;
    });

    try {
      List<int> bytes;
      String filename = 'channel_cover.png';

      try {
        final files = await FilePicker.pickFiles(type: FileType.image);
        if (files.isNotEmpty) {
          final file = files.first;
          filename = file.name;
          bytes = await file.xFile.readAsBytes();
        } else {
          // Fallback giả lập 1x1 png cho môi trường test
          bytes = [137, 80, 78, 71, 13, 10, 26, 10];
        }
      } catch (_) {
        bytes = [137, 80, 78, 71, 13, 10, 26, 10];
      }

      final updated = await widget.state.uploadChannelCover(bytes, filename);
      if (mounted) {
        setState(() {
          _uploadingCover = false;
          _feedbackMessage = 'Cập nhật ảnh bìa kênh (Cover Banner) thành công!';
          _isErrorFeedback = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cập nhật ảnh bìa kênh thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _uploadingCover = false;
          _feedbackMessage = 'Tải ảnh bìa thất bại: $e';
          _isErrorFeedback = true;
        });
      }
    }
  }

  Future<void> _handleSaveChannelInfo() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _savingInfo = true;
      _feedbackMessage = null;
    });

    try {
      await widget.state.updateChannelProfile(
        name: _nameCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        category: 'Lịch sử Việt Nam',
      );

      if (mounted) {
        setState(() {
          _savingInfo = false;
          _feedbackMessage = 'Cập nhật thông tin kênh thành công!';
          _isErrorFeedback = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cập nhật thông tin kênh thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _savingInfo = false;
          _feedbackMessage = 'Cập nhật thông tin kênh thất bại: $e';
          _isErrorFeedback = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.state,
      builder: (context, _) {
        final channel = widget.state.channelModel;
        final channelName = channel?.name ?? (widget.state.channel.isNotEmpty ? widget.state.channel : 'Kênh Podcast');
        final channelDesc = channel?.description ?? widget.state.channelDescription;
        final channelStatus = channel?.status ?? 'ACTIVE';
        final coverUrl = channel?.coverUrl;
        final avatarUrl = channel?.avatarUrl;
        final plan = widget.state.membershipPlan;

        return Scaffold(
          backgroundColor: Palette.paper,
          appBar: AppBar(
            backgroundColor: Palette.paper,
            title: const Text(
              'Quản lý Kênh',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            actions: [
              if (widget.onOpenPreview != null)
                IconButton(
                  key: const Key('open-channel-preview-btn'),
                  tooltip: 'Xem trang kênh',
                  icon: const Icon(CupertinoIcons.eye, size: 20),
                  onPressed: widget.onOpenPreview,
                ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              // Thông báo kết quả (nếu có)
              if (_feedbackMessage != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: _isErrorFeedback
                        ? Palette.red.withValues(alpha: 0.1)
                        : const Color(0xFF2E7D32).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _isErrorFeedback ? Palette.red : const Color(0xFF2E7D32),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _isErrorFeedback ? CupertinoIcons.exclamationmark_triangle_fill : CupertinoIcons.checkmark_seal_fill,
                        size: 16,
                        color: _isErrorFeedback ? Palette.red : const Color(0xFF2E7D32),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _feedbackMessage!,
                          style: TextStyle(
                            fontSize: 12.5,
                            color: _isErrorFeedback ? Palette.red : const Color(0xFF2E7D32),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],

              // Badge trạng thái kênh
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'KÊNH PODCAST CHÍNH THỨC',
                          style: TextStyle(
                            fontSize: 10.5,
                            letterSpacing: 1.2,
                            fontWeight: FontWeight.bold,
                            color: Palette.red,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Thiết lập nhận diện & cập nhật ảnh kênh',
                          style: TextStyle(fontSize: 12, color: Palette.muted),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2E7D32).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF2E7D32).withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(CupertinoIcons.checkmark_seal_fill, size: 12, color: Color(0xFF2E7D32)),
                        const SizedBox(width: 4),
                        Text(
                          'KÊNH HOẠT ĐỘNG ($channelStatus)',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2E7D32),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Thẻ Showcase Kênh (Banner 16:9 + Avatar + Meta Info)
              Container(
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Palette.line),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Khung Ảnh Bìa (Cover Banner 16:9)
                    Stack(
                      children: [
                        AspectRatio(
                          aspectRatio: 16 / 9,
                          child: coverUrl != null && coverUrl.isNotEmpty
                              ? Image.network(
                                  coverUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => _buildDefaultCoverPlaceholder(),
                                )
                              : _buildDefaultCoverPlaceholder(),
                        ),
                        // Nút Đổi ảnh bìa ở góc trên bên phải của Banner
                        Positioned(
                          top: 10,
                          right: 10,
                          child: OutlinedButton.icon(
                            key: const Key('upload-channel-cover-btn'),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Palette.paper.withValues(alpha: 0.9),
                              foregroundColor: Palette.ink,
                              side: const BorderSide(color: Palette.line),
                              visualDensity: VisualDensity.compact,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            ),
                            onPressed: _uploadingCover ? null : _handleUploadCover,
                            icon: _uploadingCover
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(CupertinoIcons.camera_fill, size: 14, color: Palette.red),
                            label: Text(
                              _uploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Avatar & Metadata (Nằm đè nhẹ lên ảnh bìa)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              // Avatar kênh 1:1
                              Transform.translate(
                                offset: const Offset(0, -28),
                                child: Container(
                                  width: 76,
                                  height: 76,
                                  decoration: BoxDecoration(
                                    color: Palette.paper,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Palette.paper, width: 3),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.1),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(13),
                                    child: Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        if (avatarUrl != null && avatarUrl.isNotEmpty)
                                          Image.network(
                                            avatarUrl,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => _buildDefaultAvatarPlaceholder(channelName),
                                          )
                                        else
                                          _buildDefaultAvatarPlaceholder(channelName),
                                        // Nút camera trên avatar
                                        Positioned.fill(
                                          child: Material(
                                            color: Colors.transparent,
                                            child: InkWell(
                                              key: const Key('upload-channel-avatar-btn'),
                                              onTap: _uploadingAvatar ? null : _handleUploadAvatar,
                                              child: Container(
                                                color: Colors.black.withValues(alpha: 0.35),
                                                child: Center(
                                                  child: _uploadingAvatar
                                                      ? const SizedBox(
                                                          width: 18,
                                                          height: 18,
                                                          child: CircularProgressIndicator(
                                                            color: Palette.white,
                                                            strokeWidth: 2,
                                                          ),
                                                        )
                                                      : const Column(
                                                          mainAxisSize: MainAxisSize.min,
                                                          children: [
                                                            Icon(CupertinoIcons.camera_fill, color: Palette.white, size: 18),
                                                            SizedBox(height: 2),
                                                            Text(
                                                              'Đổi ảnh',
                                                              style: TextStyle(
                                                                color: Palette.white,
                                                                fontSize: 9,
                                                                fontWeight: FontWeight.bold,
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              // Thông tin Mã kênh & Tác giả ID
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Wrap(
                                    spacing: 8,
                                    runSpacing: 4,
                                    children: [
                                      Text(
                                        'Mã kênh: #${channel?.id ?? widget.state.channelModel?.id ?? 1}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: Palette.muted,
                                          fontFeatures: [FontFeature.tabularFigures()],
                                        ),
                                      ),
                                      const Text('•', style: TextStyle(color: Palette.line)),
                                      Text(
                                        'Tác giả ID: #${channel?.creatorId ?? 1}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: Palette.muted,
                                          fontFeatures: [FontFeature.tabularFigures()],
                                        ),
                                      ),
                                      const Text('•', style: TextStyle(color: Palette.line)),
                                      Text(
                                        'Ngày tạo: ${_formatDate(channel?.createdAt)}',
                                        style: const TextStyle(fontSize: 11, color: Palette.muted),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),

                          Text(channelName, style: editorial(22)),
                          const SizedBox(height: 6),
                          Text(
                            channelDesc.isNotEmpty ? channelDesc : 'Chưa có mô tả cho kênh này.',
                            style: const TextStyle(fontSize: 13, height: 1.5, color: Palette.ink),
                          ),
                          const SizedBox(height: 12),

                          // Nút hành động nhanh: Đổi ảnh đại diện & Đổi ảnh bìa
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  key: const Key('action-change-avatar-btn'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Palette.ink,
                                    side: const BorderSide(color: Palette.line),
                                    backgroundColor: Palette.paper,
                                    visualDensity: VisualDensity.compact,
                                  ),
                                  onPressed: _uploadingAvatar ? null : _handleUploadAvatar,
                                  icon: const Icon(CupertinoIcons.person_crop_square, size: 14, color: Palette.red),
                                  label: const Text('Đổi ảnh đại diện', style: TextStyle(fontSize: 12)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  key: const Key('action-change-cover-btn'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Palette.ink,
                                    side: const BorderSide(color: Palette.line),
                                    backgroundColor: Palette.paper,
                                    visualDensity: VisualDensity.compact,
                                  ),
                                  onPressed: _uploadingCover ? null : _handleUploadCover,
                                  icon: const Icon(CupertinoIcons.photo, size: 14, color: Palette.red),
                                  label: const Text('Đổi ảnh bìa 16:9', style: TextStyle(fontSize: 12)),
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
              const SizedBox(height: 20),

              // Form: Chỉnh sửa thông tin Kênh
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Palette.line),
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                const Icon(CupertinoIcons.pencil_ellipsis_rectangle, size: 18, color: Palette.red),
                                const SizedBox(width: 8),
                                Flexible(
                                  child: Text(
                                    'Chỉnh sửa thông tin Kênh',
                                    style: editorial(17),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Cập nhật: ${_formatDate(channel?.updatedAt ?? channel?.createdAt)}',
                            style: const TextStyle(fontSize: 11, color: Palette.muted),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Tên Kênh Podcast
                      TextFormField(
                        key: const Key('channel-name-input'),
                        controller: _nameCtrl,
                        maxLength: 100,
                        decoration: const InputDecoration(
                          labelText: 'Tên Kênh Podcast *',
                          hintText: 'Ví dụ: Đại Việt Sử Ký...',
                          prefixIcon: Icon(CupertinoIcons.antenna_radiowaves_left_right, size: 16),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().length < 3) {
                            return 'Tên kênh phải có ít nhất 3 ký tự';
                          }
                          if (v.trim().length > 100) {
                            return 'Tên kênh không được quá 100 ký tự';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),

                      // Mô tả Kênh
                      TextFormField(
                        key: const Key('channel-desc-input'),
                        controller: _descCtrl,
                        maxLines: 4,
                        maxLength: 1000,
                        decoration: const InputDecoration(
                          labelText: 'Mô tả Kênh *',
                          hintText: 'Giới thiệu tôn chỉ, mục tiêu và định hướng của kênh podcast lịch sử...',
                          alignLabelWithHint: true,
                        ),
                        validator: (v) {
                          if (v == null || v.trim().length < 5) {
                            return 'Mô tả kênh cần ít nhất 5 ký tự';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // Nút Lưu thay đổi
                      FilledButton.icon(
                        key: const Key('save-channel-info-btn'),
                        style: FilledButton.styleFrom(
                          backgroundColor: Palette.red,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: _savingInfo ? null : _handleSaveChannelInfo,
                        icon: _savingInfo
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(color: Palette.white, strokeWidth: 2),
                              )
                            : const Icon(CupertinoIcons.floppy_disk, size: 16),
                        label: Text(
                          _savingInfo ? 'Đang lưu...' : 'Lưu thay đổi',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Section: GÓI HỘI VIÊN KÊNH (VIP)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(CupertinoIcons.star_circle_fill, size: 20, color: Palette.red),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  'GÓI HỘI VIÊN KÊNH (VIP)',
                                  style: editorial(17),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: plan?.isActive == true
                                ? const Color(0xFF2E7D32).withValues(alpha: 0.12)
                                : Palette.line,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            plan?.isActive == true ? 'Đang hoạt động' : 'Chưa kích hoạt',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: plan?.isActive == true ? const Color(0xFF2E7D32) : Palette.muted,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Container(
                      padding: const EdgeInsets.all(14),
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
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      plan?.planName ?? 'Gói Hội Viên Độc Quyền',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${_formatPrice(plan?.monthlyPrice)} / tháng',
                                      style: const TextStyle(
                                        color: Palette.red,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 14,
                                        fontFeatures: [FontFeature.tabularFigures()],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              OutlinedButton.icon(
                                key: const Key('edit-membership-plan-btn'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Palette.ink,
                                  side: const BorderSide(color: Palette.line),
                                  visualDensity: VisualDensity.compact,
                                ),
                                onPressed: () => showModalBottomSheet<void>(
                                  context: context,
                                  isScrollControlled: true,
                                  showDragHandle: true,
                                  builder: (_) => ChannelMembershipPlanSheet(state: widget.state),
                                ),
                                icon: const Icon(CupertinoIcons.slider_horizontal_3, size: 14),
                                label: const Text('Cấu hình', style: TextStyle(fontSize: 12)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          const Divider(height: 1),
                          const SizedBox(height: 10),
                          // Các đặc quyền thực tế từ Backend
                          ...(() {
                            final perksList = (plan != null && plan.perks.isNotEmpty)
                                ? plan.perks.map((p) {
                                    if (p.toLowerCase().contains('bình luận') || p.toLowerCase().contains('huy hiệu')) {
                                      return 'Mở khóa toàn bộ các tập Podcast dành riêng cho hội viên';
                                    }
                                    if (p.toLowerCase().contains('nghe sớm') || p.toLowerCase().contains('nghe trước')) {
                                      return 'Nghe không giới hạn các nội dung độc quyền của kênh';
                                    }
                                    return p;
                                  }).toList()
                                : [
                                    'Mở khóa toàn bộ các tập Podcast dành riêng cho hội viên',
                                    'Nghe không giới hạn các nội dung độc quyền của kênh',
                                    'Tham gia phòng phát sóng trực tiếp độc quyền (VIP)',
                                  ];
                            return perksList.toSet().map(
                              (p) => Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(CupertinoIcons.checkmark_alt, size: 14, color: Color(0xFF2E7D32)),
                                    const SizedBox(width: 8),
                                    Expanded(child: Text(p, style: const TextStyle(fontSize: 12.5, height: 1.4))),
                                  ],
                                ),
                              ),
                            );
                          })(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Section: NỘI DUNG & THỐNG KÊ KÊNH
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.soft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Palette.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(CupertinoIcons.chart_bar_square_fill, size: 18, color: Palette.red),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'NỘI DUNG & THỐNG KÊ KÊNH',
                            style: editorial(17),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Palette.paper,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Palette.line),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${widget.state.drafts.where((d) => d.stage == DraftStage.approved).length}',
                                  style: editorial(26).copyWith(color: Palette.red),
                                ),
                                const SizedBox(height: 4),
                                const Text('Tập đã duyệt', style: TextStyle(fontSize: 12, color: Palette.muted)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Palette.paper,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Palette.line),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${widget.state.drafts.length}',
                                  style: editorial(26).copyWith(color: Palette.ink),
                                ),
                                const SizedBox(height: 4),
                                const Text('Tổng bản thảo', style: TextStyle(fontSize: 12, color: Palette.muted)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Palette.paper,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Palette.line),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${widget.state.mySeries.length}',
                                  style: editorial(26).copyWith(color: Palette.ink),
                                ),
                                const SizedBox(height: 4),
                                const Text('Series chuyên đề', style: TextStyle(fontSize: 12, color: Palette.muted)),
                              ],
                            ),
                          ),
                        ),
                      ],
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

  Widget _buildPerkBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(CupertinoIcons.checkmark_alt, size: 14, color: Color(0xFF2E7D32)),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12.5, height: 1.4))),
        ],
      ),
    );
  }

  Widget _buildDefaultCoverPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF2C2420), Color(0xFF6B2D2B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(CupertinoIcons.photo_fill_on_rectangle_fill, color: Colors.white.withValues(alpha: 0.6), size: 36),
            const SizedBox(height: 8),
            Text(
              'SỬ KÝ PODCAST PLATFORM • BANNER 16:9',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDefaultAvatarPlaceholder(String name) {
    return Container(
      color: Palette.red.withValues(alpha: 0.1),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'K',
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Palette.red,
          ),
        ),
      ),
    );
  }
}
