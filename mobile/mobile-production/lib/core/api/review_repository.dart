import 'api_client.dart';

class ReviewModel {
  final int id;
  final int contractId;
  final int reviewerId;
  final String? reviewerFullName;
  final String? reviewerAvatarUrl;
  final int revieweeId;
  final String? revieweeFullName;
  final int rating;
  final String? comment;
  final String? createdAt;

  ReviewModel({
    required this.id,
    required this.contractId,
    required this.reviewerId,
    this.reviewerFullName,
    this.reviewerAvatarUrl,
    required this.revieweeId,
    this.revieweeFullName,
    required this.rating,
    this.comment,
    this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: (json['id'] as num).toInt(),
      contractId: (json['contractId'] as num).toInt(),
      reviewerId: (json['reviewerId'] as num).toInt(),
      reviewerFullName: json['reviewerFullName']?.toString(),
      reviewerAvatarUrl: json['reviewerAvatarUrl']?.toString(),
      revieweeId: (json['revieweeId'] as num).toInt(),
      revieweeFullName: json['revieweeFullName']?.toString(),
      rating: (json['rating'] as num?)?.toInt() ?? 5,
      comment: json['comment']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class ReviewRepository {
  final ApiClient client;

  ReviewRepository({required this.client});

  /// 1. POST /api/v1/reviews/contract/{contractId} (Đánh giá bên còn lại sau khi hợp đồng hoàn thành)
  Future<ReviewModel> createReview(
    int contractId, {
    required int rating,
    String? comment,
  }) async {
    final payload = <String, dynamic>{
      'rating': rating,
      if (comment != null) 'comment': comment,
    };
    final res = await client.post('/api/v1/reviews/contract/$contractId', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return ReviewModel.fromJson(data);
  }

  /// 2. GET /api/v1/reviews/contract/{contractId} (Xem danh sách đánh giá của một hợp đồng)
  Future<List<ReviewModel>> getReviewsByContract(int contractId) async {
    final res = await client.get('/api/v1/reviews/contract/$contractId');
    final data = res['data'];
    if (data is List) {
      return data.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// 3. GET /api/v1/reviews/user/{userId} (Xem danh sách đánh giá uy tín của một người dùng)
  Future<List<ReviewModel>> getUserReviews(int userId, {int page = 0, int size = 20}) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'size': size.toString(),
    };
    final res = await client.get('/api/v1/reviews/user/$userId', queryParams: queryParams);
    final data = res['data'];
    if (data is Map<String, dynamic> && data['content'] is List) {
      return (data['content'] as List)
          .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } else if (data is List) {
      return data.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
