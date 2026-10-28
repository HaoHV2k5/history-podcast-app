import 'package:flutter/material.dart';

import 'core/api/wallet_repository.dart';
import 'creator_state.dart';
import 'design.dart';
import 'episode.dart';
import 'wallet_state.dart';

/// Accept whole VND values, including Vietnamese three-digit grouping.
int? parseWalletAmount(String value) {
  final text = value.trim();
  if (RegExp(r'^\d+$').hasMatch(text)) return int.tryParse(text);
  if (RegExp(r'^\d{1,3}(\.\d{3})+$').hasMatch(text)) {
    return int.tryParse(text.replaceAll('.', ''));
  }
  return null;
}

String maskedBankAccount(Map bank) {
  final account = bank['account']?.toString() ?? '';
  final tail = account.length > 4
      ? account.substring(account.length - 4)
      : account;
  return '${bank['name']} · ••••$tail';
}

class WalletFormDialog extends StatefulWidget {
  const WalletFormDialog({
    super.key,
    required this.ledger,
    required this.owner,
    required this.kyc,
    required this.linkBank,
    this.existingBank,
  });
  final WalletState ledger;
  final String owner;
  final KycProfile kyc;
  final bool linkBank;
  final BankAccountData? existingBank;

  @override
  State<WalletFormDialog> createState() => _WalletFormDialogState();
}

class _WalletFormDialogState extends State<WalletFormDialog> {
  final form = GlobalKey<FormState>();
  late final TextEditingController bank;
  late final TextEditingController account;
  late final TextEditingController holder;
  final amount = TextEditingController();
  bool reviewing = false, busy = false;
  String? error;

  @override
  void initState() {
    super.initState();
    if (widget.existingBank != null) {
      bank = TextEditingController(text: widget.existingBank!.bankName);
      account = TextEditingController(text: widget.existingBank!.accountNumber);
      holder = TextEditingController(text: widget.existingBank!.accountHolderName);
    } else {
      final defaultBank = widget.ledger.isLiveBackend
          ? (widget.kyc.bankName.isNotEmpty ? widget.kyc.bankName : '')
          : 'Ngân hàng mẫu';
      final defaultAccount = widget.kyc.bankAccountNumber.isNotEmpty
          ? widget.kyc.bankAccountNumber
          : '';
      final defaultHolder = widget.kyc.bankAccountHolder.isNotEmpty
          ? widget.kyc.bankAccountHolder
          : widget.kyc.fullName;
      bank = TextEditingController(text: defaultBank);
      account = TextEditingController(text: defaultAccount);
      holder = TextEditingController(text: defaultHolder);
    }
  }

