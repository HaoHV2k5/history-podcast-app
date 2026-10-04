import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_player/video_player.dart';

import '../../episode.dart';
import '../../audio_playback.dart';
import '../../local_file.dart';
import '../../artwork_state.dart';

/// Local UI demo with technical media fixtures; no backend is connected.
class AppState extends ChangeNotifier {
  AppState(this.preferences, {this.writeComments}) {
    reloadCatalog(notify: false);
    checkoutStates.addAll(
      (jsonDecode(
        preferences.getString('checkoutStatesV1') ?? '{}',
      ) as Map<String, dynamic>).map((k, v) => MapEntry(k, v as String)),
    );
    queue.addAll(
      (preferences.getStringList('playbackQueueV1') ?? []).where(
        (id) => allEpisodes.any((e) => e.id == id),
      ),
    );
    saved.addAll(preferences.getStringList('savedEpisodes') ?? []);
    followed.addAll(preferences.getStringList('followedChannels') ?? []);
    memberships.addAll(preferences.getStringList('demoMemberships') ?? []);
    likedEpisodes.addAll(preferences.getStringList('likedEpisodes') ?? []);
    dislikedEpisodes.addAll(
      preferences.getStringList('dislikedEpisodes') ?? [],
    );
    displayName = preferences.getString('displayName') ?? 'Người nghe';
    isLoggedIn = preferences.getBool('isLoggedIn') ?? false;
    userEmail = preferences.getString('userEmail');
    userPhone = preferences.getString('userPhone');

    recentSearches.addAll(
      (preferences.getStringList('recentSearches') ?? [])
          .where((q) => q.trim().isNotEmpty)
          .take(5),
    );
    final known = {for (final e in allEpisodes) e.id: e};
    recentPlayed.addAll(
      (preferences.getStringList('recentPlayed') ?? [])
          .where(known.containsKey)
          .toSet(),
    );
    try {
      final raw = jsonDecode(
        preferences.getString('listeningProgress') ?? '{}',
      );
      if (raw is Map) {
        for (final entry in raw.entries) {
          final e = known[entry.key];
          if (e != null && entry.value is int) {
            listeningProgress[e.id] = (entry.value as int).clamp(0, e.seconds);
          }
        }
      }
    } catch (_) {}

    final preferredRate = preferences.getDouble('playbackSpeed');
    if ([1.0, 1.25, 1.5, 1.75, 2.0].contains(preferredRate)) {
      speed = preferredRate!;
    }

    // Initialize comments
    _loadComments();

    // Initialize membership transactions
    final savedTxs = preferences.getStringList('membershipTransactions');
    if (savedTxs != null && savedTxs.isNotEmpty) {
      for (final raw in savedTxs) {
        try {
          transactions.add(MembershipTransaction.fromJson(raw));
        } catch (_) {}
      }
    } else if (memberships.isNotEmpty) {
      for (final ch in memberships) {
        transactions.add(
          MembershipTransaction(
            id: 'TX-INIT-${ch.hashCode.abs() % 10000}',
            channelName: ch,
            date: 'Hôm nay',
            type: 'Kích hoạt thử',
            status: 'Thành công (Mô phỏng)',
            planTitle: 'G\u00f3i th\u00e1ng k\u00eanh $ch',
          ),
        );
      }
    }
  }

  final SharedPreferences preferences;
  final Future<bool> Function(String key, List<String> value)? writeComments;
  final Map<String, String> checkoutStates = {};
  final List<String> queue = [];
  String checkoutStatus(String channel) =>
      checkoutStates[channel] ??
      (memberships.contains(channel) ? 'active' : 'none');
  Future<void> beginCheckout(String channel) async {
    if (!channelByName(channel).hasMembership ||
        memberships.contains(channel) ||
        checkoutStatus(channel) == 'pending') {
      throw StateError(
        'Kênh chưa có gói, đã kích hoạt hoặc giao dịch đang chờ.',
      );
    }
    checkoutStates[channel] = 'pending';
    await preferences.setString('checkoutStatesV1', jsonEncode(checkoutStates));
    notifyListeners();
  }

