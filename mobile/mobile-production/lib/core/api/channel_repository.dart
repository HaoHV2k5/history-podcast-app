import 'api_client.dart';

class ChannelModel {
  final int id;
  final int? creatorId;
  final String name;
  final String description;
  final String? avatarUrl;
  final String? coverUrl;
  final String? status;
  final String? createdAt;
  final String? updatedAt;

  ChannelModel({
    required this.id,
    this.creatorId,
    required this.name,
    required this.description,
    this.avatarUrl,
    this.coverUrl,
    this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory ChannelModel.fromJson(Map<String, dynamic> json) {
    return ChannelModel(
      id: (json['id'] as num).toInt(),
      creatorId: (json['creatorId'] as num?)?.toInt(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      coverUrl: json['coverUrl']?.toString(),
      status: json['status']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class MembershipPlanModel {
  final int id;
  final int channelId;
  final String? channelName;
  final String name;
  final String? description;
  final double monthlyPrice;
  final List<String> perks;
  final String? status;
  final String? createdAt;

  MembershipPlanModel({
    required this.id,
    required this.channelId,
    this.channelName,
    required this.name,
    this.description,
    required this.monthlyPrice,
    this.perks = const [],
    this.status,
    this.createdAt,
  });

  factory MembershipPlanModel.fromJson(Map<String, dynamic> json) {
    return MembershipPlanModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      channelId: (json['channelId'] as num?)?.toInt() ?? 0,
      channelName: json['channelName']?.toString(),
      name: (json['name'] ?? json['planName'] ?? '').toString(),
      description: json['description']?.toString(),
      monthlyPrice: (json['monthlyPrice'] as num?)?.toDouble() ?? 0.0,
      perks: (json['perks'] as List?)?.map((e) => e.toString()).toList() ?? [],
      status: json['status']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }

  String get planName => name;
  bool get isActive =>
      status == null ||
      status!.toUpperCase() == 'ACTIVE' ||
      status!.toUpperCase() == 'PUBLISHED';
}

class ChannelRepository {
  final ApiClient client;

  ChannelRepository({required this.client});

  /// 1. Tạo kênh Podcast mới (POST /api/v1/channels)
  Future<ChannelModel> createChannel({
    required String name,
    required String description,
    String? avatarUrl,
    String? coverUrl,
  }) async {
    final payload = {
      'name': name,
      'description': description,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (coverUrl != null) 'coverUrl': coverUrl,
    };
    final res = await client.post('/api/v1/channels', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ChannelModel.fromJson(data);
  }

  /// 4. Lấy thông tin kênh của tôi (GET /api/v1/channels/me)
  Future<ChannelModel> getMyChannel() async {
    final res = await client.get('/api/v1/channels/me');
    final data = res['data'] as Map<String, dynamic>;
    return ChannelModel.fromJson(data);
  }

  /// 5. Xem chi tiết kênh theo ID (GET /api/v1/channels/{id})
  Future<ChannelModel> getChannelById(int id) async {
    final res = await client.get('/api/v1/channels/$id');
    final data = res['data'] as Map<String, dynamic>;
    return ChannelModel.fromJson(data);
  }

  /// 6. Danh sách tất cả các kênh công khai (GET /api/v1/channels)
  Future<List<ChannelModel>> getAllChannels({int page = 0, int size = 10}) async {
    final res = await client.get('/api/v1/channels', queryParams: {
      'page': page.toString(),
      'size': size.toString(),
    });
    final data = res['data'];
    if (data is Map) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems.map((e) => ChannelModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } else if (data is List) {
      return data.map((e) => ChannelModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 7. Cập nhật thông tin kênh (PUT /api/v1/channels/{id})
  Future<ChannelModel> updateChannel(
    int id, {
    String? name,
    String? description,
    String? avatarUrl,
    String? coverUrl,
  }) async {
    final payload = {
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (coverUrl != null) 'coverUrl': coverUrl,
    };
    final res = await client.put('/api/v1/channels/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ChannelModel.fromJson(data);
  }

  // --- Channel Membership Plan ---

  /// Xem thông tin gói hội viên công khai (GET /api/v1/channels/{channelId}/memberships/membership-plans)
  Future<MembershipPlanModel?> getChannelMembershipPlan(int channelId) async {
    try {
      final res = await client.get('/api/v1/channels/$channelId/memberships/membership-plans');
      final data = res['data'] as Map<String, dynamic>?;
      if (data == null) return null;
      return MembershipPlanModel.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  /// Creator cấu hình gói hội viên kênh (POST /api/v1/channels/{channelId}/memberships/membership-plans)
  Future<MembershipPlanModel> upsertChannelMembershipPlan(
    int channelId, {
    required String name,
    String? description,
    required double monthlyPrice,
    List<String> perks = const [],
    String status = 'ACTIVE',
  }) async {
    final payload = {
      'name': name,
      if (description != null) 'description': description,
      'monthlyPrice': monthlyPrice,
      'perks': perks,
      'status': status,
    };
    final res = await client.post(
      '/api/v1/channels/$channelId/memberships/membership-plans',
      body: payload,
    );
    final data = res['data'] as Map<String, dynamic>;
    return MembershipPlanModel.fromJson(data);
  }
}
