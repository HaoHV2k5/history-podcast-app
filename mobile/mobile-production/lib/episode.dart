import 'dart:convert';

part 'mock/fixtures/catalog.dart';

class Chapter {
  const Chapter(this.title, this.seconds);
  final String title;
  final int seconds;
}

class Episode {
  const Episode({
    required this.id,
    required this.title,
    required this.channel,
    required this.image,
    required this.category,
    required this.seconds,
    required this.description,
    required this.chapters,
    this.membersOnly = false,
    this.isVideo = false,
    this.mediaAsset = '',
    this.sources = '',
    this.channelImage = '',
    this.channelId,
    this.contentId,
    this.seriesId,
    this.seriesTitle,
    this.remoteLikeCount,
    this.remoteDislikeCount,
    this.remoteCommentCount,
  });
  final String id, title, channel, image, category, description;
  final int seconds;
  final List<Chapter> chapters;
  final bool membersOnly;
  final bool isVideo;
  final String mediaAsset, sources, channelImage;
  final int? channelId;
  final int? contentId;
  final int? seriesId;
  final String? seriesTitle;
  final int? remoteLikeCount;
  final int? remoteDislikeCount;
  final int? remoteCommentCount;
  String get duration =>
      seconds < 60 ? '$seconds giây' : '${seconds ~/ 60} ph\u00fat';
}

final List<Episode> publishedEpisodes = [];
final List<Episode> remoteEpisodes = [];
final List<Channel> remoteChannels = [];

List<Episode> get allEpisodes {
  final combined = remoteEpisodes.isNotEmpty
      ? <Episode>[...remoteEpisodes, ...publishedEpisodes]
      : <Episode>[
          ...remoteEpisodes,
          ...episodes,
          ...memberEpisodes,
          ...videoEpisodes,
          ...audioEpisodes,
          ...publishedEpisodes,
        ];
  final seen = <String>{};
  return [
    for (final e in combined)
      if (seen.add(e.id)) e,
  ];
}

Map<String, dynamic> episodeToJson(Episode e) => {
  'id': e.id,
  'title': e.title,
  'channel': e.channel,
  'image': e.image,
  'channelImage': e.channelImage,
  'category': e.category,
  'seconds': e.seconds,
  'description': e.description,
  'chapters': [
    for (final c in e.chapters) {'title': c.title, 'seconds': c.seconds},
  ],
  'membersOnly': e.membersOnly,
  'isVideo': e.isVideo,
  'mediaAsset': e.mediaAsset,
  'sources': e.sources,
  if (e.channelId != null) 'channelId': e.channelId,
  if (e.contentId != null) 'contentId': e.contentId,
  if (e.seriesId != null) 'seriesId': e.seriesId,
  if (e.seriesTitle != null) 'seriesTitle': e.seriesTitle,
};
Episode episodeFromJson(Map<String, dynamic> j) => Episode(
  id: j['id'] as String,
  title: j['title'] as String,
  channel: j['channel'] as String,
  image: j['image'] as String,
  channelImage: j['channelImage'] as String? ?? '',
  category: j['category'] as String,
  seconds: j['seconds'] as int,
  description: j['description'] as String,
  chapters: (j['chapters'] as List)
      .map((c) => Chapter(c['title'] as String, c['seconds'] as int))
      .toList(),
  membersOnly: j['membersOnly'] == true,
  isVideo: j['isVideo'] == true,
  mediaAsset: j['mediaAsset'] as String? ?? '',
  sources: j['sources'] as String? ?? '',
  channelId: (j['channelId'] as num?)?.toInt(),
  contentId: (j['contentId'] as num?)?.toInt(),
  seriesId: (j['seriesId'] as num?)?.toInt(),
  seriesTitle: j['seriesTitle'] as String?,
);

class Channel {
  const Channel(
    this.name,
    this.initial,
    this.image,
    this.description, {
    this.id,
    this.coverImage = '',
    this.monthlyPrice,
    this.hasBackendPlan = false,
  });
  final String name, initial, image, description;
  final int? id;
  final String coverImage;
  final double? monthlyPrice;
  final bool hasBackendPlan;
  List<Episode> get content => allEpisodes
      .where((e) =>
          e.channel.trim().toLowerCase() == name.trim().toLowerCase() ||
          (e.channelId != null && id != null && e.channelId == id))
      .toList();
  bool get hasMembership =>
      hasBackendPlan ||
      (monthlyPrice != null && monthlyPrice! > 0) ||
      content.any((e) => e.membersOnly);
}

