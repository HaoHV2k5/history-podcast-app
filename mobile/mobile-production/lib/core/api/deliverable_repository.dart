import 'api_client.dart';

class DeliverableModel {
  final int id;
  final int contractId;
  final String fileUrl;
  final String status;
  final String? reviewNote;
  final String? submittedAt;
  final String? reviewedAt;

  DeliverableModel({
    required this.id,
    required this.contractId,
    required this.fileUrl,
    required this.status,
    this.reviewNote,
    this.submittedAt,
    this.reviewedAt,
  });

  factory DeliverableModel.fromJson(Map<String, dynamic> json) {
    return DeliverableModel(
      id: (json['id'] as num).toInt(),
      contractId: (json['contractId'] as num).toInt(),
      fileUrl: (json['fileUrl'] ?? '').toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      reviewNote: json['reviewNote']?.toString(),
      submittedAt: json['submittedAt']?.toString(),
      reviewedAt: json['reviewedAt']?.toString(),
    );
  }
}

class DeliverableRepository {
  final ApiClient client;

  DeliverableRepository({required this.client});

  /// 1. Lấy danh sách tất cả Deliverable (GET /api/v1/deliverables)
  Future<List<DeliverableModel>> getAll() async {
    final res = await client.get('/api/v1/deliverables');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => DeliverableModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. Lấy chi tiết Deliverable theo ID (GET /api/v1/deliverables/{id})
  Future<DeliverableModel> getById(int id) async {
    final res = await client.get('/api/v1/deliverables/$id');
    final data = res['data'] as Map<String, dynamic>;
    return DeliverableModel.fromJson(data);
  }

  /// 3. Tạo mới Deliverable (POST /api/v1/deliverables)
  Future<DeliverableModel> create({
    required int contractId,
    required String fileUrl,
    String status = 'SUBMITTED',
    String? reviewNote,
  }) async {
    final payload = {
      'contractId': contractId,
      'fileUrl': fileUrl,
      'status': status,
      if (reviewNote != null) 'reviewNote': reviewNote,
      'submittedAt': DateTime.now().toUtc().toIso8601String(),
    };
    final res = await client.post('/api/v1/deliverables', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return DeliverableModel.fromJson(data);
  }

  /// 4. Cập nhật Deliverable (PUT /api/v1/deliverables/{id})
  Future<DeliverableModel> update(
    int id, {
    String? fileUrl,
    String? status,
    String? reviewNote,
  }) async {
    final payload = {
      if (fileUrl != null) 'fileUrl': fileUrl,
      if (status != null) 'status': status,
      if (reviewNote != null) 'reviewNote': reviewNote,
      'reviewedAt': DateTime.now().toUtc().toIso8601String(),
    };
    final res = await client.put('/api/v1/deliverables/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return DeliverableModel.fromJson(data);
  }

  /// 5. Xóa Deliverable (DELETE /api/v1/deliverables/{id})
  Future<void> delete(int id) async {
    await client.delete('/api/v1/deliverables/$id');
  }
}
