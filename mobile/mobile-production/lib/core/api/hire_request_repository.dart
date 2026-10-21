import 'api_client.dart';

class HireRequestModel {
  final int id;
  final int creatorId;
  final int narratorId;
  final int? channelId;
  final String? description;
  final double? proposedPrice;
  final String? deadline;
  final String status;
  final String? createdAt;

  HireRequestModel({
    required this.id,
    required this.creatorId,
    required this.narratorId,
    this.channelId,
    this.description,
    this.proposedPrice,
    this.deadline,
    required this.status,
    this.createdAt,
  });

  factory HireRequestModel.fromJson(Map<String, dynamic> json) {
    return HireRequestModel(
      id: (json['id'] as num).toInt(),
      creatorId: (json['creatorId'] as num).toInt(),
      narratorId: (json['narratorId'] as num).toInt(),
      channelId: (json['channelId'] as num?)?.toInt(),
      description: json['description']?.toString(),
      proposedPrice: (json['proposedPrice'] as num?)?.toDouble(),
      deadline: json['deadline']?.toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class HireRequestRepository {
  final ApiClient client;

  HireRequestRepository({required this.client});

  /// 1. Lấy danh sách tất cả HireRequest (GET /api/v1/hire-requests)
  Future<List<HireRequestModel>> getAll() async {
    final res = await client.get('/api/v1/hire-requests');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => HireRequestModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. Lấy chi tiết HireRequest theo ID (GET /api/v1/hire-requests/{id})
  Future<HireRequestModel> getById(int id) async {
    final res = await client.get('/api/v1/hire-requests/$id');
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// 3. Tạo mới HireRequest (POST /api/v1/hire-requests)
  Future<HireRequestModel> create({
    required int creatorId,
    required int narratorId,
    int? channelId,
    String? description,
    double? proposedPrice,
    String? deadline,
  }) async {
    final payload = {
      'creatorId': creatorId,
      'narratorId': narratorId,
      if (channelId != null) 'channelId': channelId,
      if (description != null) 'description': description,
      if (proposedPrice != null) 'proposedPrice': proposedPrice,
      if (deadline != null) 'deadline': deadline,
      'status': 'PENDING',
      'createdAt': DateTime.now().toUtc().toIso8601String(),
    };
    final res = await client.post('/api/v1/hire-requests', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// 4. Cập nhật HireRequest (PUT /api/v1/hire-requests/{id})
  Future<HireRequestModel> update(
    int id, {
    String? description,
    double? proposedPrice,
    String? deadline,
    String? status,
  }) async {
    final payload = {
      if (description != null) 'description': description,
      if (proposedPrice != null) 'proposedPrice': proposedPrice,
      if (deadline != null) 'deadline': deadline,
      if (status != null) 'status': status,
    };
    final res = await client.put('/api/v1/hire-requests/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// 5. Xóa HireRequest (DELETE /api/v1/hire-requests/{id})
  Future<void> delete(int id) async {
    await client.delete('/api/v1/hire-requests/$id');
  }
}
