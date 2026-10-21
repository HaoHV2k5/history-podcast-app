import 'api_client.dart';

class ChatConversationModel {
  final String conversationId;
  final int? partnerId;
  final String? partnerName;
  final String? partnerEmail;
  final String? partnerAvatarUrl;
  final String? partnerRole;
  final String? contextType;
  final int? contextId;

  ChatConversationModel({
    required this.conversationId,
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

class ChatRepository {
  final ApiClient client;

  ChatRepository({required this.client});

  /// Xác thực & Lấy thông tin phòng chat (POST /api/v1/chats/conversation)
  Future<ChatConversationModel> getOrCreateConversation({
    int? contractId,
    int? collaborationId,
    int? postId,
    int? applicantId,
  }) async {
    final payload = {
      if (contractId != null) 'contractId': contractId,
      if (collaborationId != null) 'collaborationId': collaborationId,
      if (postId != null) 'postId': postId,
      if (applicantId != null) 'applicantId': applicantId,
    };

    final res = await client.post('/api/v1/chats/conversation', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ChatConversationModel.fromJson(data);
  }
}
