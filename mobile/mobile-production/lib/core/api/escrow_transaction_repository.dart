import 'api_client.dart';

class EscrowTransactionModel {
  final int id;
  final int contractId;
  final int? milestoneId;
  final double amount;
  final String status;
  final String? type;
  final String? note;
  final String? createdAt;
  final String? updatedAt;

  EscrowTransactionModel({
    required this.id,
    required this.contractId,
    this.milestoneId,
    required this.amount,
    required this.status,
    this.type,
    this.note,
    this.createdAt,
    this.updatedAt,
  });

  factory EscrowTransactionModel.fromJson(Map<String, dynamic> json) {
    return EscrowTransactionModel(
      id: (json['id'] as num).toInt(),
      contractId: (json['contractId'] as num).toInt(),
      milestoneId: (json['milestoneId'] as num?)?.toInt(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'PENDING').toString(),
      type: json['type']?.toString(),
      note: json['note']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class EscrowTransactionRepository {
  final ApiClient client;

  EscrowTransactionRepository({required this.client});

  /// 1. Lấy danh sách tất cả EscrowTransaction (GET /api/v1/escrow-transactions)
  Future<List<EscrowTransactionModel>> getAll() async {
    final res = await client.get('/api/v1/escrow-transactions');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => EscrowTransactionModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. Lấy chi tiết EscrowTransaction theo ID (GET /api/v1/escrow-transactions/{id})
  Future<EscrowTransactionModel> getById(int id) async {
    final res = await client.get('/api/v1/escrow-transactions/$id');
    final data = res['data'] as Map<String, dynamic>;
    return EscrowTransactionModel.fromJson(data);
  }

  /// 3. Tạo mới EscrowTransaction (POST /api/v1/escrow-transactions)
  Future<EscrowTransactionModel> create({
    required int contractId,
    int? milestoneId,
    required double amount,
    String status = 'PENDING',
    String? type,
    String? note,
  }) async {
    final payload = {
      'contractId': contractId,
      if (milestoneId != null) 'milestoneId': milestoneId,
      'amount': amount,
      'status': status,
      if (type != null) 'type': type,
      if (note != null) 'note': note,
      'createdAt': DateTime.now().toUtc().toIso8601String(),
    };
    final res = await client.post('/api/v1/escrow-transactions', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return EscrowTransactionModel.fromJson(data);
  }

  /// 4. Cập nhật EscrowTransaction (PUT /api/v1/escrow-transactions/{id})
  Future<EscrowTransactionModel> update(
    int id, {
    double? amount,
    String? status,
    String? note,
  }) async {
    final payload = {
      if (amount != null) 'amount': amount,
      if (status != null) 'status': status,
      if (note != null) 'note': note,
      'updatedAt': DateTime.now().toUtc().toIso8601String(),
    };
    final res = await client.put('/api/v1/escrow-transactions/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return EscrowTransactionModel.fromJson(data);
  }

  /// 5. Xóa EscrowTransaction (DELETE /api/v1/escrow-transactions/{id})
  Future<void> delete(int id) async {
    await client.delete('/api/v1/escrow-transactions/$id');
  }
}
