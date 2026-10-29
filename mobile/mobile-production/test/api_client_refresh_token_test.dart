import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/core/api/api_client.dart';
import 'package:su_ky_mobile_production/core/api/auth_repository.dart';

void main() {
  group('ApiClient Automatic Refresh Token & Retry Tests', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    test('Automatically refreshes token on 401 and retries original request', () async {
      int getCount = 0;
      int refreshCount = 0;

      final mockHttp = MockClient((request) async {
        final path = request.url.path;

        if (path == '/api/v1/auth/refresh') {
          refreshCount++;
          expect(request.url.queryParameters['refreshToken'], 'initial_refresh_token');
          return http.Response(
            jsonEncode({
              'success': true,
              'message': 'Làm mới token thành công',
              'data': {
                'accessToken': 'new_access_token_999',
                'refreshToken': 'new_refresh_token_999',
              }
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (path == '/api/v1/users/me') {
          getCount++;
          if (getCount == 1) {
            // First attempt with old token fails with 401
            expect(request.headers['Authorization'], 'Bearer old_expired_token');
            return http.Response(
              jsonEncode({'success': false, 'message': 'Token đã hết hạn'}),
              401,
              headers: {'content-type': 'application/json; charset=utf-8'},
            );
          } else {
            // Second attempt after refresh with new token succeeds
            expect(request.headers['Authorization'], 'Bearer new_access_token_999');
            return http.Response(
              jsonEncode({
                'success': true,
                'data': {
                  'id': 7,
                  'email': 'phoenix090205@gmail.com',
                  'fullName': 'Nguyễn Quang Tùng',
                }
              }),
              200,
              headers: {'content-type': 'application/json; charset=utf-8'},
            );
          }
        }

        return http.Response('Not Found', 404);
      });

      final client = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );

      await client.saveTokens(
        accessToken: 'old_expired_token',
        refreshToken: 'initial_refresh_token',
      );

      final res = await client.get('/api/v1/users/me');

      expect(getCount, 2);
      expect(refreshCount, 1);
      expect(client.token, 'new_access_token_999');
      expect(client.refreshToken, 'new_refresh_token_999');
      expect(prefs.getString('auth_access_token'), 'new_access_token_999');
      expect(prefs.getString('auth_refresh_token'), 'new_refresh_token_999');
      expect((res['data'] as Map)['fullName'], 'Nguyễn Quang Tùng');
    });

    test('Single-flight mutex prevents duplicate refresh calls during concurrent 401s', () async {
      int refreshCount = 0;

      final mockHttp = MockClient((request) async {
        final path = request.url.path;

        if (path == '/api/v1/auth/refresh') {
          refreshCount++;
          await Future.delayed(const Duration(milliseconds: 50));
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'accessToken': 'new_shared_token_888',
                'refreshToken': 'initial_refresh_token',
              }
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (path.startsWith('/api/v1/data/')) {
          if (request.headers['Authorization'] == 'Bearer new_shared_token_888') {
            return http.Response(
              jsonEncode({'success': true, 'data': {'path': path}}),
              200,
              headers: {'content-type': 'application/json; charset=utf-8'},
            );
          } else {
            return http.Response(
              jsonEncode({'success': false, 'message': 'Unauthorized'}),
              401,
              headers: {'content-type': 'application/json; charset=utf-8'},
            );
          }
        }

        return http.Response('Not Found', 404);
      });

      final client = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );

      await client.saveTokens(
        accessToken: 'old_token',
        refreshToken: 'initial_refresh_token',
      );

      // Fire 3 simultaneous requests
      final future1 = client.get('/api/v1/data/1');
      final future2 = client.get('/api/v1/data/2');
      final future3 = client.get('/api/v1/data/3');

      final results = await Future.wait([future1, future2, future3]);

      expect(refreshCount, 1, reason: 'Only ONE refresh request should be executed');
      expect((results[0]['data'] as Map)['path'], '/api/v1/data/1');
      expect((results[1]['data'] as Map)['path'], '/api/v1/data/2');
      expect((results[2]['data'] as Map)['path'], '/api/v1/data/3');
      expect(client.token, 'new_shared_token_888');
    });

    test('Does NOT refresh token for login endpoint returning 401', () async {
      int refreshCount = 0;

      final mockHttp = MockClient((request) async {
        final path = request.url.path;

        if (path == '/api/v1/auth/refresh') {
          refreshCount++;
          return http.Response('OK', 200);
        }

        if (path == '/api/v1/auth/login') {
          return http.Response(
            jsonEncode({'success': false, 'message': 'Sai mật khẩu hoặc tài khoản'}),
            401,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        return http.Response('Not Found', 404);
      });

      final client = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );

      await client.saveTokens(
        accessToken: 'some_token',
        refreshToken: 'some_refresh_token',
      );

      expect(
        () => client.post('/api/v1/auth/login', body: {'email': 'test@test.com', 'password': 'wrong'}),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', 401)),
      );

      expect(refreshCount, 0, reason: 'Auth endpoints should not trigger refresh token');
    });

    test('Clears tokens and calls onSessionExpired when refresh token fails', () async {
      bool sessionExpiredCalled = false;

      final mockHttp = MockClient((request) async {
        final path = request.url.path;

        if (path == '/api/v1/auth/refresh') {
          return http.Response(
            jsonEncode({'success': false, 'message': 'Refresh token đã hết hạn'}),
            401,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (path == '/api/v1/users/me') {
          return http.Response(
            jsonEncode({'success': false, 'message': 'Hết phiên'}),
            401,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        return http.Response('Not Found', 404);
      });

      final client = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );
      client.onSessionExpired = () {
        sessionExpiredCalled = true;
      };

      await client.saveTokens(
        accessToken: 'expired_access_token',
        refreshToken: 'expired_refresh_token',
      );

      expect(
        () => client.get('/api/v1/users/me'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'status', 401)),
      );

      await Future.delayed(const Duration(milliseconds: 20));
      expect(sessionExpiredCalled, isTrue);
      expect(client.token, isNull);
      expect(client.refreshToken, isNull);
      expect(prefs.getString('auth_access_token'), isNull);
      expect(prefs.getString('auth_refresh_token'), isNull);
    });

    test('AuthRepository can trigger explicit refreshToken()', () async {
      final mockHttp = MockClient((request) async {
        if (request.url.path == '/api/v1/auth/refresh') {
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'accessToken': 'manually_refreshed_access_token',
                'refreshToken': 'manually_refreshed_refresh_token',
              }
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        return http.Response('Not Found', 404);
      });

      final client = ApiClient(
        baseUrl: 'http://localhost:8080',
        preferences: prefs,
        httpClient: mockHttp,
      );
      await client.saveTokens(
        accessToken: 'initial_at',
        refreshToken: 'initial_rt',
      );

      final authRepo = AuthRepository(client);
      final newToken = await authRepo.refreshToken();

      expect(newToken, 'manually_refreshed_access_token');
      expect(client.token, 'manually_refreshed_access_token');
      expect(client.refreshToken, 'manually_refreshed_refresh_token');
    });
  });
}

