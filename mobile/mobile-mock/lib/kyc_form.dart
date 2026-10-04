import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'creator_state.dart';
import 'design.dart';

class KycSheet extends StatefulWidget {
  const KycSheet({
    super.key,
    required this.state,
    required this.onSubmitted,
    this.title = 'Xác thực KYC người sáng tạo',
  });
  final CreatorState state;
  final VoidCallback onSubmitted;
  final String title;
  @override
  State<KycSheet> createState() => _KycSheetState();
}

class _KycSheetState extends State<KycSheet> {
  final form = GlobalKey<FormState>();
  final controllers = [
    TextEditingController(text: 'Trần Đại Nghĩa'),
    TextEditingController(text: '001099008899'),
    TextEditingController(text: '12/04/1996'),
    TextEditingController(text: '0912345678'),
    TextEditingController(),
  ];
  final fields = List.generate(5, (_) => GlobalKey<FormFieldState<String>>());
  final focus = List.generate(5, (_) => FocusNode());
  bool front = false, back = false, selfie = false;
  bool otpSent = false, dirty = false, busy = false, leaving = false;
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
        controllers[4].clear();
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
    if (busy) return;
    if (!fields[3].currentState!.validate()) {
      reveal(3);
      return;
    }
    try {
      widget.state.requestDemoOtp(controllers[3].text);
      setState(() {
        otpSent = true;
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

  Future<void> submit() async {
    if (busy) return;
    if (!form.currentState!.validate()) {
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].currentState?.hasError ?? false) {
          reveal(i);
          break;
        }
      }
      return;
    }
    if (!otpSent || !front || !back || !selfie) {
      setState(
        () => error = !otpSent
            ? 'Gửi mã OTP thử cho số điện thoại này trước khi nộp.'
            : 'Hoàn tất cả ba bước giấy tờ và khuôn mặt mô phỏng bên dưới.',
      );
      return;
    }
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await widget.state.submitKyc(
        fullName: controllers[0].text,
        idNumber: controllers[1].text,
        dob: controllers[2].text,
        phone: controllers[3].text,
        otp: controllers[4].text,
        idFront: front,
        idBack: back,
        selfie: selfie,
      );
      if (mounted) {
        widget.onSubmitted();
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => error = e is StateError
              ? e.message
              : 'Chưa lưu được hồ sơ. Thông tin vẫn được giữ; hãy nộp lại.',
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
      3 =>
        RegExp(r'^0[35789]\d{8}$').hasMatch(value)
            ? null
            : 'Nhập số điện thoại Việt Nam hợp lệ.',
      _ => value == '889900' ? null : 'Nhập mã thử 889900.',
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
          ? TextInputType.phone
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

  Widget check(String title, bool value, ValueChanged<bool> update) =>
      CheckboxListTile(
        contentPadding: EdgeInsets.zero,
        controlAffinity: ListTileControlAffinity.leading,
        title: Text(title, style: const TextStyle(fontSize: 13)),
        value: value,
        onChanged: busy
            ? null
            : (v) => setState(() {
                update(v!);
                dirty = true;
                error = null;
              }),
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
                const SizedBox(height: 8),
                const Text(
                  'Dữ liệu mẫu để thử giao diện. Không tải giấy tờ thật, gửi SMS hay xác thực danh tính thật.',
                  style: TextStyle(fontSize: 12, color: Palette.muted),
                ),
                const SizedBox(height: 24),
                const Text(
                  '1. Thông tin cá nhân',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 16),
                field(0, 'Họ và tên trên CCCD'),
                field(1, 'Số CCCD (12 chữ số)'),
                field(2, 'Ngày sinh (DD/MM/YYYY)'),
                const Text(
                  '2. Xác nhận số điện thoại',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 16),
                field(3, 'Số điện thoại'),
                OutlinedButton(
                  onPressed: busy ? null : sendOtp,
                  child: Text(otpSent ? 'Gửi lại mã thử' : 'Gửi OTP thử'),
                ),
                if (otpSent) ...[
                  const SizedBox(height: 16),
                  field(
                    4,
                    'OTP thử nghiệm',
                    helper: 'Nhập 889900 · Không có SMS thật',
                  ),
                ],
                const SizedBox(height: 24),
                const Text(
                  '3. Giấy tờ & khuôn mặt',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Đánh dấu để mô phỏng hoàn tất từng bước.',
                  style: TextStyle(color: Palette.muted, fontSize: 12),
                ),
                check('CCCD mặt trước · mô phỏng', front, (v) => front = v),
                check('CCCD mặt sau · mô phỏng', back, (v) => back = v),
                check('Khuôn mặt · mô phỏng', selfie, (v) => selfie = v),
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
                  onPressed: busy ? null : submit,
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
