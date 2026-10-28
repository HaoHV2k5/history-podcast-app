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

  /// GET /api/v1/contents/search (enriched with artifacts and channels, with fallback to /api/v1/contents)
  Future<List<Episode>> getPublishedEpisodes({String? keyword, int? channelId, bool? isExclusive}) async {
    try {
      // 1. Fetch artifacts to pair Video and Thumbnail accurately
      final videoArtifactsByContent = <int, Map<String, dynamic>>{};
      final thumbArtifactsByContent = <int, Map<String, dynamic>>{};
      try {
        final artResp = await apiClient.get('/api/v1/artifacts');
        final artList = artResp['data'] as List<dynamic>? ?? [];
        for (final a in artList) {
          if (a is! Map<String, dynamic>) continue;
          final cId = (a['contentId'] as num?)?.toInt();
          if (cId == null) continue;
          final type = a['type']?.toString().toUpperCase() ?? '';
          final fileUrl = (a['fileUrl'] ?? a['optimizedUrl'])?.toString() ?? '';
          final lower = fileUrl.toLowerCase();
          final isVideo = type == 'VIDEO' ||
              lower.endsWith('.mp4') ||
              lower.endsWith('.webm') ||
              lower.endsWith('.mov') ||
              lower.endsWith('.m3u8');
          final isThumb = type == 'THUMBNAIL' ||
              lower.endsWith('.png') ||
              lower.endsWith('.jpg') ||
              lower.endsWith('.jpeg') ||
              lower.endsWith('.webp');
          if (isVideo) {
            videoArtifactsByContent[cId] = a;
          }
          if (isThumb) {
            thumbArtifactsByContent[cId] = a;
          }
        }
      } catch (_) {}

      // 2. Fetch channels map to resolve channel names and avatars
      final channelNames = <int, String>{};
      final channelAvatars = <int, String>{};
      try {
        final chanResp = await apiClient.get('/api/v1/channels');
        final chanData = chanResp['data'];
        List<dynamic> chanItems = [];
        if (chanData is Map<String, dynamic> && chanData.containsKey('items')) {
          chanItems = chanData['items'] as List<dynamic>? ?? [];
        } else if (chanData is List<dynamic>) {
          chanItems = chanData;
        }
        for (final c in chanItems) {
          if (c is! Map<String, dynamic>) continue;
          final cId = (c['id'] as num?)?.toInt();
          final cName = c['name']?.toString();
          final cAvatar = c['avatarUrl']?.toString();
          if (cId != null && cName != null && cName.isNotEmpty) {
            channelNames[cId] = cName;
          }
          if (cId != null && cAvatar != null && cAvatar.isNotEmpty) {
            channelAvatars[cId] = cAvatar;
          }
        }
      } catch (_) {}

      // 3. Search public videos via /api/v1/contents/search
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

      List<dynamic> rawList = [];
      try {
        final response = await apiClient.get('/api/v1/contents/search', queryParams: query);
        rawList = response['data'] as List<dynamic>? ?? [];
      } catch (_) {}

      // 4. Fallback to GET /api/v1/contents if search returned empty
      if (rawList.isEmpty) {
        try {
          final allContentsResp = await apiClient.get('/api/v1/contents');
          final allContents = allContentsResp['data'] as List<dynamic>? ?? [];
          rawList = allContents.where((item) {
            if (item is! Map<String, dynamic>) return false;
            if (channelId != null) {
              final cId = (item['channelId'] as num?)?.toInt();
              if (cId != channelId) return false;
            }
            if (isExclusive != null) {
              if (item['isExclusive'] != isExclusive) return false;
            }
            if (keyword != null && keyword.trim().isNotEmpty) {
              final kw = keyword.trim().toLowerCase();
              final title = (item['title'] ?? '').toString().toLowerCase();
              final body = (item['textBody'] ?? '').toString().toLowerCase();
              if (!title.contains(kw) && !body.contains(kw)) return false;
            }
            return true;
          }).toList();
        } catch (_) {}
      }

      return rawList.map((item) {
        final map = item as Map<String, dynamic>;
        final artifactId = (map['artifactId'] as num?)?.toInt();
        final contentId = (map['contentId'] ?? map['id']) as num?;
        final cIdInt = contentId?.toInt();
        final chId = (map['channelId'] as num?)?.toInt();
        final id = (artifactId ?? cIdInt ?? map['id'])?.toString() ?? '0';
        final title = map['title'] as String? ?? 'Tập Sử Ký';
        final description = (map['description'] ?? map['textBody'])?.toString() ?? '';

        final videoArt = cIdInt != null ? videoArtifactsByContent[cIdInt] : null;
        final thumbArt = cIdInt != null ? thumbArtifactsByContent[cIdInt] : null;

        // Duration
        final rawDuration = (videoArt?['durationSeconds'] ?? map['durationSeconds'] ?? map['duration']) as num?;
        final duration = (rawDuration != null && rawDuration > 0) ? rawDuration.toInt() : 300;

        // Channel title and avatar
        String channelTitle = (map['channelName'] ?? map['channelTitle'])?.toString() ?? '';
        if (channelTitle.isEmpty && chId != null && channelNames.containsKey(chId)) {
          channelTitle = channelNames[chId]!;
        }
        if (channelTitle.isEmpty) {
          channelTitle = 'Sử Ký Triều Trần';
        }
        final channelAvatar = (chId != null ? channelAvatars[chId] : null) ?? '';

        // Thumbnail URL
        String thumbnailUrl = thumbArt?['fileUrl']?.toString().trim() ?? '';
        if (thumbnailUrl.isEmpty) {
          final rawThumb = map['thumbnailUrl']?.toString().trim() ?? '';
          if (rawThumb.isNotEmpty) {
            thumbnailUrl = rawThumb;
          }
        }
        if (thumbnailUrl.isEmpty) {
          final fileUrl = map['fileUrl']?.toString().trim() ?? '';
          final lower = fileUrl.toLowerCase();
          if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
            thumbnailUrl = fileUrl;
          }
        }
        if (thumbnailUrl.isEmpty) {
          const editorialCovers = [
            'assets/mock/images/ha-noi.jpg',
            'assets/mock/images/hoi-an.jpg',
            'assets/mock/images/van-mieu.jpg',
          ];
          final coverIndex = ((cIdInt ?? artifactId ?? 0).abs()) % editorialCovers.length;
          thumbnailUrl = editorialCovers[coverIndex];
        }

        // Media URL (prefer video artifact)
        String mediaUrl = videoArt?['fileUrl']?.toString().trim() ?? '';
        if (mediaUrl.isEmpty) {
          final rawMedia = (map['fileUrl'] ?? map['optimizedUrl'] ?? map['mediaUrl'])?.toString().trim() ?? '';
          final lower = rawMedia.toLowerCase();
          if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg')) {
            mediaUrl = rawMedia;
          }
        }

        final lowerMedia = mediaUrl.toLowerCase();
        final isVideoType = videoArt != null ||
            map['type']?.toString().toUpperCase() == 'VIDEO' ||
            lowerMedia.endsWith('.mp4') ||
            lowerMedia.endsWith('.webm') ||
            lowerMedia.endsWith('.mov') ||
            lowerMedia.endsWith('.m3u8');

        final isExclusive = map['isExclusive'] == true;
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
          channelImage: channelAvatar,
          channelId: chId,
          contentId: cIdInt,
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
