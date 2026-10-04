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
      final local = source.startsWith('local-artwork:');
      final image = local
          ? ArtworkStore.catalog[source.substring('local-artwork:'.length)]
          : null;
      if (local && image == null || source.isEmpty) {
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
      return Image(
        image: image == null ? AssetImage(source) : MemoryImage(image.bytes),
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
              child: const ColoredBox(color: Palette.soft),
            ),
      );
    },
  );
}
