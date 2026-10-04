import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'app_state.dart';
import 'demo_data.dart';
import 'design.dart';

class DemoDataPage extends StatefulWidget {
  const DemoDataPage({super.key, required this.state});
  final AppState state;
  @override
  State<DemoDataPage> createState() => _DemoDataPageState();
}

class _DemoDataPageState extends State<DemoDataPage> {
  late final service = DemoDataService(widget.state.preferences);
  late final presets = service.scenarios();
  bool busy = false;
  String? message;
  Future<void> apply(Map<String, dynamic>? preset) async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          preset == null
              ? 'Khôi phục dữ liệu trước demo?'
              : 'Nạp ${preset['title']}?',
        ),
        content: Text(
          preset == null
              ? 'Dữ liệu thử hiện tại sẽ được thay bằng bản trước lần nạp demo đầu tiên.'
              : 'Các dữ liệu người nghe, Studio và Narrator trên thiết bị sẽ được thay bằng dữ liệu mẫu. Bản trước demo được giữ để khôi phục; dữ liệu thử hiện tại không được giữ khi đổi bộ.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(preset == null ? 'Khôi phục' : 'Nạp dữ liệu'),
          ),
        ],
      ),
    );
    if (yes != true || !mounted) return;
    setState(() {
      busy = true;
      message = null;
    });
    try {
      await widget.state.pauseForDataChange();
      if (preset == null) {
        await service.restore();
      } else {
        await service.load(preset['id']);
      }
      widget.state.reloadLocalData();
      if (mounted) {
        setState(
          () => message = preset == null
              ? 'Đã khôi phục dữ liệu trước demo.'
              : 'Đã nạp ${preset['title']}. Mở Cá nhân → Không gian sáng tạo để thử người kể hoặc người đọc.',
        );
      }
    } catch (e) {
      widget.state.reloadLocalData();
      if (mounted) {
        setState(
          () => message = e is StateError
              ? e.message
              : 'Không nạp được dữ liệu demo.',
        );
      }
    }
    if (mounted) setState(() => busy = false);
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !busy,
    child: Scaffold(
      appBar: AppBar(
        title: const Text(
          'Dữ liệu thử giao diện',
          style: TextStyle(fontSize: 14),
        ),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: presets,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(
              child: Text('Không đọc được bộ demo đi kèm app.'),
            );
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const Text(
                'BẢN THỬ / DỮ LIỆU MẪU',
                style: TextStyle(
                  fontSize: 11,
                  color: Palette.muted,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 12),
              Text('Thử từng bước,\nkhông cần nhập lại.', style: editorial(29)),
              const SizedBox(height: 16),
              const Text(
                'Các tên, hồ sơ và thỏa thuận dưới đây là dữ liệu hư cấu. Tập kỹ thuật có audio/video phát thật, chưa phải giọng kể lịch sử. Không xác thực danh tính hoặc tạo giao dịch tiền.',
                style: TextStyle(color: Palette.muted, height: 1.7),
              ),
              const SizedBox(height: 24),
              for (final preset in snapshot.data!) ...[
                const Divider(),
                const SizedBox(height: 18),
                Text(preset['title'], style: editorial(23)),
                const SizedBox(height: 10),
                Text(
                  preset['description'],
                  style: const TextStyle(color: Palette.muted, height: 1.7),
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerLeft,
                  child: OutlinedButton.icon(
                    onPressed: busy ? null : () => apply(preset),
                    icon: const Icon(CupertinoIcons.arrow_down_doc, size: 18),
                    label: Text(
                      service.current == preset['id']
                          ? 'Nạp lại bộ này'
                          : 'Nạp ${preset['title']}',
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
              if (message != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      message!,
                      style: const TextStyle(color: Palette.red, height: 1.7),
                    ),
                  ),
                ),
              if (service.hasBackup) ...[
                const Divider(),
                const SizedBox(height: 20),
                Text('Trở về dữ liệu của bạn', style: editorial(23)),
                const SizedBox(height: 12),
                const Text(
                  'Khôi phục bản lưu trước lần nạp demo đầu tiên. Không xóa dữ liệu ngoài phạm vi app.',
                  style: TextStyle(color: Palette.muted, height: 1.7),
                ),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: busy ? null : () => apply(null),
                  child: const Text('Khôi phục dữ liệu trước demo'),
                ),
              ],
              if (busy)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: LinearProgressIndicator(),
                ),
              const SizedBox(height: 20),
            ],
          );
        },
      ),
    ),
  );
}
