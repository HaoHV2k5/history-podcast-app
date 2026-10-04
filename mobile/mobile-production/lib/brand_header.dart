import 'package:flutter/material.dart';

import 'design.dart';
import 'paper_surface.dart';

TextStyle _wordmarkStyle(bool compact) => TextStyle(
  fontFamily: 'CormorantWordmark',
  fontStyle: FontStyle.italic,
  fontWeight: FontWeight.w600,
  fontSize: compact ? 30 : 46,
  height: 1.05,
  letterSpacing: -1.4,
  color: Palette.ink,
);

/// A modern publisher's masthead, not a reproduction of a historical seal.
class BrandHeader extends StatelessWidget implements PreferredSizeWidget {
  const BrandHeader({super.key, required this.height, this.compact = false});

  factory BrandHeader.adaptive(BuildContext context) {
    final media = MediaQuery.of(context);
    final textWidth = media.size.width.clamp(0.0, 480.0) - 100;
    double measure(String text, TextStyle style) {
      final painter = TextPainter(
        text: TextSpan(
          text: text,
          style: Theme.of(context).textTheme.bodyMedium?.merge(style),
        ),
        textDirection: Directionality.of(context),
        textScaler: media.textScaler,
      )..layout(maxWidth: textWidth);
      final height = painter.height;
      painter.dispose();
      return height;
    }

    if (media.size.height < 500) {
      return BrandHeader(
        height:
            measure(
              'Sử Ký',
              _wordmarkStyle(true),
            ).clamp(42.0, double.infinity) +
            36,
        compact: true,
      );
    }
    final textHeight =
        measure('Sử Ký', _wordmarkStyle(false)) +
        4 +
        measure(
          'Chuyện xưa · Góc nhìn nay',
          const TextStyle(fontFamily: 'BeVietnam', fontSize: 11, height: 1.5),
        );
    return BrandHeader(height: textHeight.clamp(42.0, double.infinity) + 46);
  }

  final double height;
  final bool compact;

  @override
  Size get preferredSize => Size.fromHeight(height);

  @override
  Widget build(BuildContext context) => Material(
    color: Palette.paper,
    child: PaperSurface(
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            24,
            compact ? 8 : 14,
            24,
            compact ? 8 : 12,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Semantics(
                          header: true,
                          label: 'Sử Ký',
                          child: ExcludeSemantics(
                            child: Text(
                              'Sử Ký',
                              key: const Key('brand-wordmark'),
                              style: _wordmarkStyle(compact),
                            ),
                          ),
                        ),
                        if (!compact) ...[
                          const SizedBox(height: 4),
                          const Text(
                            'Chuyện xưa · Góc nhìn nay',
                            style: TextStyle(
                              fontSize: 11,
                              height: 1.5,
                              color: Palette.muted,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  const ExcludeSemantics(
                    child: CustomPaint(
                      size: Size(36, 42),
                      painter: _BookSealPainter(),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Row(
                children: [
                  SizedBox(width: 24, child: Divider(color: Palette.red)),
                  SizedBox(width: 5),
                  Expanded(child: Divider()),
                ],
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

/// A book/spine drawn as a compact monoline imprint. No image dependency.
class _BookSealPainter extends CustomPainter {
  const _BookSealPainter();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRRect(
      RRect.fromRectAndRadius(Offset.zero & size, const Radius.circular(2)),
      Paint()..color = Palette.red,
    );
    final ink = Paint()
      ..color = Palette.paper
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.square
      ..strokeJoin = StrokeJoin.miter;
    canvas.drawRect(Rect.fromLTWH(4, 4, size.width - 8, size.height - 8), ink);
    final book = Path()
      ..moveTo(18, 12)
      ..lineTo(10, 10)
      ..lineTo(10, 29)
      ..lineTo(18, 32)
      ..lineTo(26, 29)
      ..lineTo(26, 10)
      ..close()
      ..moveTo(18, 12)
      ..lineTo(18, 32);
    canvas.drawPath(book, ink);
    canvas.drawLine(const Offset(13, 16), const Offset(15, 17), ink);
    canvas.drawLine(const Offset(13, 20), const Offset(15, 21), ink);
    canvas.drawLine(const Offset(21, 17), const Offset(23, 16), ink);
    canvas.drawLine(const Offset(21, 21), const Offset(23, 20), ink);
  }

  @override
  bool shouldRepaint(covariant _BookSealPainter oldDelegate) => false;
}
