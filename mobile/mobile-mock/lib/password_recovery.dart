import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'mock/services/password_recovery.dart';
export 'mock/services/password_recovery.dart';

import 'components.dart';
import 'design.dart';

class PasswordRecoveryPage extends StatefulWidget {
  const PasswordRecoveryPage({super.key, this.initialIdentifier = ''});
  final String initialIdentifier;
  @override
  State<PasswordRecoveryPage> createState() => _PasswordRecoveryPageState();
}

class _PasswordRecoveryPageState extends State<PasswordRecoveryPage> {
  late final input = TextEditingController(text: widget.initialIdentifier);
  final form = GlobalKey<FormState>();
  bool busy = false;
  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  Future<void> send() async {
    if (!form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => busy = true);
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    final flow = DemoPasswordRecovery()..request(input.text);
    setState(() => busy = false);
    final success = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => RecoveryOtpPage(flow: flow)),
    );
    if (success == true && mounted) Navigator.pop(context, flow.identifier);
  }

  @override
  Widget build(BuildContext context) => RecoveryScaffold(
    title: 'Quên mật khẩu',
    step: 'BẮT ĐẦU',
    heading: 'Tìm lại tài khoản.',
    description: 'Nhập email hoặc số điện thoại bạn dùng để đăng nhập.',
    child: Form(
      key: form,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            key: const Key('recovery-identifier'),
            controller: input,
            readOnly: busy,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.username],
            decoration: const InputDecoration(
              labelText: 'Email hoặc số điện thoại',
              hintText: 'minhanh@example.test',
            ),
            validator: (v) => DemoPasswordRecovery.validateIdentifier(v ?? ''),
            onFieldSubmitted: (_) {
              if (!busy) send();
            },
          ),
          const SizedBox(height: 24),
          FilledButton(
            key: const Key('recovery-send'),
            onPressed: busy ? null : send,
            child: Text(busy ? 'Đang chuẩn bị mã…' : 'Tiếp tục với mã OTP'),
          ),
          const SizedBox(height: 12),
          const Text(
            'Nếu thông tin khớp một tài khoản, bạn sẽ nhận được hướng dẫn khôi phục.',
            style: TextStyle(color: Palette.muted, fontSize: 12),
          ),
        ],
      ),
    ),
  );
}

class RecoveryOtpPage extends StatefulWidget {
  const RecoveryOtpPage({super.key, required this.flow});
  final DemoPasswordRecovery flow;
  @override
  State<RecoveryOtpPage> createState() => _RecoveryOtpPageState();
}

class _RecoveryOtpPageState extends State<RecoveryOtpPage> {
  final input = TextEditingController();
  final focus = FocusNode();
  String? error;
  bool busy = false;
  late final Timer timer;
  @override
  void initState() {
    super.initState();
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    timer.cancel();
    input.dispose();
    focus.dispose();
    super.dispose();
  }

  Future<void> verify() async {
    if (busy) return;
    try {
      if (!widget.flow.hasGrant) widget.flow.verify(input.text);
      FocusScope.of(context).unfocus();
      setState(() {
        busy = true;
        error = null;
      });
      final success = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => RecoveryPasswordPage(flow: widget.flow),
        ),
      );
      if (!mounted) return;
      setState(() => busy = false);
      if (success == true) Navigator.pop(context, true);
    } on StateError catch (e) {
      setState(() => error = e.message);
      focus.requestFocus();
    }
  }

  void resend() {
    try {
      widget.flow.request(widget.flow.identifier);
      input.clear();
      setState(() => error = null);
      focus.requestFocus();
    } on StateError catch (e) {
      setState(() => error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) => RecoveryScaffold(
    title: 'Xác thực tài khoản',
    step: '01 / 02 · XÁC THỰC',
    heading: 'Một mã, một bước.',
    description:
        'Mã xác thực dành cho ${widget.flow.maskedIdentifier}. Bạn có thể dán đủ 6 số vào ô bên dưới.',
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!widget.flow.hasGrant)
          TextField(
            key: const Key('recovery-otp'),
            controller: input,
            focusNode: focus,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.oneTimeCode],
            maxLength: 6,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            style: const TextStyle(fontSize: 24, letterSpacing: 7),
            decoration: InputDecoration(
              labelText: 'Mã OTP 6 số',
              counterText: '',
              errorText: error,
              helperText: widget.flow.expired
                  ? 'Mã đã hết hạn. Gửi lại để tiếp tục.'
                  : 'Mã mẫu có hiệu lực trong 2 phút.',
            ),
            onSubmitted: (_) => verify(),
          )
        else
          const Text('Mã đã được xác thực. Tiếp tục để đặt mật khẩu mới.'),
        const SizedBox(height: 24),
        FilledButton(
          key: const Key('recovery-verify'),
          onPressed:
              busy ||
                  widget.flow.expired && !widget.flow.hasGrant ||
                  widget.flow.attempts >= 5 && !widget.flow.hasGrant
              ? null
              : verify,
          child: Text(
            widget.flow.hasGrant ? 'Tiếp tục đặt mật khẩu' : 'Xác thực mã',
          ),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: widget.flow.resendSeconds > 0 || busy ? null : resend,
          child: Text(
            widget.flow.resendSeconds > 0
                ? 'Gửi lại sau ${widget.flow.resendSeconds}s'
                : 'Gửi lại mã OTP',
          ),
        ),
        TextButton(
          onPressed: busy ? null : () => Navigator.pop(context),
          child: const Text('Đổi email / số điện thoại'),
        ),
        const Divider(height: 32),
        ExpansionTile(
          tilePadding: EdgeInsets.zero,
          title: const Text(
            'Điều khiển bản thử',
            style: TextStyle(fontSize: 12),
          ),
          children: [
            const Text('OTP mẫu: 889900. Không gửi email/SMS.'),
            TextButton(
              onPressed: busy
                  ? null
                  : () {
                      widget.flow.expireForDemo();
                      input.clear();
                      setState(() => error = null);
                    },
              child: const Text('Thử mã đã hết hạn'),
            ),
          ],
        ),
      ],
    ),
  );
}

