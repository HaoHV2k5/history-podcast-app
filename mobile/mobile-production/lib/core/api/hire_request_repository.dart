import 'api_client.dart';

class HireRequestModel {
  final int id;
  final int? requesterId;
  final String? requesterFullName;
  final String? requesterEmail;
  final String? requesterAvatarUrl;
  final int narratorId;
  final int creatorId;
  final String? creatorFullName;
  final String? creatorEmail;
  final String? creatorAvatarUrl;
  final int? channelId;
  final String? channelName;
  final String? channelAvatarUrl;
  final String? contentType; // SINGLE_VIDEO | SERIES
  final String? title;
  final String? description;
  final double? proposedPrice;
  final String? deadline;
  final String status; // PENDING | ACCEPTED | REJECTED | CONTRACT_SENT | COMPLETED | CANCELLED
  final String? rejectionReason;
  final int? contractId;
  final String? contractStatus;
  final String? conversationId;
  final String? createdAt;
  final String? updatedAt;

  HireRequestModel({
    required this.id,
    this.requesterId,
    this.requesterFullName,
    this.requesterEmail,
    this.requesterAvatarUrl,
    required this.narratorId,
    required this.creatorId,
    this.creatorFullName,
    this.creatorEmail,
    this.creatorAvatarUrl,
    this.channelId,
    this.channelName,
    this.channelAvatarUrl,
    this.contentType,
    this.title,
    this.description,
    this.proposedPrice,
    this.deadline,
    required this.status,
    this.rejectionReason,
    this.contractId,
    this.contractStatus,
    this.conversationId,
    this.createdAt,
    this.updatedAt,
  });

  int get effectiveRequesterId => requesterId ?? narratorId;

  String get effectiveRequesterName =>
      (requesterFullName != null && requesterFullName!.isNotEmpty)
          ? requesterFullName!
          : (requesterEmail ?? 'Khán giả #$effectiveRequesterId');

  String get effectiveChannelName =>
      (channelName != null && channelName!.isNotEmpty)
          ? channelName!
          : (creatorFullName ?? 'Kênh Creator #$creatorId');

  String get contentTypeLabel =>
      contentType == 'SERIES' ? 'Series nhiều tập' : 'Video lẻ';

