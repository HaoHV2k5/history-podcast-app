import 'package:file_picker/file_picker.dart';

import 'dart:typed_data';

class LocalAudioFile extends LocalFileMetadata {
  const LocalAudioFile(super.name, super.size, this.bytes);
  final Uint8List bytes;
}

/// Bytes live only for the rehearsal session; preferences keep metadata only.
class SessionAudioFiles {
  static final Map<String, LocalAudioFile> _files = {};
  static void deliver(String contractId, LocalAudioFile? file) {
    if (file == null) {
      _files.remove(contractId);
    } else {
      _files[contractId] = file;
    }
  }

  static LocalAudioFile? delivery(String contractId, String name) {
    final file = _files[contractId];
    return file?.name == name ? file : null;
  }

  static void clear() => _files.clear();
}

Future<LocalAudioFile?> pickLocalAudio() async {
  final files = await FilePicker.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['wav', 'mp3'],
  );
  if (files.isEmpty) return null;
  final file = files.first;
  final size = file.lengthSync() ?? await file.length() ?? 0;
  validateLocalFile(file.name, size, video: false);
  final bytes = await file.xFile.readAsBytes();
  validateLocalFile(file.name, bytes.length, video: false);
  return LocalAudioFile(file.name, bytes.length, bytes);
}

class LocalFileMetadata {
  const LocalFileMetadata(this.name, this.size);
  final String name;
  final int size;
}

Future<LocalFileMetadata?> pickLocalMetadata({required bool video}) async {
  final files = await FilePicker.pickFiles(
    type: FileType.custom,
    allowedExtensions: video ? ['mp4', 'mov', 'webm'] : ['wav', 'mp3'],
  );
  if (files.isEmpty) return null;
  final file = files.first;
  final size = file.lengthSync() ?? await file.length() ?? 0;
  validateLocalFile(file.name, size, video: video);
  return LocalFileMetadata(file.name, size);
}

void validateLocalFile(String name, int size, {required bool video}) {
  final suffix = name.split('.').last.toLowerCase();
  if (!(video ? ['mp4', 'mov', 'webm'] : ['wav', 'mp3']).contains(suffix) ||
      size <= 0 ||
      size > (video ? 200 : 20) * 1024 * 1024) {
    throw StateError(
      video
          ? 'Bản thử nhận MP4/MOV/WebM từ 1 byte đến 200 MB.'
          : 'Bản thử nhận WAV/MP3 từ 1 byte đến 20 MB.',
    );
  }
  if (name.length > 100 || name.contains(RegExp(r'[/\\]'))) {
    throw StateError('Tên file tối đa 100 ký tự, không có đường dẫn.');
  }
}
