import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../creator_state.dart';
import '../../episode.dart';
import '../../core/api/contract_repository.dart';
import '../../core/api/kyc_repository.dart';
import '../../core/api/wallet_repository.dart';
import '../../core/api/withdrawal_repository.dart';

String money(int value) =>
    '${value.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}đ';

/// WalletState hỗ trợ kết nối trực tiếp API Backend
class WalletState extends ChangeNotifier {
  WalletState(
    this.preferences, {
    this.walletRepository,
    this.withdrawalRepository,
    this.contractRepository,
    this.kycRepository,
  }) {
    refresh();
  }
  final SharedPreferences preferences;
  final WalletRepository? walletRepository;
  final WithdrawalRepository? withdrawalRepository;
  final ContractRepository? contractRepository;
  final KycRepository? kycRepository;
  Map<String, dynamic> data = {};
  List<WalletTransactionModel> remoteTransactions = [];
  List<WithdrawalModel> remoteWithdrawals = [];
  List<BankAccountData> remoteBanks = [];
  MilestoneFinancialSummaryModel? milestoneFinancials;
  String? lastDepositPaymentUrl;
  String? lastDepositMerchantTxnRef;
  int? lastDepositAmount;

  bool get isLiveBackend =>
      walletRepository != null ||
      withdrawalRepository != null ||
      contractRepository != null;

  void refresh() {
    data = jsonDecode(
      preferences.getString('walletDemoV1') ??
          '{"wallets":{},"escrows":{},"events":[]}',
    ) as Map<String, dynamic>;
  }

  Future<void> syncWalletBackend(String owner) async {
    refresh();
    var updated = false;
    int? resolvedUserId = preferences.getInt('currentUserId');
    if (walletRepository != null) {
      try {
        final info = await walletRepository!.getMyWallet();
        if (info.userId != null && info.userId! > 0) {
          resolvedUserId = info.userId;
          await preferences.setInt('currentUserId', info.userId!);
        }
        final w = wallet(owner);
        w['available'] = info.availableBalance.round();
        w['holding'] = info.pendingBalance.round();
        updated = true;
      } catch (_) {}
      try {
        remoteTransactions = await walletRepository!.getMyTransactions(page: 0, size: 50);
      } catch (_) {}
      try {
        final allBanks = await walletRepository!.getBankAccounts();
        remoteBanks = (resolvedUserId != null && resolvedUserId > 0)
            ? allBanks.where((b) => b.userId == resolvedUserId).toList()
            : <BankAccountData>[];
        if (remoteBanks.isNotEmpty) {
          final firstBank = remoteBanks.first;
          wallet(owner)['bank'] = {
            'id': firstBank.id,
            'name': firstBank.bankName,
            'account': firstBank.accountNumber,
            'holder': firstBank.accountHolderName,
          };
          updated = true;
        } else {
          wallet(owner)['bank'] = null;
          updated = true;
        }
      } catch (_) {}
    }
    if (withdrawalRepository != null) {
      try {
        remoteWithdrawals = await withdrawalRepository!.getMyWithdrawals(page: 0, size: 50);
      } catch (_) {}
    }
    if (contractRepository != null) {
      try {
        milestoneFinancials =
            await contractRepository!.getMyMilestoneFinancials();
      } catch (_) {}
    }
    if (updated) {
      await save();
    }
    notifyListeners();
  }

