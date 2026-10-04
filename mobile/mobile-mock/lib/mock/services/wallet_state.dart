import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../creator_state.dart';
import '../../episode.dart';

String money(int value) =>
    '${value.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}đ';

/// Demo ledger only. Integer VND, explicit funding, no bank or payment service.
class WalletState extends ChangeNotifier {
  WalletState(this.preferences) {
    refresh();
  }
  final SharedPreferences preferences;
  Map<String, dynamic> data = {};
  void refresh() {
    data = jsonDecode(
      preferences.getString('walletDemoV1') ??
          '{"wallets":{},"escrows":{},"events":[]}',
    ) as Map<String, dynamic>;
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
    if (!kyc.isApproved ||
        normalizeSearch(holder.trim()) !=
            normalizeSearch(kyc.fullName.trim()) ||
        !RegExp(r'^\d{6,19}$').hasMatch(account) ||
        bank.trim().isEmpty) {
      throw StateError(
        'Cần KYC đã duyệt, ngân hàng, số tài khoản 6–19 số và tên chủ khớp KYC.',
      );
    }
    if ((wallet(owner)['withdrawals'] as List).any(
      (r) => r['status'] == 'processing',
    )) {
      throw StateError('Có yêu cầu rút đang xử lý; chưa đổi ngân hàng.');
    }
    wallet(owner)['bank'] = {
      'name': bank.trim(),
      'account': account,
      'holder': holder.trim(),
    };
    event('Liên kết ngân hàng mẫu cho $owner');
    await save();
  }

  Future<void> withdraw(String owner, KycProfile kyc, int amount) async {
    refresh();
    final w = wallet(owner), bank = w['bank'] as Map?;
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
    w['available'] = available(owner) - amount;
    (w['withdrawals'] as List).insert(0, {
      'id': 'RUT-${DateTime.now().microsecondsSinceEpoch}',
      'amount': amount,
      'status': 'processing',
      'reason': '',
      'bank': Map.of(bank),
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
