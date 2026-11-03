import 'api_client.dart';

class DisputeModel {
  final int id;
  final int contractId;
  final String? contractTitle;
  final int? milestoneId;
  final String? milestoneTitle;
  final int raisedByUserId;
  final String? raisedByName;
  final String reason;
  final String? evidenceUrl;
  final List<String> evidenceUrls;
  final String? counterEvidenceUrl;
  final List<String> counterEvidenceUrls;
  final String? counterNote;
  final String status;
  final String? result;
  final double? splitPercent;
  final String? resolvedByUserFullName;
  final String? resolution;
  final String? resolvedAt;
  final double? refundCreatorPercent;
  final double? payFreelancerPercent;
  final String? createdAt;

  DisputeModel({
    required this.id,
    required this.contractId,
    this.contractTitle,
    this.milestoneId,
    this.milestoneTitle,
    required this.raisedByUserId,
    this.raisedByName,
    required this.reason,
    this.evidenceUrl,
    this.evidenceUrls = const [],
    this.counterEvidenceUrl,
    this.counterEvidenceUrls = const [],
    this.counterNote,
    required this.status,
    this.result,
    this.splitPercent,
    this.resolvedByUserFullName,
    this.resolution,
    this.resolvedAt,
    this.refundCreatorPercent,
    this.payFreelancerPercent,
    this.createdAt,
  });

  factory DisputeModel.fromJson(Map<String, dynamic> json) {
    final rawEvUrls = json['evidenceUrls'];
    final rawCounterEvUrls = json['counterEvidenceUrls'];
    return DisputeModel(
      id: (json['id'] as num).toInt(),
      contractId: (json['contractId'] as num?)?.toInt() ?? 0,
      contractTitle: json['contractTitle']?.toString(),
      milestoneId: (json['milestoneId'] as num?)?.toInt(),
      milestoneTitle: json['milestoneTitle']?.toString(),
      raisedByUserId: (json['raisedByUserId'] as num?)?.toInt() ?? 0,
      raisedByName: (json['raisedByUserFullName'] ?? json['raisedByName'])?.toString(),
      reason: (json['reason'] ?? '').toString(),
      evidenceUrl: (json['evidence'] ?? json['evidenceUrl'])?.toString(),
      evidenceUrls: (rawEvUrls is List)
          ? rawEvUrls.map((e) => e.toString()).toList()
          : const [],
      counterEvidenceUrl: (json['counterEvidence'] ?? json['counterEvidenceUrl'])?.toString(),
      counterEvidenceUrls: (rawCounterEvUrls is List)
          ? rawCounterEvUrls.map((e) => e.toString()).toList()
          : const [],
      counterNote: json['counterNote']?.toString(),
      status: (json['status'] ?? 'OPEN').toString(),
      result: json['result']?.toString(),
      splitPercent: (json['splitPercent'] as num?)?.toDouble(),
      resolvedByUserFullName: json['resolvedByUserFullName']?.toString(),
      resolution: json['resolution']?.toString(),
      resolvedAt: json['resolvedAt']?.toString(),
      refundCreatorPercent: (json['refundCreatorPercent'] as num?)?.toDouble(),
      payFreelancerPercent: (json['payFreelancerPercent'] as num?)?.toDouble(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class DisputeRepository {
  final ApiClient client;

  DisputeRepository({required this.client});

  /// Upload tệp bằng chứng khiếu nại / đối chất (POST /api/v1/disputes/evidence-upload)
  Future<String> uploadEvidenceFile({
    required List<int> fileBytes,
    required String filename,
  }) async {
    final res = await client.multipartPost(
      '/api/v1/disputes/evidence-upload',
      fileField: 'file',
      fileBytes: fileBytes,
      filename: filename,
    );
    final data = res['data'] as Map<String, dynamic>;
    return data['fileUrl'].toString();
  }

  /// 1. Mở khiếu nại / tranh chấp (POST /api/v1/disputes)
  Future<DisputeModel> openDispute({
    int? contractId,
    int? milestoneId,
    required String reason,
    String? evidence,
    String? evidenceUrl,
    List<String>? attachmentUrls,
  }) async {
    final effectiveEvidence = evidence ?? evidenceUrl;
    final payload = {
      if (contractId != null) 'contractId': contractId,
      if (milestoneId != null) 'milestoneId': milestoneId,
      'reason': reason,
      if (effectiveEvidence != null && effectiveEvidence.isNotEmpty)
        'evidence': effectiveEvidence,
      if (attachmentUrls != null && attachmentUrls.isNotEmpty)
        'attachmentUrls': attachmentUrls,
    };
    final res = await client.post('/api/v1/disputes', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return DisputeModel.fromJson(data);
  }

  /// 2. Bên còn lại nộp bằng chứng phản hồi (POST /api/v1/disputes/{id}/counter-evidence)
  Future<DisputeModel> submitCounterEvidence(
    int disputeId, {
    String? counterEvidence,
    String? counterEvidenceUrl,
    String? counterNote,
    List<String>? attachmentUrls,
  }) async {
    final effectiveCounter = [
      if (counterEvidence != null && counterEvidence.trim().isNotEmpty)
        counterEvidence.trim(),
      if (counterEvidenceUrl != null && counterEvidenceUrl.trim().isNotEmpty)
        counterEvidenceUrl.trim(),
      if (counterNote != null && counterNote.trim().isNotEmpty)
        counterNote.trim(),
    ].join(' — ');
    final payload = {
      'counterEvidence': effectiveCounter,
      if (counterEvidenceUrl != null) 'counterEvidenceUrl': counterEvidenceUrl,
      if (counterNote != null) 'counterNote': counterNote,
      if (attachmentUrls != null && attachmentUrls.isNotEmpty)
        'attachmentUrls': attachmentUrls,
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
    if (data is Map) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems.map((e) => DisputeModel.fromJson(e as Map<String, dynamic>)).toList();
      }
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
