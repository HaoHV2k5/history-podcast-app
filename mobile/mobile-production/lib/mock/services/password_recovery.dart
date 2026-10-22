import '../../core/api/auth_repository.dart';

/// Password recovery service kết nối trực tiếp Brevo OTP API backend
class DemoPasswordRecovery {
  DemoPasswordRecovery({DateTime Function()? now, this.authRepository})
      : now = now ?? DateTime.now;
  final DateTime Function() now;
  final AuthRepository? authRepository;
  String identifier = '';
  String? resetToken;
  DateTime? sentAt, verifiedAt;
  int attempts = 0;
  bool consumed = false;
  static const otpLifetime = Duration(minutes: 5);
  static const grantLifetime = Duration(minutes: 10);
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

  Future<void> request(String value) async {
    final error = validateIdentifier(value);
    if (error != null) throw StateError(error);
    if (sentAt != null && resendSeconds > 0) {
      throw StateError('Chờ $resendSeconds giây trước khi gửi lại.');
    }
    identifier = value.trim();

    if (authRepository != null && identifier.contains('@')) {
      try {
        await authRepository!.sendForgotPasswordOtp(identifier);
      } catch (e) {
        throw StateError(e.toString());
      }
    }

    sentAt = now();
    verifiedAt = null;
    attempts = 0;
    consumed = false;
  }

  Future<void> verify(String code) async {
    if (consumed || verifiedAt != null) {
      throw StateError('Mã đã được dùng. Hãy bắt đầu yêu cầu mới.');
    }
    if (expired) {
      throw StateError('Mã đã hết hạn. Hãy gửi lại mã.');
    }
    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      throw StateError('Nhập đủ 6 chữ số.');
    }

    if (authRepository != null && identifier.contains('@')) {
      try {
        resetToken = await authRepository!.verifyForgotPasswordOtp(
          email: identifier,
          otp: code,
        );
        verifiedAt = now();
        return;
      } catch (e) {
        attempts++;
        throw StateError(e.toString());
      }
    }

    if (code != '889900') {
      attempts++;
      throw StateError('Mã OTP chưa chính xác.');
    }
    verifiedAt = now();
  }

  Future<void> complete(String password, String confirmation) async {
    if (!hasGrant) {
      throw StateError('Phiên xác thực đã hết hạn. Hãy xác thực lại.');
    }
    if (password.trim().isEmpty || password.length < 6) {
      throw StateError('Mật khẩu từ 6 ký tự trở lên.');
    }
    if (password != confirmation) throw StateError('Hai mật khẩu chưa khớp.');

    if (authRepository != null && identifier.contains('@') && resetToken != null) {
      try {
        await authRepository!.resetPassword(
          email: identifier,
          newPassword: password,
          confirmPassword: confirmation,
          resetToken: resetToken!,
        );
      } catch (e) {
        throw StateError(e.toString());
      }
    }

    consumed = true;
    verifiedAt = null;
    sentAt = null;
  }

  void expireForDemo() {
    sentAt = now().subtract(otpLifetime);
    verifiedAt = null;
  }
}
