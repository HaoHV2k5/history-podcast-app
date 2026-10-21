import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../app.dart';
import '../app_state.dart';
import 'api/api_client.dart';
import 'api/auth_repository.dart';
import 'api/content_repository.dart';
import 'api/wallet_repository.dart';
import 'api/comment_repository.dart';
import 'api/channel_repository.dart';
import 'api/chat_repository.dart';
import 'api/contract_repository.dart';
import 'api/creator_series_repository.dart';
import 'api/creator_studio_repository.dart';
import 'api/deliverable_repository.dart';
import 'backend_application_factory.dart';
import 'runtime_configuration.dart';

class LiveBackendApplicationFactory implements BackendApplicationFactory {
  const LiveBackendApplicationFactory();

  @override
  Future<Widget> createApplication(RuntimeConfiguration configuration) async {
    final preferences = await SharedPreferences.getInstance();
    final baseUrl = configuration.apiBaseUri?.toString() ?? 'http://localhost:8080';
    
    final apiClient = ApiClient(baseUrl: baseUrl, preferences: preferences);
    final authRepository = AuthRepository(apiClient);
    final contentRepository = ContentRepository(apiClient);
    final walletRepository = WalletRepository(apiClient);
    final commentRepository = CommentRepository(client: apiClient);
    final channelRepository = ChannelRepository(client: apiClient);
    final chatRepository = ChatRepository(client: apiClient);
    final contractRepository = ContractRepository(client: apiClient);
    final creatorSeriesRepository = CreatorSeriesRepository(client: apiClient);
    final creatorStudioRepository = CreatorStudioRepository(client: apiClient);
    final deliverableRepository = DeliverableRepository(client: apiClient);

    // Khởi tạo AppState với Real Repositories
    final appState = AppState(
      preferences,
      apiClient: apiClient,
      authRepository: authRepository,
      contentRepository: contentRepository,
      walletRepository: walletRepository,
      commentRepository: commentRepository,
      channelRepository: channelRepository,
      chatRepository: chatRepository,
      contractRepository: contractRepository,
      creatorSeriesRepository: creatorSeriesRepository,
      creatorStudioRepository: creatorStudioRepository,
      deliverableRepository: deliverableRepository,
    );

    // Tải dữ liệu thật từ Spring Boot backend
    await appState.initRealBackend();

    return SuKyApp(state: appState);
  }
}