  Future<void> finishCheckout(String channel, bool success) async {
    if (checkoutStatus(channel) != 'pending') {
      throw StateError('Không có giao dịch đang chờ.');
    }
    if (success) {
      await setDemoMembership(channel, true);
      return;
    }
    checkoutStates[channel] = 'failed';
    await preferences.setString('checkoutStatesV1', jsonEncode(checkoutStates));
    transactions.insert(
      0,
      MembershipTransaction(
        id: 'TX-${DateTime.now().microsecondsSinceEpoch}',
        channelName: channel,
        date: 'Hôm nay',
        type: 'Đăng ký thử',
        status: 'Thất bại mẫu · Không cấp quyền',
        planTitle: 'Giá chưa cấu hình',
      ),
    );
    await preferences.setStringList(
      'membershipTransactions',
      transactions.map((t) => t.toJson()).toList(),
    );
    notifyListeners();
  }

  Future<void> expireMembership(String channel) async {
    if (!memberships.contains(channel)) {
      throw StateError('Chưa có quyền để thử hết hạn.');
    }
    await setDemoMembership(channel, false);
    checkoutStates[channel] = 'expired';
    await preferences.setString('checkoutStatesV1', jsonEncode(checkoutStates));
    notifyListeners();
  }

  void addToQueue(Episode episode) {
    if (!canPlay(episode) || queue.contains(episode.id)) return;
    queue.add(episode.id);
    unawaited(preferences.setStringList('playbackQueueV1', queue));
    notifyListeners();
  }

  void removeFromQueue(String id) {
    queue.remove(id);
    unawaited(preferences.setStringList('playbackQueueV1', queue));
    notifyListeners();
  }

  void playNext() {
    while (queue.isNotEmpty) {
      final id = queue.removeAt(0);
      final candidates = allEpisodes.where((e) => e.id == id && canPlay(e));
      if (candidates.isNotEmpty) {
        play(candidates.first);
        break;
      }
    }
    unawaited(preferences.setStringList('playbackQueueV1', queue));
    notifyListeners();
  }

  void reloadCatalog({bool notify = true}) {
    ArtworkStore(preferences).reload(notify: false);
    publishedEpisodes.clear();
    try {
      final items = jsonDecode(
        preferences.getString('publishedEpisodesV1') ?? '[]',
      ) as List;
      publishedEpisodes.addAll(
        items.map((j) => episodeFromJson(j as Map<String, dynamic>)),
      );
    } catch (_) {}
    if (current != null && !allEpisodes.any((e) => e.id == current!.id)) {
      _closeVideo();
      _closeAudio();
      playing = false;
      current = null;
      position = 0;
    }
    if (notify) notifyListeners();
  }

  final Set<String> saved = {};
  final Set<String> followed = {};
  final Set<String> memberships = {};
  final Set<String> likedEpisodes = {};
  final Set<String> dislikedEpisodes = {};
  final List<MembershipTransaction> transactions = [];
  final Map<String, List<EpisodeComment>> _comments = {};

  late String displayName;
  bool isLoggedIn = false;
  String? userEmail;
  String? userPhone;

  void _loadComments() {
    // Populate seeds first
    for (final c in initialSampleComments) {
      _comments.putIfAbsent(c.episodeId, () => []).add(c);
    }
    final rawUserComments = preferences.getStringList('userComments');
    if (rawUserComments != null) {
      for (final raw in rawUserComments) {
        try {
          final cmt = EpisodeComment.fromJson(raw);
          final list = _comments.putIfAbsent(cmt.episodeId, () => []);
          // Replace or insert
          final idx = list.indexWhere((it) => it.id == cmt.id);
          if (idx >= 0) {
            list[idx] = cmt;
          } else {
            list.insert(0, cmt);
          }
        } catch (_) {}
      }
    }
  }

  void _saveComments() {
    final allList = <String>[];
    for (final entry in _comments.values) {
      for (final c in entry) {
        allList.add(c.toJson());
      }
    }
    unawaited(preferences.setStringList('userComments', allList));
  }

  bool canPlay(Episode episode) =>
      !episode.membersOnly || memberships.contains(episode.channel);

