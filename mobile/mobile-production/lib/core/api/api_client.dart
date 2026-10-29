import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  ApiClient({
    String? baseUrl,
    SharedPreferences? preferences,
    http.Client? httpClient,
  }) : _baseUrl = (baseUrl != null && baseUrl.isNotEmpty)
           ? (baseUrl.endsWith('/')
                 ? baseUrl.substring(0, baseUrl.length - 1)
                 : baseUrl)
           : 'http://localhost:8080',
       _http = httpClient ?? http.Client() {
    _preferences = preferences;
  }

  String _baseUrl;
  final http.Client _http;
  SharedPreferences? _preferences;
  String? _inMemoryAccessToken;
  String? _inMemoryRefreshToken;

  /// Callback khi phiên đăng nhập hết hạn hoàn toàn (refresh token hỏng hoặc hết hạn)
  void Function()? onSessionExpired;

  String get baseUrl => _baseUrl;

  void updateBaseUrl(String newUrl) {
    var trimmed = newUrl.trim();
    if (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    if (trimmed.isNotEmpty) {
      _baseUrl = trimmed;
      _preferences?.setString('custom_api_base_url', trimmed);
    }
  }

  void setPreferences(SharedPreferences preferences) {
    _preferences = preferences;
  }

  String? get token =>
      _preferences?.getString('auth_access_token') ?? _inMemoryAccessToken;

  String? get refreshToken =>
      _preferences?.getString('auth_refresh_token') ?? _inMemoryRefreshToken;

  Future<void> saveTokens({required String accessToken, String? refreshToken}) async {
    _inMemoryAccessToken = accessToken;
    if (refreshToken != null && refreshToken.isNotEmpty) {
      _inMemoryRefreshToken = refreshToken;
    }
    if (_preferences != null) {
      await _preferences!.setString('auth_access_token', accessToken);
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _preferences!.setString('auth_refresh_token', refreshToken);
      }
    }
  }

  Future<void> clearTokens() async {
    _inMemoryAccessToken = null;
    _inMemoryRefreshToken = null;
    if (_preferences != null) {
      await _preferences!.remove('auth_access_token');
      await _preferences!.remove('auth_refresh_token');
    }
  }

  Map<String, String> _buildHeaders([Map<String, String>? extraHeaders]) {
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    };
    final currentToken = token;
    if (currentToken != null && currentToken.isNotEmpty) {
      headers['Authorization'] = 'Bearer $currentToken';
    }
    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  static const Duration defaultTimeout = Duration(seconds: 15);

  Completer<String?>? _refreshCompleter;

  bool _isAuthEndpoint(String path) {
    final lower = path.toLowerCase();
    return lower.contains('/api/v1/auth/login') ||
        lower.contains('/api/v1/auth/register') ||
        lower.contains('/api/v1/auth/refresh') ||
        lower.contains('/api/v1/auth/forgot-password') ||
        lower.contains('/api/v1/auth/verify-forgot-password-otp') ||
        lower.contains('/api/v1/auth/reset-password');
  }

  /// Làm mới Access Token từ Refresh Token (Single-Flight Mutex chống trùng lặp)
  Future<String?> refreshAccessToken() async {
    final rt = refreshToken;
    if (rt == null || rt.isEmpty) {
      return null;
    }

    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }

    final completer = Completer<String?>();
    _refreshCompleter = completer;

    try {
      final uri = Uri.parse('$_baseUrl/api/v1/auth/refresh').replace(
        queryParameters: {'refreshToken': rt},
      );
      final res = await _http.post(
        uri,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json',
        },
      ).timeout(defaultTimeout);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final rawBody = utf8.decode(res.bodyBytes);
        final dynamic decoded = rawBody.isNotEmpty ? jsonDecode(rawBody) : {};
        if (decoded is Map<String, dynamic>) {
          final data = decoded['data'] as Map<String, dynamic>?;
          final newAccessToken = data?['accessToken'] as String?;
          final newRefreshToken = data?['refreshToken'] as String?;

          if (newAccessToken != null && newAccessToken.isNotEmpty) {
            await saveTokens(
              accessToken: newAccessToken,
              refreshToken: (newRefreshToken != null && newRefreshToken.isNotEmpty)
                  ? newRefreshToken
                  : rt,
            );
            completer.complete(newAccessToken);
            return newAccessToken;
          }
        }
      }

      // Khi refresh thất bại (ví dụ: refresh token hết hạn hoặc bị thu hồi)
      await clearTokens();
      onSessionExpired?.call();
      completer.complete(null);
      return null;
    } catch (e) {
      completer.complete(null);
      return null;
    } finally {
      _refreshCompleter = null;
    }
  }

  /// Thực thi request và tự động refresh token nếu gặp HTTP 401
  Future<Map<String, dynamic>> _sendWithRetry({
    required String path,
    required Future<http.Response> Function(Map<String, String> headers) send,
    bool isRetry = false,
  }) async {
    final response = await send(_buildHeaders()).timeout(defaultTimeout);

    if (response.statusCode == 401 && !isRetry && !_isAuthEndpoint(path)) {
      final newToken = await refreshAccessToken();
      if (newToken != null && newToken.isNotEmpty) {
        final retryResponse = await send(_buildHeaders()).timeout(defaultTimeout);
        return _handleResponse(retryResponse);
      }
    }

    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? queryParams}) async {
    var uri = Uri.parse('$_baseUrl$path');
    if (queryParams != null && queryParams.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParams);
    }
    return _sendWithRetry(
      path: path,
      send: (headers) => _http.get(uri, headers: headers),
    );
  }

  Future<Map<String, dynamic>> post(String path, {Object? body}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final encodedBody = body != null ? jsonEncode(body) : null;
    return _sendWithRetry(
      path: path,
      send: (headers) => _http.post(uri, headers: headers, body: encodedBody),
    );
  }

  Future<Map<String, dynamic>> put(String path, {Object? body}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final encodedBody = body != null ? jsonEncode(body) : null;
    return _sendWithRetry(
      path: path,
      send: (headers) => _http.put(uri, headers: headers, body: encodedBody),
    );
  }

  Future<Map<String, dynamic>> patch(String path, {Object? body}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final encodedBody = body != null ? jsonEncode(body) : null;
    return _sendWithRetry(
      path: path,
      send: (headers) => _http.patch(uri, headers: headers, body: encodedBody),
    );
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final uri = Uri.parse('$_baseUrl$path');
    return _sendWithRetry(
      path: path,
      send: (headers) => _http.delete(uri, headers: headers),
    );
  }

  Future<Map<String, dynamic>> multipartPost(
    String path, {
    Map<String, String>? fields,
    required String fileField,
    required List<int> fileBytes,
    required String filename,
  }) async {
    Future<http.Response> doSend(String? bearerToken) async {
      final uri = Uri.parse('$_baseUrl$path');
      final request = http.MultipartRequest('POST', uri);
      if (bearerToken != null && bearerToken.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $bearerToken';
      }
      request.headers['Accept'] = 'application/json';
      if (fields != null) {
        request.fields.addAll(fields);
      }
      request.files.add(http.MultipartFile.fromBytes(
        fileField,
        fileBytes,
        filename: filename,
      ));
      final streamedResponse = await _http.send(request);
      return http.Response.fromStream(streamedResponse);
    }

    final response = await doSend(token).timeout(defaultTimeout);
    if (response.statusCode == 401 && !_isAuthEndpoint(path)) {
      final newToken = await refreshAccessToken();
      if (newToken != null && newToken.isNotEmpty) {
        final retryResponse = await doSend(newToken).timeout(defaultTimeout);
        return _handleResponse(retryResponse);
      }
    }
    return _handleResponse(response);
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    final utf8Body = utf8.decode(response.bodyBytes);
    final dynamic decoded = utf8Body.isNotEmpty ? jsonDecode(utf8Body) : {};

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      return {'data': decoded};
    }

    String errorMessage = 'Đã có lỗi xảy ra (${response.statusCode})';
    if (decoded is Map<String, dynamic>) {
      if (decoded.containsKey('message') && decoded['message'] != null) {
        errorMessage = decoded['message'].toString();
      }
    }
    throw ApiException(statusCode: response.statusCode, message: errorMessage);
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => message;
}
