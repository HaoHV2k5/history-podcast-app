import 'package:flutter/material.dart';

import 'dart:typed_data';

import 'package:just_audio/just_audio.dart';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/audio_playback.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/design.dart';
import 'package:su_ky_mobile_production/episode.dart';
import 'package:su_ky_mobile_production/local_file.dart';
import 'package:su_ky_mobile_production/password_recovery.dart';

void main() {
  test(
    'loaded duration starts audio before the duration stream catches up',
    () async {
      final player = DelayedDurationPlayer();
      final audio = AudioPlayback(createPlayer: () => player);
      await audio.open('fixture.mp3');
      expect(player.duration, isNull);
      expect(audio.duration, const Duration(seconds: 24));
      expect(audio.initialized, isTrue);
      expect(player.didPlay, isTrue);
      audio.dispose();
    },
  );
  test(
    'recovery validates destination and masks it without looking up accounts',
    () {
      expect(DemoPasswordRecovery.validateIdentifier('bad@'), isNotNull);
      expect(DemoPasswordRecovery.validateIdentifier('0912345678'), isNull);
      expect(DemoPasswordRecovery.validateIdentifier('+84912345678'), isNull);
      expect(DemoPasswordRecovery.validateIdentifier('a@b.test'), isNull);
      final flow = DemoPasswordRecovery()..request('minhanh@example.test');
      expect(flow.maskedIdentifier, 'm•••@example.test');
      expect(() => flow.complete('secret12', 'secret12'), throwsStateError);
    },
  );

  test('OTP cooldown, attempt limit and resend reset are enforced', () {
    var time = DateTime(2026, 10, 1);
    final flow = DemoPasswordRecovery(now: () => time)..request('a@b.test');
    expect(flow.resendSeconds, 30);
    expect(() => flow.request('a@b.test'), throwsStateError);
    expect(() => flow.verify('12'), throwsStateError);
    expect(flow.attempts, 0);
    for (var i = 0; i < 5; i++) {
      expect(() => flow.verify('000000'), throwsStateError);
    }
    expect(() => flow.verify('889900'), throwsStateError);
    time = time.add(const Duration(seconds: 30));
    flow.request('a@b.test');
    expect(flow.attempts, 0);
    flow.verify('889900');
    expect(flow.hasGrant, isTrue);
    expect(() => flow.verify('889900'), throwsStateError);
  });

  test('expired OTP and expired reset grant cannot set a password', () {
    var time = DateTime(2026, 10, 1);
    final flow = DemoPasswordRecovery(now: () => time)..request('a@b.test');
    time = time.add(const Duration(minutes: 2));
    expect(() => flow.verify('889900'), throwsStateError);
    flow.request('a@b.test');
    flow.verify('889900');
    time = time.add(const Duration(minutes: 5));
    expect(() => flow.complete('secret12', 'secret12'), throwsStateError);
  });

  test(
    'confirm mismatch does not consume grant, success does exactly once',
    () {
      final flow = DemoPasswordRecovery()
        ..request('a@b.test')
        ..verify('889900');
      expect(() => flow.complete('secret12', 'different'), throwsStateError);
      expect(() => flow.complete('     ', '     '), throwsStateError);
      expect(flow.hasGrant, isTrue);
      flow.complete('secret12', 'secret12');
      expect(flow.consumed, isTrue);
      expect(flow.hasGrant, isFalse);
      expect(() => flow.complete('secret12', 'secret12'), throwsStateError);
    },
  );

  test('media focus stops previous owner but repeated claim keeps playing', () {
    final a = Object(), b = Object();
    var pauses = 0;
    MediaFocus.claim(a, () => pauses++);
    MediaFocus.claim(a, () => pauses++);
    expect(pauses, 0);
    MediaFocus.claim(b, () => pauses++);
    expect(pauses, 1);
    MediaFocus.release(a);
    MediaFocus.claim(a, () => pauses++);
    expect(pauses, 2);
    MediaFocus.release(a);
  });

  test(
    'audio fixtures persist correct type, asset and membership guard',
    () async {
      SharedPreferences.setMockInitialValues({});
      final app = AppState(await SharedPreferences.getInstance());
      final copy = episodeFromJson(episodeToJson(audioEpisodes.first));
      expect(copy.isVideo, isFalse);
      expect(copy.mediaAsset, 'assets/mock/audio/playback-demo.mp3');
      expect(copy.seconds, 24);
      expect(app.play(audioEpisodes.last), isFalse);
      expect(app.audio, isNull);
      app.play(episodes.first);
      MediaFocus.claim(Object(), () {});
      expect(app.playing, isFalse);
      app.dispose();
    },
  );

  test('local audio validation rejects empty, oversize and path names', () {
    expect(
      () => validateLocalFile('demo.wav', 0, video: false),
      throwsStateError,
    );
    expect(
      () => validateLocalFile('demo.wav', 21 * 1024 * 1024, video: false),
      throwsStateError,
    );
    expect(
      () => validateLocalFile('D:/voice.wav', 100, video: false),
      throwsStateError,
    );
    expect(
      () => validateLocalFile('demo.txt', 100, video: false),
      throwsStateError,
    );
    validateLocalFile('demo.MP3', 100, video: false);
  });

  test('session delivery bytes are replaced, name-guarded and removed without files', () {
    final file = LocalAudioFile('demo.wav', 3, Uint8List.fromList([1, 2, 3]));
    SessionAudioFiles.deliver('one', file);
    expect(SessionAudioFiles.delivery('one', 'demo.wav'), same(file));
    expect(SessionAudioFiles.delivery('one', 'another.wav'), isNull);
    SessionAudioFiles.deliver('one', null);
    expect(SessionAudioFiles.delivery('one', 'demo.wav'), isNull);
    SessionAudioFiles.deliver('one', file);
    SessionAudioFiles.clear();
    expect(SessionAudioFiles.delivery('one', 'demo.wav'), isNull);
  });

  testWidgets(
    'auth recovery uses separate OTP/password pages and returns without login or storage',
    (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final app = AppState(prefs);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: Scaffold(body: AuthSheet(state: app)),
        ),
      );
      await tester.ensureVisible(find.byKey(const Key('auth-forgot')));
      await tester.tap(find.byKey(const Key('auth-forgot')));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('recovery-identifier')),
        'minhanh@example.test',
      );
      await tester.tap(find.byKey(const Key('recovery-send')));
      await tester.pumpAndSettle();
      expect(find.byType(RecoveryOtpPage), findsOneWidget);
      expect(find.byKey(const Key('recovery-password')), findsNothing);
      await tester.enterText(find.byKey(const Key('recovery-otp')), '000000');
      await tester.tap(find.byKey(const Key('recovery-verify')));
      await tester.pumpAndSettle();
      expect(find.textContaining('Mã chưa đúng'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('recovery-otp')), '889900');
      await tester.tap(find.byKey(const Key('recovery-verify')));
      await tester.pumpAndSettle();
      expect(find.byType(RecoveryPasswordPage), findsOneWidget);
      expect(find.byKey(const Key('recovery-otp')), findsNothing);
      await tester.enterText(
        find.byKey(const Key('recovery-password')),
        'secret12',
      );
      await tester.enterText(
        find.byKey(const Key('recovery-confirm')),
        'notmatch',
      );
      await tester.ensureVisible(find.byKey(const Key('recovery-submit')));
      await tester.tap(find.byKey(const Key('recovery-submit')));
      await tester.pumpAndSettle();
      expect(find.text('Hai mật khẩu chưa khớp.'), findsOneWidget);
      await tester.enterText(
        find.byKey(const Key('recovery-confirm')),
        'secret12',
      );
      await tester.ensureVisible(find.byKey(const Key('recovery-submit')));
      await tester.tap(find.byKey(const Key('recovery-submit')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('recovery-return')));
      await tester.pumpAndSettle();
      expect(find.byType(AuthSheet), findsOneWidget);
      expect(app.isLoggedIn, isFalse);
      expect(prefs.getKeys(), isEmpty);
      expect(
        tester
            .widget<TextFormField>(find.byKey(const Key('auth-identifier')))
            .controller!
            .text,
        'minhanh@example.test',
      );
      expect(
        tester
            .widget<TextFormField>(find.byKey(const Key('auth-password')))
            .controller!
            .text,
        isEmpty,
      );
      await tester.pumpWidget(const SizedBox());
      app.dispose();
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets(
      'recovery stays scrollable with text 2x and keyboard at $size',
      (tester) async {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });
        final flow = DemoPasswordRecovery()..request('minhanh@example.test');
        for (final page in [
          PasswordRecoveryPage(),
          RecoveryOtpPage(flow: flow),
          RecoveryPasswordPage(flow: flow),
        ]) {
          await tester.pumpWidget(
            MaterialApp(
              theme: appTheme(),
              builder: (context, child) => MediaQuery(
                data: MediaQuery.of(context).copyWith(
                  textScaler: const TextScaler.linear(2),
                  viewInsets: const EdgeInsets.only(bottom: 160),
                ),
                child: child!,
              ),
              home: page,
            ),
          );
          await tester.pump();
          expect(tester.takeException(), isNull);
          await tester.drag(
            find.byType(ListView).first,
            const Offset(0, -1000),
          );
          await tester.pump();
          expect(tester.takeException(), isNull);
        }
        await tester.pumpWidget(const SizedBox());
      },
    );
  }
}

class DelayedDurationPlayer extends Fake implements AudioPlayer {
  bool didPlay = false;
  @override
  Duration? get duration => null;
  @override
  Stream<PlayerState> get playerStateStream => const Stream.empty();
  @override
  Stream<Duration> get positionStream => const Stream.empty();
  @override
  Stream<PlayerException> get errorStream => const Stream.empty();
  @override
  Future<Duration?> setAsset(
    String assetPath, {
    String? package,
    bool preload = true,
    Duration? initialPosition,
    dynamic tag,
  }) async => const Duration(seconds: 24);
  @override
  Future<void> setSpeed(double speed) async {}
  @override
  Future<void> play() async {
    didPlay = true;
  }

  @override
  Future<void> dispose() async {}
}
