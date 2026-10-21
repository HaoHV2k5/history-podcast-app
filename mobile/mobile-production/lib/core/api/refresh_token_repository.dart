import 'api_client.dart';

class RefreshTokenModel {
  final int id;
  final int userId;
  final String token;
  final String? issuedAt;
  final String? expiresAt;
  final bool revoked;
  final String? revokedAt;

  RefreshTokenModel({
    required this.id,
    required this.userId,
    required this.token,
    this.issuedAt,
    this.expiresAt,
    this.revoked = false,
    this.revokedAt,
  });

  factory RefreshTokenModel.fromJson(Map<String, dynamic> json) {
    return RefreshTokenModel(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num).toInt(),
      token: (json['token'] ?? '').toString(),
      issuedAt: json['issuedAt']?.toString(),
      expiresAt: json['expiresAt']?.toString(),
      revoked: json['revoked'] == true,
      revokedAt: json['revokedAt']?.toString(),
    );
  }
}

class RefreshTokenRepository {
  final ApiClient client;

  RefreshTokenRepository({required this.client});

  /// 1. GET /api/v1/refresh-tokens
  Future<List<RefreshTokenModel>> getAll() async {
    final res = await client.get('/api/v1/refresh-tokens');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => RefreshTokenModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/refresh-tokens/{id}
  Future<RefreshTokenModel> getById(int id) async {
    final res = await client.get('/api/v1/refresh-tokens/$id');
    final data = res['data'] as Map<String, dynamic>;
    return RefreshTokenModel.fromJson(data);
  }

  /// 3. POST /api/v1/refresh-tokens
  Future<RefreshTokenModel> create({
    required int userId,
    required String token,
    String? expiresAt,
  }) async {
    final payload = <String, dynamic>{
      'userId': userId,
      'token': token,
      if (expiresAt != null) 'expiresAt': expiresAt,
    };
    final res = await client.post('/api/v1/refresh-tokens', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return RefreshTokenModel.fromJson(data);
  }

  /// 4. PUT /api/v1/refresh-tokens/{id}
  Future<RefreshTokenModel> update(
    int id, {
    String? token,
    bool? revoked,
    String? expiresAt,
  }) async {
    final payload = <String, dynamic>{
      if (token != null) 'token': token,
      if (revoked != null) 'revoked': revoked,
      if (expiresAt != null) 'expiresAt': expiresAt,
    };
    final res = await client.put('/api/v1/refresh-tokens/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return RefreshTokenModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/refresh-tokens/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/refresh-tokens/$id');
  }
}
