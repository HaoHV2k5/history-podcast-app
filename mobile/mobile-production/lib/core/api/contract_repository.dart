import 'api_client.dart';

class BookingEscrowPolicyModel {
  final int contractAcceptHours;
  final int fundHours;
  final int fundPauseMaxDays;
  final int reviewDays;
  final int releaseHoldDays;
  final int revisionDays;
  final int maxMilestones;
  final int maxRevisionsDefault;
  final double platformFeePercent;
  final double membershipFeePercent;
  final int membershipDurationDays;
  final int withdrawalSlaDays;
  final double withdrawalMinAmount;
  final double depositMinAmount;
  final String? renderedTerms;

  const BookingEscrowPolicyModel({
    this.contractAcceptHours = 48,
    this.fundHours = 48,
    this.fundPauseMaxDays = 14,
    this.reviewDays = 3,
    this.releaseHoldDays = 3,
    this.revisionDays = 2,
    this.maxMilestones = 20,
    this.maxRevisionsDefault = 2,
    this.platformFeePercent = 5.0,
    this.membershipFeePercent = 10.0,
    this.membershipDurationDays = 30,
    this.withdrawalSlaDays = 2,
    this.withdrawalMinAmount = 50000,
    this.depositMinAmount = 10000,
    this.renderedTerms,
  });

  factory BookingEscrowPolicyModel.fromJson(Map<String, dynamic> json) {
    return BookingEscrowPolicyModel(
      contractAcceptHours: (json['contractAcceptHours'] as num?)?.toInt() ?? 48,
      fundHours: (json['fundHours'] as num?)?.toInt() ?? 48,
      fundPauseMaxDays: (json['fundPauseMaxDays'] as num?)?.toInt() ?? 14,
      reviewDays: (json['reviewDays'] as num?)?.toInt() ?? 3,
      releaseHoldDays: (json['releaseHoldDays'] as num?)?.toInt() ?? 3,
      revisionDays: (json['revisionDays'] as num?)?.toInt() ?? 2,
      maxMilestones: (json['maxMilestones'] as num?)?.toInt() ?? 20,
      maxRevisionsDefault: (json['maxRevisionsDefault'] as num?)?.toInt() ?? 2,
      platformFeePercent:
          (json['platformFeePercent'] as num?)?.toDouble() ?? 5.0,
      membershipFeePercent:
          (json['membershipFeePercent'] as num?)?.toDouble() ?? 10.0,
      membershipDurationDays:
          (json['membershipDurationDays'] as num?)?.toInt() ?? 30,
      withdrawalSlaDays: (json['withdrawalSlaDays'] as num?)?.toInt() ?? 2,
      withdrawalMinAmount:
          (json['withdrawalMinAmount'] as num?)?.toDouble() ?? 50000,
      depositMinAmount: (json['depositMinAmount'] as num?)?.toDouble() ?? 10000,
      renderedTerms:
          (json['renderedTerms'] ?? json['termsTemplate'])?.toString(),
    );
  }
}

class MilestoneModel {
  final int id;
  final int? contractId;
  final String? contractTitle;
  final int? orderNo;
  final String title;
  final String? description;
  final String? requirement;
  final double amount;
  final double? feePercent;
  final double? platformFee;
  final double? netAmount;
  final int? durationDays;
  final int? maxRevisions;
  final int? revisionsUsed;
  final int? revisionDays;
  final String status; // WAITING | UNFUNDED | IN_PROGRESS | SUBMITTED | APPROVED | RELEASED | REFUNDED | DISPUTED | CANCELLED
  final String? escrowStatus; // NONE | HELD | RELEASED | REFUNDED | FROZEN
  final String? dueDate;
  final String? fundDueAt;
  final String? dueAt;
  final String? reviewDueAt;
  final String? releaseAt;
  final String? fundedAt;
  final String? releasedAt;
  final String? refundedAt;

  MilestoneModel({
    required this.id,
    this.contractId,
    this.contractTitle,
    this.orderNo,
    required this.title,
    this.description,
    this.requirement,
    required this.amount,
    this.feePercent,
    this.platformFee,
    this.netAmount,
    this.durationDays,
    this.maxRevisions,
    this.revisionsUsed,
    this.revisionDays,
    required this.status,
    this.escrowStatus,
    this.dueDate,
    this.fundDueAt,
    this.dueAt,
    this.reviewDueAt,
    this.releaseAt,
    this.fundedAt,
    this.releasedAt,
    this.refundedAt,
  });

