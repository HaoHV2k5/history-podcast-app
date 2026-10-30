import 'api_client.dart';

class SeriesItemModel {
  final int id;
  final int contentId;
  final String title;
  final int duration;
  final String? thumbnailUrl;
  final String? mediaUrl;
  final String? description;
  final bool isExclusive;
  final int orderNo;

  SeriesItemModel({
    required this.id,
    required this.contentId,
    required this.title,
    required this.duration,
    this.thumbnailUrl,
    this.mediaUrl,
    this.description,
    this.isExclusive = false,
    required this.orderNo,
  });

  int get durationSeconds => duration;

  factory SeriesItemModel.fromJson(Map<String, dynamic> json) {
    return SeriesItemModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      contentId: (json['contentId'] as num?)?.toInt() ?? 0,
      title: (json['title'] ?? '').toString(),
      duration:
          ((json['durationSeconds'] ?? json['duration']) as num?)?.toInt() ?? 0,
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      mediaUrl: (json['mediaUrl'] ?? json['fileUrl'])?.toString(),
      description: json['description']?.toString(),
      isExclusive: json['isExclusive'] == true,
      orderNo: (json['orderNo'] as num?)?.toInt() ?? 0,
    );
  }
}

typedef SeriesDetailModel = SeriesModel;

class SeriesModel {
  final int id;
  final int channelId;
  final String? channelName;
  final String title;
  final String? description;
  final String? coverUrl;
  final String status;
  final int itemCount;
  final int totalDurationSeconds;
  final List<SeriesItemModel> items;
  final String? createdAt;

  SeriesModel({
    required this.id,
    required this.channelId,
    this.channelName,
    required this.title,
    this.description,
    this.coverUrl,
    required this.status,
    required this.itemCount,
    required this.totalDurationSeconds,
    this.items = const [],
    this.createdAt,
  });

  factory SeriesModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return SeriesModel(
      id: (json['id'] as num).toInt(),
      channelId: (json['channelId'] as num).toInt(),
      channelName: json['channelName']?.toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      coverUrl: json['coverUrl']?.toString(),
      status: (json['status'] ?? 'PUBLISHED').toString(),
      itemCount: (json['itemCount'] as num?)?.toInt() ?? 0,
      totalDurationSeconds: (json['totalDurationSeconds'] as num?)?.toInt() ?? 0,
      items: rawItems.map((e) => SeriesItemModel.fromJson(e as Map<String, dynamic>)).toList(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class CreatorSeriesRepository {
  final ApiClient client;

  CreatorSeriesRepository({required this.client});

  /// 1. Danh sách Series của Creator (GET /api/v1/creator/series)
  Future<List<SeriesModel>> getMySeries() async {
    final res = await client.get('/api/v1/creator/series');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => SeriesModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 2. Tạo Series mới (POST /api/v1/creator/series)
  Future<SeriesModel> createSeries({
    required String title,
    String? description,
    String? coverUrl,
    String status = 'PUBLISHED',
    List<int> contentIds = const [],
  }) async {
    final payload = {
      'title': title,
      if (description != null) 'description': description,
      if (coverUrl != null) 'coverUrl': coverUrl,
      'status': status,
      if (contentIds.isNotEmpty) 'contentIds': contentIds,
    };
    final res = await client.post('/api/v1/creator/series', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return SeriesModel.fromJson(data);
  }

  /// 3. Chi tiết Series (GET /api/v1/creator/series/{seriesId})
  Future<SeriesModel> getSeriesDetail(int seriesId) async {
    final res = await client.get('/api/v1/creator/series/$seriesId');
    final data = res['data'] as Map<String, dynamic>;
    return SeriesModel.fromJson(data);
  }

  /// 4. Cập nhật thông tin Series (PUT /api/v1/creator/series/{seriesId})
  Future<SeriesModel> updateSeries(
    int seriesId, {
    String? title,
    String? description,
    String? coverUrl,
    String? status,
  }) async {
    final payload = {
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (coverUrl != null) 'coverUrl': coverUrl,
      if (status != null) 'status': status,
    };
    final res = await client.put('/api/v1/creator/series/$seriesId', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return SeriesModel.fromJson(data);
  }

  /// 5. Xóa Series (DELETE /api/v1/creator/series/{seriesId})
  Future<void> deleteSeries(int seriesId) async {
    await client.delete('/api/v1/creator/series/$seriesId');
  }

  /// 6. Thêm video vào Series (POST /api/v1/creator/series/{seriesId}/items)
  Future<SeriesModel> addSeriesItem(
    int seriesId, {
    required int contentId,
    int? orderNo,
  }) async {
    final payload = {
      'contentId': contentId,
      if (orderNo != null) 'orderNo': orderNo,
    };
    final res = await client.post('/api/v1/creator/series/$seriesId/items', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return SeriesModel.fromJson(data);
  }

  /// 7. Gỡ video khỏi Series (DELETE /api/v1/creator/series/{seriesId}/items/{contentId})
  Future<SeriesModel> removeSeriesItem(int seriesId, int contentId) async {
    final res = await client.delete('/api/v1/creator/series/$seriesId/items/$contentId');
    final data = res['data'] as Map<String, dynamic>;
    return SeriesModel.fromJson(data);
  }

  /// 8. Sắp xếp lại thứ tự các tập trong Series (PUT /api/v1/creator/series/{seriesId}/reorder)
  Future<SeriesModel> reorderSeriesItems(
    int seriesId, {
    required List<int> contentIdsInOrder,
  }) async {
    final payload = {
      'contentIdsInOrder': contentIdsInOrder,
    };
    final res = await client.put('/api/v1/creator/series/$seriesId/reorder', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return SeriesModel.fromJson(data);
  }

  // ==========================================
  // Public Series (2 endpoints)
  // ==========================================

  /// 9. GET /api/v1/channels/{channelId}/series (Xem danh sách Series của Kênh công khai)
  Future<List<SeriesModel>> getPublicChannelSeries(int channelId) async {
    final res = await client.get('/api/v1/channels/$channelId/series');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => SeriesModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 10. GET /api/v1/series/{seriesId} (Xem chi tiết Series và danh sách tập công khai)
  Future<SeriesModel> getPublicSeriesDetail(int seriesId) async {
    final res = await client.get('/api/v1/series/$seriesId');
    final data = res['data'] as Map<String, dynamic>;
    return SeriesModel.fromJson(data);
  }
}
