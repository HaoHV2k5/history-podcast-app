import 'api_client.dart';

class MilestoneDeliverableModel {
  final int id;
  final int milestoneId;
  final int? milestoneOrderNo;
  final String? milestoneTitle;
  final int? postId;
  final String? postTitle;
  final int? contractId;
  final String? contractTitle;
  final String? title;
  final String? description;
  final String fileName;
  final int? fileSize;
  final String? contentType;
  final int? versionNo;
  final int? uploadedById;
  final String? uploadedByFullName;
  final String? downloadUrl;
  final String? previewUrl;
  final String? createdAt;

  MilestoneDeliverableModel({
    required this.id,
    required this.milestoneId,
    this.milestoneOrderNo,
    this.milestoneTitle,
    this.postId,
    this.postTitle,
    this.contractId,
    this.contractTitle,
    this.title,
    this.description,
    required this.fileName,
    this.fileSize,
    this.contentType,
    this.versionNo,
    this.uploadedById,
    this.uploadedByFullName,
    this.downloadUrl,
    this.previewUrl,
    this.createdAt,
  });

  factory MilestoneDeliverableModel.fromJson(Map<String, dynamic> json) {
    return MilestoneDeliverableModel(
      id: (json['id'] as num).toInt(),
      milestoneId: (json['milestoneId'] as num?)?.toInt() ?? 0,
      milestoneOrderNo: (json['milestoneOrderNo'] as num?)?.toInt(),
      milestoneTitle: json['milestoneTitle']?.toString(),
      postId: (json['postId'] as num?)?.toInt(),
      postTitle: json['postTitle']?.toString(),
      contractId: (json['contractId'] as num?)?.toInt(),
      contractTitle: json['contractTitle']?.toString(),
      title: json['title']?.toString(),
      description: json['description']?.toString(),
      fileName: (json['fileName'] ?? 'file').toString(),
      fileSize: (json['fileSize'] as num?)?.toInt(),
      contentType: json['contentType']?.toString(),
      versionNo: (json['versionNo'] as num?)?.toInt(),
      uploadedById: (json['uploadedById'] as num?)?.toInt(),
      uploadedByFullName: json['uploadedByFullName']?.toString(),
      downloadUrl: json['downloadUrl']?.toString(),
      previewUrl: json['previewUrl']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class MilestoneReviewModel {
  final int id;
  final int milestoneId;
  final int? milestoneOrderNo;
  final String? milestoneTitle;
  final int? contractId;
  final String? contractTitle;
  final int? reviewerId;
  final String? reviewerFullName;
  final String? reviewerAvatarUrl;
  final int? revieweeId;
  final String? revieweeFullName;
  final String? revieweeAvatarUrl;
  final int rating;
  final String? comment;
  final String? createdAt;

  MilestoneReviewModel({
    required this.id,
    required this.milestoneId,
    this.milestoneOrderNo,
    this.milestoneTitle,
    this.contractId,
    this.contractTitle,
    this.reviewerId,
    this.reviewerFullName,
    this.reviewerAvatarUrl,
    this.revieweeId,
    this.revieweeFullName,
    this.revieweeAvatarUrl,
    required this.rating,
    this.comment,
    this.createdAt,
  });

  factory MilestoneReviewModel.fromJson(Map<String, dynamic> json) {
    return MilestoneReviewModel(
      id: (json['id'] as num).toInt(),
      milestoneId: (json['milestoneId'] as num?)?.toInt() ?? 0,
      milestoneOrderNo: (json['milestoneOrderNo'] as num?)?.toInt(),
      milestoneTitle: json['milestoneTitle']?.toString(),
      contractId: (json['contractId'] as num?)?.toInt(),
      contractTitle: json['contractTitle']?.toString(),
      reviewerId: (json['reviewerId'] as num?)?.toInt(),
      reviewerFullName: json['reviewerFullName']?.toString(),
      reviewerAvatarUrl: json['reviewerAvatarUrl']?.toString(),
      revieweeId: (json['revieweeId'] as num?)?.toInt(),
      revieweeFullName: json['revieweeFullName']?.toString(),
      revieweeAvatarUrl: json['revieweeAvatarUrl']?.toString(),
      rating: (json['rating'] as num?)?.toInt() ?? 5,
      comment: json['comment']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class MilestoneModel {
  final int id;
  final int? contractId;
  final int? orderNo;
  final String title;
  final String? requirement;
  final double amount;
  final int? durationDays;
  final int? maxRevisions;
  final int? revisionsUsed;
  final int? revisionDays;
  final String status;
  final String? fundDueAt;
  final String? dueAt;
  final String? reviewDueAt;
  final String? releaseAt;
  final String? escrowStatus;
  final double? platformFee;
  final double? netAmount;
  final String? fundedAt;
  final String? releasedAt;
  final String? refundedAt;
  final List<MilestoneDeliverableModel> deliverables;
  final List<MilestoneReviewModel> reviews;
  final String? createdAt;
  final String? updatedAt;

  MilestoneModel({
    required this.id,
    this.contractId,
    this.orderNo,
    required this.title,
    this.requirement,
    required this.amount,
    this.durationDays,
    this.maxRevisions,
    this.revisionsUsed,
    this.revisionDays,
    required this.status,
    this.fundDueAt,
    this.dueAt,
    this.reviewDueAt,
    this.releaseAt,
    this.escrowStatus,
    this.platformFee,
    this.netAmount,
    this.fundedAt,
    this.releasedAt,
    this.refundedAt,
    this.deliverables = const [],
    this.reviews = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory MilestoneModel.fromJson(Map<String, dynamic> json) {
    var rawDeliverables = json['deliverables'];
    var rawReviews = json['reviews'];

    return MilestoneModel(
      id: (json['id'] as num).toInt(),
      contractId: (json['contractId'] as num?)?.toInt(),
      orderNo: (json['orderNo'] as num?)?.toInt(),
      title: (json['title'] ?? '').toString(),
      requirement: json['requirement']?.toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      durationDays: (json['durationDays'] as num?)?.toInt(),
      maxRevisions: (json['maxRevisions'] as num?)?.toInt(),
      revisionsUsed: (json['revisionsUsed'] as num?)?.toInt(),
      revisionDays: (json['revisionDays'] as num?)?.toInt(),
      status: (json['status'] ?? 'PENDING').toString(),
      fundDueAt: json['fundDueAt']?.toString(),
      dueAt: json['dueAt']?.toString(),
      reviewDueAt: json['reviewDueAt']?.toString(),
      releaseAt: json['releaseAt']?.toString(),
      escrowStatus: json['escrowStatus']?.toString(),
      platformFee: (json['platformFee'] as num?)?.toDouble(),
      netAmount: (json['netAmount'] as num?)?.toDouble(),
      fundedAt: json['fundedAt']?.toString(),
      releasedAt: json['releasedAt']?.toString(),
      refundedAt: json['refundedAt']?.toString(),
      deliverables: (rawDeliverables is List)
          ? rawDeliverables.map((e) => MilestoneDeliverableModel.fromJson(e as Map<String, dynamic>)).toList()
          : [],
      reviews: (rawReviews is List)
          ? rawReviews.map((e) => MilestoneReviewModel.fromJson(e as Map<String, dynamic>)).toList()
          : [],
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class MilestoneRepository {
  final ApiClient client;

  MilestoneRepository({required this.client});

  // ==========================================
  // 1. Milestone Deliverables (5 endpoints)
  // ==========================================

  /// GET /api/v1/deliverables/{id}/download
  String getDeliverableDownloadUrl(int id) {
    return '${client.baseUrl}/api/v1/deliverables/$id/download';
  }

  /// GET /api/v1/deliverables/{id}/view
  String getDeliverablePreviewUrl(int id) {
    return '${client.baseUrl}/api/v1/deliverables/$id/view';
  }

  /// GET /api/v1/milestones/{milestoneId}/deliverables
  Future<List<MilestoneDeliverableModel>> getDeliverablesByMilestone(int milestoneId) async {
    final res = await client.get('/api/v1/milestones/$milestoneId/deliverables');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => MilestoneDeliverableModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// POST /api/v1/milestones/{milestoneId}/deliverables (Multipart file upload)
  Future<MilestoneDeliverableModel> uploadDeliverable(
    int milestoneId, {
    String? title,
    String? description,
    required List<int> fileBytes,
    required String filename,
  }) async {
    final fields = <String, String>{};
    if (title != null) fields['title'] = title;
    if (description != null) fields['description'] = description;

    final res = await client.multipartPost(
      '/api/v1/milestones/$milestoneId/deliverables',
      fields: fields,
      fileField: 'file',
      fileBytes: fileBytes,
      filename: filename,
    );
    final data = res['data'] as Map<String, dynamic>;
    return MilestoneDeliverableModel.fromJson(data);
  }

  /// GET /api/v1/posts/{postId}/deliverables
  Future<List<MilestoneDeliverableModel>> getDeliverablesByPost(int postId) async {
    final res = await client.get('/api/v1/posts/$postId/deliverables');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => MilestoneDeliverableModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  // ==========================================
  // 2. Milestone Management (7 endpoints)
  // ==========================================

  /// GET /api/v1/milestones/{id}
  Future<MilestoneModel> getMilestoneById(int id) async {
    final res = await client.get('/api/v1/milestones/$id');
    final data = res['data'] as Map<String, dynamic>;
    return MilestoneModel.fromJson(data);
  }

  /// POST /api/v1/milestones/{id}/approve
  Future<MilestoneModel> approveMilestone(int id) async {
    final res = await client.post('/api/v1/milestones/$id/approve', body: {});
    final data = res['data'] as Map<String, dynamic>;
    return MilestoneModel.fromJson(data);
  }

  /// POST /api/v1/milestones/{id}/cancel-overdue
  Future<MilestoneModel> cancelOverdueMilestone(int id) async {
    final res = await client.post('/api/v1/milestones/$id/cancel-overdue', body: {});
    final data = res['data'] as Map<String, dynamic>;
    return MilestoneModel.fromJson(data);
  }

  /// POST /api/v1/milestones/{id}/fund
  Future<MilestoneModel> fundMilestone(int id) async {
    final res = await client.post('/api/v1/milestones/$id/fund', body: {});
    final data = res['data'] as Map<String, dynamic>;
    return MilestoneModel.fromJson(data);
  }

  /// POST /api/v1/milestones/{id}/request-revision
  Future<MilestoneModel> requestRevision(
    int id, {
    int? submissionId,
    required String note,
  }) async {
    final payload = <String, dynamic>{
      if (submissionId != null) 'submissionId': submissionId,
      'note': note,
    };
    final res = await client.post('/api/v1/milestones/$id/request-revision', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return MilestoneModel.fromJson(data);
  }

  /// POST /api/v1/milestones/{id}/submit
  Future<MilestoneModel> submitDeliverable(
    int id, {
    String? content,
    String? fileUrl,
  }) async {
    final payload = <String, dynamic>{
      if (content != null) 'content': content,
      if (fileUrl != null) 'fileUrl': fileUrl,
    };
    final res = await client.post('/api/v1/milestones/$id/submit', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return MilestoneModel.fromJson(data);
  }

  /// GET /api/v1/milestones/contract/{contractId}
  Future<List<MilestoneModel>> getMilestonesByContract(int contractId) async {
    final res = await client.get('/api/v1/milestones/contract/$contractId');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => MilestoneModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  // ==========================================
  // 3. Milestone Reviews (3 endpoints)
  // ==========================================

  /// GET /api/v1/contracts/{contractId}/milestone-reviews
  Future<List<MilestoneReviewModel>> getReviewsByContract(int contractId) async {
    final res = await client.get('/api/v1/contracts/$contractId/milestone-reviews');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => MilestoneReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// GET /api/v1/milestones/{milestoneId}/reviews
  Future<List<MilestoneReviewModel>> getReviewsByMilestone(int milestoneId) async {
    final res = await client.get('/api/v1/milestones/$milestoneId/reviews');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => MilestoneReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// POST /api/v1/milestones/{milestoneId}/reviews
  Future<MilestoneReviewModel> createMilestoneReview(
    int milestoneId, {
    required int rating,
    String? comment,
  }) async {
    final payload = <String, dynamic>{
      'rating': rating,
      if (comment != null) 'comment': comment,
    };
    final res = await client.post('/api/v1/milestones/$milestoneId/reviews', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return MilestoneReviewModel.fromJson(data);
  }
}
