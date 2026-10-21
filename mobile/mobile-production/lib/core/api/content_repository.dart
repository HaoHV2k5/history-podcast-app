import 'api_client.dart';
import '../../episode.dart';

class ContentRepository {
  final ApiClient apiClient;

  ContentRepository(this.apiClient);

  Future<List<Episode>> getPublishedEpisodes({String? keyword}) async {
    final query = <String, String>{
      'status': 'PUBLISHED',
      'sortBy': 'createdAt',
      'sortDir': 'desc',
    };
    if (keyword != null && keyword.trim().isNotEmpty) {
      query['keyword'] = keyword.trim();
    }

    try {
      final response = await apiClient.get('/api/v1/contents/search', queryParams: query);
      final rawList = response['data'] as List<dynamic>? ?? [];

      return rawList.map((item) {
        final map = item as Map<String, dynamic>;
        final id = map['id']?.toString() ?? '0';
        final title = map['title'] as String? ?? 'Tập Sử Ký';
        final description = map['description'] as String? ?? '';
        final duration = (map['duration'] as num?)?.toInt() ?? 300;
        final channelTitle = map['channelTitle'] as String? ?? 'Sử Ký Triều Trần';
        final thumbnailUrl = map['thumbnailUrl'] as String? ?? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c';
        final mediaUrl = map['mediaUrl'] as String? ?? '';
        final isExclusive = map['isExclusive'] as bool? ?? false;
        final isVideoType = map['type']?.toString().toUpperCase() == 'VIDEO';

        return Episode(
          id: id,
          title: title,
          channel: channelTitle,
          image: thumbnailUrl,
          category: 'Lịch sử Việt Nam',
          seconds: duration,
          description: description,
          chapters: const [
            Chapter('Mở đầu', 0),
          ],
          membersOnly: isExclusive,
          isVideo: isVideoType,
          mediaAsset: mediaUrl,
        );
      }).toList();
    } catch (_) {
      return [];
    }
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
        final name = map['name'] as String? ?? 'Kênh Sử Ký';
        final initial = name.isNotEmpty ? name.substring(0, 1) : 'S';
        final avatar = map['avatarUrl'] as String? ?? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c';
        final description = map['description'] as String? ?? 'Kênh lịch sử trên nền tảng Sử Ký';

        return Channel(
          name,
          initial,
          avatar,
          description,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }
}
