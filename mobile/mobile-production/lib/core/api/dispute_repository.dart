import 'api_client.dart';

class DisputeModel {
  final int id;
  final int contractId;
  final int? milestoneId;
  final int raisedByUserId;
  final String? raisedByName;
  final String reason;
  final String? evidenceUrl;
  final String? counterEvidenceUrl;
  final String? counterNote;
  final String status;
  final String? resolution;
  final double? refundCreatorPercent;
  final double? payFreelancerPercent;
  final String? createdAt;

  DisputeModel({
    required this.id,
    required this.contractId,
    this.milestoneId,
    required this.raisedByUserId,
    this.raisedByName,
    required this.reason,
    this.evidenceUrl,
    this.counterEvidenceUrl,
    this.counterNote,
    required this.status,
    this.resolution,
    this.refundCreatorPercent,
    this.payFreelancerPercent,
    this.createdAt,
  });

  factory DisputeModel.fromJson(Map<String, dynamic> json) {
    return DisputeModel(
      id: (json['id'] as num).toInt(),
      contractId: (json['contractId'] as num).toInt(),
      milestoneId: (json['milestoneId'] as num?)?.toInt(),
      raisedByUserId: (json['raisedByUserId'] as num?)?.toInt() ?? 0,
      raisedByName: json['raisedByName']?.toString(),
      reason: (json['reason'] ?? '').toString(),
      evidenceUrl: json['evidenceUrl']?.toString(),
      counterEvidenceUrl: json['counterEvidenceUrl']?.toString(),
      counterNote: json['counterNote']?.toString(),
      status: (json['status'] ?? 'OPEN').toString(),
      resolution: json['resolution']?.toString(),
      refundCreatorPercent: (json['refundCreatorPercent'] as num?)?.toDouble(),
      payFreelancerPercent: (json['payFreelancerPercent'] as num?)?.toDouble(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class DisputeRepository {
  final ApiClient client;

  DisputeRepository({required this.client});

  /// 1. Mở khiếu nại / tranh chấp (POST /api/v1/disputes)
  Future<DisputeModel> openDispute({
    required int contractId,
    int? milestoneId,
    required String reason,
    String? evidenceUrl,
  }) async {
    final payload = {
      'contractId': contractId,
      if (milestoneId != null) 'milestoneId': milestoneId,
      'reason': reason,
      if (evidenceUrl != null) 'evidenceUrl': evidenceUrl,
    };
    final res = await client.post('/api/v1/disputes', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return DisputeModel.fromJson(data);
  }

  /// 2. Bên còn lại nộp bằng chứng phản hồi (POST /api/v1/disputes/{id}/counter-evidence)
  Future<DisputeModel> submitCounterEvidence(
    int disputeId, {
    required String counterEvidenceUrl,
    String? counterNote,
  }) async {
    final payload = {
      'counterEvidenceUrl': counterEvidenceUrl,
      if (counterNote != null) 'counterNote': counterNote,
    };
    final res = await client.post('/api/v1/disputes/$disputeId/counter-evidence', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return DisputeModel.fromJson(data);
  }

  /// 3. Xem chi tiết tranh chấp theo ID (GET /api/v1/disputes/{id})
  Future<DisputeModel> getById(int id) async {
    final res = await client.get('/api/v1/disputes/$id');
    final data = res['data'] as Map<String, dynamic>;
    return DisputeModel.fromJson(data);
  }

  /// 4. Xem danh sách tranh chấp của một hợp đồng (GET /api/v1/disputes/contract/{contractId})
  Future<List<DisputeModel>> getByContract(int contractId) async {
    final res = await client.get('/api/v1/disputes/contract/$contractId');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => DisputeModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 5. Lấy danh sách tất cả tranh chấp (GET /api/v1/disputes)
  Future<List<DisputeModel>> getAllDisputes({String? status, int page = 0, int size = 20}) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    if (status != null && status.isNotEmpty) {
      query['status'] = status;
    }
    final res = await client.get('/api/v1/disputes', queryParams: query);
    final data = res['data'];
    if (data is Map && data.containsKey('content')) {
      final items = data['content'] as List;
      return items.map((e) => DisputeModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is List) {
      return data.map((e) => DisputeModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 6. Admin phân xử tranh chấp (POST /api/v1/disputes/{id}/resolve)
  Future<DisputeModel> resolveDispute(
    int id, {
    required String resolution,
    double? refundCreatorPercent,
    double? payFreelancerPercent,
  }) async {
    final payload = {
      'resolution': resolution,
      if (refundCreatorPercent != null) 'refundCreatorPercent': refundCreatorPercent,
      if (payFreelancerPercent != null) 'payFreelancerPercent': payFreelancerPercent,
    };
    final res = await client.post('/api/v1/disputes/$id/resolve', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return DisputeModel.fromJson(data);
  }
}
