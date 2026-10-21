import 'api_client.dart';

class LivestreamSessionModel {
  final int id;
  final int channelId;
  final String title;
  final String? description;
  final String agoraChannelName;
  final String status;
  final bool isExclusive;
  final String? startedAt;
  final String? endedAt;

  LivestreamSessionModel({
    required this.id,
    required this.channelId,
    required this.title,
    this.description,
    required this.agoraChannelName,
    required this.status,
    this.isExclusive = false,
    this.startedAt,
    this.endedAt,
  });

  factory LivestreamSessionModel.fromJson(Map<String, dynamic> json) {
    return LivestreamSessionModel(
      id: (json['id'] as num).toInt(),
      channelId: (json['channelId'] as num).toInt(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      agoraChannelName: (json['agoraChannelName'] ?? '').toString(),
      status: (json['status'] ?? 'LIVE').toString(),
      isExclusive: json['isExclusive'] == true,
      startedAt: json['startedAt']?.toString(),
      endedAt: json['endedAt']?.toString(),
    );
  }
}

class LivestreamTokenModel {
  final String agoraChannelName;
  final String token;
  final int clientUid;
  final String role;
  final String? expiresAt;

  LivestreamTokenModel({
    required this.agoraChannelName,
    required this.token,
    required this.clientUid,
    required this.role,
    this.expiresAt,
  });

  factory LivestreamTokenModel.fromJson(Map<String, dynamic> json) {
    return LivestreamTokenModel(
      agoraChannelName: (json['agoraChannelName'] ?? '').toString(),
      token: (json['token'] ?? '').toString(),
      clientUid: (json['clientUid'] as num?)?.toInt() ?? 0,
      role: (json['role'] ?? 'SUBSCRIBER').toString(),
      expiresAt: json['expiresAt']?.toString(),
    );
  }
}

class LivestreamChatMessage {
  final String id;
  final String author;
  final String role;
  final String text;
  final int timestamp;

  LivestreamChatMessage({
    required this.id,
    required this.author,
    required this.role,
    required this.text,
    required this.timestamp,
  });

  factory LivestreamChatMessage.fromJson(Map<String, dynamic> json) {
    return LivestreamChatMessage(
      id: (json['id'] ?? '').toString(),
      author: (json['author'] ?? '').toString(),
      role: (json['role'] ?? 'VIEWER').toString(),
      text: (json['text'] ?? '').toString(),
      timestamp: (json['timestamp'] as num?)?.toInt() ?? 0,
    );
  }
}

class LivestreamRepository {
  final ApiClient client;

  LivestreamRepository({required this.client});

  /// 1. Danh sách phiên livestream (GET /api/v1/livestreams)
  Future<List<LivestreamSessionModel>> getLivestreams({String? status, int? channelId, int page = 0, int size = 10}) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
      if (status != null) 'status': status,
      if (channelId != null) 'channelId': channelId.toString(),
    };
    final res = await client.get('/api/v1/livestreams', queryParams: query);
    final data = res['data'];
    if (data is Map && data.containsKey('content')) {
      final items = data['content'] as List;
      return items.map((e) => LivestreamSessionModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is List) {
      return data.map((e) => LivestreamSessionModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. Tạo phiên livestream mới (POST /api/v1/livestreams)
  Future<LivestreamSessionModel> createSession({
    required int channelId,
    required String title,
    String? description,
    bool isExclusive = false,
  }) async {
    final payload = {
      'channelId': channelId,
      'title': title,
      if (description != null) 'description': description,
      'isExclusive': isExclusive,
    };
    final res = await client.post('/api/v1/livestreams', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return LivestreamSessionModel.fromJson(data);
  }

  /// 3. Chi tiết phiên livestream (GET /api/v1/livestreams/{id})
  Future<LivestreamSessionModel> getSession(int id) async {
    final res = await client.get('/api/v1/livestreams/$id');
    final data = res['data'] as Map<String, dynamic>;
    return LivestreamSessionModel.fromJson(data);
  }

  /// 4. Tham gia / Lấy Token kết nối Agora (POST /api/v1/livestreams/{id}/join)
  Future<LivestreamTokenModel> getJoinToken(int id, {int? clientUid}) async {
    final query = <String, String>{
      if (clientUid != null) 'clientUid': clientUid.toString(),
    };
    final res = await client.post('/api/v1/livestreams/$id/join', body: query.isNotEmpty ? query : null);
    final data = res['data'] as Map<String, dynamic>;
    return LivestreamTokenModel.fromJson(data);
  }

  /// 5. Kết thúc phiên livestream (POST /api/v1/livestreams/{id}/end)
  Future<LivestreamSessionModel> endSession(int id) async {
    final res = await client.post('/api/v1/livestreams/$id/end');
    final data = res['data'] as Map<String, dynamic>;
    return LivestreamSessionModel.fromJson(data);
  }

  /// 6. Gửi tin nhắn Live Chat (POST /api/v1/livestreams/{id}/chats)
  Future<void> sendChatMessage(int id, {
    required String messageId,
    required String author,
    required String role,
    required String text,
  }) async {
    final payload = {
      'id': messageId,
      'author': author,
      'role': role,
      'text': text,
    };
    await client.post('/api/v1/livestreams/$id/chats', body: payload);
  }

  /// 7. Lấy tin nhắn Live Chat (GET /api/v1/livestreams/{id}/chats)
  Future<List<LivestreamChatMessage>> getChatMessages(int id, {int since = 0}) async {
    final res = await client.get('/api/v1/livestreams/$id/chats', queryParams: {'since': since.toString()});
    final data = res['data'];
    if (data is List) {
      return data.map((e) => LivestreamChatMessage.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