class RecoveryPasswordPage extends StatefulWidget {
  const RecoveryPasswordPage({super.key, required this.flow});
  final DemoPasswordRecovery flow;
  @override
  State<RecoveryPasswordPage> createState() => _RecoveryPasswordPageState();
}

class _RecoveryPasswordPageState extends State<RecoveryPasswordPage> {
  final form = GlobalKey<FormState>();
  final password = TextEditingController(),
      confirmation = TextEditingController();
  bool hidden = true, confirmationHidden = true, busy = false, done = false;
  String? error;
  @override
  void dispose() {
    password.dispose();
    confirmation.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      busy = true;
      error = null;
    });
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    try {
      widget.flow.complete(password.text, confirmation.text);
      password.clear();
      confirmation.clear();
      setState(() {
        done = true;
        busy = false;
      });
    } on StateError catch (e) {
      setState(() {
        error = e.message;
        busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) => RecoveryScaffold(
    title: done ? 'Hoàn tất bản thử' : 'Mật khẩu mới',
    step: done ? 'HOÀN TẤT' : '02 / 02 · MẬT KHẨU',
    heading: done ? 'Sẵn sàng quay lại.' : 'Đặt mật khẩu mới.',
    description: done
        ? 'Bạn đã hoàn tất luồng khôi phục mẫu. Quay về màn đăng nhập để tiếp tục.'
        : 'Nhập mật khẩu mới hai lần cho ${widget.flow.maskedIdentifier}.',
    child: done
        ? Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                CupertinoIcons.checkmark_circle,
                size: 44,
                color: Palette.red,
              ),
              const SizedBox(height: 24),
              FilledButton(
                key: const Key('recovery-return'),
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Quay về đăng nhập'),
              ),
            ],
          )
        : Form(
            key: form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  key: const Key('recovery-password'),
                  controller: password,
                  readOnly: busy,
                  obscureText: hidden,
                  enableSuggestions: false,
                  autocorrect: false,
                  autofillHints: const [AutofillHints.newPassword],
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu mới',
                    helperText: 'Tối thiểu 6 ký tự theo đăng nhập mẫu.',
                    suffixIcon: IconButton(
                      tooltip: hidden ? 'Hiện mật khẩu mới' : 'Ẩn mật khẩu mới',
                      onPressed: () => setState(() => hidden = !hidden),
                      icon: Icon(
                        hidden ? CupertinoIcons.eye : CupertinoIcons.eye_slash,
                      ),
                    ),
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty || v.length < 6
                      ? 'Nhập mật khẩu từ 6 ký tự.'
                      : null,
                ),
                const SizedBox(height: 20),
                TextFormField(
                  key: const Key('recovery-confirm'),
                  controller: confirmation,
                  readOnly: busy,
                  obscureText: confirmationHidden,
                  enableSuggestions: false,
                  autocorrect: false,
                  autofillHints: const [AutofillHints.newPassword],
                  textInputAction: TextInputAction.done,
                  decoration: InputDecoration(
                    labelText: 'Xác nhận mật khẩu mới',
                    suffixIcon: IconButton(
                      tooltip: confirmationHidden
                          ? 'Hiện mật khẩu xác nhận'
                          : 'Ẩn mật khẩu xác nhận',
                      onPressed: () => setState(
                        () => confirmationHidden = !confirmationHidden,
                      ),
                      icon: Icon(
                        confirmationHidden
                            ? CupertinoIcons.eye
                            : CupertinoIcons.eye_slash,
                      ),
                    ),
                  ),
                  validator: (v) => v == null || v.isEmpty
                      ? 'Nhập lại mật khẩu mới.'
                      : v != password.text
                      ? 'Hai mật khẩu chưa khớp.'
                      : null,
                  onFieldSubmitted: (_) {
                    if (!busy) submit();
                  },
                ),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        error!,
                        style: const TextStyle(color: Palette.red),
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
                FilledButton(
                  key: const Key('recovery-submit'),
                  onPressed: busy ? null : submit,
                  child: Text(
                    busy ? 'Đang xử lý bản thử…' : 'Lưu mật khẩu mới (mẫu)',
                  ),
                ),
                if (error != null)
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Quay lại xác thực'),
                  ),
              ],
            ),
          ),
  );
}

class RecoveryScaffold extends StatelessWidget {
  const RecoveryScaffold({
    super.key,
    required this.title,
    required this.step,
    required this.heading,
    required this.description,
    required this.child,
  });
  final String title, step, heading, description;
  final Widget child;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title, style: const TextStyle(fontSize: 16))),
    body: SafeArea(
      child: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
            children: [
              Eyebrow(step),
              const SizedBox(height: 14),
              Text(heading, style: editorial(30)),
              const SizedBox(height: 12),
              Text(
                description,
                style: const TextStyle(color: Palette.muted, height: 1.65),
              ),
              const SizedBox(height: 32),
              child,
              const SizedBox(height: 28),
              const Divider(),
              const SizedBox(height: 16),
              const Text(
                'Bản thử giao diện · Không gửi OTP thật, lưu mật khẩu hoặc thay đổi tài khoản server.',
                style: TextStyle(color: Palette.muted, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
