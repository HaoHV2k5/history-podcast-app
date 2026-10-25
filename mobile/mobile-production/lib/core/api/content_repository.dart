import 'api_client.dart';
import '../../episode.dart';

class ContentDetailModel {
  final int id;
  final int? channelId;
  final String title;
  final String? textBody;
  final String? sourceType;
  final String? status;
  final bool isExclusive;
  final String? createdAt;

  ContentDetailModel({
    required this.id,
    this.channelId,
    required this.title,
    this.textBody,
    this.sourceType,
    this.status,
    this.isExclusive = false,
    this.createdAt,
  });

  factory ContentDetailModel.fromJson(Map<String, dynamic> json) {
    return ContentDetailModel(
      id: (json['id'] as num).toInt(),
      channelId: (json['channelId'] as num?)?.toInt(),
      title: (json['title'] ?? '').toString(),
      textBody: json['textBody']?.toString(),
      sourceType: json['sourceType']?.toString(),
      status: json['status']?.toString(),
      isExclusive: json['isExclusive'] == true,
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class ContentRepository {
  final ApiClient apiClient;

  ContentRepository(this.apiClient);

  /// GET /api/v1/contents/search
  Future<List<Episode>> getPublishedEpisodes({String? keyword, int? channelId, bool? isExclusive}) async {
    final query = <String, String>{
      'status': 'PUBLISHED',
      'sortBy': 'createdAt',
      'sortDir': 'desc',
    };
    if (keyword != null && keyword.trim().isNotEmpty) {
      query['keyword'] = keyword.trim();
    }
    if (channelId != null) {
      query['channelId'] = channelId.toString();
    }
    if (isExclusive != null) {
      query['isExclusive'] = isExclusive.toString();
    }

    try {
      final response = await apiClient.get('/api/v1/contents/search', queryParams: query);
      final rawList = response['data'] as List<dynamic>? ?? [];

      return rawList.map((item) {
        final map = item as Map<String, dynamic>;
        final artifactId = (map['artifactId'] as num?)?.toInt();
        final contentId = (map['contentId'] as num?)?.toInt();
        final channelId = (map['channelId'] as num?)?.toInt();
        final id =
            (artifactId ?? contentId ?? map['id'])?.toString() ?? '0';
        final title = map['title'] as String? ?? 'Tập Sử Ký';
        final description =
            (map['description'] ?? map['textBody'])?.toString() ?? '';
        final rawDuration =
            (map['durationSeconds'] ?? map['duration']) as num?;
        final duration =
            (rawDuration != null && rawDuration > 0) ? rawDuration.toInt() : 300;
        final channelTitle =
            (map['channelName'] ?? map['channelTitle'])?.toString() ??
            'Sử Ký Triều Trần';
        const editorialCovers = [
          'assets/mock/images/ha-noi.jpg',
          'assets/mock/images/hoi-an.jpg',
          'assets/mock/images/van-mieu.jpg',
        ];
        final coverIndex = ((contentId ?? artifactId ?? 0).abs()) %
            editorialCovers.length;
        final rawThumb = map['thumbnailUrl']?.toString().trim() ?? '';
        final thumbnailUrl = rawThumb.isNotEmpty
            ? rawThumb
            : editorialCovers[coverIndex];
        final mediaUrl =
            (map['fileUrl'] ?? map['optimizedUrl'] ?? map['mediaUrl'])
                ?.toString() ??
            '';
        final isExclusive = map['isExclusive'] == true;
        final lowerMedia = mediaUrl.toLowerCase();
        final isVideoType =
            map['type']?.toString().toUpperCase() == 'VIDEO' ||
            lowerMedia.endsWith('.mp4') ||
            lowerMedia.endsWith('.webm') ||
            lowerMedia.endsWith('.mov') ||
            lowerMedia.endsWith('.m3u8');
        final likeCount = (map['likeCount'] as num?)?.toInt();
        final dislikeCount = (map['dislikeCount'] as num?)?.toInt();
        final commentCount = (map['commentCount'] as num?)?.toInt();

        return Episode(
          id: id,
          title: title,
          channel: channelTitle,
          image: thumbnailUrl,
          category: map['category']?.toString() ?? 'Lịch sử Việt Nam',
          seconds: duration,
          description: description,
          chapters: const [
            Chapter('Mở đầu', 0),
          ],
          membersOnly: isExclusive,
          isVideo: isVideoType,
          mediaAsset: mediaUrl,
          channelId: channelId,
          contentId: contentId,
          remoteLikeCount: likeCount,
          remoteDislikeCount: dislikeCount,
          remoteCommentCount: commentCount,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }

  /// GET /api/v1/contents
  Future<List<ContentDetailModel>> getAllContents() async {
    final response = await apiClient.get('/api/v1/contents');
    final rawList = response['data'] as List<dynamic>? ?? [];
    return rawList.map((e) => ContentDetailModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /api/v1/contents/{id}
  Future<ContentDetailModel> getContentById(int id) async {
    final response = await apiClient.get('/api/v1/contents/$id');
    final data = response['data'] as Map<String, dynamic>;
    return ContentDetailModel.fromJson(data);
  }

  /// POST /api/v1/contents
  Future<ContentDetailModel> createContent({
    required int channelId,
    required String title,
    required String textBody,
    String sourceType = 'ORIGINAL',
    String status = 'PUBLISHED',
    bool isExclusive = false,
  }) async {
    final payload = {
      'channelId': channelId,
      'title': title,
      'textBody': textBody,
      'sourceType': sourceType,
      'status': status,
      'isExclusive': isExclusive,
      'createdAt': DateTime.now().toUtc().toIso8601String(),
    };
    final response = await apiClient.post('/api/v1/contents', body: payload);
    final data = response['data'] as Map<String, dynamic>;
    return ContentDetailModel.fromJson(data);
  }

  /// PUT /api/v1/contents/{id}
  Future<ContentDetailModel> updateContent(
    int id, {
    String? title,
    String? textBody,
    String? status,
    bool? isExclusive,
  }) async {
    final payload = {
      if (title != null) 'title': title,
      if (textBody != null) 'textBody': textBody,
      if (status != null) 'status': status,
      if (isExclusive != null) 'isExclusive': isExclusive,
      'updatedAt': DateTime.now().toUtc().toIso8601String(),
    };
    final response = await apiClient.put('/api/v1/contents/$id', body: payload);
    final data = response['data'] as Map<String, dynamic>;
    return ContentDetailModel.fromJson(data);
  }

  /// DELETE /api/v1/contents/{id}
  Future<void> deleteContent(int id) async {
    await apiClient.delete('/api/v1/contents/$id');
  }

  Future<List<Channel>> getChannels() async {
    try {
      final response = await apiClient.get('/api/v1/channels');
      final data = response['data'];
      List<dynamic> items = [];
      if (data is Map<String, dynamic> && data.containsKey('items')) {
        items = data['items'] as List<dynamic>? ?? [];
      } else if (data is List<dynamic>) {
        items = data;
      }

      return items.map((item) {
        final map = item as Map<String, dynamic>;
        final id = (map['id'] as num?)?.toInt();
        final name = map['name'] as String? ?? 'Kênh Sử Ký';
        final initial = name.isNotEmpty ? name.substring(0, 1) : 'S';
        final avatar =
            (map['avatarUrl'] as String?)?.isNotEmpty == true
                ? map['avatarUrl'] as String
                : 'assets/images/hue-citadel.jpg';
        final cover = map['coverUrl'] as String? ?? '';
        final description =
            map['description'] as String? ?? 'Kênh lịch sử trên nền tảng Sử Ký';

        return Channel(
          name,
          initial,
          avatar,
          description,
          id: id,
          coverImage: cover,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }
}
