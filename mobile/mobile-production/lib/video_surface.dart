import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';

import 'app_state.dart';
import 'design.dart';

class VideoSurface extends StatelessWidget {
  const VideoSurface({super.key, required this.state, this.fullscreen = false});
  final AppState state;
  final bool fullscreen;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: state,
    builder: (context, _) {
      final controller = state.video;
      return Align(
        alignment: Alignment.topCenter,
        child: SizedBox(
          width: fullscreen
              ? double.infinity
              : (MediaQuery.sizeOf(context).height < 500
                  ? (MediaQuery.sizeOf(context).height - 160).clamp(100, 300) *
                        16 /
                        9
                  : MediaQuery.sizeOf(context).width),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(fullscreen ? 0 : 8),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: ColoredBox(
                    color: Palette.ink,
                    child: state.videoError != null
                        ? Center(
                            child: TextButton.icon(
                              key: const Key('retry-video'),
                              onPressed: state.retryVideo,
                              icon: const Icon(
                                CupertinoIcons.refresh,
                                color: Colors.white,
                              ),
                              label: const Text(
                                'Không tải được · Thử lại',
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                          )
                        : state.videoLoading || controller == null
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: Colors.white,
                            ),
                          )
                        : ValueListenableBuilder<VideoPlayerValue>(
                            valueListenable: controller,
                            builder: (context, value, _) => Stack(
                              alignment: Alignment.center,
                              children: [
                                VideoPlayer(controller),
                                if (value.isBuffering)
                                  const CircularProgressIndicator(
                                    color: Colors.white,
                                  ),
                              ],
                            ),
                          ),
                  ),
                ),
              ),
              if (!fullscreen)
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    key: const Key('video-fullscreen'),
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => FullscreenVideoPage(state: state),
                      ),
                    ),
                    icon: const Icon(
                      CupertinoIcons.arrow_up_left_arrow_down_right,
                      size: 16,
                    ),
                    label: const Text('Toàn màn hình'),
                  ),
                ),
            ],
          ),
        ),
      );
    },
  );
}

class FullscreenVideoPage extends StatefulWidget {
  const FullscreenVideoPage({super.key, required this.state});
  final AppState state;

  @override
  State<FullscreenVideoPage> createState() => _FullscreenVideoPageState();
}

class _FullscreenVideoPageState extends State<FullscreenVideoPage> {
  bool _showControls = true;
  Timer? _hideTimer;

  @override
  void initState() {
    super.initState();
    // Chuyển sang chế độ toàn màn hình: xoay ngang và ẩn thanh hệ thống
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _startHideTimer();
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    // Phục hồi lại định hướng màn hình và thanh hệ thống khi đóng toàn màn hình
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _startHideTimer() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() => _showControls = false);
      }
    });
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
    if (_showControls) {
      _startHideTimer();
    } else {
      _hideTimer?.cancel();
    }
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (d.inHours > 0) {
      return '${d.inHours}:$minutes:$seconds';
    }
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: ListenableBuilder(
        listenable: widget.state,
        builder: (context, _) {
          final controller = widget.state.video;
          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: _toggleControls,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Video hiển thị trọn vẹn toàn bộ màn hình
                Center(
                  child: controller != null && controller.value.isInitialized
                      ? AspectRatio(
                          aspectRatio: controller.value.aspectRatio,
                          child: VideoPlayer(controller),
                        )
                      : widget.state.videoError != null
                          ? Center(
                              child: TextButton.icon(
                                onPressed: widget.state.retryVideo,
                                icon: const Icon(
                                  CupertinoIcons.refresh,
                                  color: Colors.white,
                                ),
                                label: const Text(
                                  'Không tải được · Thử lại',
                                  style: TextStyle(color: Colors.white),
                                ),
                              ),
                            )
                          : const Center(
                              child: CircularProgressIndicator(
                                color: Colors.white,
                              ),
                            ),
                ),

                // Lớp điều khiển phủ lên video (tự ẩn sau 4 giây)
                AnimatedOpacity(
                  opacity: _showControls ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 250),
                  child: IgnorePointer(
                    ignoring: !_showControls,
                    child: Stack(
                      children: [
                        // Thanh tiêu đề phía trên cùng
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.black.withValues(alpha: 0.8),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                            child: SafeArea(
                              bottom: false,
                              child: Row(
                                children: [
                                  IconButton(
                                    key: const Key('fullscreen-back-btn'),
                                    icon: const Icon(
                                      CupertinoIcons.chevron_back,
                                      color: Colors.white,
                                      size: 26,
                                    ),
                                    onPressed: () => Navigator.of(context).pop(),
                                    tooltip: 'Thoát toàn màn hình',
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      widget.state.current?.title ?? 'Video Sử Ký',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                        // Nút Play / Pause chính giữa màn hình
                        Center(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.5),
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              iconSize: 56,
                              color: Colors.white,
                              tooltip: widget.state.playing ? 'Tạm dừng' : 'Phát tiếp',
                              onPressed: () {
                                widget.state.togglePlaying();
                                _startHideTimer();
                              },
                              icon: Icon(
                                widget.state.playing
                                    ? CupertinoIcons.pause_fill
                                    : CupertinoIcons.play_fill,
                              ),
                            ),
                          ),
                        ),

                        // Thanh tiến trình và nút thoát toàn màn hình ở dưới cùng
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [
                                  Colors.black.withValues(alpha: 0.85),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                            child: SafeArea(
                              top: false,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (controller != null && controller.value.isInitialized)
                                    VideoProgressIndicator(
                                      controller,
                                      allowScrubbing: true,
                                      colors: const VideoProgressColors(
                                        playedColor: Palette.red,
                                        bufferedColor: Colors.white24,
                                        backgroundColor: Colors.white12,
                                      ),
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                    ),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      if (controller != null && controller.value.isInitialized)
                                        ValueListenableBuilder<VideoPlayerValue>(
                                          valueListenable: controller,
                                          builder: (context, value, _) {
                                            return Text(
                                              '${_formatDuration(value.position)} / ${_formatDuration(value.duration)}',
                                              style: const TextStyle(
                                                color: Colors.white70,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            );
                                          },
                                        )
                                      else
                                        const SizedBox.shrink(),
                                      IconButton(
                                        key: const Key('fullscreen-exit-btn'),
                                        icon: const Icon(
                                          CupertinoIcons.fullscreen_exit,
                                          color: Colors.white,
                                          size: 22,
                                        ),
                                        onPressed: () => Navigator.of(context).pop(),
                                        tooltip: 'Thu nhỏ',
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