  Future<String?> topUpWallet(String owner, int amount, {String? description}) async {
    refresh();
    final minTopUp = isLiveBackend ? 10000 : 50000;
    if (amount < minTopUp) {
      throw StateError('Số tiền nạp tối thiểu là ${money(minTopUp)}.');
    }
    String? paymentUrl;
    if (walletRepository != null) {
      final deposit = await walletRepository!.createDepositPayment(
        amount: amount,
        description: description,
      );
      paymentUrl = deposit.paymentUrl;
      final effectiveRef =
          (deposit.merchantTxnRef != null &&
              deposit.merchantTxnRef!.trim().isNotEmpty)
          ? deposit.merchantTxnRef!.trim()
          : 'DEP${DateTime.now().millisecondsSinceEpoch}';
      lastDepositPaymentUrl = paymentUrl;
      lastDepositMerchantTxnRef = effectiveRef;
      lastDepositAmount = amount;
      await preferences.setString('last_deposit_merchant_txn_ref', effectiveRef);
      if (paymentUrl.isNotEmpty) {
        await preferences.setString('last_deposit_payment_url', paymentUrl);
      }
      await syncWalletBackend(owner);
      final hasPendingInList = remoteTransactions.any(
        (tx) =>
            tx.type.toUpperCase() == 'DEPOSIT' &&
            tx.status.toUpperCase() == 'PENDING',
      );
      if (!hasPendingInList) {
        remoteTransactions = [
          WalletTransactionModel(
            id: DateTime.now().millisecondsSinceEpoch,
            walletId: 0,
            type: 'DEPOSIT',
            amount: amount.toDouble(),
            status: 'PENDING',
            merchantTxnRef: effectiveRef,
            gatewayProvider: 'VNPAY',
            description: (description != null && description.trim().isNotEmpty)
                ? description.trim()
                : 'Nạp tiền vào ví Sử Ký qua VNPay Sandbox',
            createdAt: DateTime.now().toIso8601String(),
          ),
          ...remoteTransactions,
        ];
      }
      event('Tạo lệnh nạp ${money(amount)} qua cổng thanh toán VNPay Sandbox');
      await save();
      return paymentUrl;
    }
    wallet(owner)['available'] = available(owner) + amount;
    event('Nạp ${money(amount)} vào ví $owner');
    await save();
    return null;
  }

  Future<void> refreshFromBackend([String owner = 'creator']) =>
      syncWalletBackend(owner);

  Future<bool> confirmPendingDeposit(String owner, Object tx) async {
    if (walletRepository == null) {
      return false;
    }
    int amount = lastDepositAmount ?? 0;
    String? txnRef;
    String? paymentUrl = lastDepositPaymentUrl;
    if (tx is WalletTransactionModel) {
      amount = tx.amount.abs().round();
      txnRef = tx.merchantTxnRef;
    } else if (tx is Map) {
      final rawAmt = tx['amount'];
      if (rawAmt is num) {
        amount = rawAmt.toDouble().abs().round();
      } else if (rawAmt != null) {
        amount = (double.tryParse(rawAmt.toString()) ?? 0).abs().round();
      }
      txnRef = tx['merchantTxnRef']?.toString() ?? tx['vnp_TxnRef']?.toString();
      paymentUrl = tx['paymentUrl']?.toString() ?? paymentUrl;
    }
    if (txnRef == null || txnRef.trim().isEmpty) {
      txnRef = lastDepositMerchantTxnRef ??
          preferences.getString('last_deposit_merchant_txn_ref');
    }
    if (paymentUrl == null || paymentUrl.trim().isEmpty) {
      paymentUrl = preferences.getString('last_deposit_payment_url');
    }
    if ((txnRef == null || txnRef.trim().isEmpty) &&
        (paymentUrl == null || paymentUrl.trim().isEmpty)) {
      return false;
    }
    final ok = await walletRepository!.confirmVnpaySandboxIpn(
      amount: amount,
      merchantTxnRef: txnRef,
      paymentUrl: paymentUrl,
    );
    if (ok) {
      await preferences.remove('return_to_wallet_after_vnpay');
      await syncWalletBackend(owner);
    }
    return ok;
  }

  Map<String, dynamic> wallet(String owner) =>
      (data['wallets'] as Map).putIfAbsent(
        owner,
        () => <String, dynamic>{
          'available': 0,
          'holding': 0,
          'bank': null,
          'withdrawals': <dynamic>[],
        },
      ) as Map<String, dynamic>;
  int available(String owner) => wallet(owner)['available'] as int;
  int holding(String owner) => wallet(owner)['holding'] as int;
  List<dynamic> get events => data['events'] as List;
  Map<String, dynamic> get escrows => data['escrows'] as Map<String, dynamic>;
  void event(String text) =>
      events.insert(0, '${DateTime.now().toIso8601String()} · $text');
  Future<void> save() async {
    if (!await preferences.setString('walletDemoV1', jsonEncode(data))) {
      throw StateError('Không lưu được sổ ví mẫu.');
    }
    notifyListeners();
  }

