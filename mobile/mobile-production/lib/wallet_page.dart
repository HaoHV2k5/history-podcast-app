import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'components.dart';
import 'contract_chat_sheet.dart';
import 'core/api/contract_repository.dart';
import 'core/api/kyc_repository.dart';
import 'core/api/wallet_repository.dart';
import 'core/api/withdrawal_repository.dart';
import 'creator_state.dart';
import 'design.dart';
import 'narrator_profile.dart';
import 'wallet_state.dart';
import 'wallet_forms.dart';

class WalletPage extends StatefulWidget {
  const WalletPage({
    super.key,
    required this.preferences,
    this.walletRepository,
    this.withdrawalRepository,
    this.contractRepository,
    this.kycRepository,
  });
  final SharedPreferences preferences;
  final WalletRepository? walletRepository;
  final WithdrawalRepository? withdrawalRepository;
  final ContractRepository? contractRepository;
  final KycRepository? kycRepository;
  @override
  State<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends State<WalletPage> {
  late final ledger = WalletState(
    widget.preferences,
    walletRepository: widget.walletRepository,
    withdrawalRepository: widget.withdrawalRepository,
    contractRepository: widget.contractRepository,
  );
  late final creator = CreatorState(
    widget.preferences,
    kycRepository: widget.kycRepository,
  );
  late final narrator = NarratorProfileState(
    widget.preferences,
    kycRepository: widget.kycRepository,
  );
  bool isNarrator = false, busy = false;
  String? error;
  String get owner => isNarrator ? 'narrator:${narrator.id}' : 'creator';
  KycProfile get kyc => isNarrator ? narrator.verification.kyc : creator.kyc;

  @override
  void initState() {
    super.initState();
    if (ledger.isLiveBackend) {
      ledger.syncWalletBackend(owner);
    }
    if (widget.kycRepository != null) {
      creator.initStudioBackend();
      narrator.syncFromBackend();
    }
  }
  @override
  void dispose() {
    ledger.dispose();
    creator.dispose();
    narrator.dispose();
    super.dispose();
  }

  Future<void> run(Future<void> Function() action) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await action();
    } on StateError catch (e) {
      error = e.message;
    } catch (_) {
      error = 'Chưa lưu được thay đổi. Hãy thử lại.';
    }
    if (error != null) ledger.refresh();
    if (mounted) setState(() => busy = false);
  }

  Future<void> bankForm() => openForm(linkBank: true);
  Future<void> withdrawForm() => openForm(linkBank: false);

  Future<void> openTopUpSheet() async {
    if (busy) return;
    final toppedUp = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Palette.paper,
      builder: (_) => TopUpWalletSheet(ledger: ledger, owner: owner),
    );
    if (toppedUp == true && mounted) {
      setState(() {
        ledger.refresh();
        error = null;
      });
    }
  }

  Future<void> openForm({required bool linkBank}) async {
    if (busy) return;
    await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => WalletFormDialog(
        ledger: ledger,
        owner: owner,
        kyc: kyc,
        linkBank: linkBank,
      ),
    );
    if (mounted) {
      setState(() {
        ledger.refresh();
        error = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([ledger, creator, narrator]),
    builder: (context, _) {
      final w = ledger.wallet(owner), bank = w['bank'] as Map?;
      final rows = w['withdrawals'] as List;
      final pending = rows.any((r) => r['status'] == 'processing');
      final escrows = ledger.escrows.entries
          .where((e) => !isNarrator || e.value['narrator'] == narrator.id)
          .toList();
      return Scaffold(
      appBar: AppBar(title: const Text('Ví & rút tiền')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        children: [
          Eyebrow(
            ledger.isLiveBackend
                ? 'SỔ THU CHI & KÝ QUỸ'
                : 'SỔ THU CHI / BẢN THỬ',
          ),
          const SizedBox(height: 12),
          Text('Số dư của bạn', style: editorial(27)),
          const SizedBox(height: 20),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('Creator'),
                selected: !isNarrator,
                onSelected: busy
                    ? null
                    : (_) {
                        setState(() {
                          isNarrator = false;
                          error = null;
                          ledger.refresh();
                        });
                        if (ledger.isLiveBackend) {
                          ledger.syncWalletBackend(owner);
                        }
                      },
              ),
              ChoiceChip(
                label: const Text('Narrator'),
                selected: isNarrator,
                onSelected: busy
                    ? null
                    : (_) {
                        setState(() {
                          isNarrator = true;
                          error = null;
                          ledger.refresh();
                        });
                        if (ledger.isLiveBackend) {
                          ledger.syncWalletBackend(owner);
                        }
                      },
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Khả dụng', style: TextStyle(color: Palette.muted)),
          Text(
            money(ledger.available(owner)),
            style: editorial(36).copyWith(
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Chờ hết kỳ giữ: ${money(ledger.holding(owner))}',
            style: const TextStyle(
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Đang rút: ${money(rows.where((r) => r['status'] == 'processing').fold<int>(0, (sum, r) => sum + (r['amount'] as int)))}',
            style: const TextStyle(
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            key: const Key('open-topup-sheet-btn'),
            onPressed: busy ? null : openTopUpSheet,
            icon: const Icon(CupertinoIcons.plus_circle, size: 17),
            label: const Text('Nạp tiền vào ví'),
          ),
          const SizedBox(height: 20),
          const Divider(),
          Text(
            kyc.isApproved ? 'KYC đã duyệt · ${kyc.fullName}' : 'Cần hoàn thành KYC trong Studio / Không gian người đọc trước khi rút.',
            style: const TextStyle(height: 1.7),
          ),
          const SizedBox(height: 16),
          Text(
            bank == null
                ? 'Chưa liên kết ngân hàng'
                : '${maskedBankAccount(bank)}\n${bank['holder']}',
          ),
          OutlinedButton.icon(
            key: const Key('link-bank'),
            onPressed: busy || !kyc.isApproved || pending ? null : bankForm,
            icon: const Icon(CupertinoIcons.building_2_fill, size: 18),
            label: Text(
              ledger.isLiveBackend
                  ? (bank == null ? 'Liên kết ngân hàng' : 'Đổi ngân hàng')
                  : (bank == null
                        ? 'Liên kết ngân hàng mẫu'
                        : 'Đổi ngân hàng mẫu'),
            ),
          ),
          FilledButton(
            key: const Key('withdraw-button'),
            onPressed:
                busy ||
                    !kyc.isApproved ||
                    bank == null ||
                    pending ||
                    ledger.available(owner) < 100000
                ? null
                : withdrawForm,
            child: Text(
              ledger.isLiveBackend ? 'Yêu cầu rút tiền' : 'Yêu cầu rút mẫu',
            ),
          ),
          if (pending)
            const Padding(
              padding: EdgeInsets.only(top: 12),
              child: Text(
                'Có yêu cầu đang xử lý. Xem lịch sử bên dưới; bạn có thể rút tiếp hoặc đổi ngân hàng sau khi có kết quả.',
                style: TextStyle(color: Palette.muted),
              ),
            ),
          if (!pending &&
              kyc.isApproved &&
              bank != null &&
              ledger.available(owner) < 100000)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                ledger.isLiveBackend
                    ? 'Chưa đủ số dư khả dụng để rút (Tối thiểu 100.000đ).'
                    : 'Chưa đủ số dư khả dụng để rút. Ngưỡng trong bản thử là 100.000đ.',
                style: const TextStyle(color: Palette.muted),
              ),
            ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Semantics(
                liveRegion: true,
                child: Text(error!, style: const TextStyle(color: Palette.red)),
              ),
            ),
          const SizedBox(height: 24),
          ExpansionTile(
            key: ValueKey('$owner-withdrawals-$pending'),
            tilePadding: EdgeInsets.zero,
            initiallyExpanded: pending,
            title: const Text('Lịch sử rút tiền'),
            subtitle: Text(
              '${rows.length} yêu cầu${pending ? ' · Có khoản đang xử lý' : ''}',
            ),
            children: [
              if (rows.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Text(
                    ledger.isLiveBackend
                        ? 'Chưa có yêu cầu rút tiền nào.'
                        : 'Chưa có yêu cầu. Tiền trong bản thử là dữ liệu hư cấu.',
                    style: const TextStyle(color: Palette.muted),
                  ),
                ),
              for (final r in rows) ...[
                const Divider(),
                Text(
                  '${money(r['amount'] as int)} · ${switch (r['status']) {
                    'processing' => 'Đang xử lý',
                    'completed' => ledger.isLiveBackend ? 'Đã hoàn tất' : 'Hoàn tất mẫu',
                    _ => 'Thất bại · Đã hoàn số dư',
                  }}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  '${r['id']}\n${r['reason']}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Palette.muted,
                    height: 1.7,
                  ),
                ),
                if (r['status'] == 'processing' && !ledger.isLiveBackend)
                  ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    title: const Text('Thử kết quả chuyển khoản'),
                    children: [
                      OutlinedButton(
                        onPressed: busy
                            ? null
                            : () => run(
                                () => ledger.resolveWithdrawal(
                                  owner,
                                  r['id'] as String,
                                  true,
                                ),
                              ),
                        child: const Text('Thử chuyển khoản thành công'),
                      ),
                      TextButton(
                        onPressed: busy
                            ? null
                            : () => run(
                                () => ledger.resolveWithdrawal(
                                  owner,
                                  r['id'] as String,
                                  false,
                                  reason:
                                      'Ngân hàng mẫu tạm thời không phản hồi.',
                                ),
                              ),
                        child: const Text('Thử lỗi và hoàn số dư'),
                      ),
                    ],
                  ),
                if (r['status'] == 'failed')
                  TextButton(
                    onPressed: busy ? null : withdrawForm,
                    child: const Text('Tạo yêu cầu thử lại'),
                  ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          ExpansionTile(
            key: ValueKey('$owner-escrows'),
            tilePadding: EdgeInsets.zero,
            title: const Text('Ký quỹ hợp tác'),
            subtitle: Text(
              ledger.isLiveBackend
                  ? '${escrows.length} khoản ký quỹ'
                  : '${escrows.length} khoản trong sổ thử',
            ),
            children: [
              if (escrows.isEmpty)
                Text(
                  ledger.isLiveBackend
                      ? 'Chưa có khoản ký quỹ đang giữ.'
                      : 'Chưa có ký quỹ. Sau xác nhận hai bên, số dư mẫu Creator mới được khóa.',
                ),
              for (final e in escrows)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text('${e.key} · ${money(e.value['amount'] as int)}'),
                  subtitle: Text(switch (e.value['status']) {
                    'held' => 'Đang giữ',
                    'released' =>
                      ledger.isLiveBackend
                          ? 'Đã giải ngân vào ví Narrator'
                          : 'Đã giải ngân mẫu vào ví Narrator',
                    _ => 'Đã hoàn Creator',
                  }),
                ),
            ],
          ),
          if (!ledger.isLiveBackend)
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: const Text('Điều khiển số dư thử'),
              children: [
                OutlinedButton(
                  onPressed: busy ? null : () => run(ledger.seed),
                  child: const Text('Nạp số dư hư cấu (một lần)'),
                ),
                OutlinedButton(
                  onPressed: busy
                      ? null
                      : () => run(() => ledger.releaseHolding(owner)),
                  child: const Text('Giả lập hết kỳ giữ tiền'),
                ),
              ],
            ),
          ExpansionTile(
            tilePadding: EdgeInsets.zero,
            title: const Text('Nhật ký sổ ví'),
            children: [
              for (final tx in ledger.remoteTransactions)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      '${tx.type} · ${money(tx.amount.round())} · ${tx.description ?? tx.status}',
                      style: const TextStyle(
                        fontSize: 12,
                        height: 1.7,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                  ),
                ),
              for (final e in ledger.events)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    e as String,
                    style: const TextStyle(fontSize: 12, height: 1.7),
                  ),
                ),
            ],
          ),
          if (!ledger.isLiveBackend) ...[
            const SizedBox(height: 16),
            const Text(
              'Không có tiền thật. Ngưỡng thử 100.000đ, thời gian giữ và phí là cấu hình diễn tập; chính sách thực tế chưa chốt. Không lưu thông tin ngân hàng thật.',
              style: TextStyle(color: Palette.muted, fontSize: 12, height: 1.7),
            ),
          ],
        ],
      ),
      );
    },
  );
}
