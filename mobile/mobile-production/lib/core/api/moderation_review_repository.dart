import 'api_client.dart';

class ModerationReviewModel {
  final int id;
  final int? artifactId;
  final int? moderatorId;
  final String decision;
  final String? reason;
  final bool escalated;
  final String? reviewedAt;

  ModerationReviewModel({
    required this.id,
    this.artifactId,
    this.moderatorId,
    required this.decision,
    this.reason,
    this.escalated = false,
    this.reviewedAt,
  });

  factory ModerationReviewModel.fromJson(Map<String, dynamic> json) {
    return ModerationReviewModel(
      id: (json['id'] as num).toInt(),
      artifactId: (json['artifactId'] as num?)?.toInt(),
      moderatorId: (json['moderatorId'] as num?)?.toInt(),
      decision: (json['decision'] ?? 'PENDING').toString(),
      reason: json['reason']?.toString(),
      escalated: json['escalated'] == true,
      reviewedAt: json['reviewedAt']?.toString(),
    );
  }
}

class ModerationReviewRepository {
  final ApiClient client;

  ModerationReviewRepository({required this.client});

  /// 1. GET /api/v1/moderation-reviews
  Future<List<ModerationReviewModel>> getAll() async {
    final res = await client.get('/api/v1/moderation-reviews');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => ModerationReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/moderation-reviews/{id}
  Future<ModerationReviewModel> getById(int id) async {
    final res = await client.get('/api/v1/moderation-reviews/$id');
    final data = res['data'] as Map<String, dynamic>;
    return ModerationReviewModel.fromJson(data);
  }

  /// 3. POST /api/v1/moderation-reviews
  Future<ModerationReviewModel> create({
    required int artifactId,
    required String decision,
    String? reason,
    bool escalated = false,
  }) async {
    final payload = <String, dynamic>{
      'artifactId': artifactId,
      'decision': decision,
      if (reason != null) 'reason': reason,
      'escalated': escalated,
    };
    final res = await client.post('/api/v1/moderation-reviews', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ModerationReviewModel.fromJson(data);
  }

  /// 4. PUT /api/v1/moderation-reviews/{id}
  Future<ModerationReviewModel> update(
    int id, {
    int? artifactId,
    String? decision,
    String? reason,
    bool? escalated,
  }) async {
    final payload = <String, dynamic>{
      if (artifactId != null) 'artifactId': artifactId,
      if (decision != null) 'decision': decision,
      if (reason != null) 'reason': reason,
      if (escalated != null) 'escalated': escalated,
    };
    final res = await client.put('/api/v1/moderation-reviews/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ModerationReviewModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/moderation-reviews/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/moderation-reviews/$id');
  }
}