  Future<void> seed() async {
    refresh();
    if (data['seeded'] == true) {
      throw StateError('Số dư mẫu đã được nạp; đổi bộ demo để thử lại từ đầu.');
    }
    wallet('creator')['available'] = available('creator') + 2000000;
    wallet('creator')['holding'] = holding('creator') + 500000;
    data['seeded'] = true;
    event('Nạp 2.000.000đ khả dụng và 500.000đ chờ giữ · tiền hư cấu');
    await save();
  }

  Future<void> linkBank(
    String owner,
    KycProfile kyc,
    String bank,
    String account,
    String holder,
  ) async {
    refresh();
    final invalidHolder = isLiveBackend
        ? holder.trim().isEmpty
        : (!kyc.isApproved ||
              normalizeSearch(holder.trim()) !=
                  normalizeSearch(kyc.fullName.trim()));
    if (invalidHolder ||
        !RegExp(r'^\d{6,19}$').hasMatch(account) ||
        bank.trim().isEmpty) {
      throw StateError(
        'Cần ngân hàng, số tài khoản 6–19 số và tên chủ khớp KYC.',
      );
    }
    if (!isLiveBackend &&
        (wallet(owner)['withdrawals'] as List).any(
          (r) => r['status'] == 'processing',
        )) {
      throw StateError('Có yêu cầu rút đang xử lý; chưa đổi ngân hàng.');
    }

    int? createdId;
    if (walletRepository != null) {
      final currentUserId = preferences.getInt('currentUserId');
      final newBank = await walletRepository!.createBankAccount(
        bankName: bank.trim(),
        accountNumber: account,
        accountHolderName: holder.trim(),
        userId: currentUserId,
      );
      createdId = newBank.id;
      remoteBanks = [newBank, ...remoteBanks.where((b) => b.id != newBank.id)];
    }

    wallet(owner)['bank'] = {
      'id': ?createdId,
      'name': bank.trim(),
      'account': account,
      'holder': holder.trim(),
    };
    event('Liên kết ngân hàng thành công cho $owner');
    await save();
  }

  Future<void> updateBank({
    required int id,
    required String owner,
    required KycProfile kyc,
    required String bank,
    required String account,
    required String holder,
  }) async {
    refresh();
    final mustMatchKycName = !isLiveBackend && kyc.fullName.isNotEmpty;
    if (holder.trim().isEmpty ||
        (mustMatchKycName &&
            normalizeSearch(holder.trim()) !=
                normalizeSearch(kyc.fullName.trim())) ||
        !RegExp(r'^\d{6,19}$').hasMatch(account) ||
        bank.trim().isEmpty) {
      throw StateError(
        'Cần ngân hàng, số tài khoản 6–19 số và tên chủ khớp KYC.',
      );
    }

    if (walletRepository != null) {
      final currentUserId = preferences.getInt('currentUserId');
      final updated = await walletRepository!.updateBankAccount(
        id: id,
        bankName: bank.trim(),
        accountNumber: account,
        accountHolderName: holder.trim(),
        userId: currentUserId,
      );
      final idx = remoteBanks.indexWhere((b) => b.id == id);
      if (idx != -1) {
        remoteBanks[idx] = updated;
      } else {
        remoteBanks = [updated, ...remoteBanks];
      }
    }

    wallet(owner)['bank'] = {
      'id': id,
      'name': bank.trim(),
      'account': account,
      'holder': holder.trim(),
    };
    event('Cập nhật tài khoản ngân hàng thành công cho $owner');
    await save();
  }

