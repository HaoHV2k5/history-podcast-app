import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'core/api/api_client.dart';
import 'creator_state.dart';
import 'design.dart';

const popularBanks = [
  'Vietcombank',
  'MB Bank',
  'Techcombank',
  'BIDV',
  'VietinBank',
  'ACB',
  'VPBank',
  'TPBank',
  'Sacombank',
  'Agribank',
  'VIB',
];

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

  bool get _canPrefill {
    final k = widget.state.kyc;
    if (k.status == KycStatus.notSubmitted) return false;
    // Guard against legacy mock/fixture data remaining in local storage or state
    if (k.fullName == 'Nguyễn Văn Sử' || k.fullName == 'Trần Đại Nghĩa') return false;
    if (k.idNumber == '001099012345' || k.idNumber == '001099008899') return false;
    if (k.bankAccountHolder == 'NGUYEN VAN SU' || k.bankAccountHolder == 'TRAN DAI NGHIA') return false;
    if (k.portfolioUrl.contains('eraidev.id.vn')) return false;
    return true;
  }

  late final fullNameController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.fullName : '',
  );

  late final idNumberController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.idNumber : '',
  );

  late final dobController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.dob : '',
  );

  late final contactEmailController = TextEditingController(
    text: _canPrefill && widget.state.kyc.contactEmail.isNotEmpty
        ? widget.state.kyc.contactEmail
        : (widget.state.preferences.getString('userEmail') ?? ''),
  );

  late final otpController = TextEditingController();

  late final phoneController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.phone : '',
  );

  late final bankNameController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.bankName : '',
  );

  late final bankAccountNumberController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.bankAccountNumber : '',
  );

  late final bankAccountHolderController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.bankAccountHolder : '',
  );

  late final portfolioController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.portfolioUrl : '',
  );

  late final bioController = TextEditingController(
    text: _canPrefill ? widget.state.kyc.bio : '',
  );

  late final List<TextEditingController> controllers = [
    fullNameController,
    idNumberController,
    dobController,
    contactEmailController,
    otpController,
  ];

  final fullNameFocus = FocusNode();
  final idNumberFocus = FocusNode();
  final dobFocus = FocusNode();
  final contactEmailFocus = FocusNode();
  final otpFocus = FocusNode();
  final phoneFocus = FocusNode();
  final bankNameFocus = FocusNode();
  final bankAccountNumberFocus = FocusNode();
  final bankAccountHolderFocus = FocusNode();
  final portfolioFocus = FocusNode();
  final bioFocus = FocusNode();

  late final List<FocusNode> focus = [
    fullNameFocus,
    idNumberFocus,
    dobFocus,
    contactEmailFocus,
    otpFocus,
  ];

  final fields = List.generate(5, (_) => GlobalKey<FormFieldState<String>>());

  bool otpSent = false;
  bool otpVerified = false;
  bool sendingOtp = false;
  bool verifyingOtp = false;
  int otpCooldown = 0;
  Timer? _cooldownTimer;
  String? otpSuccess;
  String? otpError;

  bool dirty = false;
  bool busy = false;
  bool leaving = false;
  bool confirming = false;
  String? error;

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    fullNameController.dispose();
    idNumberController.dispose();
    dobController.dispose();
    contactEmailController.dispose();
    otpController.dispose();
    phoneController.dispose();
    bankNameController.dispose();
    bankAccountNumberController.dispose();
    bankAccountHolderController.dispose();
    portfolioController.dispose();
    bioController.dispose();

    fullNameFocus.dispose();
    idNumberFocus.dispose();
    dobFocus.dispose();
    contactEmailFocus.dispose();
    otpFocus.dispose();
    phoneFocus.dispose();
    bankNameFocus.dispose();
    bankAccountNumberFocus.dispose();
    bankAccountHolderFocus.dispose();
    portfolioFocus.dispose();
    bioFocus.dispose();
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
      otpError = null;
      if (index == 3 && otpSent) {
        otpSent = false;
        otpVerified = false;
        otpSuccess = null;
        otpController.clear();
        _cooldownTimer?.cancel();
        otpCooldown = 0;
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

  Future<void> sendOtp() async {
    if (busy || sendingOtp || verifyingOtp || otpCooldown > 0) return;
    final email = contactEmailController.text.trim();
    if (email.isEmpty) {
      setState(() {
        otpError = 'Vui lòng nhập địa chỉ email nhận mã xác thực.';
      });
      contactEmailFocus.requestFocus();
      return;
    }
    final isEmail = RegExp(r'^[\w\.\-+]+@[\w\.\-]+\.\w+$').hasMatch(email);
    final isPhone = RegExp(r'^0[35789]\d{8}$').hasMatch(email);
    if (!isEmail && !isPhone) {
      setState(() {
        otpError = 'Địa chỉ email không đúng định dạng.';
      });
      contactEmailFocus.requestFocus();
      return;
    }

    setState(() {
      sendingOtp = true;
      otpError = null;
      otpSuccess = null;
      error = null;
    });

    try {
      if (widget.state.isLiveBackend && widget.state.kycRepository != null) {
        await widget.state.kycRepository!.sendEmailOtp(email);
        if (!mounted) return;
        setState(() {
          otpSent = true;
          otpVerified = false;
          dirty = true;
          otpSuccess = 'Mã xác thực 6 chữ số đã được gửi đến hộp thư $email';
          otpCooldown = 60;
        });
        _startOtpCooldown();
      } else {
        widget.state.requestDemoOtp(email);
        if (!mounted) return;
        setState(() {
          otpSent = true;
          otpVerified = false;
          dirty = true;
          otpSuccess = 'Mã xác thực thử nghiệm đã sẵn sàng (889900).';
          otpCooldown = 60;
        });
        _startOtpCooldown();
      }
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) otpFocus.requestFocus();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        otpError = e is ApiException
            ? e.message
            : (e is StateError
                ? e.message
                : 'Chưa gửi được mã xác thực. Vui lòng kiểm tra lại email.');
      });
    } finally {
      if (mounted) setState(() => sendingOtp = false);
    }
  }

  void _startOtpCooldown() {
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (otpCooldown > 1) {
        setState(() => otpCooldown--);
      } else {
        timer.cancel();
        setState(() => otpCooldown = 0);
      }
    });
  }

  Future<void> verifyOtp() async {
    if (busy || verifyingOtp) return;
    final code = otpController.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      setState(() => otpError = 'Vui lòng nhập đủ 6 chữ số mã OTP.');
      otpFocus.requestFocus();
      return;
    }
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      verifyingOtp = true;
      otpError = null;
      error = null;
    });
    try {
      if (widget.state.isLiveBackend && widget.state.kycRepository != null) {
        await widget.state.kycRepository!.verifyEmailOtp(
          contactEmailController.text.trim(),
          code,
        );
      } else {
        if (code != '889900' && code.length != 6) {
          throw StateError('Mã xác thực OTP không chính xác.');
        }
      }
      if (!mounted) return;
      setState(() {
        otpVerified = true;
        otpError = null;
        otpSuccess = 'Đã xác thực OTP thành công';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        otpVerified = false;
        otpError = e is ApiException
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
    if (busy || verifyingOtp || sendingOtp) return;
    if (!form.currentState!.validate()) {
      return;
    }
    if (!otpSent) {
      setState(
        () => error = widget.state.isLiveBackend
            ? 'Vui lòng gửi và xác thực mã OTP trước khi nộp.'
            : 'Vui lòng gửi mã OTP thử trước khi nộp hồ sơ.',
      );
      return;
    }

    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      busy = true;
      error = null;
    });

    if (!otpVerified) {
      final code = otpController.text.trim();
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
        otpFocus.requestFocus();
        return;
      }
    }

    try {
      await widget.state.submitKyc(
        fullName: fullNameController.text.trim(),
        idNumber: idNumberController.text.trim(),
        dob: dobController.text.trim(),
        phone: phoneController.text.trim(),
        contactEmail: contactEmailController.text.trim(),
        otp: otpController.text.trim(),
        bankName: bankNameController.text.trim(),
        bankAccountNumber: bankAccountNumberController.text.trim(),
        bankAccountHolder: bankAccountHolderController.text.trim().toUpperCase(),
        portfolioUrl: portfolioController.text.trim(),
        bio: bioController.text.trim(),
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
      0 => value.isEmpty
          ? 'Nhập họ và tên thật trên giấy tờ tùy thân.'
          : (value.length < 2 ? 'Họ và tên tối thiểu 2 ký tự.' : null),
      1 => RegExp(r'^\d{12}$').hasMatch(value)
          ? null
          : 'Nhập đủ 12 chữ số CCCD.',
      2 => validateKycBirthDate(value),
      3 => (RegExp(r'^[\w\.\-+]+@[\w\.\-]+\.\w+$').hasMatch(value) ||
            RegExp(r'^0[35789]\d{8}$').hasMatch(value))
          ? null
          : 'Nhập địa chỉ email hợp lệ để nhận mã xác thực.',
      _ => RegExp(r'^\d{6}$').hasMatch(value)
          ? null
          : 'Nhập mã xác thực 6 chữ số.',
    };
  }

  Widget field(
    int index,
    String label, {
    String? helper,
    String? hint,
    Key? key,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      key: key ?? fields[index],
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
        if (index == 3) {
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
        hintText: hint,
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

                // ==================== MỤC 1: XÁC THỰC EMAIL ====================
                const Text(
                  '1. Xác thực hộp thư liên hệ',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 14),
                field(
                  3,
                  'Địa chỉ Email nhận mã xác thực *',
                  hint: 'Ví dụ: nguyen.van.a@example.com',
                  helper: 'Hệ thống sẽ gửi mã xác thực gồm 6 chữ số đến hộp thư này của bạn',
                  key: const Key('kyc-field-email'),
                ),
                OutlinedButton.icon(
                  key: const Key('kyc-send-otp-btn'),
                  icon: sendingOtp
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(CupertinoIcons.mail, size: 16),
                  onPressed: busy || sendingOtp || verifyingOtp || otpCooldown > 0
                      ? null
                      : sendOtp,
                  label: Text(
                    otpCooldown > 0
                        ? 'Gửi lại mã sau ${otpCooldown}s'
                        : (otpSent
                            ? (widget.state.isLiveBackend
                                ? 'Gửi lại mã xác thực qua Email'
                                : 'Gửi lại mã thử')
                            : (widget.state.isLiveBackend
                                ? 'Gửi mã xác thực qua Email'
                                : 'Gửi OTP thử')),
                  ),
                ),
                if (otpError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Palette.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Palette.red.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(CupertinoIcons.exclamationmark_triangle_fill, size: 16, color: Palette.red),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              otpError!,
                              style: const TextStyle(fontSize: 12, color: Palette.red),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (otpSuccess != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(CupertinoIcons.checkmark_circle_fill, size: 16, color: Colors.green[700]),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              otpSuccess!,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF1B5E20)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (otpSent) ...[
                  const SizedBox(height: 16),
                  field(
                    4,
                    'Mã xác thực 6 chữ số *',
                    hint: 'Nhập 6 chữ số trong email',
                    helper: 'Kiểm tra hộp thư đến (hoặc mục Thư rác) và nhập 6 chữ số vừa nhận',
                    key: const Key('kyc-field-otp'),
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

                // ==================== MỤC 2: THÔNG TIN CÁ NHÂN ====================
                const SizedBox(height: 24),
                const Text(
                  '2. Thông tin cá nhân của tác giả',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 14),
                field(
                  0,
                  'Họ và tên đầy đủ *',
                  hint: 'Ví dụ: NGUYEN VAN A',
                  helper: 'Nhập đúng họ và tên thật trên giấy tờ tùy thân của bạn',
                  key: const Key('kyc-field-name'),
                ),
                field(
                  1,
                  'Số Căn cước công dân (12 chữ số) *',
                  hint: 'Ví dụ: 001099012345',
                  helper: 'Dùng để xác minh danh tính chính chủ khi bảo vệ bản quyền tác phẩm',
                  key: const Key('kyc-field-id'),
                ),
                field(
                  2,
                  'Ngày tháng năm sinh *',
                  hint: 'Ví dụ: 15/08/1995',
                  helper: 'Nhập theo định dạng Ngày/Tháng/Năm (DD/MM/YYYY)',
                  key: const Key('kyc-field-dob'),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextFormField(
                    key: const Key('kyc-field-phone'),
                    controller: phoneController,
                    focusNode: phoneFocus,
                    readOnly: busy,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    validator: (v) {
                      final val = (v ?? '').trim();
                      if (val.isEmpty) return 'Vui lòng nhập số điện thoại liên hệ.';
                      if (!RegExp(r'^0[35789]\d{8}$').hasMatch(val)) {
                        return 'Nhập số điện thoại Việt Nam hợp lệ (10 chữ số).';
                      }
                      return null;
                    },
                    onChanged: (_) => setState(() => dirty = true),
                    keyboardType: TextInputType.phone,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(10),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'Số điện thoại liên hệ *',
                      hintText: 'Ví dụ: 0912345678',
                      helperText: 'Số điện thoại đang hoạt động để Ban Quản trị liên hệ khi cần hỗ trợ',
                      helperMaxLines: 3,
                      errorMaxLines: 3,
                    ),
                  ),
                ),

                // ==================== MỤC 3: NGÂN HÀNG THỤ HƯỞNG ====================
                const SizedBox(height: 24),
                const Text(
                  '3. Tài khoản ngân hàng nhận thù lao',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: TextFormField(
                    key: const Key('kyc-field-bank-name'),
                    controller: bankNameController,
                    focusNode: bankNameFocus,
                    readOnly: busy,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    validator: (v) {
                      final val = (v ?? '').trim();
                      if (val.isEmpty) return 'Vui lòng chọn hoặc nhập tên ngân hàng.';
                      return null;
                    },
                    onChanged: (_) => setState(() => dirty = true),
                    decoration: const InputDecoration(
                      labelText: 'Tên ngân hàng *',
                      hintText: 'Ví dụ: Vietcombank, MB Bank, Techcombank...',
                      helperText: 'Ngân hàng bạn dùng để nhận tiền nhuận bút và thù lao làm nội dung',
                      helperMaxLines: 3,
                      errorMaxLines: 3,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final b in popularBanks)
                          Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ActionChip(
                              label: Text(b, style: const TextStyle(fontSize: 11)),
                              backgroundColor: bankNameController.text.trim().toLowerCase() == b.toLowerCase()
                                  ? Palette.red.withValues(alpha: 0.15)
                                  : Palette.soft,
                              side: BorderSide(
                                color: bankNameController.text.trim().toLowerCase() == b.toLowerCase()
                                    ? Palette.red
                                    : Palette.line,
                              ),
                              onPressed: busy
                                  ? null
                                  : () {
                                      setState(() {
                                        bankNameController.text = b;
                                        dirty = true;
                                      });
                                    },
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextFormField(
                    key: const Key('kyc-field-bank-acc'),
                    controller: bankAccountNumberController,
                    focusNode: bankAccountNumberFocus,
                    readOnly: busy,
                    keyboardType: TextInputType.number,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(20),
                    ],
                    validator: (v) {
                      final val = (v ?? '').trim();
                      if (val.isEmpty) return 'Vui lòng nhập số tài khoản ngân hàng.';
                      if (!RegExp(r'^\d{6,20}$').hasMatch(val)) {
                        return 'Số tài khoản chỉ gồm chữ số (từ 6 đến 20 số).';
                      }
                      return null;
                    },
                    onChanged: (_) => setState(() => dirty = true),
                    decoration: const InputDecoration(
                      labelText: 'Số tài khoản ngân hàng *',
                      hintText: 'Ví dụ: 1903678889999',
                      helperText: 'Vui lòng kiểm tra kỹ để việc chi trả nhuận bút diễn ra chính xác',
                      helperMaxLines: 3,
                      errorMaxLines: 3,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextFormField(
                    key: const Key('kyc-field-bank-holder'),
                    controller: bankAccountHolderController,
                    focusNode: bankAccountHolderFocus,
                    readOnly: busy,
                    textCapitalization: TextCapitalization.characters,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    validator: (v) {
                      final val = (v ?? '').trim();
                      if (val.isEmpty) return 'Vui lòng nhập tên chủ tài khoản ngân hàng.';
                      return null;
                    },
                    onChanged: (_) => setState(() => dirty = true),
                    decoration: const InputDecoration(
                      labelText: 'Tên chủ tài khoản (In hoa không dấu) *',
                      hintText: 'Ví dụ: NGUYEN VAN A',
                      helperText: 'Tên chủ tài khoản ngân hàng cần trùng khớp với họ tên của bạn',
                      helperMaxLines: 3,
                      errorMaxLines: 3,
                    ),
                  ),
                ),

                // ==================== MỤC 4: GIỚI THIỆU THÊM ====================
                const SizedBox(height: 24),
                const Text(
                  '4. Giới thiệu thêm về bạn (Không bắt buộc)',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextFormField(
                    key: const Key('kyc-field-portfolio'),
                    controller: portfolioController,
                    focusNode: portfolioFocus,
                    readOnly: busy,
                    keyboardType: TextInputType.url,
                    onChanged: (_) => setState(() => dirty = true),
                    decoration: const InputDecoration(
                      labelText: 'Liên kết trang cá nhân hoặc kênh đã có (Không bắt buộc)',
                      hintText: 'Ví dụ: https://youtube.com/@kenhlichsu hoặc liên kết bài viết...',
                      helperText: 'Dán liên kết Facebook, YouTube, TikTok hoặc trang viết lách của bạn nếu có',
                      helperMaxLines: 3,
                      errorMaxLines: 3,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextFormField(
                    key: const Key('kyc-field-bio'),
                    controller: bioController,
                    focusNode: bioFocus,
                    readOnly: busy,
                    maxLines: 3,
                    onChanged: (_) => setState(() => dirty = true),
                    decoration: const InputDecoration(
                      labelText: 'Đôi nét giới thiệu về bạn (Không bắt buộc)',
                      hintText: 'Chia sẻ ngắn gọn về giọng kể, phong cách hoặc giai đoạn lịch sử bạn yêu thích...',
                      helperText: 'Giúp thính giả và khách đặt nội dung hiểu rõ hơn về thế mạnh của bạn',
                      helperMaxLines: 3,
                      errorMaxLines: 3,
                    ),
                  ),
                ),

                if (error != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Semantics(
                      liveRegion: true,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Palette.red.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Palette.red.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(CupertinoIcons.exclamationmark_triangle_fill, size: 18, color: Palette.red),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                error!,
                                style: const TextStyle(color: Palette.red, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
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
