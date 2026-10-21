import 'api_client.dart';

class UserModel {
  final int id;
  final int? roleId;
  final String? roleName;
  final List<String> roles;
  final bool isCreator;
  final bool isFreelancer;
  final bool isAdmin;
  final String email;
  final String? phone;
  final String fullName;
  final String? avatarUrl;
  final String? bio;
  final String status;
  final String? createdAt;
  final String? updatedAt;

  UserModel({
    required this.id,
    this.roleId,
    this.roleName,
    this.roles = const [],
    this.isCreator = false,
    this.isFreelancer = false,
    this.isAdmin = false,
    required this.email,
    this.phone,
    required this.fullName,
    this.avatarUrl,
    this.bio,
    required this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final rawRoles = json['roles'];
    final rolesList = <String>[];
    if (rawRoles is List) {
      rolesList.addAll(rawRoles.map((e) => e.toString()));
    } else if (rawRoles is Set) {
      rolesList.addAll(rawRoles.map((e) => e.toString()));
    }

    return UserModel(
      id: (json['id'] as num).toInt(),
      roleId: (json['roleId'] as num?)?.toInt(),
      roleName: json['roleName']?.toString(),
      roles: rolesList,
      isCreator: json['isCreator'] == true,
      isFreelancer: json['isFreelancer'] == true,
      isAdmin: json['isAdmin'] == true,
      email: (json['email'] ?? '').toString(),
      phone: json['phone']?.toString(),
      fullName: (json['fullName'] ?? '').toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      bio: json['bio']?.toString(),
      status: (json['status'] ?? 'ACTIVE').toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class UserRepository {
  final ApiClient client;

  UserRepository({required this.client});

  // ==========================================
  // User Profile Self-Management (Me / Profile)
  // ==========================================

  /// 1. GET /api/v1/users/me hoặc /api/v1/users/profile
  Future<UserModel> getMyProfile() async {
    final res = await client.get('/api/v1/users/me');
    final data = res['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// 2. PUT /api/v1/users/me hoặc /api/v1/users/profile
  Future<UserModel> updateMyProfile({
    String? fullName,
    String? phone,
    String? avatarUrl,
    String? bio,
  }) async {
    final payload = <String, dynamic>{
      if (fullName != null) 'fullName': fullName,
      if (phone != null) 'phone': phone,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (bio != null) 'bio': bio,
    };
    final res = await client.put('/api/v1/users/me', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// 3. POST /api/v1/users/me/avatar (Tải ảnh đại diện cá nhân Multipart)
  Future<UserModel> uploadAvatar({
    required List<int> fileBytes,
    required String filename,
  }) async {
    final res = await client.multipartPost(
      '/api/v1/users/me/avatar',
      fileField: 'file',
      fileBytes: fileBytes,
      filename: filename,
    );
    final data = res['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// 4. PUT hoặc POST /api/v1/users/me/change-password hoặc /api/v1/users/me/password
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final payload = {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
      'confirmPassword': confirmPassword,
    };
    await client.put('/api/v1/users/me/change-password', body: payload);
  }

  // ==========================================
  // Admin User Management
  // ==========================================

  /// 5. GET /api/v1/users ([Admin] Lấy danh sách tất cả User)
  Future<List<UserModel>> getAll() async {
    final res = await client.get('/api/v1/users');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 6. GET /api/v1/users/{id} ([Admin] Lấy chi tiết User theo ID)
  Future<UserModel> getById(int id) async {
    final res = await client.get('/api/v1/users/$id');
    final data = res['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// 7. POST /api/v1/users ([Admin] Tạo mới User)
  Future<UserModel> createUser({
    required String email,
    required String password,
    required String fullName,
    String? phone,
    int? roleId,
  }) async {
    final payload = <String, dynamic>{
      'email': email,
      'password': password,
      'fullName': fullName,
      if (phone != null) 'phone': phone,
      if (roleId != null) 'roleId': roleId,
    };
    final res = await client.post('/api/v1/users', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// 8. PUT /api/v1/users/{id} ([Admin] Cập nhật User)
  Future<UserModel> updateUser(
    int id, {
    String? fullName,
    String? phone,
    String? avatarUrl,
    String? bio,
    String? status,
    int? roleId,
  }) async {
    final payload = <String, dynamic>{
      if (fullName != null) 'fullName': fullName,
      if (phone != null) 'phone': phone,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (bio != null) 'bio': bio,
      if (status != null) 'status': status,
      if (roleId != null) 'roleId': roleId,
    };
    final res = await client.put('/api/v1/users/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// 9. DELETE /api/v1/users/{id} ([Admin] Xóa User)
  Future<void> deleteUser(int id) async {
    await client.delete('/api/v1/users/$id');
  }
}
