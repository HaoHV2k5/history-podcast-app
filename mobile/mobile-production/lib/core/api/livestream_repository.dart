import 'api_client.dart';

class LivestreamSessionModel {
  final int id;
  final int channelId;
  final String channelName;
  final String? channelAvatarUrl;
  final int? creatorId;
  final String? creatorName;
  final String title;
  final String? description;
  final String? thumbnailUrl;
  final String agoraChannelName;
  final String status;
  final bool isExclusive;
  final int viewerCount;
  final String? startedAt;
  final String? endedAt;
  final String? createdAt;

  LivestreamSessionModel({
    required this.id,
    required this.channelId,
    this.channelName = '',
    this.channelAvatarUrl,
    this.creatorId,
    this.creatorName,
    required this.title,
    this.description,
    this.thumbnailUrl,
    required this.agoraChannelName,
    required this.status,
    this.isExclusive = false,
    this.viewerCount = 0,
    this.startedAt,
    this.endedAt,
    this.createdAt,
  });

  LivestreamSessionModel copyWith({
    int? id,
    int? channelId,
    String? channelName,
    String? channelAvatarUrl,
    int? creatorId,
    String? creatorName,
    String? title,
    String? description,
    String? thumbnailUrl,
    String? agoraChannelName,
    String? status,
    bool? isExclusive,
    int? viewerCount,
    String? startedAt,
    String? endedAt,
    String? createdAt,
  }) {
    return LivestreamSessionModel(
      id: id ?? this.id,
      channelId: channelId ?? this.channelId,
      channelName: channelName ?? this.channelName,
      channelAvatarUrl: channelAvatarUrl ?? this.channelAvatarUrl,
      creatorId: creatorId ?? this.creatorId,
      creatorName: creatorName ?? this.creatorName,
      title: title ?? this.title,
      description: description ?? this.description,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      agoraChannelName: agoraChannelName ?? this.agoraChannelName,
      status: status ?? this.status,
      isExclusive: isExclusive ?? this.isExclusive,
      viewerCount: viewerCount ?? this.viewerCount,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory LivestreamSessionModel.fromJson(Map<String, dynamic> json) {
    return LivestreamSessionModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      channelId: (json['channelId'] as num?)?.toInt() ?? 0,
      channelName: (json['channelName'] ?? '').toString(),
      channelAvatarUrl: json['channelAvatarUrl']?.toString(),
      creatorId: (json['creatorId'] as num?)?.toInt(),
      creatorName: json['creatorName']?.toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      agoraChannelName: (json['agoraChannelName'] ?? '').toString(),
      status: (json['status'] ?? 'LIVE').toString(),
      isExclusive: json['isExclusive'] == true,
      viewerCount: (json['viewerCount'] as num?)?.toInt() ?? 0,
      startedAt: json['startedAt']?.toString(),
      endedAt: json['endedAt']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class LivestreamTokenModel {
  final String appId;
  final String agoraChannelName;
  final String token;
  final int clientUid;
  final String role;
  final int expirationSeconds;
  final String? expiresAt;

  int get uid => clientUid;

  LivestreamTokenModel({
    this.appId = '',
    required this.agoraChannelName,
    required this.token,
    required this.clientUid,
    required this.role,
    this.expirationSeconds = 3600,
    this.expiresAt,
  });

  factory LivestreamTokenModel.fromJson(Map<String, dynamic> json) {
    final parsedUid =
        (json['uid'] as num?)?.toInt() ??
        (json['clientUid'] as num?)?.toInt() ??
        0;
    return LivestreamTokenModel(
      appId: (json['appId'] ?? '').toString(),
      agoraChannelName: (json['agoraChannelName'] ?? '').toString(),
      token: (json['token'] ?? '').toString(),
      clientUid: parsedUid,
      role: (json['role'] ?? 'SUBSCRIBER').toString(),
      expirationSeconds: (json['expirationSeconds'] as num?)?.toInt() ?? 3600,
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
  final String? timeFormatted;

  LivestreamChatMessage({
    required this.id,
    required this.author,
    required this.role,
    required this.text,
    required this.timestamp,
    this.timeFormatted,
  });

  factory LivestreamChatMessage.fromJson(Map<String, dynamic> json) {
    return LivestreamChatMessage(
      id: (json['id'] ?? '').toString(),
      author: (json['author'] ?? '').toString(),
      role: (json['role'] ?? 'VIEWER').toString(),
      text: (json['text'] ?? '').toString(),
      timestamp: (json['timestamp'] as num?)?.toInt() ?? 0,
      timeFormatted: json['timeFormatted']?.toString(),
    );
  }
}

class LivestreamRepository {
  final ApiClient client;

  LivestreamRepository({required this.client});

  /// 1. Danh sách phiên livestream (GET /api/v1/livestreams)
  Future<List<LivestreamSessionModel>> getLivestreams({
    String? status,
    int? channelId,
    int page = 0,
    int size = 10,
  }) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
      'status': ?status,
      if (channelId != null) 'channelId': channelId.toString(),
    };
    final res = await client.get('/api/v1/livestreams', queryParams: query);
    final data = res['data'];
    if (data is Map) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems
            .map((e) => LivestreamSessionModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } else if (data is List) {
      return data
          .map((e) => LivestreamSessionModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// 2. Tạo phiên livestream mới (POST /api/v1/livestreams)
  Future<LivestreamSessionModel> createSession({
    required int channelId,
    required String title,
    String? description,
    String? thumbnailUrl,
    bool isExclusive = false,
  }) async {
    final payload = {
      'channelId': channelId,
      'title': title,
      if (description != null && description.isNotEmpty) 'description': description,
      if (thumbnailUrl != null && thumbnailUrl.isNotEmpty) 'thumbnailUrl': thumbnailUrl,
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
    final endpoint = clientUid != null
        ? '/api/v1/livestreams/$id/join?clientUid=$clientUid'
        : '/api/v1/livestreams/$id/join';
    final res = await client.post(endpoint);
    final data = res['data'] as Map<String, dynamic>;
    return LivestreamTokenModel.fromJson(data);
  }

  /// 5. Rời phòng livestream (POST /api/v1/livestreams/{id}/leave)
  Future<LivestreamSessionModel> leaveSession(int id, {bool reset = false}) async {
    final res = await client.post('/api/v1/livestreams/$id/leave?reset=$reset');
    final data = res['data'] as Map<String, dynamic>;
    return LivestreamSessionModel.fromJson(data);
  }

  /// 6. Kết thúc phiên livestream (POST /api/v1/livestreams/{id}/end)
  Future<LivestreamSessionModel> endSession(int id) async {
    final res = await client.post('/api/v1/livestreams/$id/end');
    final data = res['data'] as Map<String, dynamic>;
    return LivestreamSessionModel.fromJson(data);
  }

  /// 7. Gửi tin nhắn Live Chat (POST /api/v1/livestreams/{id}/chats)
  Future<void> sendChatMessage(
    int id, {
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

  /// 8. Lấy tin nhắn Live Chat (GET /api/v1/livestreams/{id}/chats)
  Future<List<LivestreamChatMessage>> getChatMessages(int id, {int since = 0}) async {
    final res = await client.get(
      '/api/v1/livestreams/$id/chats',
      queryParams: {'since': since.toString()},
    );
    final data = res['data'];
    if (data is List) {
      return data
          .map((e) => LivestreamChatMessage.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}
