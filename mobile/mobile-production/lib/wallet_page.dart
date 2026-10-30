import 'dart:ui' as ui;

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
    kycRepository: widget.kycRepository,
  );
  late final creator = CreatorState(
    widget.preferences,
    kycRepository: widget.kycRepository,
  );
  late final narrator = NarratorProfileState(
    widget.preferences,
    kycRepository: widget.kycRepository,
  );

  bool isNarrator = false;
  bool busy = false;
  bool isRefreshing = false;
  String? error;

  // Active sub-tab: 0 = Biến động số dư, 1 = Lịch sử rút tiền, 2 = Tài khoản ngân hàng
  int activeSubTab = 0;

  String get owner => isNarrator ? 'narrator:${narrator.id}' : 'creator';
  KycProfile get kyc => isNarrator ? narrator.verification.kyc : creator.kyc;

  @override
  void initState() {
    super.initState();
    _refreshAll();
  }

  Future<void> _refreshAll() async {
    setState(() => isRefreshing = true);
    try {
      if (widget.kycRepository != null) {
        await creator.initStudioBackend();
        await narrator.syncFromBackend();
      }
      if (ledger.isLiveBackend) {
        await ledger.syncWalletBackend(owner);
      }
    } catch (_) {}
    if (mounted) {
      setState(() => isRefreshing = false);
    }
  }

  @override
  void dispose() {
    ledger.dispose();
    creator.dispose();
    narrator.dispose();
    super.dispose();
  }

  Future<void> bankForm([BankAccountData? existing]) => openForm(linkBank: true, existingBank: existing);
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

  Future<void> openForm({required bool linkBank, BankAccountData? existingBank}) async {
    if (busy) return;
    await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => WalletFormDialog(
        ledger: ledger,
        owner: owner,
        kyc: kyc,
        linkBank: linkBank,
        existingBank: existingBank,
      ),
    );
    if (mounted) {
      await _refreshAll();
    }
  }

  Future<void> _deleteBank(int bankId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Palette.paper,
        title: const Text('Xác nhận xóa tài khoản'),
        content: const Text('Bạn có chắc chắn muốn hủy liên kết tài khoản ngân hàng này không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Palette.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
    if (confirmed == true && widget.walletRepository != null) {
      try {
        await widget.walletRepository!.deleteBankAccount(bankId);
        ledger.remoteBanks.removeWhere((b) => b.id == bankId);
        await _refreshAll();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Chưa xóa được tài khoản: $e')),
          );
        }
      }
    }
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    try {
      final dt = DateTime.parse(raw).toLocal();
      final dd = dt.day.toString().padLeft(2, '0');
      final mm = dt.month.toString().padLeft(2, '0');
      final yyyy = dt.year;
      final hh = dt.hour.toString().padLeft(2, '0');
      final min = dt.minute.toString().padLeft(2, '0');
      return '$dd/$mm/$yyyy $hh:$min';
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([ledger, creator, narrator]),
    builder: (context, _) {
      final w = ledger.wallet(owner);
      final bank = w['bank'] as Map?;
      final rows = w['withdrawals'] as List;
      final pending = rows.any((r) => r['status'] == 'processing');
      final availableBal = ledger.available(owner);
      final holdingBal = ledger.holding(owner);

      // Danh sách thực tế
      final transactions = ledger.remoteTransactions;
      final withdrawals = ledger.remoteWithdrawals;
      final bankAccounts = ledger.remoteBanks;
      final bankCount = bankAccounts.isNotEmpty ? bankAccounts.length : (bank != null ? 1 : 0);

      return Scaffold(
        backgroundColor: Palette.paper,
        appBar: AppBar(
          title: const Text('Ví & Quản Lý Thu Nhập'),
          backgroundColor: Palette.paper,
          scrolledUnderElevation: 1,
          actions: [
            IconButton(
              tooltip: 'Làm mới số dư',
              onPressed: isRefreshing ? null : _refreshAll,
              icon: isRefreshing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Palette.red),
                    )
                  : const Icon(CupertinoIcons.arrow_2_circlepath, size: 20),
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
          children: [
              // 1. Header Tiêu đề & Badge (Sử dụng Wrap để co giãn màn hình hẹp không bao giờ tràn)
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 4,
                children: [
                  Text('Ví & Quản Lý Thu Nhập', style: editorial(22)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Palette.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Palette.red.withValues(alpha: 0.25)),
                    ),
                    child: const Text(
                      'Creator Wallet',
                      style: TextStyle(
                        fontSize: 10.5,
                        color: Palette.red,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Theo dõi doanh thu gói hội viên, số dư ví khả dụng, lịch sử giao dịch và yêu cầu rút tiền.',
                style: TextStyle(fontSize: 12.5, color: Palette.muted, height: 1.4),
              ),

              const SizedBox(height: 18),

              // 2. HỆ THỐNG 3 THẺ CHỈ SỐ (STATS CARDS)
              // THẺ 1: Số dư khả dụng
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Palette.paper,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Palette.red.withValues(alpha: 0.35)),
                  boxShadow: [
                    BoxShadow(
                      color: Palette.red.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Số dư khả dụng',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Palette.ink,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Palette.red.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(CupertinoIcons.creditcard_fill, size: 18, color: Palette.red),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      money(availableBal),
                      style: editorial(32).copyWith(
                        color: Palette.ink,
                        fontWeight: FontWeight.bold,
                        fontFeatures: const [ui.FontFeature.tabularFigures()],
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Tiền sẵn sàng để rút về tài khoản ngân hàng',
                      style: TextStyle(fontSize: 11.5, color: Palette.muted),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            key: const Key('withdraw-button'),
                            style: FilledButton.styleFrom(
                              backgroundColor: Palette.red,
                              padding: const EdgeInsets.symmetric(vertical: 11),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: (busy || !kyc.isApproved || bank == null || pending || availableBal < 100000)
                                ? null
                                : withdrawForm,
                            icon: const Icon(CupertinoIcons.arrow_up_right, size: 15),
                            label: const Text('Rút tiền', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            key: const Key('open-topup-sheet-btn'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 11),
                              side: const BorderSide(color: Palette.line),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: busy ? null : openTopUpSheet,
                            icon: const Icon(CupertinoIcons.arrow_down_left, size: 15, color: Palette.ink),
                            label: const Text(
                              'Nạp tiền (VNPay)',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Palette.ink),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // THẺ 2 & 3: Xếp 2 cột cân xứng chiều cao
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // THẺ 2: Số dư đang chờ duyệt rút
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Palette.paper,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Expanded(
                                  child: Text(
                                    'Chờ duyệt rút',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Palette.ink),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: Colors.amber.withValues(alpha: 0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(CupertinoIcons.time, size: 15, color: Colors.amber[800]),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              money(holdingBal),
                              style: editorial(22).copyWith(
                                fontWeight: FontWeight.bold,
                                fontFeatures: const [ui.FontFeature.tabularFigures()],
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Trong hàng đợi đối soát',
                              style: TextStyle(fontSize: 11, color: Palette.muted),
                            ),
                            const Spacer(),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Icon(CupertinoIcons.checkmark_shield_fill, size: 13, color: Colors.green[700]),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    'Ký quỹ & đối soát Sử Ký',
                                    style: TextStyle(fontSize: 10.5, color: Colors.green[800], fontWeight: FontWeight.w500),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // THẺ 3: Tài khoản ngân hàng
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Palette.paper,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Palette.line),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Expanded(
                                  child: Text(
                                    'Tài khoản NH',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Palette.ink),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: const BoxDecoration(
                                    color: Palette.soft,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(CupertinoIcons.building_2_fill, size: 15, color: Palette.ink),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '$bankCount tài khoản',
                              style: editorial(22).copyWith(
                                fontWeight: FontWeight.bold,
                                fontFeatures: const [ui.FontFeature.tabularFigures()],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              bankCount == 0 ? 'Chưa liên kết ngân hàng' : 'Đã xác thực chính chủ',
                              style: const TextStyle(fontSize: 11, color: Palette.muted),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const Spacer(),
                            const SizedBox(height: 10),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                key: const Key('link-bank'),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                                  side: const BorderSide(color: Palette.line),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                onPressed: (busy || !kyc.isApproved || pending) ? null : bankForm,
                                icon: const Icon(CupertinoIcons.plus_circle, size: 13, color: Palette.ink),
                                label: Text(
                                  bankCount == 0 ? 'Thêm mới' : 'Đổi ngân hàng',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Palette.ink),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // 3. THANH 3 TABS ĐIỀU HƯỚNG NỘI DUNG (GIỐNG HỆT WEB)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _subTabItem(
                      index: 0,
                      title: 'Lịch sử biến động số dư',
                      count: transactions.length,
                    ),
                    const SizedBox(width: 8),
                    _subTabItem(
                      index: 1,
                      title: 'Lịch sử rút tiền',
                      count: withdrawals.isNotEmpty ? withdrawals.length : rows.length,
                    ),
                    const SizedBox(width: 8),
                    _subTabItem(
                      index: 2,
                      title: 'Tài khoản ngân hàng liên kết',
                      count: bankCount,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 4. NỘI DUNG CHI TIẾT THEO TAB ĐANG CHỌN
              if (activeSubTab == 0) ...[
                // TAB 0: LỊCH SỬ BIẾN ĐỘNG SỐ DƯ
                if (transactions.isEmpty && ledger.events.isEmpty)
                  _emptyState(
                    icon: CupertinoIcons.creditcard,
                    title: 'Chưa có biến động số dư nào.',
                    description: 'Các giao dịch nạp tiền, nhận tiền hội viên và ký quỹ sẽ xuất hiện tại đây.',
                  )
                else if (transactions.isNotEmpty) ...[
                  for (final tx in transactions)
                    _transactionCard(tx),
                ] else ...[
                  for (final ev in ledger.events)
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Palette.paper,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Palette.line),
                      ),
                      child: Text(
                        ev as String,
                        style: const TextStyle(fontSize: 12.5, height: 1.4),
                      ),
                    ),
                ],
              ] else if (activeSubTab == 1) ...[
                // TAB 1: LỊCH SỬ RÚT TIỀN
                if (withdrawals.isEmpty && rows.isEmpty)
                  _emptyState(
                    icon: CupertinoIcons.clock,
                    title: 'Chưa có yêu cầu rút tiền nào.',
                    description: 'Khi bạn tạo yêu cầu rút tiền, tiến trình duyệt đối soát sẽ hiển thị tại đây.',
                  )
                else ...[
                  if (withdrawals.isNotEmpty)
                    for (final wItem in withdrawals)
                      _withdrawalItemCard(wItem)
                  else
                    for (final r in rows)
                      _legacyWithdrawalCard(r as Map, pending: pending),
                ],
              ] else ...[
                // TAB 2: TÀI KHOẢN NGÂN HÀNG LIÊN KẾT
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Tài khoản đã liên kết (${bankCount})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    TextButton.icon(
                      onPressed: busy ? null : bankForm,
                      icon: const Icon(CupertinoIcons.plus_circle, size: 16, color: Palette.red),
                      label: const Text('Thêm tài khoản', style: TextStyle(fontSize: 13, color: Palette.red, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (bankAccounts.isEmpty && bank == null)
                  _emptyState(
                    icon: CupertinoIcons.building_2_fill,
                    title: 'Bạn chưa liên kết tài khoản ngân hàng nào.',
                    description: 'Nhập thông tin tài khoản ngân hàng chính chủ để thực hiện rút tiền an toàn.',
                    actionLabel: '+ Thêm tài khoản ngân hàng',
                    onAction: bankForm,
                  )
                else ...[
                  if (bankAccounts.isNotEmpty)
                    for (final b in bankAccounts)
                      _bankAccountCard(b)
                  else if (bank != null)
                    _legacyBankCard(bank),
                ],
              ],
            ],
          ),
        );
      },
    );

  Widget _subTabItem({required int index, required String title, required int count}) {
    final isSelected = activeSubTab == index;
    return InkWell(
      onTap: () => setState(() => activeSubTab = index),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Palette.red : Palette.paper,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? Palette.red : Palette.line),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? Colors.white : Palette.ink,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withValues(alpha: 0.25) : Palette.soft,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : Palette.muted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _emptyState({
    required IconData icon,
    required String title,
    required String description,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Palette.line),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 44, color: Palette.muted.withValues(alpha: 0.5)),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Palette.ink),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: const TextStyle(fontSize: 12, color: Palette.muted, height: 1.4),
            textAlign: TextAlign.center,
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 16),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: Palette.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: onAction,
              icon: const Icon(CupertinoIcons.plus, size: 15),
              label: Text(actionLabel, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _transactionCard(WalletTransactionModel tx) {
    final isPositive = tx.type == 'DEPOSIT' || tx.type == 'MEMBERSHIP_FEE' || tx.type == 'REFUND';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isPositive ? Colors.green.withValues(alpha: 0.12) : Palette.red.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPositive ? CupertinoIcons.arrow_down_left : CupertinoIcons.arrow_up_right,
              size: 16,
              color: isPositive ? Colors.green[700] : Palette.red,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.description ?? _translateTxType(tx.type),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Palette.ink),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(tx.createdAt),
                  style: const TextStyle(fontSize: 11, color: Palette.muted),
                ),
                if (tx.merchantTxnRef != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Mã: ${tx.merchantTxnRef}',
                    style: const TextStyle(fontSize: 10.5, color: Palette.muted),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isPositive ? '+' : '-'}${money(tx.amount.round())}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isPositive ? Colors.green[700] : Palette.red,
                  fontFeatures: const [ui.FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(height: 4),
              _statusBadge(tx.status),
            ],
          ),
        ],
      ),
    );
  }

  Widget _withdrawalItemCard(WithdrawalModel w) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(CupertinoIcons.arrow_up_right, size: 16, color: Colors.amber[800]),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  money(w.amount.round()),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Palette.ink,
                    fontFeatures: [ui.FontFeature.tabularFigures()],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${w.bankName ?? 'Ngân hàng'} · **** ${w.accountNumber?.length != null && w.accountNumber!.length > 4 ? w.accountNumber!.substring(w.accountNumber!.length - 4) : (w.accountNumber ?? '')}',
                  style: const TextStyle(fontSize: 12, color: Palette.ink),
                ),
                if (w.accountHolderName != null)
                  Text(w.accountHolderName!, style: const TextStyle(fontSize: 11, color: Palette.muted)),
                const SizedBox(height: 2),
                Text(_formatDate(w.requestedAt), style: const TextStyle(fontSize: 10.5, color: Palette.muted)),
              ],
            ),
          ),
          _statusBadge(w.status),
        ],
      ),
    );
  }

  Widget _legacyWithdrawalCard(Map r, {required bool pending}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                money(r['amount'] as int),
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              _statusBadge(r['status'] as String),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            r['id'].toString(),
            style: const TextStyle(fontSize: 11, color: Palette.muted),
          ),
        ],
      ),
    );
  }

  Widget _bankAccountCard(BankAccountData b) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(CupertinoIcons.building_2_fill, size: 22, color: Palette.ink),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(b.bankName, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                const SizedBox(height: 3),
                Text(
                  '•••• •••• •••• ${b.accountNumber.length > 4 ? b.accountNumber.substring(b.accountNumber.length - 4) : b.accountNumber}',
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, letterSpacing: 0.5),
                ),
                const SizedBox(height: 2),
                Text(
                  b.accountHolderName.toUpperCase(),
                  style: const TextStyle(fontSize: 11, color: Palette.muted, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Sửa thông tin',
            icon: const Icon(CupertinoIcons.pencil, size: 18, color: Palette.ink),
            onPressed: () => bankForm(b),
          ),
          IconButton(
            tooltip: 'Hủy liên kết',
            icon: const Icon(CupertinoIcons.trash, size: 18, color: Palette.muted),
            onPressed: () => _deleteBank(b.id),
          ),
        ],
      ),
    );
  }

  Widget _legacyBankCard(Map b) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Palette.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.line),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Palette.soft,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(CupertinoIcons.building_2_fill, size: 22, color: Palette.ink),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(b['name']?.toString() ?? 'Ngân hàng', style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                const SizedBox(height: 3),
                Text(
                  '•••• •••• •••• ${b['account'] != null && b['account'].toString().length > 4 ? b['account'].toString().substring(b['account'].toString().length - 4) : (b['account'] ?? '')}',
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, letterSpacing: 0.5),
                ),
                const SizedBox(height: 2),
                Text(
                  (b['holder'] ?? '').toString().toUpperCase(),
                  style: const TextStyle(fontSize: 11, color: Palette.muted, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: bankForm,
            child: const Text('Đổi', style: TextStyle(color: Palette.red, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    final s = status.toUpperCase();
    Color bg;
    Color fg;
    String label;

    switch (s) {
      case 'SUCCESS':
      case 'COMPLETED':
        bg = Colors.green.withValues(alpha: 0.12);
        fg = Colors.green[800]!;
        label = 'Thành công';
        break;
      case 'PROCESSING':
      case 'PENDING':
        bg = Colors.amber.withValues(alpha: 0.15);
        fg = Colors.amber[900]!;
        label = 'Chờ xử lý';
        break;
      case 'FAILED':
      case 'REJECTED':
        bg = Palette.red.withValues(alpha: 0.12);
        fg = Palette.red;
        label = 'Thất bại';
        break;
      default:
        bg = Palette.soft;
        fg = Palette.muted;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }

  String _translateTxType(String type) {
    switch (type.toUpperCase()) {
      case 'DEPOSIT':
        return 'Nạp tiền ví (VNPay)';
      case 'WITHDRAWAL':
        return 'Yêu cầu rút tiền';
      case 'MEMBERSHIP_FEE':
        return 'Thu nhập Hội viên kênh';
      case 'ESCROW_HOLD':
        return 'Ký quỹ hợp đồng thu âm';
      case 'ESCROW_RELEASE':
        return 'Giải ngân tiền ký quỹ';
      case 'REFUND':
        return 'Hoàn tiền ví';
      default:
        return type;
    }
  }
}
