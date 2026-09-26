import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';

class ApiException implements Exception {
  ApiException(this.statusCode, this.message, {this.code});

  final int statusCode;
  final String message;

  /// Domain error code from the API, e.g. `SLOT_UNAVAILABLE`.
  final String? code;

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}

/// Thin JSON-over-HTTP client that attaches the bearer token.
class ApiClient {
  ApiClient({http.Client? httpClient, String? baseUrl})
      : _http = httpClient ?? http.Client(),
        _base = baseUrl ?? AppConfig.apiUrl;

  final http.Client _http;
  final String _base;
  String? token;
  String? refreshToken;

  /// Called when the session can't be refreshed so the app can sign out.
  void Function()? onUnauthorized;

  /// Called after a successful refresh so the new tokens can be persisted.
  Future<void> Function(String accessToken, String refreshToken)? onTokensRefreshed;

  Future<bool>? _refreshing;

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final q = <String, String>{};
    query?.forEach((k, v) {
      if (v != null && '$v'.isNotEmpty) q[k] = '$v';
    });
    return Uri.parse('$_base$path').replace(queryParameters: q.isEmpty ? null : q);
  }

  Map<String, String> get _headers => {
        'content-type': 'application/json',
        'accept': 'application/json',
        if (token != null) 'authorization': 'Bearer $token',
      };

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _http.get(_uri(path, query), headers: _headers));

  Future<dynamic> post(String path, [Object? body]) => _send(
        () => _http.post(_uri(path), headers: _headers, body: jsonEncode(body ?? {})),
      );

  Future<dynamic> put(String path, [Object? body]) => _send(
        () => _http.put(_uri(path), headers: _headers, body: jsonEncode(body ?? {})),
      );

  Future<dynamic> patch(String path, [Object? body]) => _send(
        () => _http.patch(_uri(path), headers: _headers, body: jsonEncode(body ?? {})),
      );

  /// Uploads raw bytes to a signed storage URL (S3/R2 or the API's local
  /// storage). No bearer token: the URL itself carries the authorisation.
  Future<void> uploadBytes(String url, List<int> bytes, Map<String, String> headers) async {
    final http.Response res;
    try {
      res = await _http.put(Uri.parse(url), headers: headers, body: bytes).timeout(const Duration(minutes: 2));
    } catch (e) {
      throw ApiException(0, 'Upload failed. Check your connection and try again.');
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiException(res.statusCode, 'Upload was rejected (${res.statusCode}). Please try again.');
    }
  }

  Future<dynamic> _send(Future<http.Response> Function() request, {bool retry = true}) async {
    final http.Response res;
    try {
      res = await request().timeout(const Duration(seconds: 20));
    } catch (e) {
      throw ApiException(0, 'Cannot reach the server. Check your connection.');
    }
    final body = res.body.isEmpty ? null : jsonDecode(utf8.decode(res.bodyBytes));
    if (res.statusCode >= 200 && res.statusCode < 300) return body;

    if (res.statusCode == 401 && token != null) {
      // The access token lives 15 minutes: refresh once, then replay the request.
      if (retry && refreshToken != null && await _refresh()) return _send(request, retry: false);
      onUnauthorized?.call();
    }
    final msg = body is Map ? body['message'] : null;
    throw ApiException(
      res.statusCode,
      msg is List ? msg.join('\n') : (msg?.toString() ?? 'Request failed (${res.statusCode})'),
      code: body is Map ? body['error']?.toString() : null,
    );
  }

  /// Exchanges the refresh token for a new pair. Concurrent callers share one
  /// request, because refresh tokens are single-use.
  Future<bool> _refresh() {
    return _refreshing ??= () async {
      try {
        final res = await _http
            .post(_uri('/auth/refresh'),
                headers: {'content-type': 'application/json', 'accept': 'application/json'},
                body: jsonEncode({'refreshToken': refreshToken}))
            .timeout(const Duration(seconds: 20));
        if (res.statusCode != 200) return false;
        final j = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
        token = j['accessToken'] as String;
        refreshToken = j['refreshToken'] as String;
        await onTokensRefreshed?.call(token!, refreshToken!);
        return true;
      } catch (_) {
        return false;
      } finally {
        _refreshing = null;
      }
    }();
  }
}
