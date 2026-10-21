import 'api_client.dart';

class EmailTemplateModel {
  final int id;
  final String code;
  final String subject;
  final String htmlContent;
  final String? description;
  final String? createdAt;
  final String? updatedAt;

  EmailTemplateModel({
    required this.id,
    required this.code,
    required this.subject,
    required this.htmlContent,
    this.description,
    this.createdAt,
    this.updatedAt,
  });

  factory EmailTemplateModel.fromJson(Map<String, dynamic> json) {
    return EmailTemplateModel(
      id: (json['id'] as num).toInt(),
      code: (json['code'] ?? '').toString(),
      subject: (json['subject'] ?? '').toString(),
      htmlContent: (json['htmlContent'] ?? '').toString(),
      description: json['description']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class EmailTemplateRepository {
  final ApiClient client;

  EmailTemplateRepository({required this.client});

  /// 1. Lấy danh sách tất cả Email Template (GET /api/v1/email-templates)
  Future<List<EmailTemplateModel>> getAll() async {
    final res = await client.get('/api/v1/email-templates');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => EmailTemplateModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. Lấy chi tiết Email Template theo ID (GET /api/v1/email-templates/{id})
  Future<EmailTemplateModel> getById(int id) async {
    final res = await client.get('/api/v1/email-templates/$id');
    final data = res['data'] as Map<String, dynamic>;
    return EmailTemplateModel.fromJson(data);
  }

  /// 3. Lấy chi tiết Email Template theo Code (GET /api/v1/email-templates/code/{code})
  Future<EmailTemplateModel> getByCode(String code) async {
    final res = await client.get('/api/v1/email-templates/code/$code');
    final data = res['data'] as Map<String, dynamic>;
    return EmailTemplateModel.fromJson(data);
  }

  /// 4. Tạo mới Email Template (POST /api/v1/email-templates)
  Future<EmailTemplateModel> create({
    required String code,
    required String subject,
    required String htmlContent,
    String? description,
  }) async {
    final payload = {
      'code': code,
      'subject': subject,
      'htmlContent': htmlContent,
      if (description != null) 'description': description,
    };
    final res = await client.post('/api/v1/email-templates', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return EmailTemplateModel.fromJson(data);
  }

  /// 5. Cập nhật Email Template (PUT /api/v1/email-templates/{id})
  Future<EmailTemplateModel> update(
    int id, {
    String? subject,
    String? htmlContent,
    String? description,
  }) async {
    final payload = {
      if (subject != null) 'subject': subject,
      if (htmlContent != null) 'htmlContent': htmlContent,
      if (description != null) 'description': description,
    };
    final res = await client.put('/api/v1/email-templates/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return EmailTemplateModel.fromJson(data);
  }

  /// 6. Xóa Email Template (DELETE /api/v1/email-templates/{id})
  Future<void> delete(int id) async {
    await client.delete('/api/v1/email-templates/$id');
  }

  /// 7. Xem trước giao diện email sau khi render biến (POST /api/v1/email-templates/{id}/preview)
  Future<Map<String, dynamic>> preview(int id, {Map<String, Object>? sampleData}) async {
    final payload = sampleData != null ? {'sampleData': sampleData} : null;
    final res = await client.post('/api/v1/email-templates/$id/preview', body: payload);
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// 8. Gửi thử nghiệm email qua Brevo (POST /api/v1/email-templates/{id}/test-send)
  Future<void> sendTestEmail(int id, {required String toEmail}) async {
    await client.post('/api/v1/email-templates/$id/test-send', body: {'toEmail': toEmail});
  }
}
