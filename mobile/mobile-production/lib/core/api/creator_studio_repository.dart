import 'api_client.dart';

class CreatorAiSettingModel {
  final String? geminiApiKey;
  final String? elevenLabsApiKey;
  final String? preferredVoiceId;
  final String? voiceProvider;

  CreatorAiSettingModel({
    this.geminiApiKey,
    this.elevenLabsApiKey,
    this.preferredVoiceId,
    this.voiceProvider,
  });

  factory CreatorAiSettingModel.fromJson(Map<String, dynamic> json) {
    return CreatorAiSettingModel(
      geminiApiKey: json['geminiApiKey']?.toString(),
      elevenLabsApiKey: json['elevenLabsApiKey']?.toString(),
      preferredVoiceId: json['preferredVoiceId']?.toString(),
      voiceProvider: json['voiceProvider']?.toString(),
    );
  }
}

class CreatorVoiceModel {
  final String voiceId;
  final String name;
  final String? provider;
  final String? previewAudioUrl;
  final String? description;

  CreatorVoiceModel({
    required this.voiceId,
    required this.name,
    this.provider,
    this.previewAudioUrl,
    this.description,
  });

  factory CreatorVoiceModel.fromJson(Map<String, dynamic> json) {
    return CreatorVoiceModel(
      voiceId: (json['voiceId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      provider: json['provider']?.toString(),
      previewAudioUrl: json['previewAudioUrl']?.toString(),
      description: json['description']?.toString(),
    );
  }
}

class CreatorStudioRepository {
  final ApiClient client;

  CreatorStudioRepository({required this.client});

  /// 1. Lấy cấu hình AI (GET /api/v1/creator/studio/settings)
  Future<CreatorAiSettingModel> getSettings() async {
    final res = await client.get('/api/v1/creator/studio/settings');
    final data = res['data'] as Map<String, dynamic>;
    return CreatorAiSettingModel.fromJson(data);
  }

  /// 2. Lưu / Cập nhật cấu hình AI (PUT /api/v1/creator/studio/settings)
  Future<CreatorAiSettingModel> saveSettings({
    String? geminiApiKey,
    String? elevenLabsApiKey,
    String? preferredVoiceId,
    String? voiceProvider,
  }) async {
    final payload = {
      if (geminiApiKey != null) 'geminiApiKey': geminiApiKey,
      if (elevenLabsApiKey != null) 'elevenLabsApiKey': elevenLabsApiKey,
      if (preferredVoiceId != null) 'preferredVoiceId': preferredVoiceId,
      if (voiceProvider != null) 'voiceProvider': voiceProvider,
    };
    final res = await client.put('/api/v1/creator/studio/settings', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return CreatorAiSettingModel.fromJson(data);
  }

  /// 3. Thẩm định kịch bản sử liệu & Gợi ý prompt thumbnail (POST /api/v1/creator/studio/verify-script)
  Future<Map<String, dynamic>> verifyScript(String script) async {
    final res = await client.post('/api/v1/creator/studio/verify-script', body: {'script': script});
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// 4. Tạo kịch bản và gợi ý prompt - Storyboard (POST /api/v1/creator/studio/storyboard)
  Future<dynamic> generateStoryboard(Map<String, dynamic> request) async {
    final res = await client.post('/api/v1/creator/studio/storyboard', body: request);
    return res['data'];
  }

  /// 5. Chấp nhận kịch bản & Xuất bản Video / Lưu DB (POST /api/v1/creator/studio/render)
  Future<Map<String, dynamic>> renderVideo(Map<String, dynamic> request) async {
    final res = await client.post('/api/v1/creator/studio/render', body: request);
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// 6. Kiểm tra tiến trình render video (GET /api/v1/creator/studio/jobs/{jobId})
  Future<Map<String, dynamic>> getJobStatus(String jobId, {int? artifactId}) async {
    final query = <String, String>{
      if (artifactId != null) 'artifactId': artifactId.toString(),
    };
    final res = await client.get('/api/v1/creator/studio/jobs/$jobId', queryParams: query.isNotEmpty ? query : null);
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// 7. Danh sách video của Creator (GET /api/v1/creator/studio/videos)
  Future<List<dynamic>> getVideos({String? keyword, String? status, bool? isExclusive}) async {
    final query = <String, String>{
      if (keyword != null) 'keyword': keyword,
      if (status != null) 'status': status,
      if (isExclusive != null) 'isExclusive': isExclusive.toString(),
    };
    final res = await client.get('/api/v1/creator/studio/videos', queryParams: query.isNotEmpty ? query : null);
    final data = res['data'];
    if (data is List) return data;
    return [];
  }

  /// 8. Chi tiết video và tương tác (GET /api/v1/creator/studio/videos/{contentId})
  Future<Map<String, dynamic>> getVideoDetail(int contentId) async {
    final res = await client.get('/api/v1/creator/studio/videos/$contentId');
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// 9. Chỉnh sửa thông tin video (PUT /api/v1/creator/studio/videos/{contentId})
  Future<Map<String, dynamic>> updateVideo(int contentId, Map<String, dynamic> request) async {
    final res = await client.put('/api/v1/creator/studio/videos/$contentId', body: request);
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// 10. Danh sách bình luận của video (GET /api/v1/creator/studio/videos/{contentId}/comments)
  Future<List<dynamic>> getVideoComments(int contentId) async {
    final res = await client.get('/api/v1/creator/studio/videos/$contentId/comments');
    final data = res['data'];
    if (data is List) return data;
    return [];
  }

  /// 11. Gửi video kiểm duyệt AI Shield & Xuất bản (POST /api/v1/creator/studio/videos/{contentId}/submit-publish)
  Future<Map<String, dynamic>> submitVideoForPublish(int contentId) async {
    final res = await client.post('/api/v1/creator/studio/videos/$contentId/submit-publish');
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// 12. Ẩn hoặc Hiện video (PATCH /api/v1/creator/studio/videos/{contentId}/visibility)
  Future<Map<String, dynamic>> updateVisibility(int contentId, bool hidden) async {
    final res = await client.patch('/api/v1/creator/studio/videos/$contentId/visibility', body: {'hidden': hidden});
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// 13. Thư viện giọng đọc AI cho thuyết minh sử Việt (GET /api/v1/creator/studio/voices)
  Future<List<CreatorVoiceModel>> getVoices() async {
    final res = await client.get('/api/v1/creator/studio/voices');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => CreatorVoiceModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 14. Tạo bản nghe thử giọng đọc trực tiếp (POST /api/v1/creator/studio/voices/preview)
  Future<Map<String, dynamic>> previewVoice({
    required String voiceId,
    required String text,
    String? provider,
  }) async {
    final payload = {
      'voiceId': voiceId,
      'text': text,
      if (provider != null) 'provider': provider,
    };
    final res = await client.post('/api/v1/creator/studio/voices/preview', body: payload);
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  // ==========================================
  // Whiteboard Media Streaming (2 endpoints)
  // ==========================================

  /// 15. GET /api/v1/creator/studio/outputs/{jobId}/{fileName} hoặc /outputs/{jobId}/{fileName}
  String getWhiteboardMediaStreamUrl(String jobId, String fileName) {
    return '${client.baseUrl}/api/v1/creator/studio/outputs/$jobId/$fileName';
  }
}