  factory MilestoneModel.fromJson(Map<String, dynamic> json) {
    final reqText = (json['requirement'] ?? json['description'])?.toString();
    final due = (json['dueAt'] ?? json['dueDate'])?.toString();
    return MilestoneModel(
      id: (json['id'] as num).toInt(),
      contractId: (json['contractId'] as num?)?.toInt(),
      contractTitle: json['contractTitle']?.toString(),
      orderNo: (json['orderNo'] as num?)?.toInt(),
      title: (json['title'] ?? '').toString(),
      description: reqText,
      requirement: reqText,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      feePercent: (json['feePercent'] as num?)?.toDouble(),
      platformFee: (json['platformFee'] as num?)?.toDouble(),
      netAmount: (json['netAmount'] as num?)?.toDouble(),
      durationDays: (json['durationDays'] as num?)?.toInt(),
      maxRevisions: (json['maxRevisions'] as num?)?.toInt(),
      revisionsUsed: (json['revisionsUsed'] as num?)?.toInt(),
      revisionDays: (json['revisionDays'] as num?)?.toInt(),
      status: (json['status'] ?? 'WAITING').toString(),
      escrowStatus: json['escrowStatus']?.toString(),
      dueDate: due,
      fundDueAt: json['fundDueAt']?.toString(),
      dueAt: due,
      reviewDueAt: json['reviewDueAt']?.toString(),
      releaseAt: json['releaseAt']?.toString(),
      fundedAt: json['fundedAt']?.toString(),
      releasedAt: json['releasedAt']?.toString(),
      refundedAt: json['refundedAt']?.toString(),
    );
  }
}

class ContractModel {
  final int id;
  final int? hireRequestId;
  final int? channelId;
  final String? channelName;
  final String? conversationId;
  final int? postId;
  final String? postTitle;
  final int? creatorId;
  final String? creatorFullName;
  final String? creatorAvatarUrl;
  final int? requesterId;
  final String? requesterFullName;
  final String? requesterAvatarUrl;
  final int? freelancerId;
  final String? freelancerFullName;
  final String? freelancerAvatarUrl;
  final String serviceType;
  final String title;
  final String? description;
  final double totalAmount;
  final double? platformFeePercent;
  final double? platformFee;
  final double? netAmount;
  final String? termsText;
  final String status; // PENDING | ACTIVE | REJECTED | COMPLETED | CANCELLED | DISPUTED
  final String? acceptedAt;
  final String? acceptDueAt;
  final List<MilestoneModel> milestones;
  final String? createdAt;
  final String? updatedAt;

  ContractModel({
    required this.id,
    this.hireRequestId,
    this.channelId,
    this.channelName,
    this.conversationId,
    this.postId,
    this.postTitle,
    this.creatorId,
    this.creatorFullName,
    this.creatorAvatarUrl,
    this.requesterId,
    this.requesterFullName,
    this.requesterAvatarUrl,
    this.freelancerId,
    this.freelancerFullName,
    this.freelancerAvatarUrl,
    required this.serviceType,
    required this.title,
    this.description,
    required this.totalAmount,
    this.platformFeePercent,
    this.platformFee,
    this.netAmount,
    this.termsText,
    required this.status,
    this.acceptedAt,
    this.acceptDueAt,
    this.milestones = const [],
    this.createdAt,
    this.updatedAt,
  });

  int? get effectiveRequesterId => requesterId ?? freelancerId;

  String get effectiveRequesterName =>
      (requesterFullName != null && requesterFullName!.isNotEmpty)
          ? requesterFullName!
          : (freelancerFullName ?? 'Khách đặt nội dung #${effectiveRequesterId ?? 0}');

  String get effectiveChannelOrCreatorName =>
      (channelName != null && channelName!.isNotEmpty)
          ? channelName!
          : (creatorFullName ?? 'Creator #${creatorId ?? 0}');

