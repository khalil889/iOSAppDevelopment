import 'package:flutter_secure_storage/flutter_secure_storage.dart';

typedef StoredTokens = ({String accessToken, String refreshToken});

/// Where the session tokens live between launches.
abstract class TokenStore {
  Future<StoredTokens?> read();
  Future<void> write(String accessToken, String refreshToken);
  Future<void> clear();
}

/// iOS Keychain / Android Keystore-backed storage (not included in backups).
class SecureTokenStore implements TokenStore {
  static const _access = 'access_token';
  static const _refresh = 'refresh_token';
  final _storage = const FlutterSecureStorage();

  @override
  Future<StoredTokens?> read() async {
    final a = await _storage.read(key: _access);
    final r = await _storage.read(key: _refresh);
    return a == null || r == null ? null : (accessToken: a, refreshToken: r);
  }

  @override
  Future<void> write(String accessToken, String refreshToken) async {
    await _storage.write(key: _access, value: accessToken);
    await _storage.write(key: _refresh, value: refreshToken);
  }

  @override
  Future<void> clear() => _storage.deleteAll();
}

/// For tests.
class MemoryTokenStore implements TokenStore {
  StoredTokens? tokens;

  @override
  Future<StoredTokens?> read() async => tokens;

  @override
  Future<void> write(String accessToken, String refreshToken) async =>
      tokens = (accessToken: accessToken, refreshToken: refreshToken);

  @override
  Future<void> clear() async => tokens = null;
}
