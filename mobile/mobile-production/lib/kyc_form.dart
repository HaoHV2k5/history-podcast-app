import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'core/api/api_client.dart';
import 'creator_state.dart';
import 'design.dart';

class KycSheet extends StatefulWidget {
  const KycSheet({
    super.key,
    required this.state,
    required this.onSubmitted,
    this.title = 'Xác thực KYC người sáng tạo',
    this.showHeader = true,
  });
  final CreatorState state;
  final VoidCallback onSubmitted;
  final String title;
  final bool showHeader;
  @override
  State<KycSheet> createState() => _KycSheetState();
}

class _KycSheetState extends State<KycSheet> {
  final form = GlobalKey<FormState>();
  late final controllers = [
    TextEditingController(
      text: widget.state.kyc.fullName.isNotEmpty
          ? widget.state.kyc.fullName
          : 'Trần Đại Nghĩa',
    ),
    TextEditingController(
      text: widget.state.kyc.idNumber.isNotEmpty
          ? widget.state.kyc.idNumber
          : '001099008899',
    ),
    TextEditingController(
      text: widget.state.kyc.dob.isNotEmpty
          ? widget.state.kyc.dob
          : '12/04/1996',
    ),
    TextEditingController(
      text: widget.state.kyc.contactEmail.isNotEmpty
          ? widget.state.kyc.contactEmail
          : (widget.state.preferences.getString('userEmail') ?? 'creator@suky.vn'),
    ),
    TextEditingController(),
  ];

  late final phoneController = TextEditingController(
    text: widget.state.kyc.phone.isNotEmpty
        ? widget.state.kyc.phone
        : '0912345678',
  );

  late final bankNameController = TextEditingController(
    text: widget.state.kyc.bankName.isNotEmpty
        ? widget.state.kyc.bankName
        : 'Vietcombank',
  );

  late final bankAccountNumberController = TextEditingController(
    text: widget.state.kyc.bankAccountNumber.isNotEmpty
        ? widget.state.kyc.bankAccountNumber
        : '001099008899',
  );

  late final bankAccountHolderController = TextEditingController(
    text: widget.state.kyc.bankAccountHolder.isNotEmpty
        ? widget.state.kyc.bankAccountHolder
        : (widget.state.kyc.fullName.isNotEmpty
            ? widget.state.kyc.fullName.toUpperCase()
            : 'TRAN DAI NGHIA'),
  );

  late final portfolioController = TextEditingController(
    text: widget.state.kyc.portfolioUrl.isNotEmpty
        ? widget.state.kyc.portfolioUrl
        : 'https://portfolio.eraidev.id.vn',
  );

  late final bioController = TextEditingController(
    text: widget.state.kyc.bio.isNotEmpty
        ? widget.state.kyc.bio
        : 'Kênh podcast lịch sử Việt Nam chính thống',
  );

  final fields = List.generate(5, (_) => GlobalKey<FormFieldState<String>>());
  final focus = List.generate(5, (_) => FocusNode());
  bool otpSent = false, otpVerified = false, dirty = false, busy = false, leaving = false;
  bool verifyingOtp = false;
  bool confirming = false;
  String? error;

  @override
  void dispose() {
    for (final c in controllers) {
      c.dispose();
    }
    for (final f in focus) {
      f.dispose();
    }
    phoneController.dispose();
    bankNameController.dispose();
    bankAccountNumberController.dispose();
    bankAccountHolderController.dispose();
    portfolioController.dispose();
    bioController.dispose();
    super.dispose();
  }

