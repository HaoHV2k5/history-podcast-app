import 'api_client.dart';

class CommentModel {
  final int id;
  final int? artifactId;
  final int? userId;
  final int? parentCommentId;
  final String textBody;
  final String? status;
  final String? createdAt;
  final String? authorName;

  CommentModel({
    required this.id,
    this.artifactId,
    this.userId,
    this.parentCommentId,
    required this.textBody,
    this.status,
    this.createdAt,
    this.authorName,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: (json['id'] as num).toInt(),
      artifactId: (json['artifactId'] as num?)?.toInt(),
      userId: (json['userId'] as num?)?.toInt(),
      parentCommentId: (json['parentCommentId'] as num?)?.toInt(),
      textBody: (json['textBody'] ?? '').toString(),
      status: json['status']?.toString(),
      createdAt: json['createdAt']?.toString(),
      authorName: json['authorName']?.toString(),
    );
  }
}

class CommentRepository {
  final ApiClient client;

  CommentRepository({required this.client});

  Future<List<CommentModel>> getComments({int? artifactId}) async {
    final Map<String, String> params = {};
    if (artifactId != null) {
      params['artifactId'] = artifactId.toString();
    }
    final res = await client.get('/api/v1/comments', queryParams: params.isNotEmpty ? params : null);
    final data = res['data'];
    if (data is List) {
      return data.map((e) => CommentModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<CommentModel> getCommentById(int id) async {
    final res = await client.get('/api/v1/comments/$id');
    final data = res['data'] as Map<String, dynamic>;
    return CommentModel.fromJson(data);
  }

  Future<CommentModel> createComment({
    required int? artifactId,
    required String textBody,
    int? parentCommentId,
  }) async {
    final payload = {
      if (artifactId != null) 'artifactId': artifactId,
      if (parentCommentId != null) 'parentCommentId': parentCommentId,
      'textBody': textBody,
      'status': 'ACTIVE',
      'createdAt': DateTime.now().toUtc().toIso8601String(),
    };
    final res = await client.post('/api/v1/comments', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return CommentModel.fromJson(data);
  }

  Future<CommentModel> updateComment(int id, {required String textBody}) async {
    final payload = {
      'textBody': textBody,
    };
    final res = await client.put('/api/v1/comments/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return CommentModel.fromJson(data);
  }

  Future<void> deleteComment(int id) async {
    await client.delete('/api/v1/comments/$id');
  }
}
