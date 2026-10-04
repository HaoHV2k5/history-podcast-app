import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import 'design.dart';

/// Only one app player/voice preview may own playback at a time.
class MediaFocus {
  static Object? _owner;
  static VoidCallback? _pause;
  static void claim(Object owner, VoidCallback pause) {
    if (_owner != owner) _pause?.call();
    _owner = owner;
    _pause = pause;
  }

  static void release(Object owner) {
    if (_owner == owner) {
      _owner = null;
      _pause = null;
    }
  }
}

class AudioPlayback extends ChangeNotifier {
  AudioPlayback({AudioPlayer Function()? createPlayer})
    : _createPlayer = createPlayer ?? AudioPlayer.new;
  final AudioPlayer Function() _createPlayer;
  AudioPlayer? _player;
  final List<StreamSubscription<Object?>> _subscriptions = [];
  bool loading = false, closed = false;
  int _generation = 0;
  bool _ready = false;
  Duration? _loadedDuration;
  String? error;
  bool get initialized => _ready && !loading && error == null && !closed;
  Duration get position => _player?.position ?? Duration.zero;
  Duration get duration =>
      _player?.duration ?? _loadedDuration ?? Duration.zero;
  bool get playing => _player?.playing == true;
  bool get completed => _player?.processingState == ProcessingState.completed;
  bool get buffering => _player?.processingState == ProcessingState.buffering;

  Future<void> open(
    String source, {
    bool asset = true,
    int startAt = 0,
    double speed = 1,
    bool autoplay = true,
  }) async {
    if (closed) return;
    final generation = ++_generation;
    loading = true;
    _ready = false;
    _loadedDuration = null;
    error = null;
    notifyListeners();
    final player = _player ??= _createPlayer();
    if (_subscriptions.isEmpty) {
      _subscriptions.add(
        player.playerStateStream.listen((_) {
          if (!closed) notifyListeners();
        }),
      );
      _subscriptions.add(
        player.positionStream.listen((_) {
          if (!closed) notifyListeners();
        }),
      );
      _subscriptions.add(
        player.errorStream.listen((_) {
          if (closed) return;
          error = 'Chưa phát được audio. Kiểm tra định dạng và thử lại.';
          loading = false;
          pause();
          notifyListeners();
        }),
      );
    }
    try {
      if (asset) {
        _loadedDuration = await player.setAsset(
          source,
          initialPosition: Duration(seconds: startAt),
        );
      } else {
        _loadedDuration = await player.setUrl(
          source,
          initialPosition: Duration(seconds: startAt),
        );
      }
      if (closed || generation != _generation) return;
      await player.setSpeed(speed);
      if (closed || generation != _generation) return;
      loading = false;
      _ready = true;
      if (autoplay) play();
      notifyListeners();
    } catch (_) {
      if (closed || generation != _generation) return;
      loading = false;
      error = 'Không mở được audio. Hãy thử lại hoặc chọn file khác.';
      notifyListeners();
    }
  }

  void play() {
    if (closed || !initialized) return;
    unawaited(
      _player!.play().catchError((Object _) {
        if (!closed) {
          error = 'Chưa phát được audio. Hãy thử lại.';
          notifyListeners();
        }
      }),
    );
  }

  void pause() {
    if (!closed && _player != null) unawaited(_player!.pause());
  }

  void seek(Duration position) {
    if (!closed && initialized) unawaited(_player!.seek(position));
  }

  void setSpeed(double speed) {
    if (!closed && initialized) unawaited(_player!.setSpeed(speed));
  }

  @override
  void dispose() {
    closed = true;
    for (final subscription in _subscriptions) {
      unawaited(subscription.cancel());
    }
    if (_player != null) unawaited(_player!.dispose());
    super.dispose();
  }
}

class LocalAudioPreview extends StatefulWidget {
  const LocalAudioPreview({super.key, required this.bytes, required this.name});
  final Uint8List bytes;
  final String name;
  @override
  State<LocalAudioPreview> createState() => _LocalAudioPreviewState();
}

class _LocalAudioPreviewState extends State<LocalAudioPreview> {
  final audio = AudioPlayback();
  Future<void> load() async {
    final mime = widget.name.toLowerCase().endsWith('.wav')
        ? 'audio/wav'
        : 'audio/mpeg';
    await audio.open(
      Uri.dataFromBytes(widget.bytes, mimeType: mime).toString(),
      asset: false,
      autoplay: false,
    );
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void didUpdateWidget(LocalAudioPreview oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.bytes != widget.bytes) {
      audio.pause();
      load();
    }
  }

  @override
  void dispose() {
    MediaFocus.release(this);
    audio.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: audio,
    builder: (_, _) => Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Palette.soft,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            widget.name,
            style: const TextStyle(fontSize: 12),
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          if (audio.loading)
            const Text('Đang mở audio…')
          else if (audio.error != null) ...[
            Semantics(
              liveRegion: true,
              child: Text(
                audio.error!,
                style: const TextStyle(color: Palette.red, fontSize: 12),
              ),
            ),
            TextButton(onPressed: load, child: const Text('Thử lại audio')),
          ] else ...[
            Row(
              children: [
                IconButton(
                  tooltip: audio.playing && !audio.completed
                      ? 'Tạm dừng nghe thử file'
                      : 'Nghe thử file vừa chọn',
                  onPressed: () {
                    if (audio.playing && !audio.completed) {
                      audio.pause();
                    } else {
                      MediaFocus.claim(this, audio.pause);
                      if (audio.completed) audio.seek(Duration.zero);
                      audio.play();
                    }
                  },
                  icon: Icon(
                    audio.playing && !audio.completed
                        ? CupertinoIcons.pause_fill
                        : CupertinoIcons.play_fill,
                    color: Palette.red,
                  ),
                ),
                Expanded(
                  child: Text(
                    '${_clock(audio.position)} / ${_clock(audio.duration)}',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
            Slider(
              value: audio.position.inMilliseconds.toDouble().clamp(
                0,
                audio.duration.inMilliseconds.toDouble(),
              ),
              max: audio.duration.inMilliseconds.toDouble().clamp(
                1,
                double.infinity,
              ),
              semanticFormatterCallback: (v) => '${v ~/ 1000} giây',
              onChanged: (v) => audio.seek(Duration(milliseconds: v.round())),
            ),
            const Text(
              'Nghe trên thiết bị, chưa upload. File chỉ dùng trong phiên này.',
              style: TextStyle(color: Palette.muted, fontSize: 12),
            ),
          ],
        ],
      ),
    ),
  );
  static String _clock(Duration d) =>
      '${d.inMinutes}:${(d.inSeconds % 60).toString().padLeft(2, '0')}';
}
