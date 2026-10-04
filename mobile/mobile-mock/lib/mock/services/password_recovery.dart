/// In-memory rehearsal. No account lookup, email/SMS or password storage.
class DemoPasswordRecovery {
  DemoPasswordRecovery({DateTime Function()? now}) : now = now ?? DateTime.now;
  final DateTime Function() now;
  String identifier = '';
  DateTime? sentAt, verifiedAt;
  int attempts = 0;
  bool consumed = false;
  static const otpLifetime = Duration(minutes: 2);
  static const grantLifetime = Duration(minutes: 5);
  static const resendDelay = Duration(seconds: 30);

  static String? validateIdentifier(String value) {
    final id = value.trim();
    if (id.isEmpty) return 'Nhập email hoặc số điện thoại.';
    if (RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(id) ||
        RegExp(r'^(?:0\d{9}|\+84\d{9})$').hasMatch(id)) {
      return null;
    }
    return 'Nhập email hợp lệ hoặc SĐT 10 số / +84.';
  }

  String get maskedIdentifier {
    if (identifier.contains('@')) {
      final parts = identifier.split('@');
      return '${parts.first.substring(0, 1)}•••@${parts.last}';
    }
    return '••••••${identifier.substring(identifier.length - 4)}';
  }

  int get resendSeconds => sentAt == null
      ? 0
      : ((resendDelay - now().difference(sentAt!)).inMilliseconds / 1000)
            .ceil()
            .clamp(0, 30);
  bool get expired =>
      sentAt == null || now().difference(sentAt!) >= otpLifetime;
  bool get hasGrant =>
      !consumed &&
      verifiedAt != null &&
      now().difference(verifiedAt!) < grantLifetime;

  void request(String value) {
    final error = validateIdentifier(value);
    if (error != null) throw StateError(error);
    if (sentAt != null && resendSeconds > 0) {
      throw StateError('Chờ $resendSeconds giây trước khi gửi lại.');
    }
    identifier = value.trim();
    sentAt = now();
    verifiedAt = null;
    attempts = 0;
    consumed = false;
  }

  void verify(String code) {
    if (consumed || verifiedAt != null) {
      throw StateError('Mã đã được dùng. Hãy bắt đầu yêu cầu mới.');
    }
    if (expired) {
      throw StateError('Mã đã hết hạn. Hãy gửi lại mã.');
    }
    if (attempts >= 5) throw StateError('Đã thử sai 5 lần. Hãy gửi lại mã.');
    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      throw StateError('Nhập đủ 6 chữ số.');
    }
    if (code != '889900') {
      attempts++;
      throw StateError(
        attempts == 5
            ? 'Đã thử sai 5 lần. Hãy gửi lại mã.'
            : 'Mã chưa đúng. Còn ${5 - attempts} lần thử.',
      );
    }
    verifiedAt = now();
  }

  void complete(String password, String confirmation) {
    if (!hasGrant) {
      throw StateError('Phiên xác thực đã hết hạn. Hãy xác thực lại.');
    }
    if (password.trim().isEmpty || password.length < 6) {
      throw StateError('Mật khẩu từ 6 ký tự trở lên, theo bản đăng nhập mẫu.');
    }
    if (password != confirmation) throw StateError('Hai mật khẩu chưa khớp.');
    // Deliberately do not store either password or reset grant in preferences.
    consumed = true;
    verifiedAt = null;
    sentAt = null;
  }

  void expireForDemo() {
    sentAt = now().subtract(otpLifetime);
    verifiedAt = null;
  }
}
