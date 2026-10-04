import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Only app-owned keys are replaced. Original local data is kept until restored.
class DemoDataService {
  DemoDataService(this.preferences);
  final SharedPreferences preferences;
  static const keys = [
    'artworkDemoV1',
    'walletDemoV1',
    'productionJobsV1',
    'publishedEpisodesV1',
    'checkoutStatesV1',
    'playbackQueueV1',
    'seenUpdatesV1',
    'savedEpisodes',
    'followedChannels',
    'demoMemberships',
    'likedEpisodes',
    'dislikedEpisodes',
    'displayName',
    'isLoggedIn',
    'userEmail',
    'userPhone',
    'userComments',
    'membershipTransactions',
    'recentSearches',
    'recentPlayed',
    'listeningProgress',
    'playbackSpeed',
    'creatorStudioV1',
    'narratorContractsV1',
    'narratorVerificationV1',
    'narratorProfileV1',
  ];
  bool get hasBackup => preferences.containsKey('demoOriginalV1');
  String? get current => preferences.getString('demoScenarioV1');
  Future<List<Map<String, dynamic>>> scenarios() async {
    final data = jsonDecode(
      await rootBundle.loadString('assets/mock/demo/scenarios.json'),
    ) as Map<String, dynamic>;
    return (data['scenarios'] as List).cast<Map<String, dynamic>>();
  }

  Future<void> _put(String key, dynamic value) async {
    final bool ok;
    if (value is String) {
      ok = await preferences.setString(key, value);
    } else if (value is bool) {
      ok = await preferences.setBool(key, value);
    } else if (value is num) {
      ok = await preferences.setDouble(key, value.toDouble());
    } else if (value is List) {
      ok = await preferences.setStringList(key, value.cast<String>());
    } else {
      throw StateError('Dữ liệu demo không hợp lệ.');
    }
    if (!ok) throw StateError('Không lưu được dữ liệu demo.');
  }

  Future<void> load(String id) async {
    final presets = await scenarios();
    final matches = presets.where((p) => p['id'] == id);
    if (matches.isEmpty) throw StateError('Không có bộ dữ liệu demo này.');
    final values = matches.first['values'] as Map<String, dynamic>;
    if (values.keys.any((k) => !keys.contains(k))) {
      throw StateError('Bộ demo có khóa ngoài phạm vi.');
    }
    if (!hasBackup) {
      final original = {
        for (final k in keys)
          if (preferences.containsKey(k)) k: preferences.get(k),
      };
      if (!await preferences.setString(
        'demoOriginalV1',
        jsonEncode(original),
      )) {
        throw StateError('Không sao lưu được dữ liệu trước khi nạp demo.');
      }
    }
    for (final k in keys) {
      if (preferences.containsKey(k) && !await preferences.remove(k)) {
        throw StateError(
          'Không thay được dữ liệu. Bản gốc vẫn được giữ để khôi phục.',
        );
      }
    }
    for (final e in values.entries) {
      await _put(e.key, e.value);
    }
    await preferences.setString('demoScenarioV1', id);
  }

  Future<void> restore() async {
    final raw = preferences.getString('demoOriginalV1');
    if (raw == null) {
      throw StateError('Chưa có dữ liệu trước demo để khôi phục.');
    }
    final values = jsonDecode(raw) as Map<String, dynamic>;
    if (values.keys.any((k) => !keys.contains(k))) {
      throw StateError('Bản sao không hợp lệ.');
    }
    for (final k in keys) {
      if (preferences.containsKey(k) && !await preferences.remove(k)) {
        throw StateError('Không khôi phục được. Bản sao vẫn còn.');
      }
    }
    for (final e in values.entries) {
      await _put(e.key, e.value);
    }
    await preferences.remove('demoScenarioV1');
    await preferences.remove('demoOriginalV1');
  }
}
