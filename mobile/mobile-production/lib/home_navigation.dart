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
      children: List.generate(HomeTabBar.labels.length, (i) {
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
  static const labels = [
    'Khám phá',
    'Trực tiếp',
    'Tạo video',
    'Tuyển dụng',
    'Cá nhân',
  ];
  static const icons = [
    CupertinoIcons.compass,
    CupertinoIcons.dot_radiowaves_left_right,
    CupertinoIcons.plus,
    CupertinoIcons.briefcase,
    CupertinoIcons.person,
  ];
  static const selectedIcons = [
    CupertinoIcons.compass_fill,
    CupertinoIcons.dot_radiowaves_left_right,
    CupertinoIcons.plus,
    CupertinoIcons.briefcase_fill,
    CupertinoIcons.person_fill,
  ];
  static const labelStyle = TextStyle(
    inherit: false,
    fontFamily: 'BeVietnam',
    letterSpacing: -0.2,
    fontSize: 10.5,
    height: 1.2,
    fontWeight: FontWeight.w500,
    color: Palette.ink,
  );

  static double heightOf(BuildContext context) {
    final width = math.min(MediaQuery.sizeOf(context).width, 480.0) / labels.length - 8;
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
    return math.max(74, 14 + 22 + 4 + labelHeight + 10);
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
            final count = HomeTabBar.labels.length;
            final width = constraints.maxWidth / count;
            final items = Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: List.generate(
                count,
                (i) {
                  final isSelected = widget.index == i;
                  return Expanded(
                    child: Semantics(
                      button: true,
                      selected: isSelected,
                      label: HomeTabBar.labels[i],
                      onTap: () => widget.onSelected(i),
                      child: ExcludeSemantics(
                        child: InkWell(
                          key: ValueKey('home-nav-$i'),
                          onTap: () => widget.onSelected(i),
                          borderRadius: BorderRadius.circular(14),
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(2, 12, 2, 7),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.start,
                              children: [
                                SizedBox(
                                  height: 26,
                                  child: Center(
                                    child: i == 2
                                        ? Container(
                                            width: 36,
                                            height: 24,
                                            decoration: BoxDecoration(
                                              color: isSelected
                                                  ? Palette.red
                                                  : Palette.red.withValues(alpha: 0.88),
                                              borderRadius: BorderRadius.circular(7),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Palette.red.withValues(alpha: 0.28),
                                                  blurRadius: 4,
                                                  offset: const Offset(0, 1.5),
                                                ),
                                              ],
                                            ),
                                            child: const Icon(
                                              CupertinoIcons.plus,
                                              size: 16,
                                              color: Colors.white,
                                            ),
                                          )
                                        : Icon(
                                            isSelected
                                                ? HomeTabBar.selectedIcons[i]
                                                : HomeTabBar.icons[i],
                                            size: 20,
                                            color: isSelected
                                                ? Palette.red
                                                : Palette.muted,
                                          ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  HomeTabBar.labels[i],
                                  style: HomeTabBar.labelStyle.copyWith(
                                    fontWeight: isSelected
                                        ? FontWeight.w600
                                        : FontWeight.w500,
                                    color: isSelected
                                        ? Palette.red
                                        : Palette.muted,
                                  ),
                                  textAlign: TextAlign.center,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            );
            return AnimatedBuilder(
              animation: position,
              child: items,
              builder: (context, child) => Stack(
                children: [
                  Positioned(
                    top: 8,
                    left: (width *
                            (position.value
                                    .clamp(0.0, (count - 1).toDouble()) +
                                .5) -
                        26),
                    width: 52,
                    height: 36,
                    child: IgnorePointer(
                      child: DecoratedBox(
                        key: const Key('home-tab-indicator'),
                        decoration: BoxDecoration(
                          color: Palette.soft,
                          borderRadius: BorderRadius.circular(18),
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
