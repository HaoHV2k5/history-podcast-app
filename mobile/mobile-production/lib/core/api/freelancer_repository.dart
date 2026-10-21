import 'api_client.dart';

class FreelancerProfileModel {
  final int id;
  final int userId;
  final String? userEmail;
  final String? userFullName;
  final String? userAvatarUrl;
  final String? userPhone;
  final String headline;
  final String? bio;
  final String? skills;
  final String? serviceTypes;
  final String? voiceDemoUrl;
  final double? referencePrice;
  final String? portfolioUrl;
  final String status;
  final List<String> roles;
  final String? createdAt;

  FreelancerProfileModel({
    required this.id,
    required this.userId,
    this.userEmail,
    this.userFullName,
    this.userAvatarUrl,
    this.userPhone,
    required this.headline,
    this.bio,
    this.skills,
    this.serviceTypes,
    this.voiceDemoUrl,
    this.referencePrice,
    this.portfolioUrl,
    required this.status,
    this.roles = const [],
    this.createdAt,
  });

  factory FreelancerProfileModel.fromJson(Map<String, dynamic> json) {
    return FreelancerProfileModel(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num).toInt(),
      userEmail: json['userEmail']?.toString(),
      userFullName: json['userFullName']?.toString(),
      userAvatarUrl: json['userAvatarUrl']?.toString(),
      userPhone: json['userPhone']?.toString(),
      headline: (json['headline'] ?? '').toString(),
      bio: json['bio']?.toString(),
      skills: json['skills']?.toString(),
      serviceTypes: json['serviceTypes']?.toString(),
      voiceDemoUrl: json['voiceDemoUrl']?.toString(),
      referencePrice: (json['referencePrice'] as num?)?.toDouble(),
      portfolioUrl: json['portfolioUrl']?.toString(),
      status: (json['status'] ?? 'ACTIVE').toString(),
      roles: (json['roles'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class FreelancerRepository {
  final ApiClient client;

  FreelancerRepository({required this.client});

  /// 1. Trở thành Freelancer (POST /api/v1/freelancers/become-freelancer)
  Future<FreelancerProfileModel> becomeFreelancer({
    required String headline,
    String? bio,
    String? skills,
    String? serviceTypes,
    String? voiceDemoUrl,
    double? referencePrice,
    String? portfolioUrl,
  }) async {
    final payload = {
      'headline': headline,
      if (bio != null) 'bio': bio,
      if (skills != null) 'skills': skills,
      if (serviceTypes != null) 'serviceTypes': serviceTypes,
      if (voiceDemoUrl != null) 'voiceDemoUrl': voiceDemoUrl,
      if (referencePrice != null) 'referencePrice': referencePrice,
      if (portfolioUrl != null) 'portfolioUrl': portfolioUrl,
    };
    final res = await client.post('/api/v1/freelancers/become-freelancer', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return FreelancerProfileModel.fromJson(data);
  }

  /// 2. Xem hồ sơ Freelancer của tôi (GET /api/v1/freelancers/me)
  Future<FreelancerProfileModel> getMyProfile() async {
    final res = await client.get('/api/v1/freelancers/me');
    final data = res['data'] as Map<String, dynamic>;
    return FreelancerProfileModel.fromJson(data);
  }

  /// 3. Cập nhật hồ sơ Freelancer của tôi (PUT /api/v1/freelancers/me)
  Future<FreelancerProfileModel> updateMyProfile({
    required String headline,
    String? bio,
    String? skills,
    String? serviceTypes,
    String? voiceDemoUrl,
    double? referencePrice,
    String? portfolioUrl,
  }) async {
    final payload = {
      'headline': headline,
      if (bio != null) 'bio': bio,
      if (skills != null) 'skills': skills,
      if (serviceTypes != null) 'serviceTypes': serviceTypes,
      if (voiceDemoUrl != null) 'voiceDemoUrl': voiceDemoUrl,
      if (referencePrice != null) 'referencePrice': referencePrice,
      if (portfolioUrl != null) 'portfolioUrl': portfolioUrl,
    };
    final res = await client.put('/api/v1/freelancers/me', body: payload);
    final data = res['data'] as Map<String, dynamic>;
    return FreelancerProfileModel.fromJson(data);
  }

  /// 4. Xem hồ sơ Freelancer theo User ID (GET /api/v1/freelancers/user/{userId})
  Future<FreelancerProfileModel> getProfileByUserId(int userId) async {
    final res = await client.get('/api/v1/freelancers/user/$userId');
    final data = res['data'] as Map<String, dynamic>;
    return FreelancerProfileModel.fromJson(data);
  }
}
