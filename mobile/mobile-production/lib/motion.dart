import 'package:animations/animations.dart';
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter_animate/flutter_animate.dart';

Duration motionDuration(BuildContext context, int milliseconds) =>
    MediaQuery.disableAnimationsOf(context)
    ? Duration.zero
    : Duration(milliseconds: milliseconds);

/// Brief content emphasis; chrome and background remain stationary.
class TabMotion extends StatelessWidget {
  const TabMotion({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    if (MediaQuery.disableAnimationsOf(context)) return child;
    return TweenAnimationBuilder<double>(
      key: child.key,
      tween: Tween(begin: .86, end: 1),
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOutCubic,
      child: child,
      builder: (_, opacity, child) => Opacity(opacity: opacity, child: child),
    );
  }
}

/// A short dissolve rather than a sideways phone-page push.
class QuietPageMotion extends PageTransitionsBuilder {
  const QuietPageMotion();
  @override
  Duration get transitionDuration => const Duration(milliseconds: 180);
  @override
  Duration get reverseTransitionDuration => const Duration(milliseconds: 140);
  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    if (MediaQuery.disableAnimationsOf(context)) return child;
    return FadeTransition(
      opacity: animation.drive(CurveTween(curve: Curves.easeOutCubic)),
      child: child,
    );
  }
}

Route<void> playerRoute(BuildContext context, Widget page) =>
    PageRouteBuilder<void>(
      opaque: false,
      barrierColor: Colors.black26,
      barrierLabel: 'Trình phát',
      transitionDuration: motionDuration(context, 420),
      reverseTransitionDuration: motionDuration(context, 320),
      pageBuilder: (_, _, _) => PullDownPlayer(child: page),
      transitionsBuilder: (_, animation, _, child) {
        final eased = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
          reverseCurve: Curves.easeInCubic,
        );
        return SlideTransition(
          position: Tween(
            begin: const Offset(0, 1),
            end: Offset.zero,
          ).animate(eased),
          child: ClipRRect(
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(24 * (1 - eased.value)),
            ),
            child: child,
          ),
        );
      },
    );

/// Header drags dismiss. Scrollable content continues to own its own gestures.
class PullDownPlayer extends StatefulWidget {
  const PullDownPlayer({super.key, required this.child, this.dragController});
  final Widget child;
  final AnimationController? dragController;
  @override
  State<PullDownPlayer> createState() => _PullDownPlayerState();
}

