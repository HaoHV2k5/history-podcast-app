import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_mock/app_state.dart';
import 'package:su_ky_mobile_mock/artwork_editor.dart';
import 'package:su_ky_mobile_mock/artwork_image.dart';
import 'package:su_ky_mobile_mock/artwork_state.dart';
import 'package:su_ky_mobile_mock/creator_state.dart';
import 'package:su_ky_mobile_mock/demo_data.dart';
import 'package:su_ky_mobile_mock/design.dart';
import 'package:su_ky_mobile_mock/episode.dart';
import 'package:su_ky_mobile_mock/publication_page.dart';

Uint8List photo([int width = 256, int height = 256]) {
  final source = img.Image(width: width, height: height, numChannels: 4);
  img.fill(source, color: img.ColorRgba8(180, 90, 45, 255));
  return img.encodePng(source);
}

LocalArtwork artwork(ArtworkKind kind) => finishArtwork({
  'bytes': photo(320, 256),
  'kind': kind.name,
  'name': 'demo.png',
});
Future<SharedPreferences> fresh() async {
  SharedPreferences.setMockInitialValues({});
  final p = await SharedPreferences.getInstance();
  ArtworkStore(p).reload(notify: false);
  return p;
}

Future<void> press(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('image validation rejects size, tiny or corrupt bytes and renamed unsupported formats', () {
    expect(() => validateArtworkInput('photo.JPG', 100), returnsNormally);
    for (final file in [
      ('x.gif', 100),
      ('x.svg', 100),
      ('x.png', 0),
      ('x.png', 9 * 1024 * 1024),
    ]) {
      expect(() => validateArtworkInput(file.$1, file.$2), throwsStateError);
    }
    expect(
      () => prepareArtworkSource(Uint8List.fromList([0, 1, 2])),
      throwsStateError,
    );
    expect(() => prepareArtworkSource(photo(64, 64)), throwsStateError);
    expect(
      () => prepareArtworkSource(
        img.encodeGif(img.Image(width: 256, height: 256)),
      ),
      throwsStateError,
    );
  });

  test('normalized artwork has the requested ratio, strips source EXIF and persists a bounded JPEG', () {
    for (final kind in ArtworkKind.values) {
      final result = artwork(kind),
          decoded = img.decodeJpg(artwork(kind).bytes)!;
      expect(result.width / result.height, closeTo(kind.ratio, .001));
      expect(decoded.width, result.width);
      expect(decoded.height, result.height);
      expect(
        result.bytes.length,
        lessThanOrEqualTo(ArtworkStore.maxThumbnailBytes),
      );
      expect(decoded.exif.imageIfd.isEmpty, true);
    }
  });

  test('store preserves old image on failed writes, rejects wrong kind/target and enforces record capacity', () async {
    final p = await fresh(),
        store = ArtworkStore(p),
        original = artwork(ArtworkKind.avatar);
    await store.put('avatar', original);
    final raw = p.getString(ArtworkStore.storageKey);
    await expectLater(
      ArtworkStore(
        p,
        write: (_, _) async => false,
      ).put('avatar', artwork(ArtworkKind.avatar)),
      throwsStateError,
    );
    expect(p.getString(ArtworkStore.storageKey), raw);
    expect(ArtworkStore.catalog['avatar']!.bytes, original.bytes);
    await expectLater(
      store.put('avatar', artwork(ArtworkKind.video)),
      throwsStateError,
    );
    await expectLater(
      store.put('foreign-target', artwork(ArtworkKind.avatar)),
      throwsStateError,
    );
    await store.put('avatar', null);
    for (var i = 0; i < ArtworkStore.maxRecords; i++) {
      await store.put('draft:test$i:audio', artwork(ArtworkKind.audio));
    }
    final before = p.getString(ArtworkStore.storageKey);
    await expectLater(store.put('avatar', original), throwsStateError);
    expect(p.getString(ArtworkStore.storageKey), before);
  });

  test('artwork follows workflow lock and references survive publication, reload and demo restore', () async {
    final p = await fresh();
    final original = artwork(ArtworkKind.avatar);
    await ArtworkStore(p).put('avatar', original);
    await DemoDataService(p).load('ready');
    expect(ArtworkStore(p).read(), isEmpty);
    final creator = CreatorState(p), store = ArtworkStore(p);
    await store.put(
      draftArtworkTarget('demo-d1', 'audio'),
      artwork(ArtworkKind.audio),
      guard: () => creator.guardArtwork(draftId: 'demo-d1'),
    );
    await store.put(
      'channel',
      artwork(ArtworkKind.channel),
      guard: creator.guardArtwork,
    );
    await creator.transition('demo-d1', DraftStage.checked);
    await creator.transition('demo-d1', DraftStage.pending);
    await expectLater(
      store.put(
        draftArtworkTarget('demo-d1', 'audio'),
        null,
        guard: () => creator.guardArtwork(draftId: 'demo-d1'),
      ),
      throwsStateError,
    );
    await creator.transition('demo-d1', DraftStage.approved);
    final production = PublicationState(creator);
    await production.buildDemo('demo-d1');
    await production.publish('demo-d1', membersOnly: false);
    final app = AppState(p);
    final published = allEpisodes.firstWhere(
      (e) => e.id == 'published-demo-d1',
    );
    expect(
      published.image,
      artworkReference(draftArtworkTarget('demo-d1', 'audio')),
    );
    expect(channelByName(creator.channel).image, artworkReference('channel'));
    expect(
      ArtworkStore.catalog.containsKey(draftArtworkTarget('demo-d1', 'audio')),
      true,
    );
    expect(
      episodeFromJson(episodeToJson(published)).channelImage,
      artworkReference('channel'),
    );
    await DemoDataService(p).restore();
    app.reloadCatalog();
    expect(ArtworkStore(p).read().keys, ['avatar']);
    expect(ArtworkStore.catalog['avatar']!.bytes, original.bytes);
    production.dispose();
    creator.dispose();
    app.dispose();
  });

  testWidgets(
    'avatar removal is confirmed and logout removes personal thumbnail',
    (tester) async {
      final p = await fresh(), store = ArtworkStore(p);
      await store.put('avatar', artwork(ArtworkKind.avatar));
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: Scaffold(
            body: ArtworkEditor(
              preferences: p,
              target: 'avatar',
              kind: ArtworkKind.avatar,
              label: 'Ảnh đại diện',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await press(tester, find.byKey(const Key('remove-artwork-avatar')));
      await press(tester, find.text('Giữ ảnh'));
      expect(store.read().containsKey('avatar'), true);
      await press(tester, find.byKey(const Key('remove-artwork-avatar')));
      await press(tester, find.widgetWithText(FilledButton, 'Gỡ ảnh'));
      expect(store.read().containsKey('avatar'), false);
      await store.put('avatar', artwork(ArtworkKind.avatar));
      final app = AppState(p);
      await app.logout();
      expect(store.read().containsKey('avatar'), false);
      await tester.pumpWidget(const SizedBox());
      app.dispose();
    },
  );

  testWidgets(
    'bad cached artwork is skipped and meaningful image fallback remains',
    (tester) async {
      final p = await fresh();
      await p.setString(
        ArtworkStore.storageKey,
        jsonEncode({
          'avatar': {'jpeg': 'invalid'},
          'channel': artwork(ArtworkKind.channel).toJson(),
        }),
      );
      final store = ArtworkStore(p);
      store.reload(notify: false);
      expect(store.read().keys, ['channel']);
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: const Scaffold(
            body: ArtworkImage(
              'local-artwork:avatar',
              width: 56,
              height: 56,
              semanticLabel: 'Ảnh đại diện',
              fallback: Text('M'),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('M'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  for (final size in [const Size(320, 740), const Size(812, 375)]) {
    testWidgets(
      'crop controls fit $size with double text, reduced motion and failed save retains editor',
      (tester) async {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.pumpWidget(
          MaterialApp(
            theme: appTheme(),
            home: MediaQuery(
              data: MediaQueryData(
                size: size,
                textScaler: const TextScaler.linear(2),
                disableAnimations: true,
              ),
              child: ArtworkCropPage(
                bytes: photo(),
                kind: ArtworkKind.audio,
                label: 'Ảnh bìa audio',
                sourceName: 'test.png',
                onSave: (_) async => throw StateError('Chưa lưu được ảnh thử.'),
              ),
            ),
          ),
        );
        // Crop parsing uses an isolate; allow real futures to settle.
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 600)),
        );
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        final save = find.byKey(const Key('save-cropped-artwork'));
        await tester.ensureVisible(save);
        await tester.pumpAndSettle();
        expect(tester.widget<FilledButton>(save).onPressed, isNotNull);
        await tester.runAsync(() async {
          await tester.tap(save);
          await Future<void>.delayed(const Duration(milliseconds: 1000));
        });
        await tester.pumpAndSettle();
        expect(find.text('Chưa lưu được ảnh thử.'), findsOneWidget);
        expect(find.byType(ArtworkCropPage), findsOneWidget);
        expect(
          tester
              .widget<FilledButton>(
                find.byKey(const Key('save-cropped-artwork')),
              )
              .onPressed,
          isNotNull,
        );
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
      },
    );
  }
}
