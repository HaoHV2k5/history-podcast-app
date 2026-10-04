import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;
import 'package:shared_preferences/shared_preferences.dart';

enum ArtworkKind { avatar, channel, audio, video }

extension ArtworkKindDetails on ArtworkKind {
  double get ratio => this == ArtworkKind.video ? 16 / 9 : 1;
  String get ratioLabel => this == ArtworkKind.video ? '16:9' : '1:1';
  int get maxWidth => switch (this) {
    ArtworkKind.avatar => 400,
    ArtworkKind.video => 960,
    _ => 600,
  };
}

String artworkReference(String target) => 'local-artwork:$target';
String draftArtworkTarget(String id, String format) =>
    'draft:$id:${format == 'video' ? 'video' : 'audio'}';

class LocalArtwork {
  const LocalArtwork({
    required this.bytes,
    required this.width,
    required this.height,
    required this.kind,
    required this.sourceName,
  });
  final Uint8List bytes;
  final int width, height;
  final ArtworkKind kind;
  final String sourceName;
  Map<String, dynamic> toJson() => {
    'jpeg': base64Encode(bytes),
    'width': width,
    'height': height,
    'kind': kind.name,
    'sourceName': sourceName,
  };
  factory LocalArtwork.fromJson(Map<String, dynamic> j) {
    final kind = ArtworkKind.values.byName(j['kind'] as String);
    final bytes = base64Decode(j['jpeg'] as String);
    final width = j['width'] as int, height = j['height'] as int;
    if (bytes.isEmpty ||
        bytes.length > ArtworkStore.maxThumbnailBytes ||
        width < 64 ||
        width > kind.maxWidth ||
        height < 36 ||
        (width / height - kind.ratio).abs() > .01) {
      throw const FormatException('Invalid artwork');
    }
    return LocalArtwork(
      bytes: bytes,
      width: width,
      height: height,
      kind: kind,
      sourceName: j['sourceName'] as String? ?? 'Ảnh đã chọn',
    );
  }
}

/// Small demo thumbnails only. Production should use server-owned media IDs.
class ArtworkStore {
  ArtworkStore(this.preferences, {this.write});
  final SharedPreferences preferences;
  final Future<bool> Function(String key, String value)? write;
  static const storageKey = 'artworkDemoV1';
  static const maxSourceBytes = 8 * 1024 * 1024;
  static const maxThumbnailBytes = 160 * 1024;
  static const maxStoredCharacters = 2 * 1024 * 1024;
  static const maxRecords = 24;
  static Map<String, LocalArtwork> catalog = {};
  static final revision = ValueNotifier<int>(0);

  Map<String, LocalArtwork> read() {
    final raw = preferences.getString(storageKey);
    if (raw == null || raw.length > maxStoredCharacters) return {};
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final result = <String, LocalArtwork>{};
      for (final entry in map.entries.take(maxRecords)) {
        try {
          result[entry.key] = LocalArtwork.fromJson(
            entry.value as Map<String, dynamic>,
          );
        } catch (_) {
          /* A corrupt thumbnail must not prevent other images loading. */
        }
      }
      return result;
    } catch (_) {
      return {};
    }
  }

  void reload({bool notify = true}) {
    catalog = read();
    if (notify) revision.value++;
  }

  Future<void> put(
    String target,
    LocalArtwork? artwork, {
    VoidCallback? guard,
  }) async {
    if (!RegExp(r'^(avatar|channel|draft:[A-Za-z0-9._-]{1,80}:(audio|video))$')
        .hasMatch(target)) {
      throw StateError('Không tìm thấy nơi lưu ảnh hợp lệ.');
    }
    guard?.call();
    final next = read();
    if (artwork == null) {
      next.remove(target);
    } else {
      LocalArtwork.fromJson(artwork.toJson());
      final expected = target.endsWith(':video')
          ? ArtworkKind.video
          : target.endsWith(':audio')
          ? ArtworkKind.audio
          : target == 'avatar'
          ? ArtworkKind.avatar
          : ArtworkKind.channel;
      if (artwork.kind != expected) {
        throw StateError('Ảnh không đúng loại. Chọn lại ảnh và vùng cắt.');
      }
      next[target] = artwork;
    }
    final serialized = jsonEncode(
      next.map((key, value) => MapEntry(key, value.toJson())),
    );
    if (next.length > maxRecords || serialized.length > maxStoredCharacters) {
      throw StateError('Bộ nhớ ảnh thử đã đầy. Gỡ ảnh không dùng rồi thử lại.');
    }
    final previous = preferences.getString(storageKey);
    try {
      if (!await (write ?? preferences.setString)(storageKey, serialized)) {
        throw StateError(
          'Chưa lưu được ảnh trên thiết bị. Ảnh trước vẫn được giữ.',
        );
      }
    } catch (_) {
      // SharedPreferences may update its in-memory cache before a failed write.
      try {
        if (previous == null) {
          await preferences.remove(storageKey);
        } else {
          await preferences.setString(storageKey, previous);
        }
      } catch (_) {
        /* Do not replace the visible catalog on a failed save. */
      }
      rethrow;
    }
    catalog = next;
    revision.value++;
  }
}

