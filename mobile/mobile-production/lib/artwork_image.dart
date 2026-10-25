import 'package:flutter/cupertino.dart';

import 'artwork_state.dart';
import 'design.dart';

/// Renders bundled imagery and the demo's persisted, cropped thumbnails.
class ArtworkImage extends StatelessWidget {
  const ArtworkImage(
    this.source, {
    super.key,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.semanticLabel,
    this.excludeFromSemantics = false,
    this.errorBuilder,
    this.fallback,
  });
  final String source;
  final double? width, height;
  final BoxFit fit;
  final String? semanticLabel;
  final bool excludeFromSemantics;
  final ImageErrorWidgetBuilder? errorBuilder;
  final Widget? fallback;
  @override
  Widget build(BuildContext context) => ValueListenableBuilder<int>(
    valueListenable: ArtworkStore.revision,
    builder: (context, _, _) {
      var normalized = source.trim();
      if (normalized.startsWith('/assets/')) {
        normalized = normalized.substring(1);
      }
      if (normalized.startsWith('assets/images/')) {
        normalized = normalized.replaceFirst(
          'assets/images/',
          'assets/mock/images/',
        );
      }
      if (normalized.endsWith('hue-citadel.jpg') ||
          normalized.endsWith('hanoi-bridge.jpg')) {
        normalized = 'assets/mock/images/ha-noi.jpg';
      } else if (normalized.endsWith('hoi-an-lanterns.jpg') ||
          normalized.endsWith('hoi-an-wood.jpg')) {
        normalized = 'assets/mock/images/hoi-an.jpg';
      } else if (normalized.endsWith('van-mieu-stone.jpg')) {
        normalized = 'assets/mock/images/van-mieu.jpg';
      }
      final local = normalized.startsWith('local-artwork:');
      final isNetwork =
          normalized.startsWith('http://') || normalized.startsWith('https://');
      final image = local
          ? ArtworkStore.catalog[normalized.substring('local-artwork:'.length)]
          : null;
      if (local && image == null || normalized.isEmpty) {
        return Semantics(
          label: excludeFromSemantics ? null : semanticLabel,
          excludeSemantics: excludeFromSemantics,
          child: SizedBox(
            width: width,
            height: height,
            child:
                fallback ??
                ColoredBox(
                  color: Palette.soft,
                  child: const Center(
                    child: Icon(CupertinoIcons.photo, color: Palette.muted),
                  ),
                ),
          ),
        );
      }
      final ImageProvider provider = image != null
          ? MemoryImage(image.bytes)
          : isNetwork
          ? NetworkImage(normalized)
          : AssetImage(normalized);
      return Image(
        image: provider,
        width: width,
        height: height,
        fit: fit,
        semanticLabel: semanticLabel,
        excludeFromSemantics: excludeFromSemantics,
        errorBuilder:
            errorBuilder ??
            (_, _, _) => SizedBox(
              width: width,
              height: height,
              child:
                  fallback ??
                  const ColoredBox(
                    color: Palette.soft,
                    child: Center(
                      child: Icon(CupertinoIcons.photo, color: Palette.muted),
                    ),
                  ),
            ),
      );
    },
  );
}
