import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_client.dart';

class ChatConversationModel {
  final String conversationId;
  final String? topicTitle;
  final String? channelName;
  final int? hireRequestId;
  final int? contractId;
  final int? partnerId;
  final String? partnerName;
  final String? partnerEmail;
  final String? partnerAvatarUrl;
  final String? partnerRole;
  final String? contextType;
  final int? contextId;

  ChatConversationModel({
    required this.conversationId,
    this.topicTitle,
    this.channelName,
    this.hireRequestId,
    this.contractId,
    this.partnerId,
    this.partnerName,
    this.partnerEmail,
    this.partnerAvatarUrl,
    this.partnerRole,
    this.contextType,
    this.contextId,
  });

  factory ChatConversationModel.fromJson(Map<String, dynamic> json) {
    return ChatConversationModel(
      conversationId: (json['conversationId'] ?? '').toString(),
      topicTitle: json['topicTitle']?.toString(),
      channelName: json['channelName']?.toString(),
      hireRequestId: (json['hireRequestId'] as num?)?.toInt(),
      contractId: (json['contractId'] as num?)?.toInt(),
      partnerId: (json['partnerId'] as num?)?.toInt(),
      partnerName: json['partnerName']?.toString(),
      partnerEmail: json['partnerEmail']?.toString(),
      partnerAvatarUrl: json['partnerAvatarUrl']?.toString(),
      partnerRole: json['partnerRole']?.toString(),
      contextType: json['contextType']?.toString(),
      contextId: (json['contextId'] as num?)?.toInt(),
    );
  }
}

class FirestoreChatMessageModel {
  final String id;
  final int senderId;
  final String senderRole;
  final String senderName;
  final String text;
  final String? imageUrl;
  final String type; // 'TEXT' | 'IMAGE'
  final String createdAt;
  final int createdAtMillis;
  final String timeFormatted;

  const FirestoreChatMessageModel({
    required this.id,
    required this.senderId,
    required this.senderRole,
    required this.senderName,
    required this.text,
    this.imageUrl,
    this.type = 'TEXT',
    required this.createdAt,
    required this.createdAtMillis,
    required this.timeFormatted,
  });

  static String formatMessageTime(String isoString) {
    try {
      final d = DateTime.parse(isoString).toLocal();
      final hours = d.hour.toString().padLeft(2, '0');
      final minutes = d.minute.toString().padLeft(2, '0');
      final now = DateTime.now();
      final isSameDay =
          d.day == now.day && d.month == now.month && d.year == now.year;
      if (isSameDay) {
        return '$hours:$minutes';
      }
      final day = d.day.toString().padLeft(2, '0');
      final month = d.month.toString().padLeft(2, '0');
      return '$hours:$minutes • $day/$month';
    } catch (_) {
      return '';
    }
  }

  factory FirestoreChatMessageModel.fromFirestoreDoc(Map<String, dynamic> doc) {
    final fields = (doc['fields'] as Map<String, dynamic>?) ?? {};
    final rawName = doc['name']?.toString() ?? '';
    final id = rawName.isNotEmpty
        ? rawName.split('/').last
        : 'msg-${DateTime.now().millisecondsSinceEpoch}';

    dynamic extractField(String key) {
      final f = fields[key];
      if (f is Map) {
        return f['stringValue'] ?? f['integerValue'] ?? f['timestampValue'];
      }
      return null;
    }

    final rawSenderId = extractField('senderId') ?? 0;
    final senderId = int.tryParse(rawSenderId.toString()) ?? 0;
    final senderRole = (extractField('senderRole') ?? 'CREATOR').toString();
    final senderName =
        (extractField('senderName') ?? extractField('sender') ?? 'Người dùng')
            .toString();
    final text = (extractField('text') ?? '').toString();
    final imageUrl = extractField('imageUrl')?.toString();
    final type = (extractField('type') ??
            (imageUrl != null && imageUrl.isNotEmpty ? 'IMAGE' : 'TEXT'))
        .toString();
    final createdAt = (extractField('createdAt') ??
            extractField('timestamp') ??
            doc['createTime'] ??
            DateTime.now().toUtc().toIso8601String())
        .toString();
    final rawMillis = extractField('createdAtMillis');
    final parsedDateMillis =
        DateTime.tryParse(createdAt)?.millisecondsSinceEpoch ??
            DateTime.now().millisecondsSinceEpoch;
    final createdAtMillis = rawMillis != null
        ? (int.tryParse(rawMillis.toString()) ?? parsedDateMillis)
        : parsedDateMillis;

    return FirestoreChatMessageModel(
      id: id,
      senderId: senderId,
      senderRole: senderRole,
      senderName: senderName,
      text: text,
      imageUrl: (imageUrl != null && imageUrl.isNotEmpty) ? imageUrl : null,
      type: type,
      createdAt: createdAt,
      createdAtMillis: createdAtMillis,
      timeFormatted: formatMessageTime(createdAt),
    );
  }
}

class ChatRepository {
  final ApiClient client;
  final String firebaseProjectId;
  final String firebaseApiKey;
  final http.Client _firestoreHttp;

  ChatRepository({
    required this.client,
    this.firebaseProjectId = 'history-podcast-app',
    this.firebaseApiKey = '',
    http.Client? firestoreHttpClient,
  }) : _firestoreHttp = firestoreHttpClient ?? http.Client();

