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
                  'Điều khoản diễn tập: thu âm theo kịch bản/nguồn đã thống nhất; bàn giao WAV/MP3 và chỉnh sửa có lý do. Chỉ sử dụng sản phẩm theo quyền do hai bên thỏa thuận; phạm vi bản quyền, phí và thời hạn khiếu nại thật chưa chốt. Hai bên xác nhận xong mới khóa tiền mẫu; nghiệm thu mới giải ngân. Tranh chấp chuyển kiểm tra mẫu. Đây không phải hợp đồng/chữ ký có giá trị pháp lý.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.7,
                    color: Palette.muted,
                  ),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Đã đọc các điều khoản mẫu'),
                  value: agree,
                  onChanged: (v) => update(() => agree = v ?? false),
                ),
                TextFormField(
                  key: const Key('contract-otp'),
                  controller: otp,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'OTP thử',
                    helperText: '889900 · Không gửi SMS',
                  ),
                  validator: (v) =>
                      v == '889900' ? null : 'Nhập OTP mẫu 889900',
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
            child: const Text('Xác nhận mẫu bằng OTP'),
          ),
        ],
      ),
    ),
  );
  await Future<void>.delayed(const Duration(milliseconds: 250));
  otp.dispose();
  return value;
}
