import 'api_client.dart';
import 'wallet_repository.dart';

class WalletTransactionRepository {
  final ApiClient client;

  WalletTransactionRepository({required this.client});

  /// 1. GET /api/v1/wallet-transactions
  Future<List<WalletTransactionModel>> getAll() async {
    final res = await client.get('/api/v1/wallet-transactions');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => WalletTransactionModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/wallet-transactions/{id}
  Future<WalletTransactionModel> getById(int id) async {
    final res = await client.get('/api/v1/wallet-transactions/$id');
    final data = res['data'] as Map<String, dynamic>;
    return WalletTransactionModel.fromJson(data);
  }

  /// 3. POST /api/v1/wallet-transactions
  Future<WalletTransactionModel> create({
    required int walletId,
    required String type,
    required double amount,
    String? relatedType,
    int? relatedId,
    String status = 'SUCCESS',
    String? description,
  }) async {
    final payload = <String, dynamic>{
      'walletId': walletId,
      'type': type,
      'amount': amount,
      if (relatedType != null) 'relatedType': relatedType,
      if (relatedId != null) 'relatedId': relatedId,
      'status': status,
      if (description != null) 'description': description,
    };
    final res = await client.post('/api/v1/wallet-transactions', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return WalletTransactionModel.fromJson(data);
  }

  /// 4. PUT /api/v1/wallet-transactions/{id}
  Future<WalletTransactionModel> update(
    int id, {
    String? status,
    String? description,
  }) async {
    final payload = <String, dynamic>{
      if (status != null) 'status': status,
      if (description != null) 'description': description,
    };
    final res = await client.put('/api/v1/wallet-transactions/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return WalletTransactionModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/wallet-transactions/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/wallet-transactions/$id');
  }
}
