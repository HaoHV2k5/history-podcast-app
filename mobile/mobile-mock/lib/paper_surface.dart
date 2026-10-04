import 'dart:math';

import 'package:flutter/material.dart';

import 'design.dart';

/// A quiet, static paper grain behind content, never over photos or text.
class PaperSurface extends StatelessWidget {
  const PaperSurface({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Material(
    color: Palette.paper,
    child: Stack(
      fit: StackFit.passthrough,
      children: [
        if (!MediaQuery.highContrastOf(context))
          const Positioned.fill(
            child: IgnorePointer(
              child: ExcludeSemantics(
                child: RepaintBoundary(
                  child: CustomPaint(
                    key: Key('paper-grain'),
                    painter: _PaperGrainPainter(),
                  ),
                ),
              ),
            ),
          ),
        Material(type: MaterialType.transparency, child: child),
      ],
    ),
  );
}

class _PaperGrainPainter extends CustomPainter {
  const _PaperGrainPainter();
  static const tile = 96.0;
  // Recorded paths stay constant through scrolling, taps and playback ticks.
  static final specks = _specks();
  static final fibers = _fibers();

  static Path _specks() {
    final random = Random(1986);
    final path = Path();
    for (var i = 0; i < 110; i++) {
      final x = random.nextDouble() * tile;
      final y = random.nextDouble() * tile;
      final radius = .25 + random.nextDouble() * .4;
      path.addOval(Rect.fromCircle(center: Offset(x, y), radius: radius));
    }
    return path;
  }

  static Path _fibers() {
    final random = Random(2026);
    final path = Path();
    for (var i = 0; i < 5; i++) {
      final x = 8 + random.nextDouble() * (tile - 16);
      final y = 8 + random.nextDouble() * (tile - 16);
      path.moveTo(x, y);
      path.quadraticBezierTo(
        x + 2,
        y - .5,
        x + 4 + random.nextDouble() * 3,
        y + .8,
      );
    }
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final grain = Paint()..color = Palette.ink.withValues(alpha: .075);
    final fiber = Paint()
      ..color = Palette.muted.withValues(alpha: .065)
      ..style = PaintingStyle.stroke
      ..strokeWidth = .35;
    canvas.save();
    canvas.clipRect(Offset.zero & size);
    for (var y = 0.0; y < size.height; y += tile) {
      for (var x = 0.0; x < size.width; x += tile) {
        canvas.save();
        canvas.translate(x, y);
        canvas.drawPath(specks, grain);
        canvas.drawPath(fibers, fiber);
        canvas.restore();
      }
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_PaperGrainPainter oldDelegate) => false;
}