  factory ContractModel.fromJson(Map<String, dynamic> json) {
    final rawMilestones = json['milestones'] as List<dynamic>? ?? [];
    final reqId = ((json['requesterId'] ?? json['freelancerId']) as num?)?.toInt();
    final reqName =
        (json['requesterFullName'] ?? json['freelancerFullName'])?.toString();
    final reqAvatar =
        (json['requesterAvatarUrl'] ?? json['freelancerAvatarUrl'])?.toString();
    return ContractModel(
      id: (json['id'] as num).toInt(),
      hireRequestId: (json['hireRequestId'] as num?)?.toInt(),
      channelId: (json['channelId'] as num?)?.toInt(),
      channelName: json['channelName']?.toString(),
      conversationId: json['conversationId']?.toString(),
      postId: (json['postId'] as num?)?.toInt(),
      postTitle: json['postTitle']?.toString(),
      creatorId: (json['creatorId'] as num?)?.toInt(),
      creatorFullName: json['creatorFullName']?.toString(),
      creatorAvatarUrl: json['creatorAvatarUrl']?.toString(),
      requesterId: reqId,
      requesterFullName: reqName,
      requesterAvatarUrl: reqAvatar,
      freelancerId: (json['freelancerId'] as num?)?.toInt() ?? reqId,
      freelancerFullName: json['freelancerFullName']?.toString() ?? reqName,
      freelancerAvatarUrl: json['freelancerAvatarUrl']?.toString() ?? reqAvatar,
      serviceType: (json['serviceType'] ?? 'CONTENT').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      platformFeePercent: (json['platformFeePercent'] as num?)?.toDouble(),
      platformFee: (json['platformFee'] as num?)?.toDouble(),
      netAmount: (json['netAmount'] as num?)?.toDouble(),
      termsText: json['termsText']?.toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      acceptedAt: json['acceptedAt']?.toString(),
      acceptDueAt: json['acceptDueAt']?.toString(),
      milestones: rawMilestones
          .map((e) => MilestoneModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class MilestoneFinancialSummaryModel {
  final String role;
  final double totalSpentOrEarned;
  final double escrowHeldAmount;
  final double refundedOrFeeAmount;
  final double totalEarned;
  final double pendingEarnings;
  final double totalPlatformFeePaid;
  final double totalSpent;
  final double escrowLocked;
  final double refundedAmount;
  final int completedMilestonesCount;
  final int activeMilestonesCount;

  const MilestoneFinancialSummaryModel({
    this.role = 'VIEWER',
    this.totalSpentOrEarned = 0.0,
    this.escrowHeldAmount = 0.0,
    this.refundedOrFeeAmount = 0.0,
    this.totalEarned = 0.0,
    this.pendingEarnings = 0.0,
    this.totalPlatformFeePaid = 0.0,
    this.totalSpent = 0.0,
    this.escrowLocked = 0.0,
    this.refundedAmount = 0.0,
    this.completedMilestonesCount = 0,
    this.activeMilestonesCount = 0,
  });

  factory MilestoneFinancialSummaryModel.fromJson(Map<String, dynamic> json) {
    final earned = (json['totalEarned'] as num?)?.toDouble() ?? 0.0;
    final spent = (json['totalSpent'] as num?)?.toDouble() ?? 0.0;
    final pending = ((json['pendingEarnings'] ?? json['pendingAmount']) as num?)
            ?.toDouble() ??
        0.0;
    final locked =
        ((json['escrowLocked'] ?? json['escrowHeld']) as num?)?.toDouble() ?? 0.0;
    final feePaid = ((json['totalPlatformFeePaid'] ??
                json['platformFeePaid']) as num?)
            ?.toDouble() ??
        0.0;
    final refunded =
        ((json['refundedAmount'] ?? json['totalRefunded']) as num?)?.toDouble() ??
            0.0;
    return MilestoneFinancialSummaryModel(
      role: (json['role'] ?? 'VIEWER').toString(),
      totalSpentOrEarned: earned > 0 ? earned : spent,
      escrowHeldAmount: locked > 0 ? locked : pending,
      refundedOrFeeAmount: feePaid > 0 ? feePaid : refunded,
      totalEarned: earned,
      pendingEarnings: pending,
      totalPlatformFeePaid: feePaid,
      totalSpent: spent,
      escrowLocked: locked,
      refundedAmount: refunded,
      completedMilestonesCount:
          (json['completedMilestonesCount'] as num?)?.toInt() ?? 0,
      activeMilestonesCount:
          (json['activeMilestonesCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class ContractRepository {
  final ApiClient client;

  ContractRepository({required this.client});

  /// 0. [Public] Xem chính sách & thông số nền tảng công khai (GET /api/v1/booking-escrow/policy)
  Future<BookingEscrowPolicyModel> getPublicPolicy() async {
    final res = await client.get('/api/v1/booking-escrow/policy');
    final data = (res['data'] as Map<String, dynamic>?) ?? const {};
    return BookingEscrowPolicyModel.fromJson(data);
  }

  /// 1. Creator lập & gửi lộ trình Milestone (POST /api/v1/contracts)
  Future<ContractModel> createAndSendContract({
    int? hireRequestId,
    int? requesterId,
    int? postId,
    int? freelancerId,
    String serviceType = 'CONTENT',
    required String title,
    String? description,
    required List<Map<String, dynamic>> milestones,
  }) async {
    final effectiveReqId = requesterId ?? freelancerId;
    final payload = {
      if (hireRequestId != null) 'hireRequestId': hireRequestId,
      if (effectiveReqId != null) 'requesterId': effectiveReqId,
      if (freelancerId != null) 'freelancerId': freelancerId,
      'serviceType': serviceType,
      'title': title,
      if (description != null) 'description': description,
      'milestones': milestones,
    };
    final res = await client.post('/api/v1/contracts', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }

  /// 1b. Creator chỉnh sửa toàn bộ lộ trình Milestone & gửi lại khi PENDING hoặc REJECTED (PUT /api/v1/contracts/{id})
  Future<ContractModel> updatePendingContract(
    int id, {
    required String title,
    String? description,
    required List<Map<String, dynamic>> milestones,
  }) async {
    final payload = {
      'title': title,
      if (description != null) 'description': description,
      'milestones': milestones,
    };
    final res = await client.put('/api/v1/contracts/$id', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }

  /// 2. Lấy chi tiết hợp đồng theo ID (GET /api/v1/contracts/{id})
  Future<ContractModel> getContractById(int id) async {
    final res = await client.get('/api/v1/contracts/$id');
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }

  /// 3. Lấy danh sách hợp đồng của tôi (GET /api/v1/contracts/me)
  Future<List<ContractModel>> getMyContracts({String? status, int page = 0, int size = 20}) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    if (status != null && status.isNotEmpty) {
      query['status'] = status;
    }
    final res = await client.get('/api/v1/contracts/me', queryParams: query);
    final data = res['data'];
    if (data is Map) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems.map((e) => ContractModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } else if (data is List) {
      return data.map((e) => ContractModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 3b. Lấy danh sách milestone của tôi (GET /api/v1/contracts/my-milestones)
  Future<List<MilestoneModel>> getMyMilestones({
    String? status,
    int? contractId,
    int page = 0,
    int size = 20,
  }) async {
    final query = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
      if (status != null && status.isNotEmpty) 'status': status,
      if (contractId != null) 'contractId': contractId.toString(),
    };
    final res = await client.get('/api/v1/contracts/my-milestones', queryParams: query);
    final data = res['data'];
    if (data is Map) {
      final rawItems = data['items'] ?? data['content'];
      if (rawItems is List) {
        return rawItems.map((e) => MilestoneModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } else if (data is List) {
      return data.map((e) => MilestoneModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 3c. Xem tổng quan tài chính milestone của tôi (GET /api/v1/contracts/me/milestone-financials)
  Future<MilestoneFinancialSummaryModel> getMyMilestoneFinancials() async {
    final res = await client.get('/api/v1/contracts/me/milestone-financials');
    final data = (res['data'] as Map<String, dynamic>?) ?? const {};
    return MilestoneFinancialSummaryModel.fromJson(data);
  }

  /// 4. Người thuê chấp nhận toàn bộ lộ trình Milestone (POST /api/v1/contracts/{id}/accept)
  Future<ContractModel> acceptContract(int id) async {
    final res = await client.post('/api/v1/contracts/$id/accept');
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }

  /// 5. Người thuê từ chối lộ trình Milestone để thương lượng lại (POST /api/v1/contracts/{id}/reject)
  Future<ContractModel> rejectContract(int id) async {
    final res = await client.post('/api/v1/contracts/$id/reject');
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }

  /// 6. Hủy hợp đồng khi còn ở trạng thái PENDING hoặc REJECTED (POST /api/v1/contracts/{id}/cancel)
  Future<ContractModel> cancelContract(int id) async {
    final res = await client.post('/api/v1/contracts/$id/cancel');
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }
}
