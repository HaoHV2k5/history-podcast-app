import 'api_client.dart';

class KycProfileData {
  final int id;
  final int? userId;
  final String? userEmail;
  final String fullName;
  final String phone;
  final String contactEmail;
  final String bankName;
  final String bankAccountNumber;
  final String bankAccountHolder;
  final String? bio;
  final String? portfolioUrl;
  final String? verificationMethod;
  final String? otpVerifiedAt;
  final String status;
  final String? rejectionReason;
  final String? createdAt;

  KycProfileData({
    required this.id,
    this.userId,
    this.userEmail,
    required this.fullName,
    required this.phone,
    required this.contactEmail,
    required this.bankName,
    required this.bankAccountNumber,
    required this.bankAccountHolder,
    this.bio,
    this.portfolioUrl,
    this.verificationMethod,
    this.otpVerifiedAt,
    required this.status,
    this.rejectionReason,
    this.createdAt,
  });

  factory KycProfileData.fromJson(Map<String, dynamic> json) {
    return KycProfileData(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num?)?.toInt(),
      userEmail: json['userEmail']?.toString(),
      fullName: (json['fullName'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      contactEmail: (json['contactEmail'] ?? '').toString(),
      bankName: (json['bankName'] ?? '').toString(),
      bankAccountNumber: (json['bankAccountNumber'] ?? '').toString(),
      bankAccountHolder: (json['bankAccountHolder'] ?? '').toString(),
      bio: json['bio']?.toString(),
      portfolioUrl: json['portfolioUrl']?.toString(),
      verificationMethod: json['verificationMethod']?.toString(),
      otpVerifiedAt: json['otpVerifiedAt']?.toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      rejectionReason: json['rejectionReason']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class KycRepository {
  final ApiClient client;

  KycRepository({required this.client});

  /// 1. Gửi mã OTP xác thực email (POST /api/v1/kyc-profiles/otps/email)
  Future<void> sendEmailOtp(String email) async {
    await client.post('/api/v1/kyc-profiles/otps/email', body: {'email': email});
  }

  /// 2. Xác thực mã OTP email (POST /api/v1/kyc-profiles/otps/email/verify)
  Future<void> verifyEmailOtp(String email, String otp) async {
    await client.post('/api/v1/kyc-profiles/otps/email/verify', body: {
      'email': email,
      'otpCode': otp,
      'otp': otp,
    });
  }

  /// 3. Xác thực số điện thoại (POST /api/v1/kyc-profiles/verifications/phone)
  Future<void> verifyPhone(String phone, String firebaseToken) async {
    await client.post('/api/v1/kyc-profiles/verifications/phone', body: {
      'phone': phone,
      'firebaseToken': firebaseToken,
    });
  }

  /// 4. Nộp hồ sơ đăng ký Creator (POST /api/v1/kyc-profiles)
  Future<KycProfileData> submitKyc({
    required String fullName,
    required String phone,
    required String contactEmail,
    required String bankName,
    required String bankAccountNumber,
    required String bankAccountHolder,
    String? bio,
    String? portfolioUrl,
  }) async {
    final payload = {
      'fullName': fullName,
      'phone': phone,
      'contactEmail': contactEmail,
      'bankName': bankName,
      'bankAccountNumber': bankAccountNumber,
      'bankAccountHolder': bankAccountHolder,
      if (bio != null) 'bio': bio,
      if (portfolioUrl != null) 'portfolioUrl': portfolioUrl,
    };
    final res = await client.post('/api/v1/kyc-profiles', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return KycProfileData.fromJson(data);
  }

  /// 5. Xem hồ sơ KYC của tôi (GET /api/v1/kyc-profiles/me)
  Future<KycProfileData?> getMyKycProfile() async {
    try {
      final res = await client.get('/api/v1/kyc-profiles/me');
      final data = res['data'] as Map<String, dynamic>?;
      if (data == null) return null;
      return KycProfileData.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  /// 6. [Admin] Danh sách hồ sơ KYC (GET /api/v1/kyc-profiles)
  Future<List<KycProfileData>> getKycProfiles({String? status, int page = 0, int size = 10}) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
      if (status != null) 'status': status,
    };
    final res = await client.get('/api/v1/kyc-profiles', queryParams: query);
    final data = res['data'];
    if (data is Map) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems.map((e) => KycProfileData.fromJson(e as Map<String, dynamic>)).toList();
      }
    } else if (data is List) {
      return data.map((e) => KycProfileData.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 7. [Admin] Phê duyệt hoặc từ chối hồ sơ KYC (PATCH /api/v1/kyc-profiles/{id}/status)
  Future<KycProfileData> updateKycStatus(
    int id, {
    required String status,
    String? rejectionReason,
  }) async {
    final payload = {
      'status': status,
      if (rejectionReason != null) 'rejectionReason': rejectionReason,
    };
    final res = await client.patch('/api/v1/kyc-profiles/$id/status', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return KycProfileData.fromJson(data);
  }
}
