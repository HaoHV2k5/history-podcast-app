import 'api_client.dart';

class TranscriptModel {
  final int id;
  final int artifactId;
  final String textBody;
  final String? createdAt;

  TranscriptModel({
    required this.id,
    required this.artifactId,
    required this.textBody,
    this.createdAt,
  });

  factory TranscriptModel.fromJson(Map<String, dynamic> json) {
    return TranscriptModel(
      id: (json['id'] as num).toInt(),
      artifactId: (json['artifactId'] as num).toInt(),
      textBody: (json['textBody'] ?? '').toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class TranscriptRepository {
  final ApiClient client;

  TranscriptRepository({required this.client});

  /// 1. GET /api/v1/transcripts
  Future<List<TranscriptModel>> getAll() async {
    final res = await client.get('/api/v1/transcripts');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => TranscriptModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/transcripts/{id}
  Future<TranscriptModel> getById(int id) async {
    final res = await client.get('/api/v1/transcripts/$id');
    final data = res['data'] as Map<String, dynamic>;
    return TranscriptModel.fromJson(data);
  }

  /// 3. POST /api/v1/transcripts
  Future<TranscriptModel> create({
    required int artifactId,
    required String textBody,
  }) async {
    final payload = <String, dynamic>{
      'artifactId': artifactId,
      'textBody': textBody,
    };
    final res = await client.post('/api/v1/transcripts', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return TranscriptModel.fromJson(data);
  }

  /// 4. PUT /api/v1/transcripts/{id}
  Future<TranscriptModel> update(
    int id, {
    int? artifactId,
    String? textBody,
  }) async {
    final payload = <String, dynamic>{
      if (artifactId != null) 'artifactId': artifactId,
      if (textBody != null) 'textBody': textBody,
    };
    final res = await client.put('/api/v1/transcripts/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return TranscriptModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/transcripts/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/transcripts/$id');
  }
}
