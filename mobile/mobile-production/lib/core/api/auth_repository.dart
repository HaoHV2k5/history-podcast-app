import 'api_client.dart';

class AuthRepository {
  final ApiClient apiClient;

  AuthRepository(this.apiClient);

  Future<AuthResult> login({required String email, required String password}) async {
    final response = await apiClient.post('/api/v1/auth/login', body: {
      'email': email.trim(),
      'password': password,
    });

    final data = response['data'] as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String?;

    await apiClient.saveTokens(accessToken: accessToken, refreshToken: refreshToken);

    return AuthResult(
      userId: data['userId']?.toString() ?? '',
      email: data['email'] as String? ?? email,
      phone: data['phone'] as String?,
      role: data['role'] as String? ?? 'LISTENER',
      roles: (data['roles'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      token: accessToken,
    );
  }

  Future<AuthResult> register({
    required String email,
    required String password,
    String? confirmPassword,
    required String phone,
    String? role,
  }) async {
    final response = await apiClient.post('/api/v1/auth/register', body: {
      'email': email.trim(),
      'password': password,
      'confirmPassword': (confirmPassword != null && confirmPassword.isNotEmpty)
          ? confirmPassword
          : password,
      'phone': phone.trim(),
      'role': role ?? 'VIEWER',
    });

    final data = response['data'] as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String?;

    await apiClient.saveTokens(accessToken: accessToken, refreshToken: refreshToken);

    return AuthResult(
      userId: data['userId']?.toString() ?? '',
      email: data['email'] as String? ?? email,
      phone: data['phone'] as String? ?? phone,
      role: data['role'] as String? ?? 'LISTENER',
      roles: (data['roles'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      token: accessToken,
    );
  }

  Future<void> sendForgotPasswordOtp(String email) async {
    await apiClient.post('/api/v1/auth/forgot-password', body: {
      'email': email.trim(),
    });
  }

  Future<String> verifyForgotPasswordOtp({required String email, required String otp}) async {
    final response = await apiClient.post('/api/v1/auth/verify-forgot-password-otp', body: {
      'email': email.trim(),
      'otpCode': otp.trim(),
    });
    final data = response['data'] as Map<String, dynamic>?;
    return data?['resetToken'] as String? ?? '';
  }

  Future<void> resetPassword({
    required String email,
    required String newPassword,
    String? confirmPassword,
    required String resetToken,
  }) async {
    await apiClient.post('/api/v1/auth/reset-password', body: {
      'email': email.trim(),
      'newPassword': newPassword,
      'confirmPassword': confirmPassword ?? newPassword,
      'resetToken': resetToken,
    });
  }

  Future<String?> refreshToken() async {
    return await apiClient.refreshAccessToken();
  }

  Future<void> logout() async {
    await apiClient.clearTokens();
  }
}

class AuthResult {
  final String userId;
  final String email;
  final String? phone;
  final String role;
  final List<String> roles;
  final String token;

  AuthResult({
    required this.userId,
    required this.email,
    this.phone,
    required this.role,
    required this.roles,
    required this.token,
  });
}
