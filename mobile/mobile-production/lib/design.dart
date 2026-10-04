import 'package:flutter/material.dart';

import 'motion.dart';

abstract final class Palette {
  static const paper = Color(0xFFFAF9F6);
  static const ink = Color(0xFF262522);
  static const muted = Color(0xFF696660);
  static const line = Color(0xFFE0DDD7);
  static const red = Color(0xFFB83345);
  static const soft = Color(0xFFEFEAE3);
  static const white = Colors.white;
}

TextStyle editorial(double size, {Color color = Palette.ink}) => TextStyle(
  fontFamily: 'NotoSerif',
  fontSize: size,
  height: 1.25,
  fontWeight: FontWeight.w400,
  letterSpacing: -.7,
  color: color,
);

ThemeData appTheme() => ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  fontFamily: 'BeVietnam',
  splashFactory: NoSplash.splashFactory,
  highlightColor: Palette.ink.withValues(alpha: .04),
  hoverColor: Palette.ink.withValues(alpha: .025),
  focusColor: Palette.red.withValues(alpha: .10),
  scaffoldBackgroundColor: Palette.paper,
  chipTheme: const ChipThemeData(
    selectedColor: Palette.soft,
    backgroundColor: Palette.paper,
    checkmarkColor: Palette.ink,
    side: BorderSide(color: Palette.line),
    shape: StadiumBorder(),
    labelStyle: TextStyle(color: Palette.ink),
  ),
  bottomSheetTheme: const BottomSheetThemeData(
    backgroundColor: Palette.paper,
    modalBackgroundColor: Palette.paper,
    surfaceTintColor: Colors.transparent,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    clipBehavior: Clip.antiAlias,
  ),
  pageTransitionsTheme: const PageTransitionsTheme(
    builders: {
      TargetPlatform.android: QuietPageMotion(),
      TargetPlatform.iOS: QuietPageMotion(),
      TargetPlatform.macOS: QuietPageMotion(),
      TargetPlatform.windows: QuietPageMotion(),
      TargetPlatform.linux: QuietPageMotion(),
      TargetPlatform.fuchsia: QuietPageMotion(),
    },
  ),
  colorScheme: ColorScheme.fromSeed(seedColor: Palette.red).copyWith(
    primary: Palette.red,
    onPrimary: Palette.white,
    surface: Palette.paper,
    onSurface: Palette.ink,
    outline: Palette.muted,
  ),
  textTheme: const TextTheme(
    bodyMedium: TextStyle(fontSize: 14, height: 1.55, color: Palette.ink),
    bodySmall: TextStyle(fontSize: 12, height: 1.5, color: Palette.muted),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Palette.paper,
    foregroundColor: Palette.ink,
    surfaceTintColor: Colors.transparent,
    elevation: 0,
    centerTitle: false,
  ),
  dividerTheme: const DividerThemeData(
    color: Palette.line,
    thickness: 1,
    space: 1,
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: Palette.red,
      foregroundColor: Palette.white,
      minimumSize: const Size(48, 52),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      textStyle: const TextStyle(
        fontFamily: 'BeVietnam',
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: Palette.ink,
      minimumSize: const Size(48, 48),
      side: const BorderSide(color: Palette.line),
      shape: const StadiumBorder(),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Palette.paper,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Palette.line),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Palette.line),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Palette.red),
    ),
  ),
);