  Future<void> withdraw(
    String owner,
    KycProfile kyc,
    int amount, {
    int? bankAccountId,
  }) async {
    refresh();
    final w = wallet(owner), bank = w['bank'] as Map?;
    if (!isLiveBackend) {
      if (!kyc.isApproved ||
          bank == null ||
          normalizeSearch(bank['holder'] as String) !=
              normalizeSearch(kyc.fullName)) {
        throw StateError('Cần KYC và ngân hàng trùng tên chủ.');
      }
      if (amount < 100000 || amount > available(owner)) {
        throw StateError(
          'Mức thử tối thiểu 100.000đ; không vượt số dư khả dụng. Đây chưa phải policy thật.',
        );
      }
      if ((w['withdrawals'] as List).any((r) => r['status'] == 'processing')) {
        throw StateError('Hãy xử lý yêu cầu đang chờ trước.');
      }
    } else {
      if (bank == null && remoteBanks.isEmpty) {
        throw StateError('Vui lòng liên kết tài khoản ngân hàng trước khi rút tiền.');
      }
      if (amount < 50000 || amount > available(owner)) {
        throw StateError(
          'Số tiền rút tối thiểu là 50.000đ và không vượt quá số dư khả dụng.',
        );
      }
    }

    if (withdrawalRepository != null) {
      final bankId = bankAccountId ??
          (bank?['id'] as num?)?.toInt() ??
          (remoteBanks.isNotEmpty ? remoteBanks.first.id : 1);
      try {
        final created = await withdrawalRepository!.requestWithdrawal(
          bankAccountId: bankId,
          amount: amount.toDouble(),
        );
        remoteWithdrawals = [
          created,
          ...remoteWithdrawals.where((item) => item.id != created.id),
        ];
        await syncWalletBackend(owner);
        return;
      } catch (e) {
        throw StateError(e.toString().replaceFirst('Exception: ', ''));
      }
    }

    w['available'] = available(owner) - amount;
    (w['withdrawals'] as List).insert(0, {
      'id': 'RUT-${DateTime.now().microsecondsSinceEpoch}',
      'amount': amount,
      'status': 'processing',
      'reason': '',
      'bank': bank != null ? Map.of(bank) : <String, dynamic>{},
    });
    event('$owner yêu cầu rút mẫu ${money(amount)} · giữ số tiền đang xử lý');
    await save();
  }

  Future<void> resolveWithdrawal(
    String owner,
    String id,
    bool success, {
    String reason = '',
  }) async {
    refresh();
    final r = (wallet(owner)['withdrawals'] as List).firstWhere(
      (r) => r['id'] == id,
    ) as Map;
    if (r['status'] != 'processing') {
      throw StateError('Yêu cầu đã xử lý, không ghi nhận hai lần.');
    }
    if (!success && reason.trim().length < 5) {
      throw StateError('Cần lý do chuyển khoản lỗi.');
    }
    r['status'] = success ? 'completed' : 'failed';
    r['reason'] = reason.trim();
    if (!success) {
      wallet(owner)['available'] = available(owner) + (r['amount'] as int);
    }
    event('$id ${success ? 'hoàn tất mẫu' : 'thất bại, trả lại số dư'}');
    await save();
  }

  Future<void> releaseHolding(String owner) async {
    refresh();
    if (holding(owner) <= 0) throw StateError('Không có tiền chờ giữ.');
    wallet(owner)['available'] = available(owner) + holding(owner);
    wallet(owner)['holding'] = 0;
    event('Giả lập hết kỳ giữ tiền của $owner; thời hạn thật chưa chốt');
    await save();
  }

  Future<void> reserve(String id, String narrator, int amount) async {
    refresh();
    if (escrows.containsKey(id)) return;
    if (amount <= 0 || amount > available('creator')) {
      throw StateError(
        'Ví mẫu Creator chưa đủ tiền ký quỹ. Vào Ví & rút tiền → nạp số dư thử.',
      );
    }
    wallet('creator')['available'] = available('creator') - amount;
    escrows[id] = {'amount': amount, 'narrator': narrator, 'status': 'held'};
    event('$id khóa ${money(amount)} sau xác nhận hai bên');
    await save();
  }

  Future<void> settle(String id, {required bool refund}) async {
    refresh();
    final escrow = escrows[id] as Map?;
    if (escrow == null) {
      throw StateError(
        'Hợp tác cũ chưa có ký quỹ mẫu; nạp lại bộ Sẵn sàng thử để diễn tập đầy đủ.',
      );
    }
    if (escrow['status'] != 'held') return;
    final amount = escrow['amount'] as int;
    if (refund) {
      wallet('creator')['available'] = available('creator') + amount;
    } else {
      final owner = 'narrator:${escrow['narrator']}';
      wallet(owner)['holding'] = holding(owner) + amount;
    }
    escrow['status'] = refund ? 'refunded' : 'released';
    event(
      '$id ${refund ? 'hoàn Creator' : 'giải ngân vào số dư chờ giữ của Narrator'} · phí thật chưa cấu hình',
    );
    await save();
  }
}
