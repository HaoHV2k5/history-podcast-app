import 'api_client.dart';

class WithdrawalModel {
  final int id;
  final int walletId;
  final int bankAccountId;
  final String? bankName;
  final String? accountNumber;
  final String? accountHolderName;
  final double amount;
  final String status;
  final String? requestedAt;
  final String? processedAt;
  final String? failureReason;

  WithdrawalModel({
    required this.id,
    required this.walletId,
    required this.bankAccountId,
    this.bankName,
    this.accountNumber,
    this.accountHolderName,
    required this.amount,
    required this.status,
    this.requestedAt,
    this.processedAt,
    this.failureReason,
  });

  factory WithdrawalModel.fromJson(Map<String, dynamic> json) {
    return WithdrawalModel(
      id: (json['id'] as num).toInt(),
      walletId: (json['walletId'] as num).toInt(),
      bankAccountId: (json['bankAccountId'] as num).toInt(),
      bankName: json['bankName']?.toString(),
      accountNumber: json['accountNumber']?.toString(),
      accountHolderName: json['accountHolderName']?.toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'PENDING').toString(),
      requestedAt: json['requestedAt']?.toString(),
      processedAt: json['processedAt']?.toString(),
      failureReason: json['failureReason']?.toString(),
    );
  }
}

class WithdrawalRepository {
  final ApiClient client;

  WithdrawalRepository({required this.client});

  /// 1. POST /api/v1/withdrawals (Creator tạo yêu cầu rút tiền)
  Future<WithdrawalModel> requestWithdrawal({
    required int bankAccountId,
    required double amount,
  }) async {
    final payload = <String, dynamic>{
      'bankAccountId': bankAccountId,
      'amount': amount,
    };
    final res = await client.post('/api/v1/withdrawals', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return WithdrawalModel.fromJson(data);
  }

  /// 2. GET /api/v1/withdrawals/me (Creator xem lịch sử rút tiền của mình)
  Future<List<WithdrawalModel>> getMyWithdrawals({int page = 0, int size = 10}) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    final res = await client.get('/api/v1/withdrawals/me', queryParams: queryParams);
    final data = res['data'];
    if (data is Map<String, dynamic> && data['content'] is List) {
      return (data['content'] as List)
          .map((e) => WithdrawalModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } else if (data is List) {
      return data.map((e) => WithdrawalModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 3. GET /api/v1/withdrawals/admin (Admin xem toàn bộ danh sách rút tiền)
  Future<List<WithdrawalModel>> getAllWithdrawalsAdmin({int page = 0, int size = 10}) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    final res = await client.get('/api/v1/withdrawals/admin', queryParams: queryParams);
    final data = res['data'];
    if (data is Map<String, dynamic> && data['content'] is List) {
      return (data['content'] as List)
          .map((e) => WithdrawalModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } else if (data is List) {
      return data.map((e) => WithdrawalModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 4. PATCH /api/v1/withdrawals/admin/{id}/process (Admin tiếp nhận xử lý rút tiền)
  Future<WithdrawalModel> processWithdrawal(int id) async {
    final res = await client.patch('/api/v1/withdrawals/admin/$id/process', body: {});
    final data = res['data'] as Map<String, dynamic>;
    return WithdrawalModel.fromJson(data);
  }

  /// 5. PATCH /api/v1/withdrawals/admin/{id}/complete (Admin xác nhận chuyển khoản thành công)
  Future<WithdrawalModel> completeWithdrawal(int id) async {
    final res = await client.patch('/api/v1/withdrawals/admin/$id/complete', body: {});
    final data = res['data'] as Map<String, dynamic>;
    return WithdrawalModel.fromJson(data);
  }

  /// 6. PATCH /api/v1/withdrawals/admin/{id}/fail (Admin báo lỗi chuyển khoản)
  Future<WithdrawalModel> failWithdrawal(int id, {String? reason}) async {
    final payload = <String, dynamic>{
      if (reason != null) 'reason': reason,
    };
    final res = await client.patch('/api/v1/withdrawals/admin/$id/fail', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return WithdrawalModel.fromJson(data);
  }

  /// 7. PATCH /api/v1/withdrawals/admin/{id}/reject (Admin từ chối yêu cầu rút tiền)
  Future<WithdrawalModel> rejectWithdrawal(int id, {String? reason}) async {
    final payload = <String, dynamic>{
      if (reason != null) 'reason': reason,
    };
    final res = await client.patch('/api/v1/withdrawals/admin/$id/reject', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return WithdrawalModel.fromJson(data);
  }
}
