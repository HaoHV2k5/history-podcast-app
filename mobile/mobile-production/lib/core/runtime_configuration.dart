/// Public build configuration only. Never put access tokens or secrets here.
class RuntimeConfiguration {
  const RuntimeConfiguration({
    this.useMockServices = false,
    this.apiBaseUrl = '',
  });

  const RuntimeConfiguration.fromEnvironment()
    : useMockServices = const bool.fromEnvironment('USE_MOCK_SERVICES'),
      apiBaseUrl = const String.fromEnvironment('API_BASE_URL');

  final bool useMockServices;
  final String apiBaseUrl;

  Uri? get apiBaseUri {
    if (apiBaseUrl.trim().isEmpty) return null;
    final uri = Uri.tryParse(apiBaseUrl.trim());
    if (uri == null ||
        !uri.hasAuthority ||
        !['http', 'https'].contains(uri.scheme) ||
        uri.userInfo.isNotEmpty ||
        uri.hasQuery ||
        uri.hasFragment) {
      throw const FormatException(
        'API_BASE_URL must be a public HTTP(S) base URL without credentials, query or fragment.',
      );
    }
    return uri;
  }
}
