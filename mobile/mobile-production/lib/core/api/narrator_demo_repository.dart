import 'api_client.dart';

class NarratorDemoModel {
  final int id;
  final int narratorProfileId;
  final String title;
  final String fileUrl;
  final String? uploadedAt;

  NarratorDemoModel({
    required this.id,
    required this.narratorProfileId,
    required this.title,
    required this.fileUrl,
    this.uploadedAt,
  });

  factory NarratorDemoModel.fromJson(Map<String, dynamic> json) {
    return NarratorDemoModel(
      id: (json['id'] as num).toInt(),
      narratorProfileId: (json['narratorProfileId'] as num).toInt(),
      title: (json['title'] ?? '').toString(),
      fileUrl: (json['fileUrl'] ?? '').toString(),
      uploadedAt: json['uploadedAt']?.toString(),
    );
  }
}

class NarratorDemoRepository {
  final ApiClient client;

  NarratorDemoRepository({required this.client});

  /// 1. GET /api/v1/narrator-demos
  Future<List<NarratorDemoModel>> getAll() async {
    final res = await client.get('/api/v1/narrator-demos');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => NarratorDemoModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. GET /api/v1/narrator-demos/{id}
  Future<NarratorDemoModel> getById(int id) async {
    final res = await client.get('/api/v1/narrator-demos/$id');
    final data = res['data'] as Map<String, dynamic>;
    return NarratorDemoModel.fromJson(data);
  }

  /// 3. POST /api/v1/narrator-demos
  Future<NarratorDemoModel> create({
    required int narratorProfileId,
    required String title,
    required String fileUrl,
  }) async {
    final payload = <String, dynamic>{
      'narratorProfileId': narratorProfileId,
      'title': title,
      'fileUrl': fileUrl,
    };
    final res = await client.post('/api/v1/narrator-demos', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return NarratorDemoModel.fromJson(data);
  }

  /// 4. PUT /api/v1/narrator-demos/{id}
  Future<NarratorDemoModel> update(
    int id, {
    int? narratorProfileId,
    String? title,
    String? fileUrl,
  }) async {
    final payload = <String, dynamic>{
      if (narratorProfileId != null) 'narratorProfileId': narratorProfileId,
      if (title != null) 'title': title,
      if (fileUrl != null) 'fileUrl': fileUrl,
    };
    final res = await client.put('/api/v1/narrator-demos/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return NarratorDemoModel.fromJson(data);
  }

  /// 5. DELETE /api/v1/narrator-demos/{id}
  Future<void> delete(int id) async {
    await client.delete('/api/v1/narrator-demos/$id');
  }
}
