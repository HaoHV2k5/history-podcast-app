import 'api_client.dart';

class MembershipCheckModel {
  final int channelId;
  final bool isMember;
  final String? expiresAt;
  final String? reason;

  MembershipCheckModel({
    required this.channelId,
    required this.isMember,
    this.expiresAt,
    this.reason,
  });

  factory MembershipCheckModel.fromJson(Map<String, dynamic> json) {
    return MembershipCheckModel(
      channelId: (json['channelId'] as num).toInt(),
      isMember: json['isMember'] == true || json['member'] == true,
      expiresAt: (json['expiresAt'] ?? json['validUntil'])?.toString(),
      reason: json['reason']?.toString(),
    );
  }
}

class MembershipSubscribeModel {
  final int subscriptionId;
  final int channelId;
  final String status;
  final double amountPaid;
  final String expiresAt;

  MembershipSubscribeModel({
    required this.subscriptionId,
    required this.channelId,
    required this.status,
    required this.amountPaid,
    required this.expiresAt,
  });

  factory MembershipSubscribeModel.fromJson(Map<String, dynamic> json) {
    return MembershipSubscribeModel(
      subscriptionId:
          ((json['subscriptionId'] ?? json['membershipId'] ?? json['id'])
                  as num?)
              ?.toInt() ??
          0,
      channelId: (json['channelId'] as num?)?.toInt() ?? 0,
      status: (json['status'] ?? 'ACTIVE').toString(),
      amountPaid: (json['amountPaid'] as num?)?.toDouble() ?? 0.0,
      expiresAt:
          (json['expiresAt'] ?? json['endedAt'] ?? json['startDate'] ?? '')
              .toString(),
    );
  }

  int get id => subscriptionId;
}

class MyMembershipItem {
  final int channelId;
  final String channelName;
  final String? channelAvatarUrl;
  final String startedAt;
  final String expiresAt;
  final String status;

  MyMembershipItem({
    required this.channelId,
    required this.channelName,
    this.channelAvatarUrl,
    required this.startedAt,
    required this.expiresAt,
    required this.status,
  });

  factory MyMembershipItem.fromJson(Map<String, dynamic> json) {
    return MyMembershipItem(
      channelId: (json['channelId'] as num).toInt(),
      channelName: (json['channelName'] ?? '').toString(),
      channelAvatarUrl: json['channelAvatarUrl']?.toString(),
      startedAt: (json['startedAt'] ?? '').toString(),
      expiresAt: (json['expiresAt'] ?? json['endedAt'] ?? '').toString(),
      status: (json['status'] ?? 'ACTIVE').toString(),
    );
  }
}

class MembershipPaymentModel {
  final int id;
  final int userId;
  final int channelId;
  final double amount;
  final String status;
  final String? paymentMethod;
  final String? transactionCode;
  final String? createdAt;

  MembershipPaymentModel({
    required this.id,
    required this.userId,
    required this.channelId,
    required this.amount,
    required this.status,
    this.paymentMethod,
    this.transactionCode,
    this.createdAt,
  });

  factory MembershipPaymentModel.fromJson(Map<String, dynamic> json) {
    return MembershipPaymentModel(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num).toInt(),
      channelId: (json['channelId'] as num).toInt(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'SUCCESS').toString(),
      paymentMethod: json['paymentMethod']?.toString(),
      transactionCode: json['transactionCode']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class MembershipRepository {
  final ApiClient client;

  MembershipRepository({required this.client});

  /// 1. Đăng ký mua gói hội viên kênh (POST /api/v1/channels/{channelId}/memberships/subscribe)
  Future<MembershipSubscribeModel> subscribe(int channelId) async {
    final res = await client.post('/api/v1/channels/$channelId/memberships/subscribe');
    final data = res['data'] as Map<String, dynamic>;
    return MembershipSubscribeModel.fromJson(data);
  }

  /// 2. Kiểm tra quyền hội viên kênh (GET /api/v1/channels/{channelId}/memberships/check)
  Future<MembershipCheckModel> checkMembership(int channelId) async {
    final res = await client.get('/api/v1/channels/$channelId/memberships/check');
    final data = res['data'] as Map<String, dynamic>;
    return MembershipCheckModel.fromJson(data);
  }

  /// 3. Xem danh sách các kênh đang là hội viên (GET /api/v1/memberships/me)
  Future<List<MyMembershipItem>> getMyMemberships({int page = 0, int size = 10}) async {
    final res = await client.get('/api/v1/memberships/me', queryParams: {
      'page': page.toString(),
      'size': size.toString(),
    });
    final data = res['data'];
    if (data is Map) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems.map((e) => MyMembershipItem.fromJson(e as Map<String, dynamic>)).toList();
      }
    } else if (data is List) {
      return data.map((e) => MyMembershipItem.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  // --- MembershipPayment Management ---

  /// Lấy danh sách tất cả MembershipPayment (GET /api/v1/membership-payments)
  Future<List<MembershipPaymentModel>> getAllPayments() async {
    final res = await client.get('/api/v1/membership-payments');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => MembershipPaymentModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// Lấy chi tiết MembershipPayment theo ID (GET /api/v1/membership-payments/{id})
  Future<MembershipPaymentModel> getPaymentById(int id) async {
    final res = await client.get('/api/v1/membership-payments/$id');
    final data = res['data'] as Map<String, dynamic>;
    return MembershipPaymentModel.fromJson(data);
  }

  /// Tạo mới MembershipPayment (POST /api/v1/membership-payments)
  Future<MembershipPaymentModel> createPayment({
    required int userId,
    required int channelId,
    required double amount,
    String status = 'SUCCESS',
    String? paymentMethod,
    String? transactionCode,
  }) async {
    final payload = {
      'userId': userId,
      'channelId': channelId,
      'amount': amount,
      'status': status,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (transactionCode != null) 'transactionCode': transactionCode,
      'createdAt': DateTime.now().toUtc().toIso8601String(),
    };
    final res = await client.post('/api/v1/membership-payments', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return MembershipPaymentModel.fromJson(data);
  }

  /// Cập nhật MembershipPayment (PUT /api/v1/membership-payments/{id})
  Future<MembershipPaymentModel> updatePayment(
    int id, {
    double? amount,
    String? status,
  }) async {
    final payload = {
      if (amount != null) 'amount': amount,
      if (status != null) 'status': status,
    };
    final res = await client.put('/api/v1/membership-payments/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return MembershipPaymentModel.fromJson(data);
  }

  /// Xóa MembershipPayment (DELETE /api/v1/membership-payments/{id})
  Future<void> deletePayment(int id) async {
    await client.delete('/api/v1/membership-payments/$id');
  }
}