  @override
  void dispose() {
    bank.dispose();
    account.dispose();
    holder.dispose();
    amount.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (busy) return;
    if (!reviewing && !form.currentState!.validate()) return;
    if (!widget.linkBank && !reviewing) {
      FocusScope.of(context).unfocus();
      setState(() => reviewing = true);
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      if (widget.linkBank) {
        if (widget.existingBank != null) {
          await widget.ledger.updateBank(
            id: widget.existingBank!.id,
            owner: widget.owner,
            kyc: widget.kyc,
            bank: bank.text.trim(),
            account: account.text.trim(),
            holder: holder.text.trim(),
          );
        } else {
          await widget.ledger.linkBank(
            widget.owner,
            widget.kyc,
            bank.text.trim(),
            account.text.trim(),
            holder.text.trim(),
          );
        }
      } else {
        await widget.ledger.withdraw(
          widget.owner,
          widget.kyc,
          parseWalletAmount(amount.text)!,
        );
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      widget.ledger.refresh();
      if (mounted) {
        setState(() {
          busy = false;
          error = e is StateError
              ? e.message
              : e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final linked = widget.ledger.wallet(widget.owner)['bank'] as Map?;
    final available = widget.ledger.available(widget.owner);
    return PopScope(
      canPop: !busy,
      child: AlertDialog(
        backgroundColor: Palette.paper,
        surfaceTintColor: Colors.transparent,
        title: Text(
          widget.linkBank
              ? (widget.existingBank != null
                    ? 'Cập nhật tài khoản ngân hàng'
                    : (widget.ledger.isLiveBackend
                          ? 'Liên kết ngân hàng'
                          : 'Liên kết ngân hàng mẫu'))
              : reviewing
              ? 'Kiểm tra yêu cầu'
              : (widget.ledger.isLiveBackend
                    ? 'Yêu cầu rút tiền'
                    : 'Yêu cầu rút mẫu'),
        ),
        content: SingleChildScrollView(
          child: Form(
            key: form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.linkBank) ...[
                  Text(
                    widget.ledger.isLiveBackend
                        ? 'Tên chủ tài khoản cần khớp với họ tên KYC đã xác thực.'
                        : 'Dùng thông tin hư cấu. Tên chủ tài khoản phải khớp tên KYC đã duyệt.',
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    key: const Key('bank-name'),
                    controller: bank,
                    enabled: !busy,
                    decoration: const InputDecoration(
                      labelText: 'Tên ngân hàng',
                      hintText: 'VD: Vietcombank, MB Bank, Techcombank...',
                    ),
                    validator: (v) =>
                        (v ?? '').trim().isEmpty ? 'Nhập tên ngân hàng.' : null,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      'Vietcombank',
                      'MB Bank',
                      'Techcombank',
                      'BIDV',
                      'VPBank',
                      'ACB',
                    ].map((bName) => ActionChip(
                      label: Text(bName, style: const TextStyle(fontSize: 11)),
                      onPressed: busy ? null : () => setState(() => bank.text = bName),
                    )).toList(),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    key: const Key('bank-account'),
                    controller: account,
                    enabled: !busy,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Số tài khoản ngân hàng',
                      hintText: 'VD: 001099008899',
                    ),
                    validator: (v) =>
                        RegExp(r'^\d{6,19}$').hasMatch((v ?? '').trim())
                        ? null
                        : 'Nhập 6–19 chữ số.',
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    key: const Key('bank-holder'),
                    controller: holder,
                    enabled: !busy,
                    decoration: const InputDecoration(
                      labelText: 'Tên chủ tài khoản (In hoa không dấu)',
                      hintText: 'VD: NGUYEN VAN A',
                    ),
                    validator: (v) {
                      final val = (v ?? '').trim();
                      if (val.isEmpty) return 'Nhập tên chủ tài khoản.';
                      if (widget.kyc.fullName.isNotEmpty &&
                          normalizeSearch(val) != normalizeSearch(widget.kyc.fullName.trim())) {
                        return 'Tên phải khớp ${widget.kyc.fullName}.';
                      }
                      return null;
                    },
                  ),
                ] else if (!reviewing) ...[
                  Text('Khả dụng ${money(available)}'),
                  const SizedBox(height: 16),
                  TextFormField(
                    key: const Key('withdraw-amount'),
                    controller: amount,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Số tiền (VND)',
                      hintText: '200.000',
                      helperText: 'Ngưỡng thử: 100.000đ',
                    ),
                    validator: (v) {
                      final n = parseWalletAmount(v ?? '');
                      if (n == null) {
                        return 'Nhập số nguyên, ví dụ 200.000 hoặc 200000.';
                      }
                      return n >= 100000 && n <= available
                          ? null
                          : 'Từ 100.000đ đến ${money(available)}.';
                    },
                  ),
                ] else ...[
                  Text(
                    money(parseWalletAmount(amount.text)!),
                    style: editorial(28),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Ngân hàng nhận',
                    style: TextStyle(color: Palette.muted),
                  ),
                  Text(
                    linked == null
                        ? 'Chưa liên kết'
                        : maskedBankAccount(linked),
                  ),
                  if (linked != null) Text(linked['holder'].toString()),
                  const SizedBox(height: 16),
                  Text(
                    'Còn khả dụng sau yêu cầu: ${money(available - parseWalletAmount(amount.text)!)}',
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Số tiền được giữ khi gửi yêu cầu. Đây là diễn tập, không chuyển khoản thật.',
                    style: TextStyle(color: Palette.muted),
                  ),
                ],
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        error!,
                        style: const TextStyle(color: Palette.red),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: busy
                ? null
                : () {
                    if (reviewing) {
                      setState(() {
                        reviewing = false;
                        error = null;
                      });
                    } else {
                      Navigator.pop(context, false);
                    }
                  },
            child: Text(reviewing ? 'Sửa số tiền' : 'Hủy'),
          ),
          FilledButton(
            key: const Key('wallet-form-submit'),
            onPressed: busy ? null : submit,
            child: Text(
              busy
                  ? 'Đang lưu…'
                  : widget.linkBank
                  ? (widget.ledger.isLiveBackend ? 'Liên kết' : 'Liên kết mẫu')
                  : reviewing
                  ? (widget.ledger.isLiveBackend
                        ? 'Xác nhận rút tiền'
                        : 'Xác nhận yêu cầu mẫu')
                  : 'Kiểm tra yêu cầu',
            ),
          ),
        ],
      ),
    );
  }
}
