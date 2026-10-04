import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
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
          width: MediaQuery.sizeOf(context).height < 500
              ? (MediaQuery.sizeOf(context).height - 160).clamp(100, 300) *
                    16 /
                    9
              : MediaQuery.sizeOf(context).width,
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
                        builder: (_) => Scaffold(
                          backgroundColor: Palette.ink,
                          appBar: AppBar(title: const Text('Toàn màn hình')),
                          body: SafeArea(
                            child: Center(
                              child: ListView(
                                shrinkWrap: true,
                                children: [
                                  VideoSurface(state: state, fullscreen: true),
                                  Center(
                                    child: ListenableBuilder(
                                      listenable: state,
                                      builder: (context, _) => IconButton(
                                        tooltip: state.playing
                                            ? 'Tạm dừng video'
                                            : 'Phát video',
                                        color: Colors.white,
                                        onPressed: state.togglePlaying,
                                        icon: Icon(
                                          state.playing
                                              ? CupertinoIcons.pause_fill
                                              : CupertinoIcons.play_fill,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
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
