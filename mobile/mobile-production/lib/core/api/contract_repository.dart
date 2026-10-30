import 'api_client.dart';

class MilestoneModel {
  final int id;
  final String title;
  final String? description;
  final double amount;
  final String status;
  final String? dueDate;

  MilestoneModel({
    required this.id,
    required this.title,
    this.description,
    required this.amount,
    required this.status,
    this.dueDate,
  });

  factory MilestoneModel.fromJson(Map<String, dynamic> json) {
    return MilestoneModel(
      id: (json['id'] as num).toInt(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'PENDING').toString(),
      dueDate: json['dueDate']?.toString(),
    );
  }
}

class ContractModel {
  final int id;
  final int? postId;
  final String? postTitle;
  final int? creatorId;
  final String? creatorFullName;
  final int? freelancerId;
  final String? freelancerFullName;
  final String serviceType;
  final String title;
  final String? description;
  final double totalAmount;
  final String status;
  final List<MilestoneModel> milestones;
  final String? createdAt;

  ContractModel({
    required this.id,
    this.postId,
    this.postTitle,
    this.creatorId,
    this.creatorFullName,
    this.freelancerId,
    this.freelancerFullName,
    required this.serviceType,
    required this.title,
    this.description,
    required this.totalAmount,
    required this.status,
    this.milestones = const [],
    this.createdAt,
  });

  factory ContractModel.fromJson(Map<String, dynamic> json) {
    final rawMilestones = json['milestones'] as List<dynamic>? ?? [];
    return ContractModel(
      id: (json['id'] as num).toInt(),
      postId: (json['postId'] as num?)?.toInt(),
      postTitle: json['postTitle']?.toString(),
      creatorId: (json['creatorId'] as num?)?.toInt(),
      creatorFullName: json['creatorFullName']?.toString(),
      freelancerId: (json['freelancerId'] as num?)?.toInt(),
      freelancerFullName: json['freelancerFullName']?.toString(),
      serviceType: (json['serviceType'] ?? 'VOICEOVER').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      status: (json['status'] ?? 'PENDING').toString(),
      milestones: rawMilestones.map((e) => MilestoneModel.fromJson(e as Map<String, dynamic>)).toList(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class MilestoneFinancialSummaryModel {
  final double totalSpentOrEarned;
  final double escrowHeldAmount;
  final double refundedOrFeeAmount;

  const MilestoneFinancialSummaryModel({
    this.totalSpentOrEarned = 0.0,
    this.escrowHeldAmount = 0.0,
    this.refundedOrFeeAmount = 0.0,
  });

  factory MilestoneFinancialSummaryModel.fromJson(Map<String, dynamic> json) {
    return MilestoneFinancialSummaryModel(
      totalSpentOrEarned: ((json['totalSpent'] ?? json['totalEarned'] ?? 0) as num).toDouble(),
      escrowHeldAmount: ((json['escrowHeld'] ?? json['pendingAmount'] ?? 0) as num).toDouble(),
      refundedOrFeeAmount: ((json['totalRefunded'] ?? json['platformFeePaid'] ?? 0) as num).toDouble(),
    );
  }
}

class ContractRepository {
  final ApiClient client;

  ContractRepository({required this.client});

  /// 1. Creator tạo & gửi hợp đồng (POST /api/v1/contracts)
  Future<ContractModel> createAndSendContract({
    int? postId,
    required int freelancerId,
    String serviceType = 'VOICEOVER',
    required String title,
    String? description,
    required List<Map<String, dynamic>> milestones,
  }) async {
    final payload = {
      if (postId != null) 'postId': postId,
      'freelancerId': freelancerId,
      'serviceType': serviceType,
      'title': title,
      if (description != null) 'description': description,
      'milestones': milestones,
    };
    final res = await client.post('/api/v1/contracts', body: payload);
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

  /// 4. Freelancer chấp nhận hợp đồng (POST /api/v1/contracts/{id}/accept)
  Future<ContractModel> acceptContract(int id) async {
    final res = await client.post('/api/v1/contracts/$id/accept');
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }

  /// 5. Freelancer từ chối hợp đồng (POST /api/v1/contracts/{id}/reject)
  Future<ContractModel> rejectContract(int id) async {
    final res = await client.post('/api/v1/contracts/$id/reject');
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }

  /// 6. Hủy hợp đồng khi còn ở trạng thái PENDING (POST /api/v1/contracts/{id}/cancel)
  Future<ContractModel> cancelContract(int id) async {
    final res = await client.post('/api/v1/contracts/$id/cancel');
    final data = res['data'] as Map<String, dynamic>;
    return ContractModel.fromJson(data);
  }
}
