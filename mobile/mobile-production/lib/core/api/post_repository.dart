import 'api_client.dart';

class PostModel {
  final int id;
  final int? userId;
  final String? userFullName;
  final String? userAvatarUrl;
  final String? userHeadline;
  final String type; // BOOKING, JOB_SEEKING
  final String? serviceType;
  final String title;
  final String description;
  final double referencePrice;
  final String status;
  final String? expiresAt;
  final String? createdAt;
  final String? updatedAt;
  final int applicationCount;

  PostModel({
    required this.id,
    this.userId,
    this.userFullName,
    this.userAvatarUrl,
    this.userHeadline,
    required this.type,
    this.serviceType,
    required this.title,
    required this.description,
    required this.referencePrice,
    required this.status,
    this.expiresAt,
    this.createdAt,
    this.updatedAt,
    this.applicationCount = 0,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num?)?.toInt(),
      userFullName: json['userFullName']?.toString(),
      userAvatarUrl: json['userAvatarUrl']?.toString(),
      userHeadline: json['userHeadline']?.toString(),
      type: (json['type'] ?? 'BOOKING').toString(),
      serviceType: json['serviceType']?.toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      referencePrice: (json['referencePrice'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'OPEN').toString(),
      expiresAt: json['expiresAt']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      applicationCount: (json['applicationCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class ApplicationModel {
  final int id;
  final int postId;
  final String? postTitle;
  final int applicantId;
  final String? applicantFullName;
  final String? applicantAvatarUrl;
  final String? applicantHeadline;
  final String? applicantServiceTypes;
  final String? applicantPortfolioUrl;
  final String? applicantVoiceDemoUrl;
  final String? message;
  final double proposedPrice;
  final String status;
  final String? createdAt;

  ApplicationModel({
    required this.id,
    required this.postId,
    this.postTitle,
    required this.applicantId,
    this.applicantFullName,
    this.applicantAvatarUrl,
    this.applicantHeadline,
    this.applicantServiceTypes,
    this.applicantPortfolioUrl,
    this.applicantVoiceDemoUrl,
    this.message,
    required this.proposedPrice,
    required this.status,
    this.createdAt,
  });

  factory ApplicationModel.fromJson(Map<String, dynamic> json) {
    return ApplicationModel(
      id: (json['id'] as num).toInt(),
      postId: (json['postId'] as num).toInt(),
      postTitle: json['postTitle']?.toString(),
      applicantId: (json['applicantId'] as num).toInt(),
      applicantFullName: json['applicantFullName']?.toString(),
      applicantAvatarUrl: json['applicantAvatarUrl']?.toString(),
      applicantHeadline: json['applicantHeadline']?.toString(),
      applicantServiceTypes: json['applicantServiceTypes']?.toString(),
      applicantPortfolioUrl: json['applicantPortfolioUrl']?.toString(),
      applicantVoiceDemoUrl: json['applicantVoiceDemoUrl']?.toString(),
      message: json['message']?.toString(),
      proposedPrice: (json['proposedPrice'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'PENDING').toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class PostRepository {
  final ApiClient client;

  PostRepository({required this.client});

  /// 1. GET /api/v1/posts (Tìm kiếm / Lọc danh sách bài đăng)
  Future<List<PostModel>> searchPosts({
    String? type,
    String? serviceType,
    double? minPrice,
    double? maxPrice,
    String? keyword,
    int page = 0,
    int size = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
      if (type != null) 'type': type,
      if (serviceType != null) 'serviceType': serviceType,
      if (minPrice != null) 'minPrice': minPrice.toString(),
      if (maxPrice != null) 'maxPrice': maxPrice.toString(),
      'keyword': (keyword ?? '').trim(),
    };
    final res = await client.get('/api/v1/posts', queryParams: queryParams);
    final data = res['data'];
    if (data is Map<String, dynamic>) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems
            .map((e) => PostModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } else if (data is List) {
      return data.map((e) => PostModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. POST /api/v1/posts (Đăng bài mới)
  Future<PostModel> createPost({
    required String type,
    required String serviceType,
    required String title,
    required String description,
    required double referencePrice,
    String? expiresAt,
  }) async {
    final payload = <String, dynamic>{
      'type': type,
      'serviceType': serviceType,
      'title': title,
      'description': description,
      'referencePrice': referencePrice,
      if (expiresAt != null) 'expiresAt': expiresAt,
    };
    final res = await client.post('/api/v1/posts', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return PostModel.fromJson(data);
  }

  /// 3. GET /api/v1/posts/{id} (Xem chi tiết bài đăng)
  Future<PostModel> getPostById(int id) async {
    final res = await client.get('/api/v1/posts/$id');
    final data = res['data'] as Map<String, dynamic>;
    return PostModel.fromJson(data);
  }

  /// 4. PUT /api/v1/posts/{id} (Cập nhật bài đăng)
  Future<PostModel> updatePost(
    int id, {
    String? serviceType,
    String? title,
    String? description,
    double? referencePrice,
    String? expiresAt,
  }) async {
    final payload = <String, dynamic>{
      if (serviceType != null) 'serviceType': serviceType,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (referencePrice != null) 'referencePrice': referencePrice,
      if (expiresAt != null) 'expiresAt': expiresAt,
    };
    final res = await client.put('/api/v1/posts/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return PostModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/posts/{id} (Đóng / Xóa bài đăng)
  Future<void> deletePost(int id) async {
    await client.delete('/api/v1/posts/$id');
  }

  /// 6. GET /api/v1/posts/{id}/applications (Xem danh sách ứng viên)
  Future<List<ApplicationModel>> getApplicationsByPost(int id, {int page = 0, int size = 20}) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    final res = await client.get('/api/v1/posts/$id/applications', queryParams: queryParams);
    final data = res['data'];
    if (data is Map<String, dynamic>) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems
            .map((e) => ApplicationModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } else if (data is List) {
      return data.map((e) => ApplicationModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 7. POST /api/v1/posts/{id}/applications/{applicantId}/choose (Chọn ứng viên)
  Future<ApplicationModel> chooseApplicant(int id, int applicantId) async {
    final res = await client.post('/api/v1/posts/$id/applications/$applicantId/choose', body: {});
    final data = res['data'] as Map<String, dynamic>;
    return ApplicationModel.fromJson(data);
  }

  /// 8. POST /api/v1/posts/{id}/apply (Ứng tuyển bài đăng BOOKING)
  Future<ApplicationModel> applyToPost(
    int id, {
    required double proposedPrice,
    String? message,
  }) async {
    final payload = <String, dynamic>{
      'proposedPrice': proposedPrice,
      if (message != null) 'message': message,
    };
    final res = await client.post('/api/v1/posts/$id/apply', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ApplicationModel.fromJson(data);
  }

  /// 9. GET /api/v1/posts/applications/me (Danh sách các đơn ứng tuyển của tôi)
  Future<List<ApplicationModel>> getMyApplications({int page = 0, int size = 20}) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    final res = await client.get('/api/v1/posts/applications/me', queryParams: queryParams);
    final data = res['data'];
    if (data is Map<String, dynamic>) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems
            .map((e) => ApplicationModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } else if (data is List) {
      return data.map((e) => ApplicationModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 10. GET /api/v1/posts/me (Xem danh sách bài đăng của tôi)
  Future<List<PostModel>> getMyPosts({int page = 0, int size = 20}) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    final res = await client.get('/api/v1/posts/me', queryParams: queryParams);
    final data = res['data'];
    if (data is Map<String, dynamic>) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems
            .map((e) => PostModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } else if (data is List) {
      return data.map((e) => PostModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
