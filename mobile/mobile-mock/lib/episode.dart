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
  });
  final String id, title, channel, image, category, description;
  final int seconds;
  final List<Chapter> chapters;
  final bool membersOnly;
  final bool isVideo;
  final String mediaAsset, sources, channelImage;
  String get duration =>
      seconds < 60 ? '$seconds giây' : '${seconds ~/ 60} ph\u00fat';
}

final List<Episode> publishedEpisodes = [];
List<Episode> get allEpisodes => [
  ...episodes,
  ...memberEpisodes,
  ...videoEpisodes,
  ...audioEpisodes,
  ...publishedEpisodes,
];

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
);

class Channel {
  const Channel(this.name, this.initial, this.image, this.description);
  final String name, initial, image, description;
  List<Episode> get content =>
      allEpisodes.where((e) => e.channel == name).toList();
  bool get hasMembership => content.any((e) => e.membersOnly);
}

List<Channel> get channels => [
  ...baseChannels,
  ...publishedEpisodes
      .map((e) => e.channel)
      .toSet()
      .where((name) => !baseChannels.any((c) => c.name == name))
      .map(
        (name) => Channel(
          name,
          name.substring(0, 1),
          publishedEpisodes.firstWhere((e) => e.channel == name).channelImage,
          'Kênh đã phát hành nội dung mẫu trên thiết bị này. Chưa đồng bộ server.',
        ),
      ),
];

Channel channelByName(String name) =>
    channels.firstWhere((c) => c.name == name);

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
