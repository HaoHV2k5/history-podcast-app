import 'api_client.dart';

class RoleModel {
  final int id;
  final String name;
  final String? description;

  RoleModel({
    required this.id,
    required this.name,
    this.description,
  });

  factory RoleModel.fromJson(Map<String, dynamic> json) {
    return RoleModel(
      id: (json['id'] as num).toInt(),
      name: (json['name'] ?? '').toString(),
      description: json['description']?.toString(),
    );
  }
}

class RoleRepository {
  final ApiClient client;

  RoleRepository({required this.client});

  /// 1. GET /api/v1/roles
  Future<List<RoleModel>> getAll() async {
    final res = await client.get('/api/v1/roles');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => RoleModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/roles/{id}
  Future<RoleModel> getById(int id) async {
    final res = await client.get('/api/v1/roles/$id');
    final data = res['data'] as Map<String, dynamic>;
    return RoleModel.fromJson(data);
  }

  /// 3. POST /api/v1/roles
  Future<RoleModel> create({
    required String name,
    String? description,
  }) async {
    final payload = <String, dynamic>{
      'name': name,
      if (description != null) 'description': description,
    };
    final res = await client.post('/api/v1/roles', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return RoleModel.fromJson(data);
  }

  /// 4. PUT /api/v1/roles/{id}
  Future<RoleModel> update(
    int id, {
    String? name,
    String? description,
  }) async {
    final payload = <String, dynamic>{
      if (name != null) 'name': name,
      if (description != null) 'description': description,
    };
    final res = await client.put('/api/v1/roles/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return RoleModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/roles/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/roles/$id');
  }
}
