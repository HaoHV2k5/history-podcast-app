import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  ApiClient({String? baseUrl, SharedPreferences? preferences})
      : _baseUrl = (baseUrl != null && baseUrl.isNotEmpty)
            ? (baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl)
            : 'http://localhost:8080' {
    _preferences = preferences;
  }

  final String _baseUrl;
  SharedPreferences? _preferences;

  String get baseUrl => _baseUrl;

  void setPreferences(SharedPreferences preferences) {
    _preferences = preferences;
  }

  String? get token => _preferences?.getString('auth_access_token');

  Future<void> saveTokens({required String accessToken, String? refreshToken}) async {
    if (_preferences != null) {
      await _preferences!.setString('auth_access_token', accessToken);
      if (refreshToken != null) {
        await _preferences!.setString('auth_refresh_token', refreshToken);
      }
    }
  }

  Future<void> clearTokens() async {
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

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? queryParams}) async {
    var uri = Uri.parse('$_baseUrl$path');
    if (queryParams != null && queryParams.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParams);
    }
    final response = await http.get(uri, headers: _buildHeaders());
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> post(String path, {Object? body}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final response = await http.post(
      uri,
      headers: _buildHeaders(),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> put(String path, {Object? body}) async {
    final uri = Uri.parse('$_baseUrl$path');
    final response = await http.put(
      uri,
      headers: _buildHeaders(),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final uri = Uri.parse('$_baseUrl$path');
    final response = await http.delete(uri, headers: _buildHeaders());
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> multipartPost(
    String path, {
    Map<String, String>? fields,
    required String fileField,
    required List<int> fileBytes,
    required String filename,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final request = http.MultipartRequest('POST', uri);

    final currentToken = token;
    if (currentToken != null && currentToken.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $currentToken';
    }
    request.headers['Accept'] = 'application/json';

    if (fields != null) {
      request.fields.addAll(fields);
    }

    final multipartFile = http.MultipartFile.fromBytes(
      fileField,
      fileBytes,
      filename: filename,
    );
    request.files.add(multipartFile);

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
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
