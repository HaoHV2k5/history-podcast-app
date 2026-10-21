import 'api_client.dart';

class NarratorProfileModel {
  final int id;
  final int? userId;
  final String? bio;
  final String? languages;
  final double baseRate;
  final String status;
  final String? createdAt;

  NarratorProfileModel({
    required this.id,
    this.userId,
    this.bio,
    this.languages,
    required this.baseRate,
    required this.status,
    this.createdAt,
  });

  factory NarratorProfileModel.fromJson(Map<String, dynamic> json) {
    return NarratorProfileModel(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num?)?.toInt(),
      bio: json['bio']?.toString(),
      languages: json['languages']?.toString(),
      baseRate: (json['baseRate'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'ACTIVE').toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class NarratorProfileRepository {
  final ApiClient client;

  NarratorProfileRepository({required this.client});

  /// 1. GET /api/v1/narrator-profiles
  Future<List<NarratorProfileModel>> getAll() async {
    final res = await client.get('/api/v1/narrator-profiles');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => NarratorProfileModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/narrator-profiles/{id}
  Future<NarratorProfileModel> getById(int id) async {
    final res = await client.get('/api/v1/narrator-profiles/$id');
    final data = res['data'] as Map<String, dynamic>;
    return NarratorProfileModel.fromJson(data);
  }

  /// 3. POST /api/v1/narrator-profiles
  Future<NarratorProfileModel> create({
    required int userId,
    String? bio,
    String? languages,
    double baseRate = 0.0,
    String status = 'ACTIVE',
  }) async {
    final payload = <String, dynamic>{
      'userId': userId,
      if (bio != null) 'bio': bio,
      if (languages != null) 'languages': languages,
      'baseRate': baseRate,
      'status': status,
    };
    final res = await client.post('/api/v1/narrator-profiles', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return NarratorProfileModel.fromJson(data);
  }

  /// 4. PUT /api/v1/narrator-profiles/{id}
  Future<NarratorProfileModel> update(
    int id, {
    String? bio,
    String? languages,
    double? baseRate,
    String? status,
  }) async {
    final payload = <String, dynamic>{
      if (bio != null) 'bio': bio,
      if (languages != null) 'languages': languages,
      if (baseRate != null) 'baseRate': baseRate,
      if (status != null) 'status': status,
    };
    final res = await client.put('/api/v1/narrator-profiles/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return NarratorProfileModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/narrator-profiles/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/narrator-profiles/$id');
  }
}