  String _buildFirestoreMessagesUrl(String conversationId) {
    final encodedProj = Uri.encodeComponent(firebaseProjectId);
    final encodedConv = Uri.encodeComponent(conversationId);
    final base =
        'https://firestore.googleapis.com/v1/projects/$encodedProj/databases/(default)/documents/conversations/$encodedConv/messages';
    return firebaseApiKey.isNotEmpty
        ? '$base?key=${Uri.encodeComponent(firebaseApiKey)}'
        : base;
  }

  /// 1. Xác thực & Lấy thông tin phòng chat (POST /api/v1/chats/conversation)
  Future<ChatConversationModel> getOrCreateConversation({
    int? hireRequestId,
    int? contractId,
    int? collaborationId,
    int? postId,
    int? applicantId,
  }) async {
    final payload = {
      if (hireRequestId != null) 'hireRequestId': hireRequestId,
      if (contractId != null) 'contractId': contractId,
      if (collaborationId != null) 'collaborationId': collaborationId,
      if (postId != null) 'postId': postId,
      if (applicantId != null) 'applicantId': applicantId,
    };

    final res = await client.post('/api/v1/chats/conversation', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ChatConversationModel.fromJson(data);
  }

  /// 2. Đọc danh sách tin nhắn từ Firebase Cloud Firestore
  /// Collection: conversations/{conversationId}/messages
  Future<List<FirestoreChatMessageModel>> listFirestoreMessages(
    String conversationId,
  ) async {
    if (conversationId.trim().isEmpty) return [];
    final baseUrl = _buildFirestoreMessagesUrl(conversationId.trim());
    final sep = baseUrl.contains('?') ? '&' : '?';
    final uri = Uri.parse('${baseUrl}${sep}pageSize=100');

    final res = await _firestoreHttp.get(
      uri,
      headers: const {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 8));

    if (res.statusCode == 404) return [];
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(
        'Không thể tải tin nhắn từ Firestore (HTTP ${res.statusCode})',
      );
    }

    final decoded = jsonDecode(utf8.decode(res.bodyBytes));
    if (decoded is! Map<String, dynamic>) return [];
    final rawDocs = decoded['documents'];
    if (rawDocs is! List) return [];

    final messages = rawDocs
        .whereType<Map<String, dynamic>>()
        .map(FirestoreChatMessageModel.fromFirestoreDoc)
        .toList();

    messages.sort((a, b) => a.createdAtMillis.compareTo(b.createdAtMillis));
    return messages;
  }

  /// 3. Ghi tin nhắn mới trực tiếp lên Firebase Cloud Firestore
  /// Collection: conversations/{conversationId}/messages
  Future<FirestoreChatMessageModel> sendFirestoreMessage(
    String conversationId, {
    required int senderId,
    required String senderRole,
    required String senderName,
    String? senderEmail,
    required String text,
    String? imageUrl,
  }) async {
    final trimmedConv = conversationId.trim();
    if (trimmedConv.isEmpty) {
      throw Exception('Chưa có mã phòng trò chuyện (conversationId)');
    }
    final uri = Uri.parse(_buildFirestoreMessagesUrl(trimmedConv));
    final now = DateTime.now().toUtc();
    final nowIso = now.toIso8601String();
    final nowMillis = now.millisecondsSinceEpoch;
    final hasImage = imageUrl != null && imageUrl.trim().isNotEmpty;

    final body = {
      'fields': {
        'senderId': {'integerValue': senderId.toString()},
        if (senderEmail != null && senderEmail.isNotEmpty)
          'senderEmail': {'stringValue': senderEmail},
        'senderRole': {'stringValue': senderRole},
        'senderName': {
          'stringValue': senderName.trim().isEmpty ? 'Người dùng' : senderName.trim(),
        },
        'text': {'stringValue': text.trim()},
        'imageUrl': hasImage
            ? {'stringValue': imageUrl.trim()}
            : {'nullValue': null},
        'type': {'stringValue': hasImage ? 'IMAGE' : 'TEXT'},
        'createdAt': {'timestampValue': nowIso},
        'createdAtMillis': {'integerValue': nowMillis.toString()},
      },
    };

    final res = await _firestoreHttp.post(
      uri,
      headers: const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: 10));

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(
        'Gửi tin nhắn lên Firestore thất bại (HTTP ${res.statusCode})',
      );
    }

    final savedDoc =
        jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return FirestoreChatMessageModel.fromFirestoreDoc(savedDoc);
  }

  /// 4. Upload ảnh đính kèm trong Chat lên Cloudinary theo folder riêng (`chats/{conversationId}`)
  /// POST /api/v1/creator/studio/upload-image
  Future<String> uploadChatImage({
    required List<int> fileBytes,
    required String filename,
    String? conversationId,
  }) async {
    final safeFolder = (conversationId != null &&
            RegExp(r'^[a-zA-Z0-9_-]{1,64}$').hasMatch(conversationId.trim()))
        ? 'chats/${conversationId.trim()}'
        : 'chats/messages';

    final res = await client.multipartPost(
      '/api/v1/creator/studio/upload-image',
      fields: {'folder': safeFolder},
      fileField: 'file',
      fileBytes: fileBytes,
      filename: filename,
    );

    final data = res['data'];
    if (data is String && data.isNotEmpty) {
      return data;
    }
    if (data is Map) {
      final url = data['url'] ?? data['secureUrl'] ?? data['imageUrl'] ?? data['fileUrl'];
      if (url != null && url.toString().isNotEmpty) {
        return url.toString();
      }
    }
    throw Exception('Không nhận được đường dẫn ảnh sau khi tải lên Cloudinary');
  }
}
