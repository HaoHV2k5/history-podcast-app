import 'package:flutter/material.dart';

import 'design.dart';
import 'narrator_state.dart';
import 'contract_pdf.dart';

Future<String?> showDemoSigning(
  BuildContext context,
  ContractOrder order,
  String role,
) async {
  final otp = TextEditingController();
  final form = GlobalKey<FormState>();
  bool agree = false;
  final value = await showDialog<String>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, update) => AlertDialog(
        title: Text('Thỏa thuận mẫu · $role', style: editorial(23)),
        content: SingleChildScrollView(
          child: Form(
            key: form,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${order.id}\nBên sáng tạo: ${order.channelName}\nNgười đọc: ${order.narratorName}\nCông việc: ${order.draftTitle}\nThù lao mẫu: ${order.feeProposal}\nHạn: ${order.deadline.substring(0, 10)}\n\n${order.notes}',
                  style: const TextStyle(height: 1.7),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () async {
                    try {
                      await downloadContract(order);
                    } catch (_) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Chưa xuất được PDF mẫu. Hãy thử lại.',
                            ),
                          ),
                        );
                      }
                    }
                  },
                  child: const Text('Tải thỏa thuận PDF mẫu'),
                ),
                const Text(
                  'Điều khoản hợp đồng: Thu âm đúng theo kịch bản và tài liệu lịch sử đã thống nhất; bàn giao đúng định dạng chuẩn chất lượng cao. Hai bên cam kết tuân thủ quy chế thanh toán và bảo vệ quyền sở hữu trí tuệ trên nền tảng.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.7,
                    color: Palette.muted,
                  ),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Tôi đã đọc và đồng ý với các điều khoản hợp đồng'),
                  value: agree,
                  onChanged: (v) => update(() => agree = v ?? false),
                ),
                TextFormField(
                  key: const Key('contract-otp'),
                  controller: otp,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Mã xác nhận bảo mật',
                    hintText: 'Nhập mã xác thực',
                  ),
                  validator: (v) =>
                      v != null && v.trim().length >= 4 ? null : 'Vui lòng nhập mã xác thực hợp lệ',
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Để sau'),
          ),
          FilledButton(
            onPressed: agree
                ? () {
                    if (form.currentState!.validate()) {
                      Navigator.pop(ctx, otp.text);
                    }
                  }
                : null,
            child: const Text('Xác nhận ký hợp đồng'),
          ),
        ],

      ),
    ),
  );
  await Future<void>.delayed(const Duration(milliseconds: 250));
  otp.dispose();
  return value;
}