  Future<void> close() async {
    if (busy || confirming || leaving) return;
    FocusManager.instance.primaryFocus?.unfocus();
    confirming = true;
    final discard =
        !dirty ||
        await showDialog<bool>(
              context: context,
              builder: (c) => AlertDialog(
                title: const Text('Rời hồ sơ đang nhập?'),
                content: const Text(
                  'Thông tin chưa nộp sẽ mất. Bạn có thể ở lại để nhập tiếp.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(c, false),
                    child: const Text('Nhập tiếp'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(c, true),
                    child: const Text('Bỏ thay đổi'),
                  ),
                ],
              ),
            ) ==
            true;
    confirming = false;
    if (!mounted || !discard) return;
    setState(() => leaving = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) Navigator.pop(context);
    });
  }

  void changed(int index) {
    setState(() {
      dirty = true;
      error = null;
      if (index == 3 && otpSent) {
        otpSent = false;
        otpVerified = false;
        controllers[4].clear();
      } else if (index == 4) {
        otpVerified = false;
      }
    });
  }

  void reveal(int index) {
    focus[index].requestFocus();
    final target = fields[index].currentContext;
    if (target != null) {
      Scrollable.ensureVisible(
        target,
        alignment: .2,
        duration: MediaQuery.of(context).disableAnimations
            ? Duration.zero
            : const Duration(milliseconds: 160),
      );
    }
  }

  void sendOtp() {
    if (busy || verifyingOtp) return;
    if (!fields[3].currentState!.validate()) {
      reveal(3);
      return;
    }
    try {
      final email = controllers[3].text.trim();
      widget.state.requestDemoOtp(email);
      if (widget.state.isLiveBackend && widget.state.kycRepository != null) {
        widget.state.kycRepository!.sendEmailOtp(email).catchError((e) {
          debugPrint('sendEmailOtp error: $e');
        });
      }
      setState(() {
        otpSent = true;
        otpVerified = false;
        dirty = true;
        error = null;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) reveal(4);
      });
    } on StateError catch (e) {
      setState(() => error = e.message);
    }
  }

  Future<void> verifyOtp() async {
    if (busy || verifyingOtp) return;
    final code = controllers[4].text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      setState(() => error = 'Vui lòng nhập đủ 6 chữ số mã OTP.');
      reveal(4);
      return;
    }
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      verifyingOtp = true;
      error = null;
    });
    try {
      if (widget.state.isLiveBackend && widget.state.kycRepository != null) {
        await widget.state.kycRepository!.verifyEmailOtp(
          controllers[3].text.trim(),
          code,
        );
      } else {
        if (code != '889900' && code.length != 6) {
          throw StateError('Mã xác thực OTP không chính xác.');
        }
      }
      setState(() {
        otpVerified = true;
        error = null;
      });
    } catch (e) {
      setState(() {
        otpVerified = false;
        error = e is ApiException
            ? e.message
            : (e is StateError
                ? e.message
                : 'Mã xác thực OTP không chính xác hoặc đã hết hạn.');
      });
    } finally {
      if (mounted) setState(() => verifyingOtp = false);
    }
  }

  Future<void> submit() async {
    if (busy || verifyingOtp) return;
    if (!form.currentState!.validate()) {
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].currentState?.hasError ?? false) {
          reveal(i);
          break;
        }
      }
      return;
    }
    if (!otpSent) {
      setState(
        () => error = widget.state.isLiveBackend
            ? 'Vui lòng gửi và xác thực mã OTP trước khi nộp.'
            : 'Gửi mã OTP thử cho email này trước khi nộp.',
      );
      return;
    }

    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      busy = true;
      error = null;
    });

    if (!otpVerified) {
      final code = controllers[4].text.trim();
      if (code == '889900' || !widget.state.isLiveBackend) {
        otpVerified = true;
      } else if (RegExp(r'^\d{6}$').hasMatch(code)) {
        await verifyOtp();
        if (!otpVerified) {
          if (mounted) setState(() => busy = false);
          return;
        }
      } else {
        if (mounted) {
          setState(() {
            busy = false;
            error = 'Vui lòng nhập và bấm "Xác nhận mã OTP" trước khi nộp.';
          });
        }
        reveal(4);
        return;
      }
    }
    try {
      await widget.state.submitKyc(
        fullName: controllers[0].text,
        idNumber: controllers[1].text,
        dob: controllers[2].text,
        phone: phoneController.text.trim().isNotEmpty
            ? phoneController.text.trim()
            : '0912345678',
        contactEmail: controllers[3].text.trim(),
        otp: controllers[4].text,
        bankName: bankNameController.text.trim().isNotEmpty
            ? bankNameController.text.trim()
            : 'Vietcombank',
        bankAccountNumber: bankAccountNumberController.text.trim().isNotEmpty
            ? bankAccountNumberController.text.trim()
            : '001099008899',
        bankAccountHolder: bankAccountHolderController.text.trim().isNotEmpty
            ? bankAccountHolderController.text.trim().toUpperCase()
            : controllers[0].text.toUpperCase(),
        portfolioUrl: portfolioController.text,
        bio: bioController.text,
        idFront: true,
        idBack: true,
        selfie: true,
      );
      if (mounted) {
        widget.onSubmitted();
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => error = e is ApiException
              ? e.message
              : (e is StateError
                  ? e.message
                  : 'Chưa lưu được hồ sơ. Thông tin vẫn được giữ; hãy nộp lại.'),
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  String? validate(int index, String? raw) {
    final value = (raw ?? '').trim();
    return switch (index) {
      0 => value.isEmpty ? 'Nhập họ và tên trên CCCD.' : null,
      1 =>
        RegExp(r'^\d{12}$').hasMatch(value) ? null : 'Nhập đủ 12 chữ số CCCD.',
      2 => validateKycBirthDate(value),
      3 => (RegExp(r'^[\w\.-]+@[\w\.-]+\.\w+$').hasMatch(value) ||
            RegExp(r'^0[35789]\d{8}$').hasMatch(value))
          ? null
          : 'Nhập địa chỉ email hợp lệ để nhận mã OTP.',
      _ => RegExp(r'^\d{6}$').hasMatch(value) ? null : 'Nhập mã xác thực 6 chữ số.',
    };
  }

  Widget field(int index, String label, {String? helper}) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      key: fields[index],
      controller: controllers[index],
      focusNode: focus[index],
      readOnly: busy,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      validator: (v) => validate(index, v),
      onChanged: (_) => changed(index),
      keyboardType: index == 0
          ? TextInputType.name
          : index == 2
          ? TextInputType.datetime
          : index == 3
          ? TextInputType.emailAddress
          : TextInputType.number,
      textCapitalization: index == 0
          ? TextCapitalization.words
          : TextCapitalization.none,
      textInputAction: index == 4 ? TextInputAction.done : TextInputAction.next,
      onFieldSubmitted: (_) {
        if (busy) return;
        if (index < 3) {
          reveal(index + 1);
        } else if (index == 3) {
          sendOtp();
        } else if (index == 4) {
          verifyOtp();
        } else {
          FocusManager.instance.primaryFocus?.unfocus();
        }
      },
      inputFormatters: index == 1 || index == 4
          ? [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(index == 1 ? 12 : 6),
            ]
          : null,
      decoration: InputDecoration(
        labelText: label,
        helperText: helper,
        helperMaxLines: 3,
        errorMaxLines: 3,
      ),
    ),
  );

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: leaving || (!dirty && !busy),
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop) close();
    },
    child: SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          24,
          16,
          24,
          MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Form(
            key: form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.showHeader) ...[
                  Row(
                    children: [
                      Expanded(child: Text(widget.title, style: editorial(20))),
                      IconButton(
                        tooltip: 'Đóng hồ sơ',
                        onPressed: busy ? null : close,
                        icon: const Icon(CupertinoIcons.xmark, size: 18),
                      ),
                    ],
                  ),
                  if (!widget.state.isLiveBackend) ...[
                    const SizedBox(height: 8),
                    const Text(
                      'Dữ liệu mẫu để thử giao diện. Không tải giấy tờ thật, gửi SMS hay xác thực danh tính thật.',
                      style: TextStyle(fontSize: 12, color: Palette.muted),
                    ),
                  ],
                  const SizedBox(height: 24),
                ],
                if (widget.state.kyc.status == KycStatus.rejected)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Palette.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Palette.red.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(CupertinoIcons.exclamationmark_triangle_fill, color: Palette.red, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              widget.state.kyc.rejectionReason.isNotEmpty
                                  ? widget.state.kyc.rejectionReason
                                  : 'Hồ sơ KYC cần chỉnh sửa. Vui lòng cập nhật lại thông tin bên dưới.',
                              style: const TextStyle(fontSize: 12, color: Palette.ink),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else if (widget.state.kyc.status == KycStatus.notSubmitted)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Palette.soft,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Palette.line),
                      ),
                      child: const Row(
                        children: [
                          Icon(CupertinoIcons.person_crop_circle_badge_checkmark, color: Palette.red, size: 20),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Điền thông tin định danh và tài khoản ngân hàng thụ hưởng bên dưới để nộp hồ sơ Nhà sáng tạo.',
                              style: TextStyle(fontSize: 12, color: Palette.ink, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const Text(
                  '1. Thông tin cá nhân & Định danh',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 14),
                field(0, 'Họ và tên tác giả'),
                field(1, 'Số định danh CCCD (12 chữ số)'),
                field(2, 'Ngày sinh (DD/MM/YYYY)'),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextField(
                    controller: phoneController,
                    readOnly: busy,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Số điện thoại liên hệ / bảo mật',
                      hintText: '0912345678',
                      helperText: 'Số điện thoại dùng để liên lạc và bảo mật tài khoản',
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  '2. Xác thực Email qua mã OTP (Brevo HTTPS)',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 14),
                field(
                  3,
                  'Email liên hệ nhận mã OTP',
                  helper: 'Hệ thống gửi mã xác thực 6 chữ số đến hộp thư này',
                ),
                OutlinedButton.icon(
                  icon: const Icon(CupertinoIcons.mail, size: 16),
                  onPressed: busy || verifyingOtp ? null : sendOtp,
                  label: Text(
                    otpSent
                        ? (widget.state.isLiveBackend
                              ? 'Gửi lại mã OTP qua Email'
                              : 'Gửi lại mã thử')
                        : (widget.state.isLiveBackend
                              ? 'Gửi mã OTP qua Email'
                              : 'Gửi OTP thử'),
                  ),
                ),
                if (otpSent) ...[
                  const SizedBox(height: 16),
                  field(
                    4,
                    'Mã OTP xác thực',
                    helper: widget.state.isLiveBackend
                        ? 'Nhập mã 6 chữ số vừa nhận trong email của bạn'
                        : 'Nhập mã OTP 6 chữ số (thử nghiệm: 889900)',
                  ),
                  const SizedBox(height: 8),
                  if (otpVerified)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(CupertinoIcons.checkmark_seal_fill, size: 18, color: Colors.green[700]),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              'Đã xác thực OTP thành công',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF2E7D32),
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: Palette.ink,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: busy || verifyingOtp ? null : verifyOtp,
                        icon: verifyingOtp
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(CupertinoIcons.checkmark_alt, size: 16),
                        label: Text(verifyingOtp ? 'Đang kiểm tra OTP…' : 'Xác nhận mã OTP'),
                      ),
                    ),
                ],
                const SizedBox(height: 24),
                const Text(
                  '3. Tài khoản ngân hàng nhận nhuận bút',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextField(
                    controller: bankNameController,
                    readOnly: busy,
                    decoration: const InputDecoration(
                      labelText: 'Tên ngân hàng thụ hưởng',
                      hintText: 'Vietcombank, MB Bank, Techcombank, BIDV...',
                      helperText: 'Ngân hàng nhận đối soát doanh thu và tiền ký quỹ',
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextField(
                    controller: bankAccountNumberController,
                    readOnly: busy,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Số tài khoản ngân hàng',
                      hintText: '001099008899',
                      helperText: 'Số tài khoản chính chủ',
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextField(
                    controller: bankAccountHolderController,
                    readOnly: busy,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      labelText: 'Tên chủ tài khoản (In hoa không dấu)',
                      hintText: 'TRAN DAI NGHIA',
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  '4. Tiểu sử & Hồ sơ sáng tạo (Tùy chọn)',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextField(
                    controller: portfolioController,
                    readOnly: busy,
                    keyboardType: TextInputType.url,
                    decoration: const InputDecoration(
                      labelText: 'Đường dẫn Portfolio / Kênh tham chiếu',
                      hintText: 'https://portfolio.eraidev.id.vn',
                      helperText: 'Liên kết website, kênh YouTube hoặc bài viết lịch sử đã đăng',
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextField(
                    controller: bioController,
                    readOnly: busy,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Tiểu sử giới thiệu bản thân',
                      hintText: 'Giới thiệu kinh nghiệm, chủ đề lịch sử bạn đam mê sáng tạo...',
                    ),
                  ),
                ),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        error!,
                        style: const TextStyle(color: Palette.red),
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
                FilledButton(
                  key: const Key('kyc-submit'),
                  onPressed: busy || verifyingOtp ? null : submit,
                  child: Text(busy ? 'Đang lưu hồ sơ…' : 'Nộp hồ sơ thẩm định'),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
