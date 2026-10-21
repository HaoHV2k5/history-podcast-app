import 'api_client.dart';

class SystemConfigModel {
  final int id;
  final String key;
  final String value;
  final int? updatedByUserId;
  final String? updatedAt;

  SystemConfigModel({
    required this.id,
    required this.key,
    required this.value,
    this.updatedByUserId,
    this.updatedAt,
  });

  factory SystemConfigModel.fromJson(Map<String, dynamic> json) {
    return SystemConfigModel(
      id: (json['id'] as num).toInt(),
      key: (json['key'] ?? '').toString(),
      value: (json['value'] ?? '').toString(),
      updatedByUserId: (json['updatedByUserId'] as num?)?.toInt(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class SystemConfigRepository {
  final ApiClient client;

  SystemConfigRepository({required this.client});

  /// 1. GET /api/v1/system-configs
  Future<List<SystemConfigModel>> getAll() async {
    final res = await client.get('/api/v1/system-configs');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => SystemConfigModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/system-configs/{id}
  Future<SystemConfigModel> getById(int id) async {
    final res = await client.get('/api/v1/system-configs/$id');
    final data = res['data'] as Map<String, dynamic>;
    return SystemConfigModel.fromJson(data);
  }

  /// 3. POST /api/v1/system-configs
  Future<SystemConfigModel> create({
    required String key,
    required String value,
    int? updatedByUserId,
  }) async {
    final payload = <String, dynamic>{
      'key': key,
      'value': value,
      if (updatedByUserId != null) 'updatedByUserId': updatedByUserId,
    };
    final res = await client.post('/api/v1/system-configs', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return SystemConfigModel.fromJson(data);
  }

  /// 4. PUT /api/v1/system-configs/{id}
  Future<SystemConfigModel> update(
    int id, {
    String? key,
    String? value,
    int? updatedByUserId,
  }) async {
    final payload = <String, dynamic>{
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (updatedByUserId != null) 'updatedByUserId': updatedByUserId,
    };
    final res = await client.put('/api/v1/system-configs/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return SystemConfigModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/system-configs/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/system-configs/$id');
  }
}