  factory HireRequestModel.fromJson(Map<String, dynamic> json) {
    final reqId = (json['requesterId'] as num?)?.toInt();
    final narId = (json['narratorId'] as num?)?.toInt() ?? reqId ?? 0;
    return HireRequestModel(
      id: (json['id'] as num).toInt(),
      requesterId: reqId ?? narId,
      requesterFullName: json['requesterFullName']?.toString(),
      requesterEmail: json['requesterEmail']?.toString(),
      requesterAvatarUrl: json['requesterAvatarUrl']?.toString(),
      narratorId: narId,
      creatorId: (json['creatorId'] as num?)?.toInt() ?? 0,
      creatorFullName: json['creatorFullName']?.toString(),
      creatorEmail: json['creatorEmail']?.toString(),
      creatorAvatarUrl: json['creatorAvatarUrl']?.toString(),
      channelId: (json['channelId'] as num?)?.toInt(),
      channelName: json['channelName']?.toString(),
      channelAvatarUrl: json['channelAvatarUrl']?.toString(),
      contentType: (json['contentType'] ?? 'SINGLE_VIDEO').toString(),
      title: json['title']?.toString(),
      description: json['description']?.toString(),
      proposedPrice: (json['proposedPrice'] as num?)?.toDouble(),
      deadline: json['deadline']?.toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      rejectionReason: json['rejectionReason']?.toString(),
      contractId: (json['contractId'] as num?)?.toInt(),
      contractStatus: json['contractStatus']?.toString(),
      conversationId: json['conversationId']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class HireRequestRepository {
  final ApiClient client;

  HireRequestRepository({required this.client});

  List<HireRequestModel> _parseList(dynamic data) {
    if (data is Map) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems
            .map((e) => HireRequestModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } else if (data is List) {
      return data
          .map((e) => HireRequestModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// 1. Người nghe gửi đơn đặt làm nội dung (POST /api/v1/commissions)
  Future<HireRequestModel> createCommission({
    int? channelId,
    int? creatorId,
    required String contentType, // SINGLE_VIDEO | SERIES
    required String title,
    required String description,
  }) async {
    final payload = <String, dynamic>{
      if (channelId != null) 'channelId': channelId,
      if (creatorId != null) 'creatorId': creatorId,
      'contentType': contentType,
      'title': title,
      'description': description,
    };
    final res = await client.post('/api/v1/commissions', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// 2. Người nghe xem danh sách đơn đặt hàng đã gửi (GET /api/v1/commissions/my-sent)
  Future<List<HireRequestModel>> getMySent({
    String? status,
    int page = 0,
    int size = 20,
  }) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
      if (status != null && status.isNotEmpty) 'status': status,
    };
    final res = await client.get('/api/v1/commissions/my-sent', queryParams: query);
    return _parseList(res['data']);
  }

  /// 3. Creator xem danh sách đơn đặt hàng nhận được từ khán giả (GET /api/v1/commissions/my-received)
  Future<List<HireRequestModel>> getMyReceived({
    String? status,
    int page = 0,
    int size = 20,
  }) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
      if (status != null && status.isNotEmpty) 'status': status,
    };
    final res = await client.get('/api/v1/commissions/my-received', queryParams: query);
    return _parseList(res['data']);
  }

  /// 4. Xem tất cả đơn đặt hàng liên quan đến tôi (GET /api/v1/commissions/me)
  Future<List<HireRequestModel>> getMyCommissions({
    String? status,
    int page = 0,
    int size = 20,
  }) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
      if (status != null && status.isNotEmpty) 'status': status,
    };
    final res = await client.get('/api/v1/commissions/me', queryParams: query);
    return _parseList(res['data']);
  }

  /// 5. Creator bấm Chấp nhận đơn thảo luận -> Mở khóa phòng Chat 1-1 (POST /api/v1/commissions/{id}/accept)
  Future<HireRequestModel> acceptCommission(int id) async {
    final res = await client.post('/api/v1/commissions/$id/accept', body: {});
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// 6. Creator bấm Từ chối đơn đặt nội dung kèm lý do (POST /api/v1/commissions/{id}/reject)
  Future<HireRequestModel> rejectCommission(
    int id, {
    required String reason,
  }) async {
    final res = await client.post(
      '/api/v1/commissions/$id/reject',
      body: {'reason': reason},
    );
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// 7. Người nghe chủ động hủy đơn đặt nội dung (POST /api/v1/commissions/{id}/cancel)
  Future<HireRequestModel> cancelCommission(int id) async {
    final res = await client.post('/api/v1/commissions/$id/cancel', body: {});
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// 8. Người nghe cập nhật nội dung đơn đặt hàng khi còn PENDING (PUT /api/v1/commissions/{id})
  Future<HireRequestModel> updateCommission(
    int id, {
    int? channelId,
    int? creatorId,
    required String contentType,
    required String title,
    required String description,
  }) async {
    final payload = <String, dynamic>{
      if (channelId != null) 'channelId': channelId,
      if (creatorId != null) 'creatorId': creatorId,
      'contentType': contentType,
      'title': title,
      'description': description,
    };
    final res = await client.put('/api/v1/commissions/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// Compatibility: Lấy danh sách tất cả HireRequest (GET /api/v1/commissions)
  Future<List<HireRequestModel>> getAll() async {
    final res = await client.get('/api/v1/commissions');
    return _parseList(res['data']);
  }

  /// Compatibility: Lấy chi tiết HireRequest theo ID (GET /api/v1/commissions/{id})
  Future<HireRequestModel> getById(int id) async {
    final res = await client.get('/api/v1/commissions/$id');
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// Compatibility: Tạo mới HireRequest (POST /api/v1/commissions)
  Future<HireRequestModel> create({
    required int creatorId,
    required int narratorId,
    int? channelId,
    String? title,
    String? contentType,
    String? description,
    double? proposedPrice,
    String? deadline,
  }) async {
    final payload = {
      'creatorId': creatorId,
      if (channelId != null) 'channelId': channelId,
      'contentType': contentType ?? 'SINGLE_VIDEO',
      'title': (title != null && title.trim().isNotEmpty)
          ? title.trim()
          : 'Đặt làm nội dung lịch sử theo yêu cầu',
      'description': (description != null && description.trim().isNotEmpty)
          ? description.trim()
          : 'Đặt sản xuất nội dung theo yêu cầu.',
    };
    final res = await client.post('/api/v1/commissions', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// Compatibility: Cập nhật HireRequest (PUT /api/v1/commissions/{id})
  Future<HireRequestModel> update(
    int id, {
    String? title,
    String? contentType,
    String? description,
    double? proposedPrice,
    String? deadline,
    String? status,
  }) async {
    if (status == 'ACCEPTED') {
      return acceptCommission(id);
    }
    if (status == 'CANCELLED') {
      return cancelCommission(id);
    }
    if (status == 'REJECTED') {
      return rejectCommission(
        id,
        reason: description ?? 'Lịch sản xuất của kênh hiện đã kín.',
      );
    }
    final payload = {
      'contentType': contentType ?? 'SINGLE_VIDEO',
      'title': title ?? 'Cập nhật yêu cầu đặt nội dung',
      'description': description ?? 'Cập nhật nội dung yêu cầu.',
    };
    final res = await client.put('/api/v1/commissions/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return HireRequestModel.fromJson(data);
  }

  /// Xóa / Hủy HireRequest (DELETE /api/v1/commissions/{id})
  Future<void> delete(int id) async {
    await client.delete('/api/v1/commissions/$id');
  }
}
