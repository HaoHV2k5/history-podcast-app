import 'package:file_picker/file_picker.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import 'narrator_state.dart';

Future<Uint8List> contractPdf(ContractOrder order) async {
  final font = pw.Font.ttf(
    await rootBundle.load('assets/fonts/BeVietnamPro-Regular.ttf'),
  );
  final doc = pw.Document(
    title: 'Thỏa thuận mẫu ${order.id}',
    author: 'Sử Ký · prototype',
  );
  doc.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(42),
      theme: pw.ThemeData.withFont(base: font),
      footer: (ctx) => pw.Padding(
        padding: const pw.EdgeInsets.only(top: 12),
        child: pw.Text(
          'TÀI LIỆU DIỄN TẬP · KHÔNG PHẢI HỢP ĐỒNG PHÁP LÝ · ${ctx.pageNumber}/${ctx.pagesCount}',
          style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
        ),
      ),
      build: (_) => [
        pw.Text(
          'THỎA THUẬN THU ÂM MẪU',
          style: pw.TextStyle(fontSize: 21, color: PdfColor.fromHex('#B83345')),
        ),
        pw.SizedBox(height: 12),
        pw.Text(
          'Mã ${order.id} · ${order.status.label}',
          style: const pw.TextStyle(fontSize: 11),
        ),
        pw.Divider(),
        pw.SizedBox(height: 12),
        pw.Text(
          'Bên sáng tạo / kênh: ${order.channelName}\nNgười đọc: ${order.narratorName}\nCông việc: ${order.draftTitle}\nThù lao hư cấu: ${order.feeProposal}\nHạn bàn giao mẫu: ${order.deadline.substring(0, 10)}',
          style: const pw.TextStyle(fontSize: 12, lineSpacing: 6),
        ),
        pw.SizedBox(height: 18),
        pw.Text(
          'Yêu cầu đã thống nhất',
          style: const pw.TextStyle(fontSize: 15),
        ),
        pw.SizedBox(height: 8),
        pw.Text(
          order.notes,
          style: const pw.TextStyle(fontSize: 11, lineSpacing: 5),
        ),
        pw.SizedBox(height: 18),
        pw.Text('Điều khoản diễn tập', style: const pw.TextStyle(fontSize: 15)),
        pw.SizedBox(height: 8),
        pw.Text(
          '1. Thu âm theo kịch bản và nguồn đã thống nhất; bàn giao WAV/MP3. Khi yêu cầu sửa phải ghi lý do.\n2. Hai bên xác nhận xong mới khóa tiền mẫu; chỉ nghiệm thu hoặc kết quả phân xử mẫu mới giải ngân/hoàn lại.\n3. Phạm vi bản quyền, phí nền tảng, thời hạn khiếu nại và chính sách giữ/rút tiền thật chưa chốt. Không dùng bản này làm chính sách hay điều khoản pháp lý.\n4. OTP 889900 và trạng thái bên dưới là mô phỏng trên thiết bị. Không xác thực SMS/chữ ký số hoặc chứng minh danh tính người ký.',
          style: const pw.TextStyle(fontSize: 11, lineSpacing: 5),
        ),
        pw.SizedBox(height: 18),
        pw.Text(
          'Trạng thái xác nhận mẫu',
          style: const pw.TextStyle(fontSize: 15),
        ),
        pw.SizedBox(height: 8),
        pw.Text(
          'Creator: ${order.creatorSigned ? 'Đã xác nhận mẫu' : 'Chưa xác nhận'}\nNarrator: ${order.narratorSigned ? 'Đã xác nhận mẫu' : 'Chưa xác nhận'}\nBàn giao: ${order.deliveredAudioName.isEmpty ? 'Chưa có' : order.deliveredAudioName}',
          style: const pw.TextStyle(fontSize: 11, lineSpacing: 5),
        ),
      ],
    ),
  );
  return doc.save();
}

Future<void> downloadContract(ContractOrder order) async {
  final bytes = await contractPdf(order);
  await FilePicker.saveFile(
    fileName: '${order.id}-thoa-thuan-mau.pdf',
    bytes: bytes,
    mimeType: 'application/pdf',
  );
}
