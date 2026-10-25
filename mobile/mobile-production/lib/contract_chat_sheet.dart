import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'components.dart';
import 'design.dart';
import 'narrator_state.dart';
import 'wallet_forms.dart';
import 'wallet_state.dart';

/// Editorial Contract Chat Bottom Sheet between Creator and Narrator
/// Connects to `POST /api/v1/chats/conversation` via `NarratorState.openContractChat`.
class ContractChatSheet extends StatefulWidget {
  const ContractChatSheet({
    super.key,
    required this.contracts,
    required this.order,
    required this.senderName,
    required this.senderRole,
  });

  final NarratorState contracts;
  final ContractOrder order;
  final String senderName;
  final String senderRole; // 'CREATOR' | 'NARRATOR'

  @override
  State<ContractChatSheet> createState() => _ContractChatSheetState();
}

class _ContractChatSheetState extends State<ContractChatSheet> {
  final _msgCtrl = TextEditingController();
  bool _loading = true;
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initConversation();
  }

  Future<void> _initConversation() async {
    try {
      await widget.contracts.openContractChat(widget.order.id);
    } catch (_) {}
    if (mounted) {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await widget.contracts.sendContractChatMessage(
        widget.order.id,
        senderName: widget.senderName,
        senderRole: widget.senderRole,
        text: text,
      );
      _msgCtrl.clear();
    } on StateError catch (e) {
      _error = e.message;
    } catch (_) {
      _error = 'Chưa gửi được tin nhắn. Vui lòng thử lại.';
    }
    if (mounted) {
      setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.contracts,
      builder: (context, _) {
        final conv = widget.contracts.activeConversations[widget.order.id];
        final messages = widget.contracts.messagesForOrder(widget.order.id);
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              24,
              12,
              24,
              MediaQuery.viewInsetsOf(context).bottom + 20,
            ),
            child: SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.68,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Eyebrow('PHÒNG TRAO ĐỔI HỢP ĐỒNG'),
                      ),
                      IconButton(
                        tooltip: 'Đóng phòng chat',
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(CupertinoIcons.xmark, size: 18),
                      ),
                    ],
                  ),
                  Text(widget.order.draftTitle, style: editorial(22)),
                  const SizedBox(height: 6),
                  Text(
                    '${widget.order.narratorName} · ${widget.order.channelName}'
                    '${conv != null ? ' · Mã phòng: ${conv.conversationId}' : ''}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Palette.muted,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Divider(height: 1),
                  Expanded(
                    child: _loading
                        ? const Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : messages.isEmpty
                            ? const Center(
                                child: Text(
                                  'Chưa có trao đổi nào. Hãy gửi lời nhắn đầu tiên về cách nhấn nhá hoặc nhịp đọc.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Palette.muted,
                                    fontSize: 13,
                                    height: 1.6,
                                  ),
                                ),
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                itemCount: messages.length,
                                separatorBuilder: (_, _) =>
                                    const SizedBox(height: 12),
                                itemBuilder: (context, index) {
                                  final m = messages[index];
                                  final isMe =
                                      m.senderRole == widget.senderRole;
                                  return Align(
                                    alignment: isMe
                                        ? Alignment.centerRight
                                        : Alignment.centerLeft,
                                    child: Container(
                                      constraints: const BoxConstraints(
                                        maxWidth: 300,
                                      ),
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        color: isMe
                                            ? Palette.soft
                                            : Palette.paper,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: isMe
                                              ? Palette.ink
                                              : Palette.line,
                                        ),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                m.senderRole == 'CREATOR'
                                                    ? 'NGƯỜI KỂ'
                                                    : 'NGƯỜI ĐỌC',
                                                style: const TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w700,
                                                  letterSpacing: 1.1,
                                                  color: Palette.red,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Flexible(
                                                child: Text(
                                                  m.senderName,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                m.timestamp,
                                                style: const TextStyle(
                                                  fontSize: 10,
                                                  color: Palette.muted,
                                                  fontFeatures: [
                                                    FontFeature
                                                        .tabularFigures(),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            m.text,
                                            style: const TextStyle(
                                              fontSize: 13,
                                              height: 1.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                  ),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        _error!,
                        style: const TextStyle(
                          color: Palette.red,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          key: const Key('contract-chat-input'),
                          controller: _msgCtrl,
                          enabled: !_sending,
                          decoration: const InputDecoration(
                            hintText:
                                'Trao đổi kịch bản, nhịp đọc hoặc bản thu…',
                            isDense: true,
                          ),
                          onSubmitted: (_) => _sendMessage(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      FilledButton.icon(
                        key: const Key('contract-chat-send-btn'),
                        onPressed: _sending ? null : _sendMessage,
                        icon: const Icon(CupertinoIcons.paperplane, size: 15),
                        label: const Text('Gửi'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Editorial Wallet Top-up Sheet (`POST /api/v1/wallets/me/deposits`)
class TopUpWalletSheet extends StatefulWidget {
  const TopUpWalletSheet({
    super.key,
    required this.ledger,
    required this.owner,
  });

  final WalletState ledger;
  final String owner;

  @override
  State<TopUpWalletSheet> createState() => _TopUpWalletSheetState();
}

class _TopUpWalletSheetState extends State<TopUpWalletSheet> {
  final _amountCtrl = TextEditingController(text: '500.000');
  int _selectedPreset = 500000;
  bool _busy = false;
  String? _error;

  static const _presets = [200000, 500000, 1000000, 2000000];

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    final parsed = parseWalletAmount(_amountCtrl.text);
    if (parsed == null || parsed < 50000) {
      setState(() => _error = 'Nhập số tiền nạp hợp lệ từ 50.000đ trở lên.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.ledger.topUpWallet(widget.owner, parsed);
      if (mounted) {
        Navigator.pop(context, true);
      }
    } on StateError catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.message;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = 'Chưa thực hiện được giao dịch nạp tiền. Hãy thử lại.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          24,
          16,
          24,
          MediaQuery.viewInsetsOf(context).bottom + 28,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Eyebrow('NẠP SỐ DƯ VÍ / CỔNG THANH TOÁN'),
            const SizedBox(height: 8),
            Text('Nạp tiền vào ví', style: editorial(24)),
            const SizedBox(height: 8),
            const Text(
              'Nạp tiền vào ví để ký quỹ hợp đồng thu âm (Milestone Escrow) hoặc đăng ký gói Hội viên kênh.',
              style: TextStyle(color: Palette.muted, fontSize: 13, height: 1.6),
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final p in _presets)
                  ChoiceChip(
                    key: Key('topup-preset-$p'),
                    label: Text(
                      money(p),
                      style: const TextStyle(
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                    selected: _selectedPreset == p,
                    showCheckmark: false,
                    onSelected: _busy
                        ? null
                        : (_) => setState(() {
                              _selectedPreset = p;
                              _amountCtrl.text = money(p).replaceAll('đ', '');
                              _error = null;
                            }),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              key: const Key('topup-amount-input'),
              controller: _amountCtrl,
              enabled: !_busy,
              keyboardType: TextInputType.number,
              style: const TextStyle(
                fontFeatures: [FontFeature.tabularFigures()],
              ),
              decoration: const InputDecoration(
                labelText: 'Số tiền nạp (VND)',
                hintText: '500.000',
                helperText: 'Tối thiểu 50.000đ · Hỗ trợ cổng VNPay Sandbox',
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Palette.red, fontSize: 12),
                ),
              ),
            const SizedBox(height: 20),
            FilledButton.icon(
              key: const Key('confirm-topup-btn'),
              onPressed: _busy ? null : _submit,
              icon: const Icon(CupertinoIcons.creditcard, size: 16),
              label: Text(_busy ? 'Đang xử lý…' : 'Xác nhận nạp tiền'),
            ),
          ],
        ),
      ),
    );
  }
}