  Future<void> updateName(String value) async {
    final trimmed = value.trim();
    if (trimmed.isEmpty || trimmed.runes.length > 40) {
      throw ArgumentError('Tên cần từ 1 đến 40 ký tự.');
    }
    await preferences.setString('displayName', trimmed);
    displayName = trimmed;
    notifyListeners();
  }

  // --- Auth Simulation (UC-06) ---
  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    final id = identifier.trim();
    if (id.isEmpty) {
      throw ArgumentError('Nhập email hoặc số điện thoại.');
    }
    if (password.length < 6) {
      throw ArgumentError('Mật khẩu cần ít nhất 6 ký tự.');
    }
    isLoggedIn = true;
    if (id.contains('@')) {
      userEmail = id;
      userPhone = null;
      if (displayName == 'Người nghe') {
        displayName = id.split('@').first;
      }
    } else {
      userPhone = id;
      userEmail = null;
      if (displayName == 'Người nghe') {
        displayName = 'Người nghe ';
      }
    }
    await preferences.setBool('isLoggedIn', true);
    if (userEmail != null) {
      await preferences.setString('userEmail', userEmail!);
    } else {
      await preferences.remove('userEmail');
    }
    if (userPhone != null) {
      await preferences.setString('userPhone', userPhone!);
    } else {
      await preferences.remove('userPhone');
    }
    await preferences.setString('displayName', displayName);
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String identifier,
    required String password,
  }) async {
    final n = name.trim();
    final id = identifier.trim();
    if (n.isEmpty) throw ArgumentError('Nhập họ tên của bạn.');
    if (id.isEmpty) throw ArgumentError('Nhập email hoặc số điện thoại.');
    if (password.length < 6) {
      throw ArgumentError('Mật khẩu cần ít nhất 6 ký tự.');
    }
    displayName = n;
    isLoggedIn = true;
    if (id.contains('@')) {
      userEmail = id;
      userPhone = null;
    } else {
      userPhone = id;
      userEmail = null;
    }
    await preferences.setBool('isLoggedIn', true);
    await preferences.setString('displayName', displayName);
    if (userEmail != null) {
      await preferences.setString('userEmail', userEmail!);
    } else {
      await preferences.remove('userEmail');
    }
    if (userPhone != null) {
      await preferences.setString('userPhone', userPhone!);
    } else {
      await preferences.remove('userPhone');
    }
    notifyListeners();
  }

  Future<void> loginAsGuest() async {
    isLoggedIn = true;
    displayName = 'Khách trải nghiệm';
    userEmail = 'khach.demo@suky.vn';
    userPhone = null;
    await preferences.setBool('isLoggedIn', true);
    await preferences.setString('displayName', displayName);
    await preferences.setString('userEmail', userEmail!);
    await preferences.remove('userPhone');
    notifyListeners();
  }

  Future<void> logout() async {
    SessionAudioFiles.clear();
    if (ArtworkStore(preferences).read().containsKey('avatar')) {
      await ArtworkStore(preferences).put('avatar', null);
    }
    isLoggedIn = false;
    userEmail = null;
    userPhone = null;
    displayName = 'Người nghe';
    await preferences.setBool('isLoggedIn', false);
    await preferences.remove('userEmail');
    await preferences.remove('userPhone');
    await preferences.setString('displayName', displayName);
    notifyListeners();
  }

  // --- Like & Dislike Simulation (UC-08) ---
  bool isLiked(String episodeId) => likedEpisodes.contains(episodeId);
  bool isDisliked(String episodeId) => dislikedEpisodes.contains(episodeId);

  int getLikeCount(String episodeId) {
    final base = seedEpisodeLikes[episodeId] ?? 20;
    return base + (isLiked(episodeId) ? 1 : 0);
  }

  void toggleLike(String episodeId) {
    if (likedEpisodes.contains(episodeId)) {
      likedEpisodes.remove(episodeId);
    } else {
      likedEpisodes.add(episodeId);
      dislikedEpisodes.remove(episodeId);
    }
    unawaited(
      preferences.setStringList('likedEpisodes', likedEpisodes.toList()),
    );
    unawaited(
      preferences.setStringList('dislikedEpisodes', dislikedEpisodes.toList()),
    );
    notifyListeners();
  }

  void toggleDislike(String episodeId) {
    if (dislikedEpisodes.contains(episodeId)) {
      dislikedEpisodes.remove(episodeId);
    } else {
      dislikedEpisodes.add(episodeId);
      likedEpisodes.remove(episodeId);
    }
    unawaited(
      preferences.setStringList('likedEpisodes', likedEpisodes.toList()),
    );
    unawaited(
      preferences.setStringList('dislikedEpisodes', dislikedEpisodes.toList()),
    );
    notifyListeners();
  }

  // --- Comments Simulation (UC-08) ---
  List<EpisodeComment> getComments(String episodeId) =>
      List.unmodifiable(_comments[episodeId] ?? []);

  final Set<String> _sendingComments = {};

  Future<String?> addComment(String episodeId, String rawContent) async {
    final content = rawContent.trim();
    if (content.isEmpty) {
      return 'Vui lòng nhập nội dung bình luận.';
    }
    if (content.runes.length < 3) {
      return 'Bình luận quá ngắn (tối thiểu 3 ký tự).';
    }
    if (content.runes.length > 300) return 'Bình luận tối đa 300 ký tự.';
    if (_sendingComments.contains(episodeId)) {
      return 'Bình luận đang được lưu. Vui lòng chờ.';
    }

    // Automated moderation check (BR-03 / UC-08)
    final lower = normalizeSearch(content);
    for (final bad in prohibitedCommentWords) {
      if (lower.contains(normalizeSearch(bad))) {
        return 'Bình luận chứa từ ngữ chưa phù hợp với chuẩn mực thảo luận lịch sử.';
      }
    }

    final comment = EpisodeComment(
      id: 'cmt-${DateTime.now().microsecondsSinceEpoch}',
      episodeId: episodeId,
      authorName: displayName,
      content: content,
      timeAgo: 'Vừa xong',
    );

    _sendingComments.add(episodeId);
    try {
      final next = [
        comment.toJson(),
        for (final list in _comments.values)
          for (final item in list) item.toJson(),
      ];
      if (!await (writeComments ?? preferences.setStringList)(
        'userComments',
        next,
      )) {
        throw StateError('Chưa lưu được bình luận.');
      }
      _comments.putIfAbsent(episodeId, () => []).insert(0, comment);
      notifyListeners();
      return null;
    } catch (_) {
      // Discard the preferences cache's optimistic value after a failed write.
      try {
        await preferences.reload();
      } catch (_) {}
      return 'Chưa lưu được bình luận. Nội dung vẫn được giữ để bạn thử lại.';
    } finally {
      _sendingComments.remove(episodeId);
    }
  }

  void toggleLikeComment(String episodeId, String commentId) {
    final list = _comments[episodeId];
    if (list == null) return;
    final idx = list.indexWhere((c) => c.id == commentId);
    if (idx >= 0) {
      final c = list[idx];
      final nextLiked = !c.isLiked;
      final nextLikes = nextLiked
          ? c.likes + 1
          : (c.likes > 0 ? c.likes - 1 : 0);
      list[idx] = c.copyWith(isLiked: nextLiked, likes: nextLikes);
      _saveComments();
      notifyListeners();
    }
  }

  void reportComment(String episodeId, String commentId) {
    final list = _comments[episodeId];
    if (list == null) return;
    final idx = list.indexWhere((c) => c.id == commentId);
    if (idx >= 0) {
      list[idx] = list[idx].copyWith(isFlagged: true);
      _saveComments();
      notifyListeners();
    }
  }

  // --- Membership & Transactions (UC-09, FR-06) ---
  Future<void> setDemoMembership(String channel, bool enabled) async {
    if (!channelByName(channel).hasMembership) return;
    final next = {...memberships};
    enabled ? next.add(channel) : next.remove(channel);
    await preferences.setStringList('demoMemberships', next.toList());
    memberships
      ..clear()
      ..addAll(next);
    checkoutStates[channel] = enabled ? 'active' : 'cancelled';
    await preferences.setString('checkoutStatesV1', jsonEncode(checkoutStates));

    // Record mock transaction
    // Record mock transaction
    final now = DateTime.now();
    final day = now.day.toString().padLeft(2, '0');
    final month = now.month.toString().padLeft(2, '0');
    final dateStr = '$day/$month/${now.year}';
    final tx = MembershipTransaction(
      id: 'TX-${now.millisecondsSinceEpoch % 1000000}',
      channelName: channel,
      date: dateStr,
      type: enabled ? 'Kích hoạt thử' : 'Tắt quyền thử',
      status: 'Thành công (Mô phỏng)',
      planTitle: 'Gói tháng kênh $channel',
    );
    transactions.insert(0, tx);
    unawaited(
      preferences.setStringList(
        'membershipTransactions',
        transactions.map((t) => t.toJson()).toList(),
      ),
    );

    if (current != null && !canPlay(current!)) {
      _closeVideo();
      _closeAudio();
      playing = false;
      current = null;
      position = 0;
      _fraction = 0;
    }
    notifyListeners();
  }

  final List<String> recentSearches = [];
  final List<String> recentPlayed = [];
  final Map<String, int> listeningProgress = {};
  List<Episode> get listeningHistory => recentPlayed
      .where((id) => allEpisodes.any((e) => e.id == id))
      .map((id) => allEpisodes.firstWhere((e) => e.id == id))
      .toList();
  int progressFor(Episode e) =>
      current?.id == e.id ? position : listeningProgress[e.id] ?? 0;
  Episode? get resumableEpisode {
    for (final e in listeningHistory) {
      if (canPlay(e) && progressFor(e) > 0 && progressFor(e) < e.seconds) {
        return e;
      }
    }
    return null;
  }

  void rememberSearch(String value) {
    final q = value.trim();
    if (q.isEmpty) return;
    recentSearches.removeWhere(
      (old) => normalizeSearch(old) == normalizeSearch(q),
    );
    recentSearches.insert(0, q.length > 100 ? q.substring(0, 100) : q);
    if (recentSearches.length > 5) {
      recentSearches.removeRange(5, recentSearches.length);
    }
    unawaited(preferences.setStringList('recentSearches', recentSearches));
    notifyListeners();
  }

  void clearRecentSearches() {
    recentSearches.clear();
    unawaited(preferences.remove('recentSearches'));
    notifyListeners();
  }

  void _storeListening() {
    _ticksSinceSave = 0;
    if (current != null) listeningProgress[current!.id] = position;
    unawaited(
      preferences.setString('listeningProgress', jsonEncode(listeningProgress)),
    );
    unawaited(preferences.setStringList('recentPlayed', recentPlayed));
  }

  Episode? current;
  AudioPlayback? audio;
  int _audioGeneration = 0;
  bool get hasRealAudio =>
      current?.isVideo == false && current!.mediaAsset.isNotEmpty;
  bool get audioLoading => audio?.loading == true;
  String? get audioError => audio?.error;

  void _closeAudio() {
    _audioGeneration++;
    final old = audio;
    audio = null;
    old?.dispose();
    MediaFocus.release(this);
  }

  Future<void> _openAudio(Episode episode) async {
    _closeAudio();
    final generation = _audioGeneration;
    final controller = AudioPlayback();
    audio = controller;
    bool lastLoading = false;
    String? lastError;
    controller.addListener(() {
      if (generation != _audioGeneration) return;
      if (controller.error != null) playing = false;
      if (controller.loading != lastLoading || controller.error != lastError) {
        lastLoading = controller.loading;
        lastError = controller.error;
        notifyListeners();
      }
    });
    await controller.open(
      episode.mediaAsset,
      startAt: position,
      speed: speed,
      autoplay: false,
    );
    if (generation != _audioGeneration) return;
    if (controller.initialized) {
      controller.seek(Duration(seconds: position));
      controller.setSpeed(speed);
      if (playing) {
        MediaFocus.claim(this, pauseForMediaFocus);
        controller.play();
      }
    }
    notifyListeners();
  }

  void retryAudio() {
    if (!hasRealAudio || !canPlay(current!)) return;
    playing = true;
    unawaited(_openAudio(current!));
  }

  void pauseForMediaFocus() {
    if (playing) togglePlaying();
  }

  VideoPlayerController? video;
  bool videoLoading = false;
  String? videoError;
  int _videoGeneration = 0;

  void _closeVideo() {
    _videoGeneration++;
    final old = video;
    video = null;
    if (old != null) unawaited(old.dispose());
    videoLoading = false;
    videoError = null;
  }

  Future<void> _openVideo(Episode episode) async {
    _closeVideo();
    final generation = _videoGeneration;
    final controller = VideoPlayerController.asset(episode.mediaAsset);
    video = controller;
    videoLoading = true;
    notifyListeners();
    try {
      await controller.initialize();
      if (generation != _videoGeneration) return;
      await controller.seekTo(Duration(seconds: position));
      await controller.setPlaybackSpeed(speed);
      if (playing) await controller.play();
      videoLoading = false;
      controller.addListener(() {
        if (generation != _videoGeneration || current?.id != episode.id) return;
        final value = controller.value;
        if (value.hasError && videoError == null) {
          videoError = 'Chưa phát được video. Hãy thử lại.';
          playing = false;
          notifyListeners();
        }
      });
      notifyListeners();
    } catch (_) {
      if (generation != _videoGeneration) return;
      videoLoading = false;
      videoError = 'Không tải được clip. Kiểm tra kết nối và thử lại.';
      playing = false;
      notifyListeners();
    }
  }

  void retryVideo() {
    if (current?.isVideo != true || !canPlay(current!)) return;
    playing = true;
    unawaited(_openVideo(current!));
  }

  bool playing = false;
  int position = 0;
  final ValueNotifier<int> playbackTick = ValueNotifier(0);
  double speed = 1;
  Timer? _ticker;
  Timer? _sleep;
  int? sleepMinutes;
  double _fraction = 0;
  int _ticksSinceSave = 0;

  void toggleSaved(Episode episode) {
    saved.contains(episode.id)
        ? saved.remove(episode.id)
        : saved.add(episode.id);
    unawaited(preferences.setStringList('savedEpisodes', saved.toList()));
    notifyListeners();
  }

  void toggleFollow(String channel) {
    followed.contains(channel)
        ? followed.remove(channel)
        : followed.add(channel);
    unawaited(preferences.setStringList('followedChannels', followed.toList()));
    notifyListeners();
  }

  bool play(Episode episode, {int? startAt}) {
    if (!canPlay(episode)) return false;
    _storeListening();
    final changed = current?.id != episode.id;
    if (changed) {
      _closeVideo();
      _closeAudio();
      position = listeningProgress[episode.id] ?? 0;
      _fraction = 0;
    }
    current = episode;
    if (startAt != null) position = startAt.clamp(0, episode.seconds);
    if (position >= episode.seconds) position = 0;
    playing = true;
    MediaFocus.claim(this, pauseForMediaFocus);
    if (episode.isVideo) {
      if (changed || video == null || videoError != null) {
        unawaited(_openVideo(episode));
      } else {
        unawaited(video!.seekTo(Duration(seconds: position)));
        unawaited(video!.play());
      }
    }
    if (hasRealAudio) {
      if (changed || audio == null || audioError != null) {
        unawaited(_openAudio(episode));
      } else if (audio!.initialized) {
        audio!.seek(Duration(seconds: position));
        audio!.play();
      }
    }
    recentPlayed.remove(episode.id);
    recentPlayed.insert(0, episode.id);
    _storeListening();
    _ticker ??= Timer.periodic(const Duration(seconds: 1), (_) {
      if (!playing || current == null) return;
      if (current!.isVideo) {
        if (video == null || !video!.value.isInitialized) return;
        position = video!.value.position.inSeconds.clamp(0, current!.seconds);
      } else if (hasRealAudio) {
        if (audio?.initialized != true) return;
        position = audio!.position.inSeconds.clamp(0, current!.seconds);
      } else {
        _fraction += speed;
        position = (position + _fraction.floor()).clamp(0, current!.seconds);
        _fraction -= _fraction.floor();
      }
      if (position >= current!.seconds ||
          (current!.isVideo && video?.value.isCompleted == true) ||
          (hasRealAudio && audio?.completed == true)) {
        position = current!.seconds;
        playing = false;
        notifyListeners();
        _storeListening();
        if (queue.isNotEmpty) {
          playNext();
          return;
        }
      }
      _ticksSinceSave++;
      if (_ticksSinceSave >= 5 || !playing) _storeListening();
      playbackTick.value++;
    });
    notifyListeners();
    return true;
  }

  void togglePlaying() {
    if (current == null) return;
    if (!playing) {
      play(current!);
      return;
    }
    playing = false;
    if (video != null && video!.value.isInitialized) {
      position = video!.value.position.inSeconds.clamp(0, current!.seconds);
    }
    if (video != null) unawaited(video!.pause());
    if (audio?.initialized == true) {
      position = audio!.position.inSeconds.clamp(0, current!.seconds);
      audio!.pause();
    }
    _storeListening();
    notifyListeners();
  }

  void seek(int seconds) {
    if (current == null) return;
    position = seconds.clamp(0, current!.seconds);
    if (video != null && video!.value.isInitialized) {
      unawaited(video!.seekTo(Duration(seconds: position)));
      if (position == current!.seconds) unawaited(video!.pause());
    }
    if (audio?.initialized == true) {
      audio!.seek(Duration(seconds: position));
      if (position == current!.seconds) audio!.pause();
    }
    _fraction = 0;
    if (position == current!.seconds) playing = false;
    _storeListening();
    notifyListeners();
  }

  void setSpeed(double rate) {
    if (![1.0, 1.25, 1.5, 1.75, 2.0].contains(rate)) return;
    speed = rate;
    if (video != null && video!.value.isInitialized) {
      unawaited(video!.setPlaybackSpeed(rate));
    }
    audio?.setSpeed(rate);
    unawaited(preferences.setDouble('playbackSpeed', rate));
    notifyListeners();
  }

  void cycleSpeed() {
    const rates = [1.0, 1.25, 1.5, 2.0];
    setSpeed(rates[(rates.indexOf(speed) + 1) % rates.length]);
  }

  void setSleep(int? minutes) {
    _sleep?.cancel();
    sleepMinutes = minutes;
    if (minutes != null) {
      _sleep = Timer(Duration(minutes: minutes), () {
        playing = false;
        if (video != null) unawaited(video!.pause());
        audio?.pause();
        sleepMinutes = null;
        _storeListening();
        notifyListeners();
      });
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _closeVideo();
    _closeAudio();
    _storeListening();
    _ticker?.cancel();
    _sleep?.cancel();
    super.dispose();
    playbackTick.dispose();
  }

  Future<void> pauseForDataChange() async {
    SessionAudioFiles.clear();
    _closeVideo();
    _closeAudio();
    _ticker?.cancel();
    _ticker = null;
    _sleep?.cancel();
    _sleep = null;
    playing = false;
    sleepMinutes = null;
    if (current != null) {
      listeningProgress[current!.id] = position;
      await preferences.setString(
        'listeningProgress',
        jsonEncode(listeningProgress),
      );
      await preferences.setStringList('recentPlayed', recentPlayed);
    }
    current = null;
    position = 0;
    _fraction = 0;
    notifyListeners();
  }

  void reloadLocalData() {
    final fresh = AppState(preferences);
    checkoutStates
      ..clear()
      ..addAll(fresh.checkoutStates);
    queue
      ..clear()
      ..addAll(fresh.queue);
    for (final pair in [
      (saved, fresh.saved),
      (followed, fresh.followed),
      (memberships, fresh.memberships),
      (likedEpisodes, fresh.likedEpisodes),
      (dislikedEpisodes, fresh.dislikedEpisodes),
    ]) {
      pair.$1
        ..clear()
        ..addAll(pair.$2);
    }
    transactions
      ..clear()
      ..addAll(fresh.transactions);
    _comments
      ..clear()
      ..addAll(fresh._comments);
    recentSearches
      ..clear()
      ..addAll(fresh.recentSearches);
    recentPlayed
      ..clear()
      ..addAll(fresh.recentPlayed);
    listeningProgress
      ..clear()
      ..addAll(fresh.listeningProgress);
    displayName = fresh.displayName;
    isLoggedIn = fresh.isLoggedIn;
    userEmail = fresh.userEmail;
    userPhone = fresh.userPhone;
    speed = fresh.speed;
    fresh.dispose();
    notifyListeners();
  }
}