List<Channel> get channels {
  final byName = <String, Channel>{};
  for (final c in remoteChannels) {
    byName[c.name.trim().toLowerCase()] = c;
  }
  for (final c in baseChannels) {
    final key = c.name.trim().toLowerCase();
    final existing = byName[key];
    if (existing == null) {
      byName[key] = c;
    } else {
      // Giữ lại URL Cloudinary cho avatar và ảnh bìa từ Backend nếu có
      final avatarImg = (existing.image.startsWith('http://') || existing.image.startsWith('https://'))
          ? existing.image
          : (c.image.isNotEmpty ? c.image : existing.image);
      final coverImg = (existing.coverImage.startsWith('http://') || existing.coverImage.startsWith('https://'))
          ? existing.coverImage
          : (c.coverImage.isNotEmpty ? c.coverImage : existing.coverImage);
      byName[key] = Channel(
        existing.name,
        existing.initial,
        avatarImg,
        existing.description.isNotEmpty ? existing.description : c.description,
        id: existing.id ?? c.id,
        coverImage: coverImg,
        monthlyPrice: existing.monthlyPrice ?? c.monthlyPrice,
        hasBackendPlan: existing.hasBackendPlan || c.hasBackendPlan,
      );
    }
  }
  for (final e in [...remoteEpisodes, ...publishedEpisodes]) {
    final key = e.channel.trim().toLowerCase();
    if (!byName.containsKey(key)) {
      byName[key] = Channel(
        e.channel,
        e.channel.isNotEmpty ? e.channel.substring(0, 1) : 'S',
        e.channelImage.isNotEmpty ? e.channelImage : e.image,
        'Kênh kể chuyện lịch sử trên nền tảng Sử Ký.',
        id: e.channelId,
      );
    }
  }
  return byName.values.toList();
}

Channel channelByName(String name) {
  final target = name.trim().toLowerCase();
  for (final c in remoteChannels) {
    if (c.name.trim().toLowerCase() == target) {
      return c;
    }
  }
  return channels.firstWhere(
    (c) => c.name.trim().toLowerCase() == target,
    orElse: () => Channel(
      name,
      name.isNotEmpty ? name.substring(0, 1) : 'S',
      'assets/images/hue-citadel.jpg',
      'Kênh kể chuyện lịch sử trên nền tảng Sử Ký.',
    ),
  );
}

String clockLabel(int seconds) =>
    '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';

String normalizeSearch(String value) {
  const originals = [
    'àáạảãâầấậẩẫăằắặẳẵ',
    'èéẹẻẽêềếệểễ',
    'ìíịỉĩ',
    'òóọỏõôồốộổỗơờớợởỡ',
    'ùúụủũưừứựửữ',
    'ỳýỵỷỹ',
    'đ',
  ];
  const replacements = ['a', 'e', 'i', 'o', 'u', 'y', 'd'];
  var result = value.toLowerCase().trim();
  for (var i = 0; i < originals.length; i++) {
    for (final rune in originals[i].runes) {
      result = result.replaceAll(String.fromCharCode(rune), replacements[i]);
    }
  }
  return result;
}

class EpisodeComment {
  const EpisodeComment({
    required this.id,
    required this.episodeId,
    required this.authorName,
    required this.content,
    required this.timeAgo,
    this.likes = 0,
    this.isLiked = false,
    this.isFlagged = false,
  });

  final String id;
  final String episodeId;
  final String authorName;
  final String content;
  final String timeAgo;
  final int likes;
  final bool isLiked;
  final bool isFlagged;

  EpisodeComment copyWith({int? likes, bool? isLiked, bool? isFlagged}) =>
      EpisodeComment(
        id: id,
        episodeId: episodeId,
        authorName: authorName,
        content: content,
        timeAgo: timeAgo,
        likes: likes ?? this.likes,
        isLiked: isLiked ?? this.isLiked,
        isFlagged: isFlagged ?? this.isFlagged,
      );

  Map<String, dynamic> toMap() => {
    'id': id,
    'episodeId': episodeId,
    'authorName': authorName,
    'content': content,
    'timeAgo': timeAgo,
    'likes': likes,
    'isLiked': isLiked,
    'isFlagged': isFlagged,
  };

  factory EpisodeComment.fromMap(Map<String, dynamic> map) => EpisodeComment(
    id: map['id'] as String,
    episodeId: map['episodeId'] as String,
    authorName: map['authorName'] as String,
    content: map['content'] as String,
    timeAgo: map['timeAgo'] as String? ?? 'Vừa xong',
    likes: map['likes'] as int? ?? 0,
    isLiked: map['isLiked'] as bool? ?? false,
    isFlagged: map['isFlagged'] as bool? ?? false,
  );

  String toJson() => jsonEncode(toMap());
  factory EpisodeComment.fromJson(String source) =>
      EpisodeComment.fromMap(jsonDecode(source) as Map<String, dynamic>);
}

class MembershipTransaction {
  const MembershipTransaction({
    required this.id,
    required this.channelName,
    required this.date,
    required this.type,
    required this.status,
    required this.planTitle,
  });

  final String id;
  final String channelName;
  final String date;
  final String type;
  final String status;
  final String planTitle;

  Map<String, dynamic> toMap() => {
    'id': id,
    'channelName': channelName,
    'date': date,
    'type': type,
    'status': status,
    'planTitle': planTitle,
  };

  factory MembershipTransaction.fromMap(Map<String, dynamic> map) =>
      MembershipTransaction(
        id: map['id'] as String,
        channelName: map['channelName'] as String,
        date: map['date'] as String,
        type: map['type'] as String,
        status: map['status'] as String,
        planTitle: map['planTitle'] as String,
      );

  String toJson() => jsonEncode(toMap());
  factory MembershipTransaction.fromJson(String source) =>
      MembershipTransaction.fromMap(jsonDecode(source) as Map<String, dynamic>);
}
