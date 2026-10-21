import 'api_client.dart';

class ReactionModel {
  final int id;
  final int artifactId;
  final int userId;
  final String type; // LIKE, HEART, CLAP, etc.
  final String? createdAt;

  ReactionModel({
    required this.id,
    required this.artifactId,
    required this.userId,
    required this.type,
    this.createdAt,
  });

  factory ReactionModel.fromJson(Map<String, dynamic> json) {
    return ReactionModel(
      id: (json['id'] as num).toInt(),
      artifactId: (json['artifactId'] as num).toInt(),
      userId: (json['userId'] as num).toInt(),
      type: (json['type'] ?? 'LIKE').toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class ReactionRepository {
  final ApiClient client;

  ReactionRepository({required this.client});

  /// 1. GET /api/v1/reactions
  Future<List<ReactionModel>> getAll() async {
    final res = await client.get('/api/v1/reactions');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => ReactionModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/reactions/{id}
  Future<ReactionModel> getById(int id) async {
    final res = await client.get('/api/v1/reactions/$id');
    final data = res['data'] as Map<String, dynamic>;
    return ReactionModel.fromJson(data);
  }

  /// 3. POST /api/v1/reactions
  Future<ReactionModel> create({
    required int artifactId,
    required int userId,
    required String type,
  }) async {
    final payload = <String, dynamic>{
      'artifactId': artifactId,
      'userId': userId,
      'type': type,
    };
    final res = await client.post('/api/v1/reactions', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ReactionModel.fromJson(data);
  }

  /// 4. PUT /api/v1/reactions/{id}
  Future<ReactionModel> update(
    int id, {
    int? artifactId,
    int? userId,
    String? type,
  }) async {
    final payload = <String, dynamic>{
      if (artifactId != null) 'artifactId': artifactId,
      if (userId != null) 'userId': userId,
      if (type != null) 'type': type,
    };
    final res = await client.put('/api/v1/reactions/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ReactionModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/reactions/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/reactions/$id');
  }
}
