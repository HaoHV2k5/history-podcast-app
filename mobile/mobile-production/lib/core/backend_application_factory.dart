import 'package:flutter/material.dart';

import '../brand_header.dart';
import '../design.dart';
import 'runtime_configuration.dart';

/// Composition boundary for the real backend implementation.
/// It must supply real feature state/adapters; inheriting local mock services
/// does not constitute a production integration.
abstract interface class BackendApplicationFactory {
  Future<Widget> createApplication(RuntimeConfiguration configuration);
}

class PendingBackendApplicationFactory implements BackendApplicationFactory {
  const PendingBackendApplicationFactory();

  @override
  Future<Widget> createApplication(RuntimeConfiguration configuration) async {
    // Validate the URL without inventing endpoints or contacting any service.
    final hasUrl = configuration.apiBaseUri != null;
    return MaterialApp(
      title: 'Sử Ký · Backend integration',
      debugShowCheckedModeBanner: false,
      theme: appTheme(),
      home: Builder(
        builder: (context) => Scaffold(
          appBar: BrandHeader.adaptive(context),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: ListView(
                children: [
                  Text('Đang chờ kết nối backend', style: editorial(28)),
                  const SizedBox(height: 16),
                  Text(
                    hasUrl
                        ? 'Đã cấu hình địa chỉ API. Nhóm cần cung cấp adapter cho các luồng trước khi sử dụng bản production.'
                        : 'Bản này chưa cấu hình API và chưa có adapter backend. Xem README để thử giao diện bằng chế độ mock riêng.',
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Chưa thực hiện đăng nhập, xác thực OTP, thanh toán hoặc phát hành thật.',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
