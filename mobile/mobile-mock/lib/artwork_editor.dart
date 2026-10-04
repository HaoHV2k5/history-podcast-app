import 'package:crop_your_image/crop_your_image.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'artwork_image.dart';
import 'artwork_state.dart';
import 'design.dart';

class ArtworkEditor extends StatefulWidget {
  const ArtworkEditor({
    super.key,
    required this.preferences,
    required this.target,
    required this.kind,
    required this.label,
    this.enabled = true,
    this.guard,
    this.onChanged,
  });
  final SharedPreferences preferences;
  final String target, label;
  final ArtworkKind kind;
  final bool enabled;
  final VoidCallback? guard, onChanged;
  @override
  State<ArtworkEditor> createState() => _ArtworkEditorState();
}

class _ArtworkEditorState extends State<ArtworkEditor> {
  late final store = ArtworkStore(widget.preferences);
  bool busy = false;
  String? error;
  @override
  void initState() {
    super.initState();
    store.reload(notify: false);
  }

  Future<void> choose() async {
    if (busy || !widget.enabled) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      widget.guard?.call();
      FocusScope.of(context).unfocus();
      final files = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      );
      if (files.isEmpty || !mounted) return;
      final file = files.first;
      validateArtworkInput(
        file.name,
        file.lengthSync() ?? await file.length() ?? 0,
      );
      final bytes = await file.xFile.readAsBytes();
      validateArtworkInput(file.name, bytes.length);
      // Yield to paint the loading state before decoding on web.
      await Future<void>.delayed(const Duration(milliseconds: 20));
      final prepared = await compute(prepareArtworkSource, bytes);
      if (!mounted) return;
      await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => ArtworkCropPage(
            bytes: prepared,
            kind: widget.kind,
            label: widget.label,
            sourceName: file.name.length > 100
                ? file.name.substring(0, 100)
                : file.name,
            onSave: (artwork) =>
                store.put(widget.target, artwork, guard: widget.guard),
          ),
        ),
      );
      widget.onChanged?.call();
    } catch (e) {
      if (mounted) {
        setState(
          () => error = e is StateError ? e.message : 'Chưa mở được ảnh. Chọn JPEG, PNG hoặc WebP hợp lệ rồi thử lại.',
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> remove() async {
    if (busy || !widget.enabled) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Gỡ ${widget.label.toLowerCase()}?'),
        content: const Text(
          'Giao diện sẽ dùng hình mặc định. File gốc trên thiết bị vẫn còn.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Giữ ảnh'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Gỡ ảnh'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await store.put(widget.target, null, guard: widget.guard);
      widget.onChanged?.call();
    } catch (e) {
      if (mounted) {
        setState(
          () => error = e is StateError
              ? e.message
              : 'Chưa gỡ được ảnh. Hãy thử lại.',
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<int>(
    valueListenable: ArtworkStore.revision,
    builder: (context, _, _) {
      final image = ArtworkStore.catalog[widget.target];
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: ArtworkImage(
                  artworkReference(widget.target),
                  key: Key('artwork-preview-${widget.target}'),
                  width: widget.kind == ArtworkKind.video ? 112 : 72,
                  height: widget.kind == ArtworkKind.video ? 63 : 72,
                  semanticLabel: widget.label,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.label,
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${widget.kind.ratioLabel} · ${image == null ? 'Chưa có ảnh' : '${image.width} × ${image.height}px'}',
                      style: const TextStyle(
                        color: Palette.muted,
                        fontSize: 12,
                      ),
                    ),
                    if (!widget.enabled)
                      const Text(
                        'Ảnh được khóa cùng nội dung.',
                        style: TextStyle(color: Palette.muted, fontSize: 12),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              OutlinedButton.icon(
                key: Key('choose-artwork-${widget.target}'),
                onPressed: busy || !widget.enabled ? null : choose,
                icon: const Icon(CupertinoIcons.photo, size: 18),
                label: Text(
                  busy
                      ? 'Đang mở ảnh…'
                      : '${image == null ? 'Chọn' : 'Thay'} ${widget.label.toLowerCase()}',
                ),
              ),
              if (image != null)
                TextButton(
                  key: Key('remove-artwork-${widget.target}'),
                  onPressed: busy || !widget.enabled ? null : remove,
                  child: const Text('Gỡ ảnh'),
                ),
            ],
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Semantics(
                liveRegion: true,
                child: Text(error!, style: const TextStyle(color: Palette.red)),
              ),
            ),
        ],
      );
    },
  );
}

class ArtworkCropPage extends StatefulWidget {
  const ArtworkCropPage({
    super.key,
    required this.bytes,
    required this.kind,
    required this.label,
    required this.sourceName,
    required this.onSave,
  });
  final Uint8List bytes;
  final ArtworkKind kind;
  final String label, sourceName;
  final Future<void> Function(LocalArtwork image) onSave;
  @override
  State<ArtworkCropPage> createState() => _ArtworkCropPageState();
}

class _ArtworkCropPageState extends State<ArtworkCropPage> {
  final controller = CropController();
  Rect? rect, original;
  bool ready = false, busy = false;
  String? error;

  void move(double x, double y) {
    if (rect == null || busy || !ready) return;
    controller.cropRect = rect!.shift(Offset(x, y));
  }

  void scale(double factor) {
    if (rect == null || busy || !ready) return;
    controller.cropRect = Rect.fromCenter(
      center: rect!.center,
      width: rect!.width * factor,
      height: rect!.height * factor,
    );
  }

  Future<void> cropped(CropResult result) async {
    if (!mounted) return;
    try {
      if (result is! CropSuccess) {
        throw StateError('Chưa cắt được ảnh. Điều chỉnh vùng cắt rồi thử lại.');
      }
      final data = await compute(finishArtwork, {
        'bytes': result.croppedImage,
        'kind': widget.kind.name,
        'name': widget.sourceName,
      });
      if (!mounted) return;
      await widget.onSave(data);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          busy = false;
          error = e is StateError
              ? e.message
              : 'Chưa lưu được ảnh. Vùng cắt vẫn được giữ để thử lại.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !busy,
    child: Scaffold(
      appBar: AppBar(
        title: Text(
          'Cắt ${widget.label.toLowerCase()}',
          style: const TextStyle(fontSize: 16),
        ),
        leading: IconButton(
          tooltip: 'Bỏ chỉnh ảnh',
          icon: const Icon(CupertinoIcons.xmark),
          onPressed: busy ? null : () => Navigator.pop(context, false),
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Chọn khung hình ${widget.kind.ratioLabel}',
                style: editorial(24),
              ),
              const SizedBox(height: 8),
              const Text(
                'Kéo vùng chọn hoặc dùng các nút điều chỉnh bên dưới.',
                style: TextStyle(color: Palette.muted),
              ),
              const SizedBox(height: 20),
              SizedBox(
                height: (constraints.maxHeight * .5).clamp(200, 380),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Crop(
                    image: widget.bytes,
                    controller: controller,
                    aspectRatio: widget.kind.ratio,
                    initialRectBuilder: InitialRectBuilder.withSizeAndRatio(
                      size: .9,
                      aspectRatio: widget.kind.ratio,
                    ),
                    baseColor: Palette.soft,
                    maskColor: Palette.ink.withValues(alpha: .6),
                    progressIndicator: const Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    onStatusChanged: (status) {
                      if (mounted) {
                        setState(() => ready = status == CropStatus.ready);
                      }
                    },
                    onMoved: (current, _) {
                      rect = current;
                      original ??= current;
                    },
                    onCropped: cropped,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 4,
                children: [
                  IconButton(
                    tooltip: 'Dịch vùng cắt sang trái',
                    onPressed: ready && !busy ? () => move(-12, 0) : null,
                    icon: const Icon(CupertinoIcons.arrow_left),
                  ),
                  IconButton(
                    tooltip: 'Dịch vùng cắt lên trên',
                    onPressed: ready && !busy ? () => move(0, -12) : null,
                    icon: const Icon(CupertinoIcons.arrow_up),
                  ),
                  IconButton(
                    tooltip: 'Dịch vùng cắt xuống dưới',
                    onPressed: ready && !busy ? () => move(0, 12) : null,
                    icon: const Icon(CupertinoIcons.arrow_down),
                  ),
                  IconButton(
                    tooltip: 'Dịch vùng cắt sang phải',
                    onPressed: ready && !busy ? () => move(12, 0) : null,
                    icon: const Icon(CupertinoIcons.arrow_right),
                  ),
                  IconButton(
                    tooltip: 'Thu nhỏ vùng cắt',
                    onPressed: ready && !busy ? () => scale(.8) : null,
                    icon: const Icon(CupertinoIcons.plus),
                  ),
                  IconButton(
                    tooltip: 'Mở rộng vùng cắt',
                    onPressed: ready && !busy ? () => scale(1.25) : null,
                    icon: const Icon(CupertinoIcons.minus),
                  ),
                ],
              ),
              TextButton(
                onPressed: ready && !busy && original != null
                    ? () => controller.cropRect = original!
                    : null,
                child: const Text('Đặt lại vùng cắt'),
              ),
              if (error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      error!,
                      style: const TextStyle(color: Palette.red),
                    ),
                  ),
                ),
              const Text(
                'JPEG, PNG, WebP · dưới 8 MB · ảnh tĩnh từ 160px. Ảnh lưu trên thiết bị để thử giao diện.',
                style: TextStyle(color: Palette.muted, fontSize: 12),
              ),
              const SizedBox(height: 20),
              FilledButton(
                key: const Key('save-cropped-artwork'),
                onPressed: busy || !ready
                    ? null
                    : () {
                        setState(() {
                          busy = true;
                          error = null;
                        });
                        controller.crop();
                      },
                child: Text(busy ? 'Đang lưu ảnh…' : 'Lưu ảnh'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
