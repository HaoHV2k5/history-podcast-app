import 'dart:math' as math;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

import 'design.dart';

/// Peer tabs switch immediately. Previously opened subtrees remain mounted;
/// there is no full-page opacity layer, route push or horizontal page motion.
class RetainedHomeTabs extends StatefulWidget {
  const RetainedHomeTabs({super.key, required this.index, required this.child});
  final int index;
  final Widget child;
  @override
  State<RetainedHomeTabs> createState() => _RetainedHomeTabsState();
}

class _RetainedHomeTabsState extends State<RetainedHomeTabs> {
  final Map<int, Widget> pages = {};
  @override
  Widget build(BuildContext context) {
    // Refresh only the active tab's configuration, retaining State in its slot.
    pages[widget.index] = widget.child;
    return Stack(
      fit: StackFit.expand,
      children: List.generate(4, (i) {
        final active = i == widget.index;
        return KeyedSubtree(
          key: ValueKey('home-tab-slot-$i'),
          child: Offstage(
            offstage: !active,
            child: TickerMode(
              enabled: active,
              child: ExcludeFocus(
                excluding: !active,
                child: ExcludeSemantics(
                  excluding: !active,
                  child: IgnorePointer(
                    ignoring: !active,
                    child: RepaintBoundary(child: pages[i] ?? const SizedBox()),
                  ),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}

/// Selection moves as one continuous, critically damped spring. Retargeting
/// preserves the current position/velocity instead of restarting from a tab.
class HomeTabBar extends StatefulWidget {
  const HomeTabBar({super.key, required this.index, required this.onSelected});
  final int index;
  final ValueChanged<int> onSelected;
  static const labels = ['Khám phá', 'Tìm kiếm', 'Thư viện', 'Cá nhân'];
  static const icons = [
    CupertinoIcons.compass,
    CupertinoIcons.search,
    CupertinoIcons.bookmark,
    CupertinoIcons.person,
  ];
  static const selectedIcons = [
    CupertinoIcons.compass_fill,
    CupertinoIcons.search,
    CupertinoIcons.bookmark_fill,
    CupertinoIcons.person_fill,
  ];
  static const labelStyle = TextStyle(
    inherit: false,
    fontFamily: 'BeVietnam',
    letterSpacing: 0,
    fontSize: 12,
    height: 1.25,
    fontWeight: FontWeight.w500,
    color: Palette.ink,
  );

  static double heightOf(BuildContext context) {
    final width = math.min(MediaQuery.sizeOf(context).width, 480.0) / 4 - 8;
    var labelHeight = 0.0;
    for (final label in labels) {
      final painter = TextPainter(
        text: TextSpan(text: label, style: labelStyle),
        textDirection: Directionality.of(context),
        textScaler: MediaQuery.textScalerOf(context),
      )..layout(maxWidth: width);
      labelHeight = math.max(labelHeight, painter.height);
      painter.dispose();
    }
    return math.max(76, 18 + 22 + 6 + labelHeight + 10);
  }

  @override
  State<HomeTabBar> createState() => _HomeTabBarState();
}

class _HomeTabBarState extends State<HomeTabBar>
    with SingleTickerProviderStateMixin {
  late final position = AnimationController.unbounded(
    vsync: this,
    value: widget.index.toDouble(),
  );
  bool reduced = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    reduced =
        MediaQuery.disableAnimationsOf(context) ||
        MediaQuery.accessibleNavigationOf(context);
    if (reduced) {
      position.stop();
      position.value = widget.index.toDouble();
    }
  }

  @override
  void didUpdateWidget(HomeTabBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.index == widget.index) return;
    if (reduced) {
      position.stop();
      position.value = widget.index.toDouble();
      return;
    }
    position.animateWith(
      SpringSimulation(
        SpringDescription.withDampingRatio(mass: 1, stiffness: 650, ratio: 1),
        position.value,
        widget.index.toDouble(),
        position.velocity,
        tolerance: const Tolerance(distance: .0005, velocity: .005),
      ),
    );
  }

  @override
  void dispose() {
    position.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Material(
    color: Palette.paper,
    child: SafeArea(
      top: false,
      child: SizedBox(
        height: HomeTabBar.heightOf(context),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth / 4;
            final items = Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: List.generate(
                4,
                (i) => Expanded(
                  child: Semantics(
                    button: true,
                    selected: widget.index == i,
                    label: HomeTabBar.labels[i],
                    onTap: () => widget.onSelected(i),
                    child: ExcludeSemantics(
                      child: InkWell(
                        key: ValueKey('home-nav-$i'),
                        onTap: () => widget.onSelected(i),
                        borderRadius: BorderRadius.circular(14),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(4, 18, 4, 10),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: [
                              Icon(
                                widget.index == i
                                    ? HomeTabBar.selectedIcons[i]
                                    : HomeTabBar.icons[i],
                                size: 22,
                                color: widget.index == i
                                    ? Palette.red
                                    : Palette.muted,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                HomeTabBar.labels[i],
                                style: HomeTabBar.labelStyle,
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
            return AnimatedBuilder(
              animation: position,
              child: items,
              builder: (context, child) => Stack(
                children: [
                  Positioned(
                    top: 10,
                    left: (width * (position.value.clamp(0.0, 3.0) + .5) - 29),
                    width: 58,
                    height: 38,
                    child: IgnorePointer(
                      child: DecoratedBox(
                        key: const Key('home-tab-indicator'),
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          borderRadius: BorderRadius.circular(22),
                        ),
                      ),
                    ),
                  ),
                  Positioned.fill(child: child!),
                ],
              ),
            );
          },
        ),
      ),
    ),
  );
}
