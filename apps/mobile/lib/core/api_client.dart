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

  /// Called when the API rejects the token so the session can sign out.
  void Function()? onUnauthorized;

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

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    final http.Response res;
    try {
      res = await request().timeout(const Duration(seconds: 20));
    } catch (e) {
      throw ApiException(0, 'Cannot reach the server. Check your connection.');
    }
    final body = res.body.isEmpty ? null : jsonDecode(utf8.decode(res.bodyBytes));
    if (res.statusCode >= 200 && res.statusCode < 300) return body;

    if (res.statusCode == 401 && token != null) onUnauthorized?.call();
    final msg = body is Map ? body['message'] : null;
    throw ApiException(
      res.statusCode,
      msg is List ? msg.join('\n') : (msg?.toString() ?? 'Request failed (${res.statusCode})'),
      code: body is Map ? body['error']?.toString() : null,
    );
  }
}
