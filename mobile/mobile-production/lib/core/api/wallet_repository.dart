import 'api_client.dart';

class WalletRepository {
  final ApiClient apiClient;

  WalletRepository(this.apiClient);

  Future<WalletInfo> getMyWallet() async {
    final response = await apiClient.get('/api/v1/wallets/me');
    final data = response['data'] as Map<String, dynamic>;
    return WalletInfo(
      id: (data['id'] as num?)?.toInt() ?? 0,
      availableBalance: (data['availableBalance'] as num?)?.toDouble() ?? 0.0,
      pendingBalance: (data['pendingBalance'] as num?)?.toDouble() ?? 0.0,
    );
  }

  /// GET /api/v1/wallets/{id} (Tra cứu ví theo ID - Admin)
  Future<WalletInfo> getWalletById(int id) async {
    final response = await apiClient.get('/api/v1/wallets/$id');
    final data = response['data'] as Map<String, dynamic>;
    return WalletInfo(
      id: (data['id'] as num?)?.toInt() ?? 0,
      availableBalance: (data['availableBalance'] as num?)?.toDouble() ?? 0.0,
      pendingBalance: (data['pendingBalance'] as num?)?.toDouble() ?? 0.0,
    );
  }

  /// GET /api/v1/wallets/me/transactions (Xem lịch sử biến động số dư ví phân trang)
  Future<List<WalletTransactionModel>> getMyTransactions({int page = 0, int size = 10}) async {
    final response = await apiClient.get('/api/v1/wallets/me/transactions', queryParams: {
      'page': page.toString(),
      'size': size.toString(),
    });
    final data = response['data'];
    if (data is Map<String, dynamic>) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems
            .map((e) => WalletTransactionModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } else if (data is List) {
      return data.map((e) => WalletTransactionModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<String> createDeposit({required int amount}) async {
    final response = await apiClient.post('/api/v1/wallets/me/deposits', body: {
      'amount': amount,
      'description': 'Nạp tiền vào ví Sử Ký qua Mobile',
      'orderInfo': 'Nạp tiền vào ví Sử Ký qua Mobile',
    });
    final data = response['data'] as Map<String, dynamic>;
    return data['paymentUrl'] as String? ?? '';
  }

  Future<List<BankAccountData>> getBankAccounts() async {
    final response = await apiClient.get('/api/v1/bank-accounts');
    final rawList = response['data'] as List<dynamic>? ?? [];
    return rawList.map((item) {
      final map = item as Map<String, dynamic>;
      return BankAccountData(
        id: (map['id'] as num?)?.toInt() ?? 0,
        userId: (map['userId'] as num?)?.toInt() ?? 0,
        bankName: map['bankName'] as String? ?? '',
        accountNumber: map['accountNumber'] as String? ?? '',
        accountHolderName: map['accountHolderName'] as String? ?? '',
        verified: map['verified'] as bool? ?? false,
      );
    }).toList();
  }

  Future<BankAccountData> createBankAccount({
    required String bankName,
    required String accountNumber,
    required String accountHolderName,
    int? userId,
  }) async {
    final response = await apiClient.post('/api/v1/bank-accounts', body: {
      'userId': userId,
      'bankName': bankName.trim(),
      'accountNumber': accountNumber.trim(),
      'accountHolderName': accountHolderName.trim().toUpperCase(),
      'verified': true,
    });
    final data = response['data'] as Map<String, dynamic>;
    return BankAccountData(
      id: (data['id'] as num?)?.toInt() ?? 0,
      userId: (data['userId'] as num?)?.toInt() ?? 0,
      bankName: data['bankName'] as String? ?? bankName,
      accountNumber: data['accountNumber'] as String? ?? accountNumber,
      accountHolderName: data['accountHolderName'] as String? ?? accountHolderName,
      verified: data['verified'] as bool? ?? true,
    );
  }

  Future<void> deleteBankAccount(int id) async {
    await apiClient.delete('/api/v1/bank-accounts/$id');
  }

  /// Xử lý Return URL từ VNPay (GET /api/v1/payments/vnpay/return)
  Future<PaymentReturnResult> handleVnpayReturn(Map<String, String> queryParams) async {
    final response = await apiClient.get('/api/v1/payments/vnpay/return', queryParams: queryParams);
    final data = response['data'] as Map<String, dynamic>;
    return PaymentReturnResult.fromJson(data);
  }

  /// Xử lý IPN Webhook từ VNPay (GET /api/v1/payments/vnpay/ipn)
  Future<Map<String, dynamic>> handleVnpayIpn(Map<String, String> ipnParams) async {
    return await apiClient.get('/api/v1/payments/vnpay/ipn', queryParams: ipnParams);
  }
}

class PaymentReturnResult {
  final String merchantTxnRef;
  final String? gatewayTxnNo;
  final double amount;
  final String status;
  final String? message;

  PaymentReturnResult({
    required this.merchantTxnRef,
    this.gatewayTxnNo,
    required this.amount,
    required this.status,
    this.message,
  });

  factory PaymentReturnResult.fromJson(Map<String, dynamic> json) {
    return PaymentReturnResult(
      merchantTxnRef: (json['merchantTxnRef'] ?? '').toString(),
      gatewayTxnNo: json['gatewayTxnNo']?.toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'PENDING').toString(),
      message: json['message']?.toString(),
    );
  }
}

class BankAccountData {
  final int id;
  final int userId;
  final String bankName;
  final String accountNumber;
  final String accountHolderName;
  final bool verified;

  BankAccountData({
    required this.id,
    required this.userId,
    required this.bankName,
    required this.accountNumber,
    required this.accountHolderName,
    required this.verified,
  });
}

class WalletInfo {
  final int id;
  final double availableBalance;
  final double pendingBalance;

  WalletInfo({
    required this.id,
    required this.availableBalance,
    required this.pendingBalance,
  });
}

class WalletTransactionModel {
  final int id;
  final int walletId;
  final String type;
  final double amount;
  final String? relatedType;
  final int? relatedId;
  final String status;
  final String? merchantTxnRef;
  final String? gatewayTxnNo;
  final String? gatewayProvider;
  final String? description;
  final String? createdAt;

  WalletTransactionModel({
    required this.id,
    required this.walletId,
    required this.type,
    required this.amount,
    this.relatedType,
    this.relatedId,
    required this.status,
    this.merchantTxnRef,
    this.gatewayTxnNo,
    this.gatewayProvider,
    this.description,
    this.createdAt,
  });

  factory WalletTransactionModel.fromJson(Map<String, dynamic> json) {
    return WalletTransactionModel(
      id: (json['id'] as num).toInt(),
      walletId: (json['walletId'] as num).toInt(),
      type: (json['type'] ?? '').toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      relatedType: json['relatedType']?.toString(),
      relatedId: (json['relatedId'] as num?)?.toInt(),
      status: (json['status'] ?? 'SUCCESS').toString(),
      merchantTxnRef: json['merchantTxnRef']?.toString(),
      gatewayTxnNo: json['gatewayTxnNo']?.toString(),
      gatewayProvider: json['gatewayProvider']?.toString(),
      description: json['description']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}