class _PullDownPlayerState extends State<PullDownPlayer>
    with SingleTickerProviderStateMixin {
  late final offset =
      widget.dragController ?? AnimationController.unbounded(vsync: this);
  bool dismissing = false;

  @override
  void dispose() {
    if (widget.dragController == null) offset.dispose();
    super.dispose();
  }

  void returnToOrigin(double velocity) {
    if (MediaQuery.disableAnimationsOf(context)) {
      offset.value = 0;
      return;
    }
    offset.animateWith(
      SpringSimulation(
        const SpringDescription(mass: 1, stiffness: 320, damping: 34),
        offset.value,
        0,
        velocity,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    onVerticalDragStart: dismissing ? null : (_) => offset.stop(),
    onVerticalDragUpdate: dismissing
        ? null
        : (d) => offset.value = (offset.value + d.delta.dy).clamp(0, 300),
    onVerticalDragCancel: () => returnToOrigin(0),
    onVerticalDragEnd: (d) async {
      final velocity = d.primaryVelocity ?? 0;
      if (offset.value > 110 || velocity > 850) {
        dismissing = true;
        // Keep the release position while the route reverses; no snap to zero.
        final popped = await Navigator.maybePop(context);
        if (!popped && mounted) {
          dismissing = false;
          returnToOrigin(velocity);
        }
      } else {
        returnToOrigin(velocity);
      }
    },
    child: AnimatedBuilder(
      animation: offset,
      child: widget.child,
      builder: (context, child) {
        if (widget.dragController != null) return child!;
        final y = MediaQuery.disableAnimationsOf(context)
            ? 0.0
            : offset.value.clamp(0.0, 300.0);
        return Transform.translate(
          offset: Offset(0, y),
          child: Transform.scale(
            scale: 1 - y / 8000,
            alignment: Alignment.topCenter,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(y / 10),
              child: child,
            ),
          ),
        );
      },
    ),
  );
}

class MotionIcon extends StatelessWidget {
  const MotionIcon({super.key, required this.icon, this.size = 24, this.label});
  final IconData icon;
  final double size;
  final String? label;
  @override
  Widget build(BuildContext context) => AnimatedSwitcher(
    duration: motionDuration(context, 160),
    transitionBuilder: (child, animation) =>
        FadeScaleTransition(animation: animation, child: child),
    child: MediaQuery.disableAnimationsOf(context)
        ? Icon(icon, key: ValueKey(icon), size: size, semanticLabel: label)
        : Icon(icon, size: size, semanticLabel: label)
              .animate(key: ValueKey(icon))
              .scaleXY(
                begin: .92,
                end: 1,
                duration: 180.ms,
                curve: Curves.easeOutCubic,
              ),
  );
}

/// A transparent route keeps the live destination visible during a header drag.
/// The player grows from the mini-player bounds without scaling its typography.
class PlayerContainer extends StatefulWidget {
  const PlayerContainer({
    super.key,
    required this.page,
    required this.closedBuilder,
  });
  final Widget page;
  final Widget Function(BuildContext, VoidCallback) closedBuilder;
  @override
  State<PlayerContainer> createState() => _PlayerContainerState();
}

class _PlayerContainerState extends State<PlayerContainer> {
  final boundsKey = GlobalKey();
  bool opening = false;

  void open() async {
    if (opening) return;
    final navigator = Navigator.of(context);
    final box = boundsKey.currentContext?.findRenderObject() as RenderBox?;
    final navBox = navigator.context.findRenderObject() as RenderBox?;
    if (box == null || navBox == null) return;
    final initialBounds =
        box.localToGlobal(Offset.zero, ancestor: navBox) & box.size;
    Rect bounds() {
      final liveBox =
          boundsKey.currentContext?.findRenderObject() as RenderBox?;
      if (liveBox != null && liveBox.hasSize) {
        return liveBox.localToGlobal(Offset.zero, ancestor: navBox) &
            liveBox.size;
      }
      return initialBounds;
    }

    opening = true;
    final preview = widget.closedBuilder(context, () {});
    try {
      await navigator.push<void>(
        PageRouteBuilder<void>(
          opaque: false,
          transitionDuration: motionDuration(context, 460),
          reverseTransitionDuration: motionDuration(context, 380),
          pageBuilder: (_, _, _) => widget.page,
          transitionsBuilder: (_, animation, _, child) => _PlayerExpansion(
            animation: animation,
            sourceBounds: bounds,
            preview: preview,
            child: child,
          ),
        ),
      );
    } finally {
      opening = false;
    }
  }

  @override
  Widget build(BuildContext context) =>
      SizedBox(key: boundsKey, child: widget.closedBuilder(context, open));
}

class _PlayerExpansion extends StatefulWidget {
  const _PlayerExpansion({
    required this.animation,
    required this.sourceBounds,
    required this.preview,
    required this.child,
  });
  final Animation<double> animation;
  final Rect Function() sourceBounds;
  final Widget preview;
  final Widget child;
  @override
  State<_PlayerExpansion> createState() => _PlayerExpansionState();
}

class _PlayerExpansionState extends State<_PlayerExpansion>
    with SingleTickerProviderStateMixin {
  late final drag = AnimationController.unbounded(vsync: this);
  @override
  void dispose() {
    drag.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) => AnimatedBuilder(
      animation: Listenable.merge([widget.animation, drag]),
      child: PullDownPlayer(dragController: drag, child: widget.child),
      builder: (context, page) {
        final t = Curves.easeOutCubic.transform(widget.animation.value);
        final reduced = MediaQuery.disableAnimationsOf(context);
        final y = reduced ? 0.0 : drag.value.clamp(0.0, 300.0);
        final size = constraints.biggest;
        final scale = 1 - y / 8000;
        final expanded = Rect.fromLTWH(
          size.width * (1 - scale) / 2,
          y,
          size.width * scale,
          size.height * scale,
        );
        final source = widget.sourceBounds();
        final rect = Rect.lerp(source, expanded, t)!;
        final radius = 24 * (1 - t) + (y / 10) * t;
        final pageOpacity = ((t - .12) / .48).clamp(0.0, 1.0);
        final previewOpacity = (1 - t / .35).clamp(0.0, 1.0);
        return Stack(
          children: [
            Positioned.fill(
              child: IgnorePointer(
                child: ColoredBox(
                  color: Colors.black.withValues(alpha: .12 * t),
                ),
              ),
            ),
            Positioned.fromRect(
              rect: rect,
              child: ClipRRect(
                key: const Key('expanded-player-surface'),
                borderRadius: BorderRadius.circular(radius),
                child: Material(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      OverflowBox(
                        alignment: Alignment.topCenter,
                        minWidth: size.width,
                        maxWidth: size.width,
                        minHeight: size.height,
                        maxHeight: size.height,
                        child: Opacity(opacity: pageOpacity, child: page),
                      ),
                      if (previewOpacity > 0)
                        IgnorePointer(
                          child: ExcludeSemantics(
                            child: Opacity(
                              opacity: previewOpacity,
                              child: OverflowBox(
                                alignment: Alignment.topLeft,
                                minWidth: source.width,
                                maxWidth: source.width,
                                minHeight: source.height,
                                maxHeight: source.height,
                                child: widget.preview,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    ),
  );
}