void validateArtworkInput(String name, int size) {
  if (![
        'jpg',
        'jpeg',
        'png',
        'webp',
      ].contains(name.split('.').last.toLowerCase()) ||
      size <= 0 ||
      size > ArtworkStore.maxSourceBytes) {
    throw StateError('Chọn JPEG, PNG hoặc WebP dưới 8 MB trong bản thử.');
  }
}

img.Image decodeArtwork(Uint8List bytes) {
  try {
    if (bytes.isEmpty || bytes.length > ArtworkStore.maxSourceBytes) {
      throw StateError('Ảnh trống hoặc vượt 8 MB.');
    }
    final decoder = img.findDecoderForData(bytes);
    if (decoder == null ||
        ![
          img.ImageFormat.jpg,
          img.ImageFormat.png,
          img.ImageFormat.webp,
        ].contains(decoder.format)) {
      throw StateError('File không phải JPEG, PNG hoặc WebP hợp lệ.');
    }
    final info = decoder.startDecode(bytes);
    if (info == null ||
        info.width < 160 ||
        info.height < 160 ||
        info.width * info.height > 12000000 ||
        info.numFrames > 1) {
      throw StateError(
        'Chọn ảnh tĩnh từ 160px, tối đa 12 megapixel trong bản thử.',
      );
    }
    final image = decoder.decodeFrame(0);
    if (image == null) {
      throw StateError('Không đọc được ảnh. Hãy chọn file khác.');
    }
    return img.bakeOrientation(image);
  } on StateError {
    rethrow;
  } catch (_) {
    throw StateError('File ảnh bị hỏng. Hãy chọn JPEG, PNG hoặc WebP khác.');
  }
}

Uint8List prepareArtworkSource(Uint8List bytes) {
  final decoded = decodeArtwork(bytes);
  final edge = math.max(decoded.width, decoded.height);
  final resized = edge > 1600
      ? img.copyResize(
          decoded,
          width: (decoded.width * 1600 / edge).round(),
          height: (decoded.height * 1600 / edge).round(),
          interpolation: img.Interpolation.average,
        )
      : decoded;
  return img.encodePng(resized);
}

LocalArtwork finishArtwork(Map<String, dynamic> request) {
  final bytes = request['bytes'] as Uint8List;
  final kind = ArtworkKind.values.byName(request['kind'] as String);
  final decoded = img.decodeImage(bytes);
  if (decoded == null || decoded.width < 64 || decoded.height < 36) {
    throw StateError('Vùng cắt quá nhỏ. Mở rộng vùng cắt rồi thử lại.');
  }
  var width = math.min(
    kind.maxWidth,
    math.min(decoded.width, (decoded.height * kind.ratio).floor()),
  );
  if (kind == ArtworkKind.video) width = width ~/ 16 * 16;
  Uint8List? output;
  int height = 0;
  while (width >= 64) {
    height = (width / kind.ratio).round();
    final resized = img.copyResize(
      decoded,
      width: width,
      height: height,
      interpolation: img.Interpolation.average,
    );
    final flattened = img.Image(width: width, height: height, numChannels: 3);
    img.fill(flattened, color: img.ColorRgb8(250, 249, 246));
    img.compositeImage(flattened, resized);
    output = img.encodeJpg(flattened, quality: 82);
    if (output.length <= ArtworkStore.maxThumbnailBytes) break;
    width = (width * .8).floor();
    if (kind == ArtworkKind.video) width = width ~/ 16 * 16;
  }
  if (output == null ||
      output.length > ArtworkStore.maxThumbnailBytes ||
      width < 64) {
    throw StateError('Chưa thu gọn được ảnh. Hãy chọn ảnh khác.');
  }
  return LocalArtwork(
    bytes: output,
    width: width,
    height: height,
    kind: kind,
    sourceName: request['name'] as String,
  );
}
